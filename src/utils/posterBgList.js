// src/utils/posterBgList.js
// 从后端 /gem-photo 接口动态获取邓紫棋精选图(CDN 直连)
//
// 缓存策略：
//   - 首次调用 pickRandomPosterBg() 异步拉取 list,后续直接命中本地缓存
//   - sessionStorage 保留 30min,避免每次打开页面都请求
//   - 拉取失败回退到内置 /img/posterBg/1.jpg

import axios from 'axios';

const CACHE_KEY = 'gem_photo_pool_v1';
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟
const FALLBACK = '/img/posterBg/1.jpg';

let memCache = null;
let pending = null;

function readSession() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { ts, items } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) return null;
        return items;
    } catch { return null; }
}

function writeSession(items) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
    } catch { /* 忽略隐私模式 */ }
}

async function fetchPool() {
    if (memCache) return memCache;
    const cached = readSession();
    if (cached && cached.length) { memCache = cached; return memCache; }

    if (!pending) {
        const base = (import.meta.env.VITE_API_BASEURL || '') + (import.meta.env.VITE_API_PREFIX ?? '');
        pending = axios.get(`${base}/gem-photo/list`, { timeout: 5000 })
            .then(r => {
                const items = (r.data && r.data.data && r.data.data.items) || [];
                memCache = items.map(i => i.url).filter(Boolean);
                writeSession(memCache);
                return memCache;
            })
            .catch(() => { memCache = []; return memCache; })
            .finally(() => { pending = null; });
    }
    return pending;
}

// 启动时预拉一次,后续 pickRandomPosterBg 调用就是同步的
fetchPool();

/** 异步取一张,确保等池子就绪后再随机 */
export async function pickRandomPosterBgAsync() {
    const pool = await fetchPool();
    if (!pool.length) return FALLBACK;
    return pool[Math.floor(Math.random() * pool.length)];
}
