// src/utils/fanMapMock.js
// 本地 mock：拦截 /fan-map/stats、/mine、/recent-avatars、/mark
// 通过 VITE_FAN_MAP_MOCK=1 或 localStorage.setItem('FAN_MAP_MOCK','1') 开启

import apiClient from './api';

const ENABLED = (() => {
    try {
        if (import.meta.env?.VITE_FAN_MAP_MOCK === '1') return true;
        if (typeof localStorage !== 'undefined' && localStorage.getItem('FAN_MAP_MOCK') === '1') return true;
    } catch (_) {}
    return false;
})();

// 城市坐标
const CITIES = [
    { country: '中国', province: '北京市', city: '北京', lng: 116.4074, lat: 39.9042 },
    { country: '中国', province: '上海市', city: '上海', lng: 121.4737, lat: 31.2304 },
    { country: '中国', province: '广东省', city: '广州', lng: 113.2644, lat: 23.1291 },
    { country: '中国', province: '广东省', city: '深圳', lng: 114.0579, lat: 22.5431 },
    { country: '中国', province: '四川省', city: '成都', lng: 104.0668, lat: 30.5728 },
    { country: '中国', province: '浙江省', city: '杭州', lng: 120.1551, lat: 30.2741 },
    { country: '中国', province: '江苏省', city: '南京', lng: 118.7969, lat: 32.0603 },
    { country: '中国', province: '湖北省', city: '武汉', lng: 114.3055, lat: 30.5928 },
    { country: '中国', province: '陕西省', city: '西安', lng: 108.9402, lat: 34.3416 },
    { country: '中国', province: '辽宁省', city: '沈阳', lng: 123.4315, lat: 41.8057 },
    { country: '中国', province: '福建省', city: '厦门', lng: 118.0894, lat: 24.4798 },
    { country: '中国', province: '湖南省', city: '长沙', lng: 112.9388, lat: 28.2278 },
    { country: '中国', province: '香港特别行政区', city: '香港', lng: 114.1694, lat: 22.3193 },
    { country: '美国', province: 'New York', city: '纽约', lng: -74.0060, lat: 40.7128 },
    { country: '日本', province: 'Tokyo', city: '东京', lng: 139.6917, lat: 35.6895 },
    { country: '英国', province: 'England', city: '伦敦', lng: -0.1278, lat: 51.5074 },
];

const NICKS = ['棋士小迷妹','邓紫棋本邓','棋士001','光年之外','倒数','泡沫','喜欢你','演员','摩天动物园','骑士','花海','超能力','你不是真正的快乐','再见','龙卷风','童话','后会无期','爱你','差不多姑娘','句号','钻石','启示录','再见过去','黑色禁药','光的方向','沙漏','穿越火线','你不是真正的棋士'];

const MESSAGES = ['❤️ G.E.M. 永远爱你','光年之外的爱','希望演唱会快点来！','摩天动物园出道纪念','I AM GLORIA！','钻石永流传 💎','为你打 call','成都见！','上海等你 🎤','一起看演唱会吧','喜欢G到心痒痒','5566我们一起','邓紫棋天下第一','摩登天空🎶'];

const AVATARS = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=12',
    'https://i.pravatar.cc/150?img=20',
    'https://i.pravatar.cc/150?img=32',
    'https://i.pravatar.cc/150?img=47',
    'https://i.pravatar.cc/150?img=56',
    'https://i.pravatar.cc/150?img=64',
    null, null, null, // 模拟无头像（老数据），走 letter avatar
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 生成 80 条 fan mark
const MARKS = (() => {
    const list = [];
    const now = Date.now();
    for (let i = 0; i < 80; i++) {
        const c = pick(CITIES);
        list.push({
            userId: 'mock_' + i,
            country: c.country,
            province: c.province,
            city: c.city,
            lng: c.lng + (Math.random() - 0.5) * 0.05,
            lat: c.lat + (Math.random() - 0.5) * 0.05,
            nickname: pick(NICKS),
            avatar: pick(AVATARS),
            message: Math.random() < 0.45 ? pick(MESSAGES) : null,
            createdAt: new Date(now - Math.floor(Math.random() * 7 * 86400_000)).toISOString(),
        });
    }
    // 按时间倒序
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
})();

// 我的报到状态（默认未报到，调用 /mark 后改为已报到）
const MINE_STATE = { marked: false, country: '', province: '', city: '', nickname: '', message: '' };

function buildStats(recentLimit = 20) {
    // 城市聚合
    const cityMap = new Map();
    for (const m of MARKS) {
        const k = m.city;
        if (!cityMap.has(k)) {
            cityMap.set(k, {
                country: m.country, province: m.province, city: m.city,
                lng: m.lng, lat: m.lat, count: 0,
            });
        }
        cityMap.get(k).count += 1;
    }
    const cities = [...cityMap.values()].sort((a, b) => b.count - a.count);

    // 省份聚合（仅中国）
    const provMap = new Map();
    for (const m of MARKS) {
        if (m.country !== '中国' || !m.province) continue;
        provMap.set(m.province, (provMap.get(m.province) || 0) + 1);
    }
    const provinces = [...provMap.entries()].map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const recent = MARKS.filter(m => m.message)
        .slice(0, recentLimit)
        .map(m => ({
            city: m.city, nickname: m.nickname, message: m.message, createdAt: m.createdAt,
        }));

    return { total: MARKS.length, cities, provinces, recent };
}

function buildAvatars(limit = 20, random = false) {
    const source = random
        ? [...MARKS].sort(() => Math.random() - 0.5)
        : MARKS;
    return {
        items: source.slice(0, limit).map(m => ({
            userId: m.userId,
            nickname: m.nickname,
            avatar: m.avatar,        // 直接是 http URL，前端 imageCache 不会走 /image/getImageByPath
            country: m.country,
            province: m.province,
            city: m.city,
            lng: m.lng, lat: m.lat,
            createdAt: m.createdAt,
        })),
    };
}

function ok(data, message = 'success') {
    return { code: 200, message, data };
}

function delay(ms = 30) {
    return new Promise(r => setTimeout(r, ms));
}

export function installFanMapMock() {
    if (!ENABLED) return false;
    apiClient.interceptors.request.use(async (config) => {
        const url = (config.url || '').replace(/^\/+/, '');
        const method = (config.method || 'get').toLowerCase();
        if (!url.startsWith('fan-map/')) return config;

        await delay(30);

        let payload = null;
        if (url.startsWith('fan-map/stats') && method === 'get') {
            payload = ok(buildStats(Number(config.params?.recentLimit) || 20));
        } else if (url.startsWith('fan-map/recent-avatars') && method === 'get') {
            const lim = Number(config.params?.limit) || 20;
            const rnd = String(config.params?.random) === 'true';
            payload = ok(buildAvatars(lim, rnd));
        } else if (url.startsWith('fan-map/mine') && method === 'get') {
            payload = ok({ loggedIn: true, marked: MINE_STATE.marked, ...MINE_STATE });
        } else if (url.startsWith('fan-map/mark') && method === 'post') {
            const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
            if (MINE_STATE.marked) {
                payload = ok(null, 'already_marked');
            } else {
                MINE_STATE.marked = true;
                Object.assign(MINE_STATE, body);
                MARKS.unshift({
                    userId: 'mock_me',
                    country: body.country, province: body.province, city: body.city,
                    lng: Number(body.lng), lat: Number(body.lat),
                    nickname: body.nickname || '我',
                    avatar: null, // 走 user store 的真实头像
                    message: body.message || null,
                    createdAt: new Date().toISOString(),
                });
                payload = ok(null, 'success');
            }
        }

        if (payload) {
            // axios adapter 短路：直接 resolve 一个假响应
            config.adapter = () => Promise.resolve({
                data: payload,
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
                request: {},
            });
        }
        return config;
    });
    // eslint-disable-next-line no-console
    console.log('[fan-map mock] enabled, total marks =', MARKS.length);
    return true;
}
