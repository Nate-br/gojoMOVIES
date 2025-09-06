// /api/catalog.js
// Env vars required (Vercel > Project Settings > Environment Variables):
// - YT_API_KEY (required)
// - ALLOWED_ORIGIN (optional; "*")
// - MIN_DURATION_SEC (default 900 -> 15m)
// - SEARCH_PAGES (default 3; max 5)
// - MAX_PER_CATEGORY (default 100)
// - MAX_IDS (default 500)
// - YT_CHANNELS (optional; comma-separated channel IDs)

module.exports = async (req, res) => {
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
  if (!API_KEY) return res.status(500).json({ error: 'Missing YT_API_KEY' });

  const fetchFn = global.fetch || (await import('node-fetch')).default;

  const MIN_DURATION_SEC = parseInt(process.env.MIN_DURATION_SEC || '900', 10); // 15 min
  const SEARCH_PAGES = Math.min(parseInt(process.env.SEARCH_PAGES || '3', 10), 5);
  const MAX_PER_CATEGORY = parseInt(process.env.MAX_PER_CATEGORY || '100', 10);
  const MAX_IDS = parseInt(process.env.MAX_IDS || '500', 10);
  const CHANNEL_IDS = (process.env.YT_CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);

  const DEBUG = req.query.debug === '1';
  const RUNTIME_MIN = req.query.min ? Math.max(parseInt(req.query.min, 10), 0) : MIN_DURATION_SEC;
  const RUNTIME_PAGES = req.query.pages ? Math.min(Math.max(parseInt(req.query.pages, 10), 1), 5) : SEARCH_PAGES;
  const RUNTIME_MAX = req.query.max ? Math.min(Math.max(parseInt(req.query.max, 10), 1), 200) : MAX_PER_CATEGORY;
  const RUNTIME_CAP = req.query.cap ? Math.min(Math.max(parseInt(req.query.cap, 10), 50), 1000) : MAX_IDS;

  const userQueries = req.query.queries ? req.query.queries.split(',') : [];

  const baseQueries = [
    'Amharic full movie', 'Ethiopian full movie', 'አማርኛ ፊልም ሙሉ',
    'amharic movies', // NEW
    'ye wendoch guday', // NEW
    'Amharic movie 2024 full', 'Ethiopian movie 2024 full',
    'Amharic movie 2023 full', 'Ethiopian movie 2023 full',
    'Amharic movie 2022 full', 'Ethiopian movie 2022 full',
    'Amharic movie 2021 full', 'Ethiopian movie 2021 full',
    'Amharic movie 2020 full', 'Ethiopian movie 2020 full',
    'Amharic drama full movie', 'Ethiopian comedy full movie',
    'Ethiopian romance movie full', 'Amharic action movie full',
    'Sebastopol Entertainment full movie', 'Sabisa Films full movie',
    'Semhal Movies full', 'Admas Film full'
  ];
  const queries = [...baseQueries, ...userQueries];

  const isoToSec = (iso) => {
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso) || [];
    return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
  };

  async function fetchWithTimeout(url, opts = {}, ms = 8000) {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), ms);
    try {
      return await fetchFn(url, { ...opts, signal: ac.signal });
    } finally { clearTimeout(id); }
  }

  async function ytSearchPaged(q, pages, duration = 'long') {
    let token = '';
    const ids = [];
    for (let i = 0; i < pages; i++) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.search = new URLSearchParams({
        key: API_KEY, part: 'snippet', type: 'video', maxResults: '50',
        q, safeSearch: 'moderate', videoEmbeddable: 'true', videoSyndicated: 'true',
        videoDuration: duration, order: 'relevance', pageToken: token
      }).toString();
      try {
        const r = await fetchWithTimeout(url);
        if (!r.ok) break;
        const j = await r.json();
        (j.items || []).forEach(it => it.id?.videoId && ids.push(it.id.videoId));
        token = j.nextPageToken || '';
        if (!token) break;
      } catch { break; }
    }
    return ids;
  }

  async function mapLimit(arr, limit, fn) {
    const ret = [];
    let i = 0;
    const workers = new Array(limit).fill(0).map(async () => {
      while (i < arr.length) {
        const idx = i++;
        ret[idx] = await fn(arr[idx], idx);
      }
    });
    await Promise.all(workers);
    return ret;
  }

  async function ytVideos(allIds) {
    const chunks = [];
    for (let i = 0; i < allIds.length; i += 50) chunks.push(allIds.slice(i, i + 50));
    const results = await mapLimit(chunks, 4, async (chunk) => {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.search = new URLSearchParams({
        key: API_KEY, part: 'contentDetails,statistics,status,snippet', id: chunk.join(',')
      }).toString();
      try {
        const r = await fetchWithTimeout(url, {}, 8000);
        if (!r.ok) return [];
        const j = await r.json();
        return j.items || [];
      } catch { return []; }
    });
    return results.flat();
  }

  async function getUploadsPlaylistId(channelId) {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.search = new URLSearchParams({ key: API_KEY, part: 'contentDetails', id: channelId }).toString();
    try {
      const r = await fetchWithTimeout(url, {}, 6000);
      if (!r.ok) return null;
      const j = await r.json();
      return j.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
    } catch { return null; }
  }

  async function listPlaylistVideoIds(playlistId, pages = 3) {
    let token = '';
    const ids = [];
    for (let i = 0; i < pages; i++) {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.search = new URLSearchParams({
        key: API_KEY, part: 'contentDetails', playlistId, maxResults: '50', pageToken: token
      }).toString();
      try {
        const r = await fetchWithTimeout(url, {}, 6000);
        if (!r.ok) break;
        const j = await r.json();
        (j.items || []).forEach(it => it.contentDetails?.videoId && ids.push(it.contentDetails.videoId));
        token = j.nextPageToken || '';
        if (!token) break;
      } catch { break; }
    }
    return ids;
  }

  function categorizeByKeywords(title, description) {
    const categories = [];
    const t = (title || '').toLowerCase();
    const d = (description || '').toLowerCase();
    if (t.includes('comedy') || t.includes('ኮሜዲ') || t.includes('ቀልድ') || d.includes('comedy')) categories.push('comedies');
    if (t.includes('drama') || t.includes('ድራማ') || t.includes('ፍቅር') || d.includes('drama')) categories.push('dramas');
    return categories;
  }

  try {
    // Search (duration any for "ye wendoch guday")
    const searchPromises = queries.map(q => {
      const lower = q.toLowerCase().trim();
      const dur = lower.includes('ye wendoch guday') ? 'any' : 'long';
      return ytSearchPaged(q, RUNTIME_PAGES, dur);
    });
    const searchResults = await Promise.all(searchPromises);
    const idSet = new Set(searchResults.flat());

    // Optional add uploads from specific channels
    if (CHANNEL_IDS.length) {
      const playlists = await Promise.all(CHANNEL_IDS.map(getUploadsPlaylistId));
      const lists = await Promise.all((playlists.filter(Boolean)).map(pl => listPlaylistVideoIds(pl, 3)));
      lists.flat().forEach(id => idSet.add(id));
    }

    const allIds = Array.from(idSet).slice(0, RUNTIME_CAP);
    if (!allIds.length) {
      return res.status(200).json({
        fetchedAt: Date.now(),
        items: [],
        categories: { 'new-releases': [], 'popular': [], 'trending': [], 'classics': [], 'comedies': [], 'dramas': [] }
      });
    }

    const videos = await ytVideos(allIds);

    const normalized = videos.map(v => {
      const durationSec = isoToSec(v.contentDetails?.duration || 'PT0S');
      const viewCount = parseInt(v.statistics?.viewCount || '0', 10);
      const publishedAt = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt).getTime() : 0;
      const embeddable = v.status?.embeddable !== false;
      const live = v.snippet?.liveBroadcastContent && v.snippet.liveBroadcastContent !== 'none';
      const categories = categorizeByKeywords(v.snippet?.title, v.snippet?.description);
      return {
        videoId: v.id,
        title: v.snippet?.title || 'Amharic Movie',
        durationSec,
        viewCount,
        publishedAt,
        embeddable,
        live,
        categories
      };
    }).filter(v => {
      const t = (v.title || '').toLowerCase();
      const isWendoch = t.includes('ye wendoch guday') || t.includes('የወንዶች ጉዳይ');
      const minSec = isWendoch ? Math.min(RUNTIME_MIN, 300) : RUNTIME_MIN; // allow >= 5 min for the show
      return v.embeddable && !v.live && v.durationSec >= minSec && v.title;
    });

    const now = Date.now();
    const days = ms => Math.floor(ms / (1000 * 60 * 60 * 24));
    const recent = normalized.filter(v => days(now - v.publishedAt) <= 730);
    const trendingPool = normalized.filter(v => days(now - v.publishedAt) <= 180);
    const classics = normalized.filter(v => days(now - v.publishedAt) > 730);
    const comedies = normalized.filter(v => v.categories?.includes('comedies'));
    const dramas = normalized.filter(v => v.categories?.includes('dramas'));

    let newReleases = [...recent].sort((a,b) => b.publishedAt - a.publishedAt).slice(0, RUNTIME_MAX);
    let popular = [...normalized].sort((a,b) => b.viewCount - a.viewCount).slice(0, RUNTIME_MAX);
    let trending = [...trendingPool].sort((a,b) => b.viewCount - a.viewCount).slice(0, RUNTIME_MAX);
    let classicsTop = [...classics].sort((a,b) => a.publishedAt - b.publishedAt).slice(0, RUNTIME_MAX);
    let comediesTop = [...comedies].sort((a,b) => b.viewCount - a.viewCount).slice(0, RUNTIME_MAX);
    let dramasTop = [...dramas].sort((a,b) => b.viewCount - a.viewCount).slice(0, RUNTIME_MAX);

    function fill(target, source) {
      const ids = new Set(target.map(x => x.videoId));
      for (const v of source) {
        if (target.length >= RUNTIME_MAX) break;
        if (!ids.has(v.videoId)) { target.push(v); ids.add(v.videoId); }
      }
    }
    fill(newReleases, normalized.sort((a,b) => b.publishedAt - a.publishedAt));
    fill(trending, normalized.sort((a,b) => b.viewCount - a.viewCount));
    fill(classicsTop, normalized.sort((a,b) => a.publishedAt - b.publishedAt));

    const thin = list => list.map(v => ({
      videoId: v.videoId,
      title: v.title,
      publishedAt: v.publishedAt,
      categories: v.categories || []
    }));

    const payload = {
      fetchedAt: Date.now(),
      items: normalized.map(v => ({
        videoId: v.videoId,
        title: v.title,
        durationSec: v.durationSec,
        viewCount: v.viewCount,
        publishedAt: v.publishedAt,
        categories: v.categories || []
      })),
      categories: {
        'new-releases': thin(newReleases),
        'popular': thin(popular),
        'trending': thin(trending),
        'classics': thin(classicsTop),
        'comedies': thin(comediesTop),
        'dramas': thin(dramasTop)
      }
    };

    if (DEBUG) {
      payload.debug = {
        allIds: allIds.length,
        fetchedVideos: videos.length,
        normalized: normalized.length,
        counts: {
          newReleases: newReleases.length, popular: popular.length, trending: trending.length,
          classics: classicsTop.length, comedies: comediesTop.length, dramas: dramasTop.length
        },
        runtime: { min: RUNTIME_MIN, pages: RUNTIME_PAGES, max: RUNTIME_MAX, cap: RUNTIME_CAP }
      };
    }

    return res.status(200).json(payload);
  } catch (e) {
    console.error('catalog crash', e);
    return res.status(500).json({ error: 'catalog generation failed' });
  }
};
