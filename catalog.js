// api/catalog.js (Vercel)
// Environment variables needed:
// - YT_API_KEY (required)
// - ALLOWED_ORIGIN (optional, e.g. https://yourdomain.com)

export default async function handler(req, res) {
  // CORS
  const allowedOrigin =
    process.env.ALLOWED_ORIGIN || '*';
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');

  // Cache-control: cache at the edge (CDN) for 6h, allow stale while revalidating
  const force = req.query.force === '1' || req.query.force === 'true';
  if (force) {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  }

  const API_KEY = process.env.YT_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Missing YT_API_KEY' });
  }

  try {
    const queries = [
      'Amharic full movie',
      'Ethiopian full movie',
      'አማርኛ ፊልም ሙሉ',
      'Amharic Ethiopian cinema'
    ];

    function isoToSec(iso) {
      const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso) || [];
      const h = parseInt(m[1] || '0', 10);
      const mm = parseInt(m[2] || '0', 10);
      const s = parseInt(m[3] || '0', 10);
      return h * 3600 + mm * 60 + s;
    }

    async function ytSearch(q) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.search = new URLSearchParams({
        key: API_KEY,
        part: 'snippet',
        type: 'video',
        maxResults: '25',
        q,
        safeSearch: 'moderate',
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        regionCode: 'ET',
        relevanceLanguage: 'am',
        videoDuration: 'long', // prefer long-form
        order: 'relevance'
      }).toString();
      const r = await fetch(url);
      if (!r.ok) throw new Error('search failed');
      const j = await r.json();
      return j.items || [];
    }

    async function ytVideos(ids) {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.search = new URLSearchParams({
        key: API_KEY,
        part: 'contentDetails,statistics,status,snippet',
        id: ids.join(',')
      }).toString();
      const r = await fetch(url);
      if (!r.ok) throw new Error('videos failed');
      const j = await r.json();
      return j.items || [];
    }

    // Collect unique IDs
    const idSet = new Set();
    for (const q of queries) {
      const items = await ytSearch(q);
      items.forEach(it => {
        const id = it.id?.videoId;
        if (id) idSet.add(id);
      });
    }
    const ids = Array.from(idSet);
    // Chunk max 50 per videos call
    const chunks = [];
    for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

    const videos = [];
    for (const chunk of chunks) {
      const items = await ytVideos(chunk);
      videos.push(...items);
    }

    const normalized = videos
      .map(v => {
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
      })
      .filter(v => v.embeddable && !v.live && v.durationSec >= 2400);

    // Categorize
    const now = Date.now();
    const days = ms => Math.floor(ms / (1000 * 60 * 60 * 24));
    const recent = normalized.filter(v => days(now - v.publishedAt) <= 730); // <= 2 years
    const classics = normalized.filter(v => days(now - v.publishedAt) > 1825); // > 5 years
    const trendingPool = normalized.filter(v => days(now - v.publishedAt) <= 180); // <= 6 months

    const newReleases = [...recent].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 48);
    const popular = [...normalized].sort((a, b) => b.viewCount - a.viewCount).slice(0, 48);
    const trending = [...trendingPool].sort((a, b) => b.viewCount - a.viewCount).slice(0, 48);
    const classicsTop = [...classics].sort((a, b) => a.publishedAt - b.publishedAt).slice(0, 48);

    function thin(list) {
      return list.map(v => ({
        videoId: v.videoId,
        title: v.title,
        publishedAt: v.publishedAt
      }));
    }

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

    res.status(200).json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'catalog generation failed' });
  }
}
