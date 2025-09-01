a// /api/catalog.js
// Env vars (set in Vercel Project > Settings > Environment Variables):
// - YT_API_KEY (required)
// - ALLOWED_ORIGIN (optional; defaults to "*")
// - MIN_DURATION_SEC (optional; default 1200 -> 20 minutes)
// - SEARCH_PAGES (optional; default 3; pages per query, max 5)
// - MAX_PER_CATEGORY (optional; default 64)
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
  if (!API_KEY) return res.status(500).json({ error: 'Missing YT_API_KEY' });

  const fetchFn = global.fetch || (await import('node-fetch')).default;

  // Defaults from env
  const MIN_DURATION_SEC = parseInt(process.env.MIN_DURATION_SEC || '1200', 10); // 20 min
  const SEARCH_PAGES = Math.min(parseInt(process.env.SEARCH_PAGES || '3', 10), 5);
  const MAX_PER_CATEGORY = parseInt(process.env.MAX_PER_CATEGORY || '64', 10);
  const CHANNEL_IDS = (process.env.YT_CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);

  // Runtime overrides via query (?debug=1&min=600&pages=5&max=96)
  const DEBUG = req.query.debug === '1';
  const RUNTIME_MIN = req.query.min ? Math.max(parseInt(req.query.min, 10), 0) : MIN_DURATION_SEC;
  const RUNTIME_PAGES = req.query.pages ? Math.min(Math.max(parseInt(req.query.pages, 10), 1), 5) : SEARCH_PAGES;
  const RUNTIME_MAX = req.query.max ? Math.min(Math.max(parseInt(req.query.max, 10), 1), 96) : MAX_PER_CATEGORY;

  const queries = [
    'Amharic full movie','Ethiopian full movie','አማርኛ ፊልም ሙሉ',
    'Amharic movie 2024 full','Ethiopian movie 2024 full',
    'Amharic movie 2023 full','Ethiopian movie 2023 full',
    'Amharic drama full movie','Ethiopian comedy full movie',
    'Amharic cinema full','Ethiopian cinema full'
  ];

  const isoToSec = (iso) => {
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso) || [];
    return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
  };

  async function ytSearchPaged(q, pages) {
    let token = '';
    const ids = [];
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
        videoDuration: 'any',
        order: 'relevance',
        pageToken: token
      }).toString();
      const r = await fetchFn(url);
      if (!r.ok) break;
      const j = await r.json();
      (j.items || []).forEach(it => it.id?.videoId && ids.push(it.id.videoId));
      token = j.nextPageToken || '';
      if (!token) break;
    }
    return ids;
  }

  async function ytVideos(allIds) {
    const out = [];
    for (let i = 0; i < allIds.length; i += 50) {
      const chunk = allIds.slice(i, i + 50);
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

  async function getUploadsPlaylistId(channelId) {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.search = new URLSearchParams({ key: API_KEY, part: 'contentDetails', id: channelId }).toString();
    const r = await fetchFn(url);
    if (!r.ok) return null;
    const j = await r.json();
    return j.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  }

  async function listPlaylistVideoIds(playlistId, pages = 2) {
    let token = '';
    const ids = [];
    for (let i = 0; i < pages; i++) {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.search = new URLSearchParams({
        key: API_KEY, part: 'contentDetails', playlistId, maxResults: '50', pageToken: token
      }).toString();
      const r = await fetchFn(url);
      if (!r.ok) break;
      const j = await r.json();
      (j.items || []).forEach(it => it.contentDetails?.videoId && ids.push(it.contentDetails.videoId));
      token = j.nextPageToken || '';
      if (!token) break;
    }
    return ids;
  }

  try {
    // 1) Parallel searches
    const searchPromises = queries.map(q => ytSearchPaged(q, RUNTIME_PAGES));
    const searchResults = await Promise.all(searchPromises);
    const idSet = new Set(searchResults.flat());

    // 2) Optional channels (uploads) in parallel
    if (CHANNEL_IDS.length) {
      const playlists = await Promise.all(CHANNEL_IDS.map(getUploadsPlaylistId));
      const lists = await Promise.all((playlists.filter(Boolean)).map(pl => listPlaylistVideoIds(pl, 2)));
      lists.flat().forEach(id => idSet.add(id));
    }

    const allIds = Array.from(idSet);
    if (!allIds.length) {
      return res.status(200).json({
        fetchedAt: Date.now(),
        items: [],
        categories: { 'new-releases': [], popular: [], trending: [], classics: [] },
        ...(DEBUG ? { debug: { allIds: 0 } } : {})
      });
    }

    // 3) Details
    const videos = await ytVideos(allIds);

    // 4) Normalize + filter
    const normalized = videos.map(v => {
      const durationSec = isoToSec(v.contentDetails?.duration || 'PT0S');
      const viewCount = parseInt(v.statistics?.viewCount || '0', 10);
      const publishedAt = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt).getTime() : 0;
      const embeddable = v.status?.embeddable !== false;
      const live = v.snippet?.liveBroadcastContent && v.snippet.liveBroadcastContent !== 'none';
      return { videoId: v.id, title: v.snippet?.title || 'Amharic Movie', durationSec, viewCount, publishedAt, embeddable, live };
    }).filter(v => v.embeddable && !v.live && v.durationSec >= RUNTIME_MIN && v.title);

    // 5) Categorize
    const now = Date.now();
    const days = ms => Math.floor(ms / (1000 * 60 * 60 * 24));
    const recent = normalized.filter(v => days(now - v.publishedAt) <= 730);
    const trendingPool = normalized.filter(v => days(now - v.publishedAt) <= 180);
    const classics = normalized.filter(v => days(now - v.publishedAt) > 1460);

    let newReleases = [...recent].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, RUNTIME_MAX);
    let popular = [...normalized].sort((a, b) => b.viewCount - a.viewCount).slice(0, RUNTIME_MAX);
    let trending = [...trendingPool].sort((a, b) => b.viewCount - a.viewCount).slice(0, RUNTIME_MAX);
    let classicsTop = [...classics].sort((a, b) => a.publishedAt - b.publishedAt).slice(0, RUNTIME_MAX);

    // Fill thin categories
    function fill(target, source) {
      const ids = new Set(target.map(x => x.videoId));
      for (const v of source) {
        if (target.length >= RUNTIME_MAX) break;
        if (!ids.has(v.videoId)) { target.push(v); ids.add(v.videoId); }
      }
    }
    fill(newReleases, normalized.sort((a, b) => b.publishedAt - a.publishedAt));
    fill(trending, normalized.sort((a, b) => b.viewCount - a.viewCount));
    fill(classicsTop, normalized.sort((a, b) => a.publishedAt - b.publishedAt));

    const thin = list => list.map(v => ({ videoId: v.videoId, title: v.title, publishedAt: v.publishedAt }));

    const payload = {
      fetchedAt: Date.now(),
      items: normalized.map(v => ({ videoId: v.videoId, title: v.title, durationSec: v.durationSec, viewCount: v.viewCount, publishedAt: v.publishedAt })),
      categories: {
        'new-releases': thin(newReleases),
        popular: thin(popular),
        trending: thin(trending),
        classics: thin(classicsTop)
      }
    };

    if (DEBUG) {
      payload.debug = {
        allIds: allIds.length,
        fetchedVideos: videos.length,
        normalized: normalized.length,
        counts: {
          newReleases: newReleases.length,
          popular: popular.length,
          trending: trending.length,
          classics: classicsTop.length
        },
        runtime: { min: RUNTIME_MIN, pages: RUNTIME_PAGES, max: RUNTIME_MAX }
      };
    }

    return res.status(200).json(payload);
  } catch (e) {
    console.error('Catalog error:', e);
    return res.status(500).json({ error: 'catalog generation failed' });
  }
};
