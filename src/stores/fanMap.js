// src/stores/fanMap.js
// Unified fan-map store: stats / mine / optimistic submit / cross-tab sync
import { defineStore } from 'pinia';
import apiClient from '@/utils/api';
import { logger } from '@/utils/logger';
import { setMarkedLocally } from '@/utils/fingerprint';

const STATS_TTL_MS = 60 * 1000; // 与后端 Redis TTL 对齐
const CHANNEL_NAME = 'gem-fan-map';

// ========= 头像轮换参数 =========
// 设计权衡见 docs：池 60 / 展示 12 / 单次替换 6 / 间隔 5s / 池刷新 60s
const AVATAR_POOL_SIZE = 60;
const AVATAR_DISPLAY_SIZE = 12;
const AVATAR_ROTATE_STEP = 6;
const AVATAR_ROTATE_INTERVAL_MS = 5000;
const AVATAR_POOL_REFRESH_MS = 60 * 1000;

let bc = null;
function getChannel() {
    if (bc !== null) return bc;
    try {
        bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : false;
    } catch (_) {
        bc = false;
    }
    return bc;
}

function broadcast(type, payload) {
    const ch = getChannel();
    if (ch) {
        try { ch.postMessage({ type, payload, ts: Date.now() }); } catch (_) {}
    }
    // localStorage 兜底（部分浏览器无 BroadcastChannel）
    try {
        localStorage.setItem('__gem_fan_map_evt__', JSON.stringify({ type, payload, ts: Date.now() }));
    } catch (_) {}
}

export const useFanMapStore = defineStore('fanMap', {
    state: () => ({
        // stats
        total: 0,
        cities: [],         // [{country, province, city, lng, lat, count}]
        provinces: [],      // [{name, value}]
        recent: [],         // [{city, nickname, message, createdAt}]
        avatars: [],        // 头像“池”：[{userId, nickname, avatar, city, lng, lat, _avatarUrl}]
        displayAvatars: [], // 当前展示的子集（从池中随机抽 N 个，每隔 INTERVAL 替换部分）
        statsLoadedAt: 0,
        statsLoading: false,
        avatarsLoadedAt: 0,
        // mine
        marked: false,
        mine: {},           // {country, province, city, nickname, message}
        mineLoadedAt: 0,
        // sync
        _bcBound: false,
        // 轮换 timer（不放进 state 的响应式追踪也行，但放进来便于 SSR/HMR 清理）
        _rotateTimer: null,
        _poolTimer: null,
        _rotatePaused: false,
    }),

    getters: {
        topCities: (s) => s.cities.slice(0, 10),
        isStatsFresh: (s) => Date.now() - s.statsLoadedAt < STATS_TTL_MS,
    },

    actions: {
        // 跨标签页消息绑定（仅绑定一次）
        bindSync() {
            if (this._bcBound) return;
            this._bcBound = true;
            const ch = getChannel();
            if (ch) {
                ch.onmessage = (e) => this._applyEvent(e.data);
            }
            // storage 事件兜底
            window.addEventListener('storage', (e) => {
                if (e.key !== '__gem_fan_map_evt__' || !e.newValue) return;
                try { this._applyEvent(JSON.parse(e.newValue)); } catch (_) {}
            });
        },

        _applyEvent(evt) {
            if (!evt || !evt.type) return;
            if (evt.type === 'mark-success') {
                // 别的标签页报到成功 → 本页同步标记
                this.marked = true;
                if (evt.payload?.mine) this.mine = evt.payload.mine;
                // 让 stats 失效，下次访问重新拉
                this.statsLoadedAt = 0;
            } else if (evt.type === 'stats-refresh') {
                this.statsLoadedAt = 0;
            }
        },

        async loadStats({ force = false, recentLimit = 20 } = {}) {
            if (!force && this.isStatsFresh) return;
            if (this.statsLoading) return;
            this.statsLoading = true;
            try {
                const res = await apiClient.get('/fan-map/stats', { params: { recentLimit } });
                const d = res.data?.data || {};
                this.total = d.total || 0;
                this.cities = d.cities || [];
                this.provinces = d.provinces || [];
                this.recent = d.recent || [];
                this.statsLoadedAt = Date.now();
            } catch (e) {
                logger.warn?.('[fan-map store] loadStats failed', e);
            } finally {
                this.statsLoading = false;
            }
        },

        /**
         * 拉头像“池”（默认 60 个），随机抽样，转 blob URL。
         * 池子用于前端轮换抽样，避免每次轮换都打后端。
         */
        async loadAvatars({ force = false, limit = AVATAR_POOL_SIZE, random = true } = {}) {
            if (!force && Date.now() - this.avatarsLoadedAt < STATS_TTL_MS && this.avatars.length) return;
            try {
                const res = await apiClient.get('/fan-map/recent-avatars', { params: { limit, random } });
                const items = res.data?.data?.items || [];
                // 并发拉头像 blob，失败的点丢弃。限并发量避免突击
                const settled = await Promise.allSettled(items.map(async (it) => {
                    // 无头像：保留条目，前端走 letter avatar 降级
                    if (!it.avatar) return { ...it, _avatarUrl: null };
                    // http(s) 直链：直接用，不走 /image/getImageByPath
                    if (/^https?:\/\//i.test(it.avatar)) return { ...it, _avatarUrl: it.avatar };
                    try {
                        const url = await apiClient.getImageUrl(it.avatar, 96);
                        return { ...it, _avatarUrl: url };
                    } catch (_) { return { ...it, _avatarUrl: null }; }
                }));
                this.avatars = settled
                    .filter(r => r.status === 'fulfilled' && r.value)
                    .map(r => r.value);
                this.avatarsLoadedAt = Date.now();
                // 池更新后，重抽展示集（保留交集稳定性：池里仍存在的展示项不动）
                this._reseedDisplay();
            } catch (e) {
                logger.warn?.('[fan-map store] loadAvatars failed', e);
            }
        },

        /**
         * 从池子里随机抽 AVATAR_DISPLAY_SIZE 个填充展示集。
         * 若池中已有 displayAvatars 的部分项，保留它们以减少首屏抖动。
         */
        _reseedDisplay() {
            if (!this.avatars.length) {
                this.displayAvatars = [];
                return;
            }
            const want = Math.min(AVATAR_DISPLAY_SIZE, this.avatars.length);
            const poolIds = new Set(this.avatars.map(a => a.userId));
            const keep = this.displayAvatars.filter(a => poolIds.has(a.userId)).slice(0, want);
            const keepIds = new Set(keep.map(a => a.userId));
            const candidates = this.avatars.filter(a => !keepIds.has(a.userId));
            // 洗牌取剩余名额
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
            this.displayAvatars = keep.concat(candidates.slice(0, want - keep.length));
        },

        /**
         * 单次轮换：从池中抽出 STEP 个不在当前展示中的，替换掉展示集中最“老”的 STEP 个。
         * 替换策略：FIFO（按当前 displayAvatars 顺序）。
         */
        rotateAvatars(step = AVATAR_ROTATE_STEP) {
            if (this._rotatePaused) return;
            if (this.avatars.length <= AVATAR_DISPLAY_SIZE) return; // 池不够大，没法换出新面孔
            const displayIds = new Set(this.displayAvatars.map(a => a.userId));
            const candidates = this.avatars.filter(a => !displayIds.has(a.userId));
            if (!candidates.length) return;
            // 从候选中随机挑 step 个
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
            const incoming = candidates.slice(0, Math.min(step, candidates.length));
            // 顶替最老的（数组头部），新人放到末尾
            const next = this.displayAvatars.slice(incoming.length).concat(incoming);
            this.displayAvatars = next;
        },

        /** 启动轮换 + 池刷新定时器（幂等）。 */
        startAvatarRotation() {
            this.stopAvatarRotation();
            this._rotatePaused = false;
            this._rotateTimer = setInterval(() => this.rotateAvatars(), AVATAR_ROTATE_INTERVAL_MS);
            this._poolTimer = setInterval(() => this.loadAvatars({ force: true }), AVATAR_POOL_REFRESH_MS);
            // 页面隐藏时暂停，避免后台空跑
            if (typeof document !== 'undefined' && !this._visBound) {
                this._visBound = true;
                document.addEventListener('visibilitychange', () => {
                    this._rotatePaused = document.hidden;
                });
            }
        },

        stopAvatarRotation() {
            if (this._rotateTimer) { clearInterval(this._rotateTimer); this._rotateTimer = null; }
            if (this._poolTimer)   { clearInterval(this._poolTimer);   this._poolTimer = null; }
        },

        async loadMine({ isLoggedIn }) {
            if (!isLoggedIn) {
                this.marked = false;
                this.mine = {};
                this.mineLoadedAt = Date.now();
                return;
            }
            try {
                const res = await apiClient.get('/fan-map/mine');
                const d = res.data?.data || {};
                this.marked = !!d.marked;
                this.mine = d.marked ? {
                    id: d.id,
                    country: d.country, province: d.province, city: d.city,
                    nickname: d.nickname, message: d.message,
                } : {};
                if (this.marked) setMarkedLocally();
                this.mineLoadedAt = Date.now();
            } catch (e) { /* silent */ }
        },

        /**
         * 乐观提交：先本地置为已报到 + total+1 + 推一条 recent，
         * 再发请求；失败回滚。返回 { code, message, rollback() } 供页面做后续动效/海报。
         */
        async submitMark(payload) {
            // 1) 备份 → 乐观更新
            const snapshot = {
                marked: this.marked,
                mine: { ...this.mine },
                total: this.total,
                recent: this.recent.slice(),
                cities: this.cities.slice(),
            };
            this.marked = true;
            this.mine = {
                country: payload.country, province: payload.province, city: payload.city,
                nickname: payload.nickname, message: payload.message,
            };
            this.total += 1;
            if (payload.message) {
                this.recent = [{
                    city: payload.city,
                    nickname: payload.nickname || '匿名棋士',
                    message: payload.message,
                    createdAt: new Date().toISOString(),
                    _optimistic: true,
                }, ...this.recent].slice(0, 20);
            }
            // 2) 同城市 count+1
            const idx = this.cities.findIndex(c => c.city === payload.city);
            if (idx >= 0) {
                const next = this.cities.slice();
                next[idx] = { ...next[idx], count: (Number(next[idx].count) || 0) + 1 };
                next.sort((a, b) => (b.count || 0) - (a.count || 0));
                this.cities = next;
            } else {
                this.cities = [
                    ...this.cities,
                    {
                        country: payload.country, province: payload.province, city: payload.city,
                        lng: payload.lng, lat: payload.lat, count: 1,
                    },
                ];
            }

            // 3) 真实请求
            try {
                const res = await apiClient.post('/fan-map/mark', payload);
                const code = res.data?.code;
                const message = res.data?.message;
                if (code === 200) {
                    setMarkedLocally();
                    // 立即重拉 mine 拿真实 id（海报右上角编号需要）
                    try { await this.loadMine({ isLoggedIn: true }); } catch (_) {}
                    broadcast('mark-success', { mine: this.mine });
                    // 异步后台刷新真实 stats / avatars（不阻塞 UI）
                    setTimeout(() => {
                        this.loadStats({ force: true });
                        this.loadAvatars({ force: true });
                    }, 1200);
                    return { ok: true, code, message };
                }
                // 业务失败 → 回滚
                Object.assign(this, snapshot);
                return { ok: false, code, message };
            } catch (e) {
                Object.assign(this, snapshot);
                return { ok: false, code: -1, message: 'network_error', error: e };
            }
        },
    },
});
