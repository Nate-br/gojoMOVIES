api/catalog.js
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

const MIN_DURATION_SEC = parseInt(process.env.MIN_DURATION_SEC || '1200', 10); // 20 min
const SEARCH_PAGES = Math.min(parseInt(process.env.SEARCH_PAGES || '3', 10), 5);
const MAX_PER_CATEGORY = parseInt(process.env.MAX_PER_CATEGORY || '64', 10);
const CHANNEL_IDS = (process.env.YT_CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);
const DEBUG = (req.query.debug === '1');

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
let token = ''; const ids = [];
for (let i=0;i<pages;i++) {
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
(j.items||[]).forEach(it => it.id?.videoId && ids.push(it.id.videoId));
token = j.nextPageToken || '';
if (!token) break;
}
return ids;
}

async function ytVideos(allIds) {
const out = [];
for (let i=0;i<allIds.length;i+=50) {
const chunk = allIds.slice(i, i+50);
const url = new URL('https://www.googleapis.com/youtube/v3/videos');
url.search = new URLSearchParams({
key: API_KEY,
part: 'contentDetails,statistics,status,snippet',
id: chunk.join(',')
}).toString();
const r = await fetchFn(url);
if (!r.ok) continue;
const j = await r.json();
out.push(...(j.items||[]));
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

async function listPlaylistVideoIds(playlistId, pages=2) {
let token = ''; const ids = [];
for (let i=0;i<pages;i++) {
const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
url.search = new URLSearchParams({
key: API_KEY, part: 'contentDetails', playlistId, maxResults: '50', pageToken: token
}).toString();
const r = await fetchFn(url);
if (!r.ok) break;
const j = await r.json();
(j.items||[]).forEach(it => it.contentDetails?.videoId && ids.push(it.contentDetails.videoId));
token = j.nextPageToken || '';
if (!token) break;
}
return ids;
}

try {
// 1) parallel searches
const searchPromises = queries.map(q => ytSearchPaged(q, SEARCH_PAGES));
const searchResults = await Promise.all(searchPromises);
const idSet = new Set(searchResults.flat());
