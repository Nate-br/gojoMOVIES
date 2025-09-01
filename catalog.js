// /api/catalog.js
// Env vars (set in Vercel Project Settings > Environment Variables):
// - YT_API_KEY (required)
// - ALLOWED_ORIGIN (optional; defaults to "*")
// - MIN_DURATION_SEC (optional; default 1800 -> 30 minutes)
// - SEARCH_PAGES (optional; default 3; pages per query)
// - MAX_PER_CATEGORY (optional; default 48)
// - YT_CHANNELS (optional; comma-separated channel IDs to harvest uploads from)

module.exports = async (req, res) => {
  // CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    return res.status(204).end();
  }
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

  const API_KEY = process.env.YT_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Missing YT_API_KEY' });
  }

  const fetchFn = global.fetch || (await import('node-fetch')).default;

  const MIN_DURATION_SEC = parseInt(process.env.MIN_DURATION_SEC || '1800', 10); // 30m
  const SEARCH_PAGES = Math.min(parseInt(process.env.SEARCH_PAGES || '3', 10), 5);
  const MAX_PER_CATEGORY = parseInt(process.env.MAX_PER_CATEGORY || '48', 10);

  const CHANNEL_IDS = (process.env.YT_CHANNELS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // More/broader queries to find more items
  const queries = [
    // generic
    'Amharic full movie', 'Ethiopian full movie', 'አማርኛ ፊልም ሙሉ',
    'Amharic movie full 1080p', 'Ethiopian film full 1080p',
    'Amharic drama full movie', 'Ethiopian comedy full movie',
    'Amharic cinema full', 'Ethiopian cinema full',
    // recent-year variants (tends to bring lots of results)
    'Amharic movie 2024 full', 'Ethiopian movie 2024 full',
    'Amharic movie 2023 full', 'Ethiopian movie 2023 full',
    'Amharic film 2022 full', 'Ethiopian film 2022 full'
  ];

  const isoToSec = (iso) => {
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso) || [];
    const h = parseInt(m[1] || '0', 10);
    const mm = parseInt(m[2] || '0', 10);
    const s = parseInt(m[3] || '0', 10);
    return h * 3600 + mm * 60 + s;
  };

  async function ytSearchPaged(q, pages = 1) {
    let nextPageToken = '';
    const out = [];
    for (let i = 0; i < pages; i++) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.search = new URLSearchParams({
        key: API_KEY,
        part: 'snippet',
        type: 'video',
        maxResults: '50',
        q,
        safeSearch: 'moderate',
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        // Let it be any; we'll filter by duration later for better yield
        videoDuration: 'any',
        regionCode: 'ET',
        relevanceLanguage: 'am',
        order: 'relevance',
        pageToken: nextPageToken
      }).toString();

      const r = await fetchFn(url);
      if (!r.ok) break;
      const j = await r.json();
      const items = j.items || [];
      out.push(...items);
      nextPageToken = j.nextPageToken || '';
      if (!nextPageToken) break;
    }
    return out;
  }

  async function ytVideos(ids) {
    const out = [];
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.search = new URLSearchParams({
        key: API_KEY,
        part: 'contentDetails,statistics,status,snippet',
        id: chunk.join(',')
      }).toString();
      const r = await fetchFn(url);
      if (!r.ok) continue;
      const j = await r.json();
      out.push(...(j.items || []));
    }
    return out;
  }

  // Optional: harvest uploads from configured channels (if provided)
  async function getUploadsPlaylistId(channelId) {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.search = new URLSearchParams({
      key: API_KEY,
      part: 'contentDetails',
      id: channelId
    }).toString();
    const r = await fetchFn(url);
    if (!r.ok) return null;
    const j = await r.json();
    const uploads = j.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    return uploads || null;
  }

  async function listPlaylistVideoIds(playlistId, maxPages = 3) {
    let token = '';
    const ids = [];
    for (let i = 0; i < maxPages; i++) {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.search = new URLSearchParams({
        key: API_KEY,
        part: 'contentDetails',
        playlistId,
        maxResults: '50',
        pageToken: token
      }).toString();
      const r = await fetchFn(url);
      if (!r.ok) break;
      const j = await r.json();
      (j.items || []).forEach(it => {
        const id = it.contentDetails?.videoId;
        if (id) ids.push(id);
      });
      token = j.nextPageToken || '';
      if (!token) break;
    }
    return ids;
  }

  try {
    // 1) Collect ids from queries (multi-page search)
    const idSet = new Set();
    for (const q of queries) {
      const items = await ytSearchPaged(q, SEARCH_PAGES);
      items.forEach(it => {
        const id = it.id?.videoId;
        if (id) idSet.add(id);
      });
    }

    // 2) Optionally collect ids from channels’ uploads
    for (const ch of CHANNEL_IDS) {
      const uploads = await getUploadsPlaylistId(ch);
      if (!uploads) continue;
      const ids = await listPlaylistVideoIds(uploads, 3);
      ids.forEach(id => idSet.add(id));
    }

    const allIds = Array.from(idSet);
    if (!allIds.length) {
      return res.status(200).json({ fetchedAt: Date.now(), items: [], categories: { 'new-releases': [], popular: [], trending: [], classics: [] } });
    }

    // 3) Details for all ids
    const videos = await ytVideos(allIds);

    // 4) Normalize + filter
    const normalized = videos.map(v => {
      const durationSec = isoToSec(v.contentDetails?.duration || 'PT0S');
      const viewCount = parseInt(v.statistics?.viewCount || '0', 10);
      const publishedAt = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt).getTime() : 0;
      const embeddable = v.status?.embeddable !== false;
      const live = v.snippet?.liveBroadcastContent && v.snippet.liveBroadcastContent !== 'none';
      return {
        videoId: v.id,
        title: v.snippet?.title || 'Amharic Movie',
        durationSec,
        viewCount,
        publishedAt,
        embeddable,
        live
      };
    }).filter(v =>
      v.embeddable &&
      !v.live &&
      v.durationSec >= MIN_DURATION_SEC &&
      v.title // ensure title exists
    );

    // 5) Categorize lots of items
    const now = Date.now();
    const days = ms => Math.floor(ms / (1000 * 60 * 60 * 24));
    const recent = normalized.filter(v => days(now - v.publishedAt) <= 730); // 2y
    const trendingPool = normalized.filter(v => days(now - v.publishedAt) <= 180); // 6m
    const classics = normalized.filter(v => days(now - v.publishedAt) > 1460); // >4y

    const newReleases = [...recent].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, MAX_PER_CATEGORY);
    const popular = [...normalized].sort((a, b) => b.viewCount - a.viewCount).slice(0, MAX_PER_CATEGORY);
    const trending = [...trendingPool].sort((a, b) => b.viewCount - a.viewCount).slice(0, MAX_PER_CATEGORY);
    const classicsTop = [...classics].sort((a, b) => a.publishedAt - b.publishedAt).slice(0, MAX_PER_CATEGORY);

    // Fallback fill to ensure lots of items even if some categories are thin
    function fill(target, source) {
      const ids = new Set(target.map(x => x.videoId));
      for (const v of source) {
        if (target.length >= MAX_PER_CATEGORY) break;
        if (!ids.has(v.videoId)) {
          target.push(v);
          ids.add(v.videoId);
        }
      }
    }
    fill(newReleases, normalized.sort((a, b) => b.publishedAt - a.publishedAt));
    fill(trending, normalized.sort((a, b) => b.viewCount - a.viewCount));
    fill(classicsTop, normalized.sort((a, b) => a.publishedAt - b.publishedAt));

    const thin = list => list.map(v => ({ videoId: v.videoId, title: v.title, publishedAt: v.publishedAt }));

    const payload = {
      fetchedAt: Date.now(),
      items: normalized.map(v => ({
        videoId: v.videoId,
        title: v.title,
        durationSec: v.durationSec,
        viewCount: v.viewCount,
        publishedAt: v.publishedAt
      })),
      categories: {
        'new-releases': thin(newReleases),
        popular: thin(popular),
        trending: thin(trending),
        classics: thin(classicsTop)
      }
    };

    return res.status(200).json(payload);
  } catch (e) {
    console.error('Catalog error:', e);
    return res.status(500).json({ error: 'catalog generation failed' });
  }
};
