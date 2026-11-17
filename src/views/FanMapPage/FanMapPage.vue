<template>
    <div class="fan-map-page">
        <!-- Aurora background layers -->
        <div class="bg-aurora"></div>
        <div class="bg-grid"></div>

        <div class="page-inner">
            <!-- Hero -->
            <section class="map-hero">
                <div class="hero-left">
                    <span class="hero-tag"><span class="tag-dot"></span> COMMUNITY</span>
                    <h1 class="hero-title">
                        全球 <span class="title-hl">棋士</span> 地图
                    </h1>
                    <p class="hero-sub">来自世界各地的棋士在这里集结 — 点亮属于你的光</p>

                    <div class="hero-actions">
                        <button v-if="!alreadyMarked" class="btn-mark" @click="handleMarkClick">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>点我标记我的位置</span>
                            <i class="fas fa-arrow-right btn-arrow"></i>
                        </button>
                        <div v-else class="already-marked">
                            <img v-if="userStore.avatar" :src="userStore.avatar" alt="me" class="already-avatar" />
                            <i v-else class="fas fa-check-circle"></i>
                            你已在 <strong>{{ mineInfo.city }}</strong> 报到
                            <button class="btn-poster" @click="openPosterModal" title="打开粉丝档案卡">
                                <i class="fas fa-id-card"></i> 粉丝档案卡
                            </button>
                        </div>
                    </div>
                </div>

                <div class="hero-right">
                    <div class="stat-card stat-total">
                        <div class="stat-num">{{ totalCount.toLocaleString() }}</div>
                        <div class="stat-label"><i class="fas fa-users"></i> 总棋士数</div>
                    </div>
                    <div class="stat-card stat-city">
                        <div class="stat-num">{{ cityData.length }}</div>
                        <div class="stat-label"><i class="fas fa-city"></i> 覆盖城市</div>
                    </div>
                    <div class="stat-card stat-province">
                        <div class="stat-num">{{ provinceData.length }}</div>
                        <div class="stat-label"><i class="fas fa-flag"></i> 覆盖省份</div>
                    </div>
                </div>
            </section>

            <!-- Map toolbar -->
            <div class="map-toolbar">
                <div class="toolbar-left">
                    <div class="map-context">
                        <span class="context-kicker">{{ view === 'china' ? 'CHINA MAP' : 'WORLD MAP' }}</span>
                        <strong>{{ drilldownProvince ? `${drilldownProvince} · 城市分布` : (view === 'china' ? '全国棋士分布' : '全球棋士分布') }}</strong>
                    </div>
                    <button v-if="drilldownProvince" class="btn-back" @click="backToChina">
                        <i class="fas fa-arrow-left"></i> 返回全国
                    </button>
                </div>
                <div class="toolbar-right">
                    <div class="view-switch">
                        <button :class="{ active: view === 'china' }" @click="switchView('china')">
                            <i class="fas fa-flag"></i> 中国
                        </button>
                        <button :class="{ active: view === 'world' }" @click="switchView('world')">
                            <i class="fas fa-globe"></i> 全球
                        </button>
                    </div>
                    <div class="mode-switch">
                        <button :class="{ active: showAvatars }" @click="showAvatars = !showAvatars" :title="showAvatars ? '隐藏用户头像' : '显示用户头像'">
                            <i :class="showAvatars ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
                        </button>
                    </div>
                </div>
                <div class="map-legend">
                    <span class="legend-item"><span class="legend-gradient"></span> 低 / 中 / 高</span>
                    <span class="legend-item"><span class="dot heat heat-4"></span> TOP 城市</span>
                    <span class="legend-tip"><i class="fas fa-mouse-pointer"></i> 点击省份查看城市</span>
                </div>
            </div>

            <!-- Map canvas -->
            <div class="map-wrapper">
                <div class="map-corner tl"></div>
                <div class="map-corner tr"></div>
                <div class="map-corner bl"></div>
                <div class="map-corner br"></div>
                <div ref="chartDom" class="echarts-container"></div>
                <div v-if="loading" class="map-loading">
                    <div class="loader-ring"></div>
                    <span>正在点亮世界地图...</span>
                </div>
            </div>

            <!-- Bottom panels -->
            <div class="bottom-panels">
                <div class="panel panel-top-cities">
                    <div class="panel-head">
                        <h3><i class="fas fa-trophy"></i> 城市榜</h3>
                        <span class="panel-sub">TOP 10</span>
                    </div>
                    <ol class="city-list">
                        <li v-for="(c, i) in topCities" :key="c.city" :class="`rank-${i + 1}`">
                            <span class="rank">{{ i + 1 }}</span>
                            <span class="name">{{ c.city }}</span>
                            <div class="bar-wrap">
                                <div class="bar" :style="{ width: barWidth(c.count) + '%' }"></div>
                            </div>
                            <span class="count">{{ c.count }}</span>
                        </li>
                        <li v-if="!topCities.length" class="empty">等你来打头阵</li>
                    </ol>
                </div>

                <div class="panel panel-recent">
                    <div class="panel-head">
                        <h3><i class="fas fa-comment-dots"></i> 最新留言</h3>
                        <span class="panel-sub"><span class="live-dot"></span> LIVE</span>
                    </div>
                    <ul class="recent-list">
                        <li v-for="(r, i) in recent" :key="i" class="recent-item">
                            <div class="recent-avatar">
                                {{ (r.nickname || r.city || '?').slice(0, 1).toUpperCase() }}
                            </div>
                            <div class="recent-body">
                                <div class="recent-meta">
                                    <span class="r-nick">{{ r.nickname || '匿名棋士' }}</span>
                                    <span class="r-city"><i class="fas fa-map-pin"></i> {{ r.city }}</span>
                                </div>
                                <div class="r-msg" v-if="r.message">「{{ r.message }}」</div>
                                <div class="r-msg placeholder" v-else>— 报到 —</div>
                            </div>
                        </li>
                        <li v-if="!recent.length" class="empty">还没有人留言，做第一个吧～</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- 粉丝档案卡（与个人主页同一个组件） -->
        <FanCardModal
            v-if="fanCardUserInfo"
            :is-visible="showPoster"
            :user-info="fanCardUserInfo"
            @close="showPoster = false"
            @updated="onFanCardBgUpdated"
        />

        <!-- Login modal -->
        <LoginModal ref="loginModalRef" />

        <!-- Mark modal -->
        <transition name="modal-fade">
            <div v-if="showModal" class="modal-mask" @click.self="closeModal">
                <div class="modal-card">
                    <div class="modal-glow"></div>
                    <button class="modal-close" @click="closeModal"><i class="fas fa-times"></i></button>
                    <div class="modal-header">
                        <div class="modal-icon">📍</div>
                        <h2>在地图上报到</h2>
                        <p class="modal-hint">选择你所在的城市，留下一句话（可选）</p>
                    </div>

                    <div class="field-row">
                        <label class="field field-inline">
                            <span>国家/地区 <em class="req">*</em></span>
                            <select v-model="form.country" class="select-box" @change="onCountryChange">
                                <option v-for="c in countryList" :key="c" :value="c">{{ c }}</option>
                            </select>
                        </label>
                        <label v-if="provinceList.length" class="field field-inline">
                            <span>省份 <em class="req">*</em></span>
                            <select v-model="form.province" class="select-box" @change="onProvinceChange">
                                <option value="" disabled>请选择省份</option>
                                <option v-for="p in provinceList" :key="p" :value="p">{{ p }}</option>
                            </select>
                        </label>
                    </div>
                    <label class="field">
                        <span>城市 <em class="req">*</em></span>
                        <select v-model="form.city" class="select-box" :disabled="!cityList.length">
                            <option value="" disabled>{{ cityList.length ? '请选择城市' : (provinceList.length ? '请先选择省份' : '请先选择国家') }}</option>
                            <option v-for="n in cityList" :key="n" :value="n">{{ n }}</option>
                        </select>
                    </label>

                    <label class="field">
                        <span>昵称 <em class="opt">可选</em></span>
                        <input v-model="form.nickname" maxlength="20" placeholder="不填则匿名" />
                    </label>

                    <label class="field field-message">
                        <span>留言 <em class="opt">可选 · 最多 80 字</em></span>
                        <textarea
                            ref="messageTextarea"
                            v-model="form.message"
                            maxlength="80"
                            rows="2"
                            placeholder="成都棋士报到！"
                        ></textarea>
                        <button
                            type="button"
                            class="emoji-toggle"
                            :class="{ active: showEmojiPanel }"
                            @click.prevent="toggleEmojiPanel"
                            aria-label="插入表情"
                        >
                            <i class="far fa-smile"></i>
                        </button>
                        <span class="field-count">{{ (form.message || '').length }}/80</span>
                        <transition name="emoji-fade">
                            <div v-if="showEmojiPanel" class="emoji-panel" @click.stop>
                                <button
                                    v-for="e in emojiList"
                                    :key="e"
                                    type="button"
                                    class="emoji-item"
                                    @click.prevent="insertEmoji(e)"
                                >{{ e }}</button>
                            </div>
                        </transition>
                    </label>

                    <div class="modal-actions">
                        <button class="btn-cancel" @click="closeModal">取消</button>
                        <button class="btn-submit" :disabled="submitting" @click="submitMark">
                            <i class="fas fa-heart"></i>
                            {{ submitting ? '提交中...' : '确认报到' }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
let echarts = null  // lazy-loaded in onMounted
import { trackEvent, EVENTS } from '@/utils/stats';
import { lookupCity, getCountries, getProvincesOfCountry, getCitiesOfProvince } from '@/utils/cityCoords';
import { showToast } from '@/utils/toast';
import { useUserStore } from '@/stores/user';
import { useFanMapStore } from '@/stores/fanMap';
import apiClient from '@/utils/api';
import FanCardModal from '@/components/user/FanCardModal.vue';
import { toCircularAvatarDataURL } from '@/utils/circleAvatar';
import LoginModal from '@/components/Login/LoginModal.vue';

const userStore = useUserStore();
const fanMapStore = useFanMapStore();
const loginModalRef = ref(null);

// 海报（粉丝档案卡）弹窗状态
const showPoster = ref(false);
// 传给 FanCardModal 的用户信息（拼接档案 + 报到信息）
const fanCardUserInfo = ref(null);
// 档案信息（fanSinceYear / favoriteSong / fanBio / posterBg）——看报到海报时拉取
const fanProfile = ref(null);
async function ensureFanProfile() {
    if (fanProfile.value || !userStore.userId) return;
    try {
        const res = await apiClient.get('/user/getUserInfo', { params: { userId: userStore.userId } });
        fanProfile.value = res.data?.data || {};
    } catch (_) {
        fanProfile.value = {};
    }
}

function buildFanCardUserInfo() {
    const m = fanMapStore.mine || {};
    const p = fanProfile.value || {};
    const total = fanMapStore.total || 0;
    return {
        userId: userStore.userId,
        nickName: p.nickName || userStore.nickName || '匿名棋士',
        fanSinceYear: p.fanSinceYear ?? null,
        favoriteSong: p.favoriteSong || '',
        fanBio: p.fanBio || '',
        fanTag: p.fanTag || '',
        posterBg: p.posterBg || '',
        mark: m.city ? {
            id: m.id || null,
            city: m.city,
            province: m.province || '',
            message: m.message || '',
            total,
            rank: null,
        } : null,
    };
}

function handleMarkClick() {
    if (!userStore.isLoggedIn) {
        showToast('请先登录后再报到～', 'info');
        loginModalRef.value?.openModal();
        return;
    }
    openMarkModal();
}

const chartDom = ref(null);
let chart = null;
let chinaMapRegistered = false;
let worldMapRegistered = false;
let worldMapFailed = false;

const view = ref('china');
const showAvatars = ref(true);
const drilldownProvince = ref(null); // 当前下钻的省份名（null 表示全国视图）
// 移动端初始 zoom 略小，避免地图溢出可视区
const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
const currentZoom = ref(isMobile ? 0.95 : 1.1);       // 监听 georoam 用，决定渲染粒度
const loading = ref(true);
// 以下数据从 store 派生（统一来源 + 跨页同步）
const totalCount = computed(() => fanMapStore.total);
const topCities = computed(() => fanMapStore.topCities);
const recent = computed(() => fanMapStore.recent);
const provinceData = computed(() => fanMapStore.provinces);
const cityData = computed(() => fanMapStore.cities);
const alreadyMarked = computed(() => fanMapStore.marked);
const mineInfo = computed(() => fanMapStore.mine);
// 头像钉数据（已转成圆形 dataURL）
const avatarPins = ref([]); // [{name, value:[lng,lat], symbol, nickname, city, userId}]
let rerenderTimer = null;
const registeredProvinces = new Set();

const showModal = ref(false);
const submitting = ref(false);
const form = ref({ country: '中国', province: '', city: '', nickname: '', message: '' });
const messageTextarea = ref(null);
const showEmojiPanel = ref(false);
const emojiList = [
    '😀','😄','😁','😆','😅','😂','🤣','😊','😍','🥰',
    '😘','😎','🤩','🥳','😏','🤔','😴','🙄','😮','😢',
    '😭','😡','🤯','👀','💪','👍','👏','🙏','🤝','✌️',
    '❤️','💖','💜','💙','💚','💛','🧡','🖤','✨','🔥',
    '🎉','🎊','🎁','🌹','🌸','🌟','⭐','🏆','🎵','🎶'
];

function toggleEmojiPanel() {
    showEmojiPanel.value = !showEmojiPanel.value;
}

function insertEmoji(emoji) {
    const current = form.value.message || '';
    const ta = messageTextarea.value;
    const max = 80;
    if (ta && typeof ta.selectionStart === 'number') {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = (current.slice(0, start) + emoji + current.slice(end)).slice(0, max);
        form.value.message = next;
        const caret = Math.min(next.length, start + emoji.length);
        // Restore caret after DOM update
        requestAnimationFrame(() => {
            ta.focus();
            try { ta.setSelectionRange(caret, caret); } catch (_) {}
        });
    } else {
        form.value.message = (current + emoji).slice(0, max);
    }
}

const countryList = computed(() => getCountries());
const provinceList = computed(() => getProvincesOfCountry(form.value.country));
const cityList = computed(() => {
    if (provinceList.value.length && !form.value.province) return [];
    return getCitiesOfProvince(form.value.country, form.value.province);
});

function onCountryChange() {
    form.value.province = '';
    form.value.city = '';
}
function onProvinceChange() {
    form.value.city = '';
}

// Bar width for city leaderboard (relative to top-1)
function barWidth(count) {
    const max = topCities.value[0]?.count || 1;
    return Math.max(6, Math.round((Number(count) / max) * 100));
}

// ========= Lifecycle =========

onMounted(async () => {
    if (!echarts) echarts = await import('echarts')
    fanMapStore.bindSync(); // 启用跨标签页同步
    await loadStats();
    await checkMine();
    await ensureChinaMap();
    initChart();
    render();
    // 后台拉头像，完成后追加到地图，不阻塞首屏
    loadAvatarPins();
    // 启动头像轮换（每 8s 替换 6 个 / 每 90s 刷新池）
    fanMapStore.startAvatarRotation();
    window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    fanMapStore.stopAvatarRotation();
    if (chart) chart.dispose();
});

watch(view, async () => {
    drilldownProvince.value = null;
    currentZoom.value = view.value === 'china' ? (isMobile ? 0.95 : 1.1) : (isMobile ? 1 : 1.2);
    if (view.value === 'china') {
        await ensureChinaMap();
    } else {
        await ensureWorldMap();
    }
    render();
});

watch(showAvatars, () => render());

// 头像池轮换：store 内的 displayAvatars 每 8s 替换 6 个 → 不打接口，复用池子重算 pins
watch(
    () => fanMapStore.displayAvatars,
    () => {
        // 下钻视图直接用 avatars 池过滤，无需响应展示集变化
        if (drilldownProvince.value) return;
        loadAvatarPins(null, { skipFetch: true });
    },
    { deep: false }
);

async function switchView(v) {
    view.value = v;
}

async function backToChina() {
    drilldownProvince.value = null;
    currentZoom.value = isMobile ? 0.95 : 1.1;
    await loadAvatarPins(null);
    render();
}

// 直辖市没有独立的省级地图文件，统一回退到全国地图（仅做下钻视图保持，城市散点照常显示）
const MUNICIPALITY_FALLBACK = new Set(['北京市', '上海市', '天津市', '重庆市']);

async function ensureProvinceMap(provinceName) {
    if (registeredProvinces.has(provinceName)) return true;
    if (MUNICIPALITY_FALLBACK.has(provinceName)) {
        // 直辖市复用全国地图轮廓，避免 404
        return true;
    }
    try {
        const url = `/data/province/${encodeURIComponent(provinceName)}.json`;
        const resp = await fetch(url);
        if (!resp.ok) return false;
        const geoJson = await resp.json();
        echarts.registerMap(provinceName, geoJson);
        registeredProvinces.add(provinceName);
        return true;
    } catch (e) {
        console.warn('[fan-map] load province map failed', provinceName, e);
        return false;
    }
}

async function drilldownTo(provinceName) {
    const ok = await ensureProvinceMap(provinceName);
    if (!ok) {
        showToast('该省地图数据暂不可用', 'info');
        return;
    }
    drilldownProvince.value = provinceName;
    currentZoom.value = 1.2;
    await loadAvatarPins(provinceName);
    render();
}

// ========= Data =========

async function loadStats() {
    loading.value = true;
    try {
        await fanMapStore.loadStats({ force: true, recentLimit: 20 });
    } finally {
        loading.value = false;
    }
}

async function checkMine() {
    await fanMapStore.loadMine({ isLoggedIn: userStore.isLoggedIn });
}

/** 拉取头像：每人一个独立头像点，同城用同心圆环布局避免重叠。
 *  无头像用户降级为 letter avatar。
 *  @param {string|null} provinceFilter 仅保留该省份的头像（下钻时使用）
 *  @param {{skipFetch?: boolean}} opts skipFetch=true 时不打接口（轮换时复用池）
 */
async function loadAvatarPins(provinceFilter = null, opts = {}) {
    if (!opts.skipFetch) {
        await fanMapStore.loadAvatars({ limit: 60, random: true });
    }
    // 下钻视图：从“池”里过滤该省所有匹配项（可见数量 ≤ 同省份头像数）
    // 全国/全球视图：用“展示集”（已被池子轮换控制成 ~20 个）
    let items = provinceFilter
        ? fanMapStore.avatars.filter(it => it.province === provinceFilter)
        : fanMapStore.displayAvatars;
    if (!items.length) {
        avatarPins.value = [];
        if (chart) render();
        return;
    }

    // 同城分组：以 city 为 key
    const groups = new Map();
    for (const it of items) {
        const key = it.city || `${it.lng},${it.lat}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(it);
    }

    // 同心圆环布局：第 k 人放在 r_k = baseStep * ring 的圆上
    // ring 1: 6个，ring 2: 12个，ring 3: 18个... 首人在中心
    const baseStep = provinceFilter ? 0.18 : 0.42; // 下钻视图更紧凑
    // 1) 先把所有点位算出来（同步快），再并发生成 dataURL
    const tasks = [];
    for (const [, list] of groups) {
        const cx = Number(list[0].lng);
        const cy = Number(list[0].lat);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;

        for (let i = 0; i < list.length; i++) {
            const it = list[i];
            let lng = cx, lat = cy;
            if (i > 0) {
                let ring = 1, slot = i;
                while (slot > 6 * ring) {
                    slot -= 6 * ring;
                    ring += 1;
                }
                const slots = 6 * ring;
                const angle = (slot - 1) * (2 * Math.PI / slots);
                lng = cx + ring * baseStep * Math.cos(angle);
                lat = cy + ring * baseStep * Math.sin(angle);
            }
            tasks.push({ it, i, lng, lat });
        }
    }

    // 2) 并发生成圆形头像 dataURL（cache 命中时立即返回）
    const settled = await Promise.all(tasks.map(t =>
        toCircularAvatarDataURL(t.it._avatarUrl || null, {
            size: 56,
            ring: 3,
            ringColor: t.i === 0 ? '#FACC15' : '#ff4ff5',
            count: 1,
            label: t.it.nickname || '?',
        }).then(dataUrl => ({ ...t, dataUrl }))
    ));

    const out = [];
    for (const { it, lng, lat, dataUrl } of settled) {
        if (!dataUrl) continue;
        out.push({
            // id 供 universalTransition 识别同一个点，轮换时不闪烁
            id: it.userId || `${it.city}-${it.nickname}`,
            name: it.nickname || '匿名棋士',
            value: [lng, lat],
            symbol: 'image://' + dataUrl,
            city: it.city,
            nickname: it.nickname || '匿名棋士',
        });
    }
    avatarPins.value = out;
    // 仅增量更新头像 series，避免整图重建；universalTransition 收状会接管进入/离开动画
    if (chart) {
        if (opts.skipFetch) {
            const avatarS = buildAvatarSeries(view.value);
            chart.setOption({ series: avatarS ? [avatarS] : [] }, { lazyUpdate: true });
        } else {
            render();
        }
    }
}

async function ensureChinaMap() {
    if (chinaMapRegistered) return;
    try {
        const resp = await fetch('/data/china_map.json');
        const geoJson = await resp.json();
        echarts.registerMap('china', geoJson);
        chinaMapRegistered = true;
    } catch (e) {
        console.error('[fan-map] load china map failed', e);
    }
}

async function ensureWorldMap() {
    if (worldMapRegistered || worldMapFailed) return;
    // Try local first, then CDN as fallback.
    const sources = [
        '/data/world.json',
        'https://fastly.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json'
    ];
    for (const url of sources) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const geoJson = await resp.json();
            echarts.registerMap('world', geoJson);
            worldMapRegistered = true;
            return;
        } catch (e) { /* try next */ }
    }
    worldMapFailed = true;
    console.warn('[fan-map] world map unavailable, falling back to scatter-only');
}

// ========= Chart =========

function initChart() {
    if (!chartDom.value) return;
    chart = echarts.init(chartDom.value, null, { renderer: 'canvas' });
    // 缩放联动：zoom 变化时按粒度重渲染（防抖）
    chart.on('georoam', (params) => {
        const opt = chart.getOption();
        const z = opt?.geo?.[0]?.zoom;
        if (typeof z !== 'number') return;
        // 实时同步 zoom（避免 series 重建时 zoom 被重置）
        currentZoom.value = z;
        // 仅在跨档位时才触发重渲染（避免每次滚轮都重绘）
        if (rerenderTimer) clearTimeout(rerenderTimer);
        rerenderTimer = setTimeout(() => {
            // 下钻视图不需要分级重渲染（点已经够少）
            if (drilldownProvince.value) return;
            chart.setOption(buildSeriesOption(), { replaceMerge: ['series'] });
        }, 150);
    });
    // 点击省份下钻
    chart.on('click', async (params) => {
        if (view.value !== 'china' || drilldownProvince.value) return;
        if (params.componentType === 'series' && params.seriesType === 'map') {
            await drilldownTo(params.name);
        }
    });
}
function render() {
    if (!chart) return;
    chart.clear();
    chart.setOption(view.value === 'china' ? chinaOption() : worldOption());
}

// 仅重建 series（georoam 时使用，避免地图被重置）
function buildSeriesOption() {
    if (view.value !== 'china' || drilldownProvince.value) {
        // 全球或下钻视图直接整体重渲染更安全
        return view.value === 'china' ? chinaOption() : worldOption();
    }
    return { series: chinaOption().series };
}

// 单色亮度梯度（深蓝→品牌粉），用于点的颜色
// 让数据小的点用低饱和冷色（融入背景），数据大的用高亮品牌色（视觉聚焦）
function colorByHeat(count) {
    if (count >= 200) return '#ff4ff5'; // 顶级：荧光品牌粉
    if (count >= 50)  return '#c47bff'; // 高：浅紫
    if (count >= 10)  return '#7aa8ff'; // 中：浅蓝
    return '#5b7bb8';                   // 低：冷灰蓝
}

// 对数 symbolSize：让 1 和 1000 的视觉差更合理
function sizeByCount(count, base = 6, factor = 6, max = 38) {
    const v = Math.max(1, Number(count) || 1);
    return Math.min(max, base + Math.log2(v + 1) * factor);
}

// “我的位置”：仅描白边，鼠标悬停提示，无标签无闪烁
function buildMineSeries() {
    if (!alreadyMarked.value || !mineInfo.value?.city) return null;
    const coords = lookupCity(mineInfo.value.city);
    if (!coords) return null;
    return {
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: 14,
        itemStyle: {
            color: 'transparent',
            borderColor: '#fff',
            borderWidth: 2
        },
        tooltip: {
            formatter: () => `你在这里 · ${mineInfo.value.city}`
        },
        data: [{ name: mineInfo.value.city, value: [Number(coords.lng), Number(coords.lat), 0] }],
        zlevel: 3,
        silent: false
    };
}

/** 头像钉 series：在中国 / 世界视图都可复用（限制高级别以免遮挡） */
function buildAvatarSeries(viewName) {
    if (!showAvatars.value) return null;
    const size = viewName === 'world' ? 22 : (drilldownProvince.value ? 32 : 28);
    return {
        id: 'avatarPins',
        name: 'avatarPins',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: size,
        // 用 userId 作为过渡键：轮换后同一用户会被识别为“同一个点”，仅进入/离开的点动画
        universalTransition: { enabled: true, seriesKey: 'avatarPins', divideShape: 'clone' },
        animationDurationUpdate: 600,
        animationEasingUpdate: 'cubicOut',
        data: avatarPins.value,
        emphasis: { scale: 1.25 },
        tooltip: {
            formatter: (p) => {
                const d = p.data || {};
                return `<div style="font-weight:600;font-size:13px;margin-bottom:2px">${d.nickname || '匿名棋士'}</div>`
                    + `<div style="color:rgba(255,255,255,0.6);font-size:11px">报到于 <span style="color:#ff4ff5;font-weight:700">${d.city || ''}</span></div>`;
            }
        },
        zlevel: 4,
        silent: false
    };
}

function chinaOption() {
    if (drilldownProvince.value) {
        return provinceDrilldownOption();
    }

    const maxProvince = Math.max(1, ...provinceData.value.map(p => Number(p.value) || 0));
    const cnCities = cityData.value.filter(c => c.country === '中国');

    const z = currentZoom.value;
    let visibleCount;
    if (z < 1.5) visibleCount = 30;
    else if (z < 2.5) visibleCount = 100;
    else visibleCount = cnCities.length;

    const sortedCities = [...cnCities].sort((a, b) => Number(b.count) - Number(a.count));
    const visibleCities = sortedCities.slice(0, visibleCount);

    // 只给 TOP 5 涟漪效果（严格控制视觉焦点）
    const topCount = Math.min(5, visibleCities.length);
    const topPoints = visibleCities.slice(0, topCount).map(c => ({
        name: c.city,
        value: [Number(c.lng), Number(c.lat), Number(c.count)]
    }));
    const restPoints = visibleCities.slice(topCount).map(c => ({
        name: c.city,
        value: [Number(c.lng), Number(c.lat), Number(c.count)]
    }));

    const series = [
        { type: 'map', geoIndex: 0, data: provinceData.value }
    ];

    // 非 TOP 点：白色半透明，只用大小表现热度（干净不吵眼）
    if (restPoints.length) {
        series.push({
            name: 'cities',
            type: 'scatter',
            coordinateSystem: 'geo',
            symbolSize: v => sizeByCount(v[2], 3, 3, 18),
            itemStyle: {
                color: 'rgba(255,255,255,0.85)',
                shadowBlur: 6,
                shadowColor: 'rgba(122,168,255,0.6)'
            },
            label: { show: false },
            emphasis: {
                scale: 1.6,
                itemStyle: { color: '#ff4ff5', shadowBlur: 16, shadowColor: '#ff4ff5' },
                label: {
                    show: true,
                    formatter: p => `{c|${p.name}}\n{n|${p.value[2]}}`,
                    position: 'top',
                    distance: 10,
                    backgroundColor: 'rgba(10,14,39,0.92)',
                    borderColor: 'rgba(255,79,245,0.4)',
                    borderWidth: 1,
                    borderRadius: 6,
                    padding: [6, 10],
                    rich: {
                        c: { color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 14 },
                        n: { color: '#ff4ff5', fontSize: 13, fontWeight: 800, lineHeight: 16 }
                    }
                }
            },
            data: restPoints,
            zlevel: 2
        });
    }
    // TOP 5：品牌粉色涟漪 + 永久 label
    if (topPoints.length) {
        series.push({
            name: 'topCities',
            type: 'effectScatter',
            coordinateSystem: 'geo',
            symbolSize: v => sizeByCount(v[2], 6, 4, 24),
            rippleEffect: { brushType: 'stroke', scale: 4, period: 4 },
            itemStyle: {
                color: '#ff4ff5',
                shadowBlur: 18,
                shadowColor: '#ff4ff5'
            },
            label: {
                show: true,
                formatter: p => `{c|${p.name}} {n|${p.value[2]}}`,
                position: 'right',
                distance: 8,
                backgroundColor: 'rgba(10,14,39,0.85)',
                borderRadius: 4,
                padding: [4, 8],
                rich: {
                    c: { color: '#fff', fontSize: 11, fontWeight: 600 },
                    n: { color: '#ff4ff5', fontSize: 11, fontWeight: 800 }
                }
            },
            data: topPoints,
            zlevel: 3
        });
    }

    const mine = buildMineSeries();
    if (mine) series.push(mine);
    const avatarSeries = buildAvatarSeries('china');
    if (avatarSeries) series.push(avatarSeries);

    return {
        backgroundColor: 'transparent',
        animation: true,
        animationDuration: 800,
        animationEasing: 'cubicOut',
        tooltip: {
            trigger: 'item',
            confine: true,
            backgroundColor: 'rgba(10,14,39,0.95)',
            borderColor: 'rgba(255,79,245,0.3)',
            borderWidth: 1,
            padding: [10, 14],
            extraCssText: 'border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); backdrop-filter: blur(10px);',
            textStyle: { color: '#fff', fontSize: 12 },
            formatter: (p) => {
                if (p.seriesType === 'map') {
                    return `<div style="font-weight:600;margin-bottom:4px;font-size:13px">${p.name}</div>`
                        + `<div style="color:rgba(255,255,255,0.6);font-size:11px">粉丝数 <span style="color:#ff4ff5;font-weight:700;font-size:14px;margin-left:4px">${p.value || 0}</span></div>`
                        + `<div style="color:rgba(255,79,245,0.7);font-size:10px;margin-top:4px">点击查看详情 →</div>`;
                }
                return `<div style="font-weight:600;margin-bottom:4px;font-size:13px">${p.name}</div>`
                    + `<div style="color:rgba(255,255,255,0.6);font-size:11px">粉丝数 <span style="color:#ff4ff5;font-weight:700;font-size:14px;margin-left:4px">${p.value[2]}</span></div>`;
            }
        },
        visualMap: {
            left: 20, bottom: 20, min: 0, max: maxProvince,
            text: ['多', '少'],
            calculable: true,
            itemWidth: 8, itemHeight: 100,
            // 极深藍黑 → 品牌粉，单调梯度
            inRange: { color: ['#0f1530', '#1e2a55', '#3d4a8a', '#7c5fcf', '#c247ff', '#ff4ff5'] },
            textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 }
        },
        geo: {
            map: 'china',
            roam: true,
            zoom: currentZoom.value,
            scaleLimit: { min: 0.8, max: 8 },
            label: { show: false },
            itemStyle: {
                areaColor: '#0f1530',
                borderColor: 'rgba(255,255,255,0.12)',
                borderWidth: 0.6
            },
            emphasis: {
                disabled: false,
                label: { show: true, color: '#fff', fontSize: 11, fontWeight: 600 },
                itemStyle: {
                    areaColor: '#3d4a8a',
                    borderColor: '#ff4ff5',
                    borderWidth: 1.2,
                    shadowBlur: 20,
                    shadowColor: 'rgba(255,79,245,0.4)'
                }
            }
        },
        series
    };
}

function provinceDrilldownOption() {
    const provinceName = drilldownProvince.value;
    const cities = cityData.value.filter(c => c.country === '中国' && c.province === provinceName);
    const sortedCities = [...cities].sort((a, b) => Number(b.count) - Number(a.count));

    // 直辖市没有独立地图，使用全国地图作为背景
    const isMunicipality = MUNICIPALITY_FALLBACK.has(provinceName);
    const mapName = isMunicipality ? 'china' : provinceName;

    const cityValueMap = {};
    cities.forEach(c => {
        const v = Number(c.count) || 0;
        cityValueMap[c.city] = v;
        cityValueMap[c.city + '市'] = v;
    });
    const mapData = Object.keys(cityValueMap).map(name => ({ name, value: cityValueMap[name] }));
    const maxCity = Math.max(1, ...cities.map(c => Number(c.count) || 0));

    // 所有序列中，map 类型负责绘制区域填色，geo 只提供坐标系
    const series = [
        {
            type: 'map',
            map: mapName,
            geoIndex: 0,
            // 直辖市场景下不填充区域（会把全国都染色），仅靠散点呈现
            data: isMunicipality ? [] : mapData,
            silent: false,
            zlevel: 0
        }
    ];

    const topCount = Math.min(3, sortedCities.length);
    const topPoints = sortedCities.slice(0, topCount).map(c => ({
        name: c.city,
        value: [Number(c.lng), Number(c.lat), Number(c.count)]
    }));
    const restPoints = sortedCities.slice(topCount).map(c => ({
        name: c.city,
        value: [Number(c.lng), Number(c.lat), Number(c.count)]
    }));

    if (restPoints.length) {
        series.push({
            type: 'scatter',
            coordinateSystem: 'geo',
            symbolSize: v => sizeByCount(v[2], 4, 4, 22),
            itemStyle: {
                color: 'rgba(255,255,255,0.9)',
                shadowBlur: 8,
                shadowColor: 'rgba(122,168,255,0.6)'
            },
            label: { show: false },
            emphasis: {
                scale: 1.6,
                itemStyle: { color: '#ff4ff5', shadowBlur: 16, shadowColor: '#ff4ff5' },
                label: {
                    show: true,
                    formatter: p => `{c|${p.name}}\n{n|${p.value[2]}}`,
                    position: 'top',
                    distance: 10,
                    backgroundColor: 'rgba(10,14,39,0.92)',
                    borderColor: 'rgba(255,79,245,0.4)',
                    borderWidth: 1,
                    borderRadius: 6,
                    padding: [6, 10],
                    rich: {
                        c: { color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 15 },
                        n: { color: '#ff4ff5', fontSize: 14, fontWeight: 800, lineHeight: 17 }
                    }
                }
            },
            data: restPoints,
            zlevel: 2
        });
    }

    if (topPoints.length) {
        series.push({
            type: 'effectScatter',
            coordinateSystem: 'geo',
            symbolSize: v => sizeByCount(v[2], 8, 5, 28),
            rippleEffect: { brushType: 'stroke', scale: 4.5, period: 3.5 },
            itemStyle: {
                color: '#ff4ff5',
                shadowBlur: 22,
                shadowColor: '#ff4ff5'
            },
            label: {
                show: true,
                formatter: p => `{c|${p.name}}\n{n|${p.value[2]}}`,
                position: 'top',
                distance: 10,
                backgroundColor: 'rgba(10,14,39,0.92)',
                borderColor: 'rgba(255,79,245,0.5)',
                borderWidth: 1,
                borderRadius: 6,
                padding: [6, 10],
                rich: {
                    c: { color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 15 },
                    n: { color: '#ff4ff5', fontSize: 14, fontWeight: 800, lineHeight: 17 }
                }
            },
            data: topPoints,
            zlevel: 3
        });
    }

    const mine = buildMineSeries();
    if (mine) series.push(mine);
    const avatarSeries = buildAvatarSeries('china');
    if (avatarSeries) series.push(avatarSeries);

    return {
        backgroundColor: 'transparent',
        animationDurationUpdate: 600,
        animationEasingUpdate: 'cubicInOut',
        tooltip: {
            trigger: 'item',
            confine: true,
            backgroundColor: 'rgba(10,14,39,0.95)',
            borderColor: 'rgba(255,79,245,0.3)',
            borderWidth: 1,
            padding: [10, 14],
            extraCssText: 'border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); backdrop-filter: blur(10px);',
            textStyle: { color: '#fff', fontSize: 12 },
            formatter: p => {
                if (p.seriesType === 'map') {
                    return `<div style="font-weight:600;margin-bottom:4px;font-size:13px">${p.name}</div>`
                        + `<div style="color:rgba(255,255,255,0.6);font-size:11px">粉丝数 <span style="color:#ff4ff5;font-weight:700;font-size:14px;margin-left:4px">${p.value || 0}</span></div>`;
                }
                return `<div style="font-weight:600;margin-bottom:4px;font-size:13px">${p.name}</div>`
                    + `<div style="color:rgba(255,255,255,0.6);font-size:11px">粉丝数 <span style="color:#ff4ff5;font-weight:700;font-size:14px;margin-left:4px">${p.value[2]}</span></div>`;
            }
        },
        visualMap: {
            left: 20, bottom: 20, min: 0, max: maxCity,
            text: ['多', '少'], calculable: true,
            itemWidth: 8, itemHeight: 100,
            inRange: { color: ['#0f1530', '#1e2a55', '#3d4a8a', '#7c5fcf', '#c247ff', '#ff4ff5'] },
            textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
            // 只作用于 map series（index 0），不影响散点颜色
            seriesIndex: [0]
        },
        geo: {
            map: mapName,
            roam: true,
            zoom: isMunicipality ? 6 : currentZoom.value,
            // 直辖市背景地图默认以它们的坐标为中心
            center: isMunicipality && cities.length
                ? [Number(cities[0].lng), Number(cities[0].lat)]
                : undefined,
            scaleLimit: { min: 0.8, max: 12 },
            label: {
                show: true,
                color: 'rgba(255,255,255,0.55)',
                fontSize: 10
            },
            itemStyle: {
                areaColor: '#0f1530',
                borderColor: 'rgba(255,255,255,0.15)',
                borderWidth: 0.6
            },
            emphasis: {
                label: { color: '#fff', fontSize: 12, fontWeight: 600 },
                itemStyle: {
                    areaColor: '#3d4a8a',
                    borderColor: '#ff4ff5',
                    borderWidth: 1.2,
                    shadowBlur: 20,
                    shadowColor: 'rgba(255,79,245,0.4)'
                }
            },
            regions: mapData.map(d => ({
                name: d.name,
                itemStyle: { areaColor: heatColorScale(d.value, maxCity) }
            }))
        },
        series
    };
}

function heatColorScale(v, max) {
    if (!v || v <= 0) return '#0f1530';
    const t = Math.min(1, v / max);
    // 冷色深藝 → 品牌粉 的单调梯度
    const stops = [
        [15, 21, 48],    // #0f1530
        [30, 42, 85],    // #1e2a55
        [61, 74, 138],   // #3d4a8a
        [124, 95, 207],  // #7c5fcf
        [194, 71, 255],  // #c247ff
        [255, 79, 245]   // #ff4ff5
    ];
    const seg = (stops.length - 1) * t;
    const i = Math.floor(seg);
    const f = seg - i;
    const a = stops[i];
    const b = stops[Math.min(stops.length - 1, i + 1)];
    const r = Math.round(a[0] + (b[0] - a[0]) * f);
    const g = Math.round(a[1] + (b[1] - a[1]) * f);
    const bl = Math.round(a[2] + (b[2] - a[2]) * f);
    return `rgb(${r},${g},${bl})`;
}

function worldOption() {
    const all = cityData.value.map(c => ({
        name: c.city,
        value: [Number(c.lng), Number(c.lat), Number(c.count)]
    }));
    const sorted = [...all].sort((a, b) => b.value[2] - a.value[2]);
    const z = currentZoom.value;
    const visibleCount = z < 1.8 ? 50 : (z < 3 ? 150 : sorted.length);
    const visible = sorted.slice(0, visibleCount);
    const topCount = Math.min(8, visible.length);
    const topPoints = visible.slice(0, topCount);
    const restPoints = visible.slice(topCount);

    const tooltipFmt = p => `<div style="font-weight:600;margin-bottom:4px;font-size:13px">${p.name}</div>`
        + `<div style="color:rgba(255,255,255,0.6);font-size:11px">粉丝数 <span style="color:#ff4ff5;font-weight:700;font-size:14px;margin-left:4px">${p.value[2]}</span></div>`;

    const base = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            confine: true,
            backgroundColor: 'rgba(10,14,39,0.95)',
            borderColor: 'rgba(255,79,245,0.3)',
            borderWidth: 1,
            padding: [10, 14],
            extraCssText: 'border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); backdrop-filter: blur(10px);',
            textStyle: { color: '#fff', fontSize: 12 },
            formatter: tooltipFmt
        }
    };

    const restSeries = {
        type: 'scatter',
        coordinateSystem: worldMapRegistered ? 'geo' : undefined,
        symbolSize: v => sizeByCount(v[2], 3, 3, 16),
        itemStyle: {
            color: 'rgba(255,255,255,0.85)',
            shadowBlur: 6,
            shadowColor: 'rgba(122,168,255,0.6)'
        },
        label: { show: false },
        emphasis: {
            scale: 1.6,
            itemStyle: { color: '#ff4ff5', shadowBlur: 16, shadowColor: '#ff4ff5' }
        },
        data: restPoints,
        zlevel: 2
    };
    const topSeries = {
        type: 'effectScatter',
        coordinateSystem: worldMapRegistered ? 'geo' : undefined,
        symbolSize: v => sizeByCount(v[2], 6, 4, 22),
        rippleEffect: { brushType: 'stroke', scale: 4, period: 4 },
        itemStyle: {
            color: '#ff4ff5',
            shadowBlur: 18,
            shadowColor: '#ff4ff5'
        },
        label: {
            show: z >= 2.5,
            formatter: p => `{c|${p.name}} {n|${p.value[2]}}`,
            position: 'right',
            distance: 8,
            backgroundColor: 'rgba(10,14,39,0.85)',
            borderRadius: 4,
            padding: [4, 8],
            rich: {
                c: { color: '#fff', fontSize: 11, fontWeight: 600 },
                n: { color: '#ff4ff5', fontSize: 11, fontWeight: 800 }
            }
        },
        data: topPoints,
        zlevel: 3
    };

    if (worldMapRegistered) {
        const series = [];
        if (restSeries.data.length) series.push(restSeries);
        if (topSeries.data.length) series.push(topSeries);
        const mine = buildMineSeries();
        if (mine) series.push(mine);
        const avatarSeries = buildAvatarSeries('world');
        if (avatarSeries) series.push(avatarSeries);
        return {
            ...base,
            geo: {
                map: 'world',
                roam: true,
                zoom: currentZoom.value,
                scaleLimit: { min: 0.8, max: 8 },
                itemStyle: {
                    areaColor: '#0f1530',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 0.5
                },
                emphasis: {
                    label: { show: false },
                    itemStyle: { areaColor: '#3d4a8a' }
                }
            },
            series
        };
    }
    return {
        ...base,
        grid: { left: '5%', right: '5%', top: '5%', bottom: '8%' },
        xAxis: { type: 'value', min: -180, max: 180, name: '经度', axisLabel: { color: 'rgba(255,255,255,0.5)' } },
        yAxis: { type: 'value', min: -60, max: 80, name: '纬度', axisLabel: { color: 'rgba(255,255,255,0.5)' } },
        series: [
            { ...restSeries, coordinateSystem: undefined },
            { ...topSeries, coordinateSystem: undefined }
        ]
    };
}

function onResize() { if (chart) chart.resize(); }

// ========= Mark =========

function openMarkModal() {
    form.value.country = '中国';
    form.value.province = '';
    form.value.city = '';
    form.value.nickname = '';
    form.value.message = '';
    showModal.value = true;
}

function closeModal() { showModal.value = false; }

async function submitMark() {
    if (!form.value.city) {
        showToast('请选择城市', 'warning');
        return;
    }
    const coords = lookupCity(form.value.city);
    if (!coords) {
        showToast('城市数据异常，请重新选择', 'warning');
        return;
    }
    submitting.value = true;
    try {
        const payload = {
            country: form.value.country || coords.country || '中国',
            province: coords.province || null,
            city: coords.city,
            lng: coords.lng,
            lat: coords.lat,
            nickname: form.value.nickname || null,
            message: form.value.message || null
        };
        // 乐观提交：UI 立刻更新，跨标签页广播
        const result = await fanMapStore.submitMark(payload);
        if (!result.ok) {
            if (result.code === 401) {
                showToast('请先登录', 'warning');
                loginModalRef.value?.openModal();
            } else if (result.code === 429) {
                showToast('同 IP 今日标记已达上限', 'warning');
            } else {
                showToast('提交失败，请重试', 'error');
            }
            return;
        }
        if (result.message === 'already_marked') {
            showToast('你已经报到过啦～', 'info');
        } else {
            showToast('🎉 报到成功！撒花～', 'success');
            trackEvent(EVENTS.FAN_MARK_CREATE);
        }
        showModal.value = false;
        // 重绘地图（数据已是 store 派生，新点直接生效）
        render();
        // 报到成功后自动弹海报
        if (result.message !== 'already_marked') {
            openPosterModal();
        }
        // 报到成功后后台重拉头像（包含自己）
        loadAvatarPins();
    } finally {
        submitting.value = false;
    }
}

// ========= Poster (统一走 FanCardModal) =========

async function openPosterModal() {
    await ensureFanProfile();
    fanCardUserInfo.value = buildFanCardUserInfo();
    showPoster.value = true;
}

function onFanCardBgUpdated(bgUrl) {
    if (fanProfile.value) fanProfile.value.posterBg = bgUrl;
}
</script>

<style scoped>
/* ===== Page frame ===== */
.fan-map-page {
    position: relative;
    min-height: 100vh;
    padding: var(--page-padding-y) 0 var(--page-padding-bottom);
    background: transparent;
    color: var(--text-primary);
    overflow: hidden;
}
.page-inner {
    position: relative;
    z-index: 1;
    max-width: var(--container-max);
    margin: 0 auto;
    padding: 0 var(--page-padding-x);
}

/* Aurora + grid background */
.bg-aurora {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background:
        radial-gradient(ellipse 55% 40% at 18% 4%, rgba(200,80,232,0.16), transparent 62%),
        radial-gradient(ellipse 60% 45% at 82% 8%, rgba(122,168,255,0.1), transparent 65%),
        linear-gradient(180deg, #080414 0%, #05010a 100%);
}
.bg-grid {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at center, black 18%, transparent 78%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 18%, transparent 78%);
}

/* ===== Hero ===== */
.map-hero {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 1.5rem;
    align-items: center;
    margin-bottom: 1.4rem;
    padding: 2.2rem 2.4rem;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    backdrop-filter: blur(16px);
    box-shadow: 0 18px 50px rgba(0,0,0,0.32);
    position: relative;
    overflow: hidden;
}
.map-hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 100% 0%, rgba(200,80,232,0.12), transparent 48%);
    pointer-events: none;
}

.hero-tag {
    display: inline-flex; align-items: center; gap: .5rem;
    font-size: .8rem; letter-spacing: 3px; font-weight: 700;
    color: #D946EF;
    padding: .4rem .9rem; border-radius: 999px;
    background: rgba(200,80,232,0.1);
    border: 1px solid rgba(200,80,232,0.3);
    margin-bottom: 1.2rem;
}
.tag-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #D946EF;
    box-shadow: 0 0 8px #D946EF;
    animation: tagBlink 1.6s ease-in-out infinite;
}
@keyframes tagBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: .3; }
}

.hero-title {
    font-size: 3rem; margin: 0 0 .7rem; font-weight: 900;
    line-height: 1.1;
    color: #fff;
    letter-spacing: -1px;
}
.title-hl {
    background: linear-gradient(135deg, #FACC15, #D946EF 60%, #A21CAF);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
}
.hero-sub {
    color: rgba(255,255,255,.6); font-size: 1.05rem; margin: 0 0 2rem;
    max-width: 440px;
}

.btn-mark {
    display: inline-flex; align-items: center; gap: .6rem;
    background: linear-gradient(135deg, #D946EF, #A21CAF);
    color: #fff; border: 0;
    padding: 1rem 2rem; font-size: 1rem; font-weight: 700; letter-spacing: .5px;
    border-radius: 999px; cursor: pointer;
    box-shadow: 0 12px 32px rgba(200,80,232,.5);
    transition: transform .25s, box-shadow .25s;
}
.btn-mark:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(200,80,232,.65); }
.btn-arrow { font-size: .8rem; transition: transform .25s; }
.btn-mark:hover .btn-arrow { transform: translateX(4px); }

.already-marked {
    display: inline-flex; align-items: center; gap: .5rem;
    background: rgba(125,255,158,.12); color: #7dff9e;
    padding: .9rem 1.6rem; border-radius: 999px;
    border: 1px solid rgba(125,255,158,.35);
    font-weight: 600;
}
.already-marked strong { color: #fff; }

/* Stat cards */
.hero-right {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .8rem;
    position: relative;
    z-index: 1;
}
.stat-card {
    padding: 1.2rem 1rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    backdrop-filter: blur(8px);
    transition-property: transform, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
    position: relative; overflow: hidden;
}
.stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(200,80,232,0.4);
    background: rgba(200,80,232,0.08);
}
.stat-total { grid-column: span 2; }
.stat-total .stat-num { font-size: 2.6rem; }
.stat-num {
    font-size: 1.8rem; font-weight: 900;
    background: linear-gradient(135deg, #FACC15, #D946EF);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1; margin-bottom: .4rem;
}
.stat-label {
    font-size: .8rem; color: rgba(255,255,255,.55);
    display: inline-flex; align-items: center; gap: .4rem;
}

/* ===== Toolbar ===== */
.map-toolbar {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    margin-bottom: 0.8rem;
    gap: 0.8rem 1rem;
}
.map-context {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
.context-kicker {
    color: rgba(255,255,255,0.35);
    font-size: 0.68rem;
    letter-spacing: 2px;
    font-weight: 800;
}
.map-context strong {
    color: #fff;
    font-size: 1.05rem;
    letter-spacing: 0.2px;
}
.toolbar-right {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
}
.view-switch {
    display: inline-flex;
    padding: 4px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    backdrop-filter: blur(8px);
}
.view-switch button {
    background: transparent; color: rgba(255,255,255,.6);
    border: 0; padding: .55rem 1.4rem; border-radius: 10px;
    cursor: pointer; font-size: .9rem; font-weight: 600;
    display: inline-flex; align-items: center; gap: .4rem;
    transition-property: transform, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}
.view-switch button:hover { color: #fff; }
.view-switch button.active {
    background: linear-gradient(135deg, #D946EF, #A21CAF);
    color: #fff;
    box-shadow: 0 4px 16px rgba(200,80,232,.4);
}

/* Toolbar left group */
.toolbar-left {
    display: inline-flex; align-items: center; gap: .8rem; flex-wrap: wrap;
}
.mode-switch {
    display: inline-flex;
    padding: 4px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    backdrop-filter: blur(8px);
}
.mode-switch button {
    background: transparent; color: rgba(255,255,255,.5);
    border: 0; width: 36px; height: 36px; border-radius: 10px;
    cursor: pointer; font-size: .9rem;
    display: inline-flex; align-items: center; justify-content: center;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.mode-switch button:hover { color: #fff; }
.mode-switch button.active {
    background: linear-gradient(135deg, #FACC15, #D946EF);
    color: #fff;
    box-shadow: 0 4px 12px rgba(250,204,21,.3);
}
.btn-back {
    display: inline-flex; align-items: center; gap: .4rem;
    padding: .55rem 1rem;
    background: rgba(250,204,21,.1);
    border: 1px solid rgba(250,204,21,.4);
    color: #FACC15; font-size: .85rem; font-weight: 600;
    border-radius: 10px; cursor: pointer;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.btn-back:hover { background: rgba(250,204,21,.2); transform: translateX(-2px); }
.legend-tip {
    color: rgba(255,255,255,.35); font-size: .75rem;
    display: inline-flex; align-items: center; gap: .3rem;
}
.map-legend {
    grid-column: 1 / -1;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    font-size: .78rem;
    color: rgba(255,255,255,.5);
}
.legend-item { display: inline-flex; align-items: center; gap: .45rem; }
.legend-gradient {
    width: 64px;
    height: 7px;
    border-radius: 999px;
    background: linear-gradient(90deg, #0f1530, #3d4a8a, #c247ff, #ff4ff5);
    box-shadow: 0 0 10px rgba(255,79,245,0.18);
}
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-pulse {
    background: #FACC15; box-shadow: 0 0 10px #FACC15;
    animation: tagBlink 1.4s ease-in-out infinite;
}
.dot.heat { box-shadow: 0 0 8px currentColor; }
.dot.heat-4 { background: #ff4ff5; color: #ff4ff5; }

/* ===== Map wrapper ===== */
.map-wrapper {
    position: relative;
    background:
        radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,95,207,0.08), transparent 70%),
        linear-gradient(135deg, #0a0e27 0%, #060920 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 24px;
    padding: 1.2rem;
    margin-bottom: 2rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.04);
}
.echarts-container { width: 100%; height: 580px; }

/* Decorative corners */
.map-corner {
    position: absolute; width: 18px; height: 18px;
    border: 1.5px solid rgba(255,79,245,0.4);
    opacity: .8;
}
.map-corner.tl { top: 10px; left: 10px; border-right: 0; border-bottom: 0; border-top-left-radius: 12px; }
.map-corner.tr { top: 10px; right: 10px; border-left: 0; border-bottom: 0; border-top-right-radius: 12px; }
.map-corner.bl { bottom: 10px; left: 10px; border-right: 0; border-top: 0; border-bottom-left-radius: 12px; }
.map-corner.br { bottom: 10px; right: 10px; border-left: 0; border-top: 0; border-bottom-right-radius: 12px; }

.map-loading {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1rem;
    color: rgba(255,255,255,.7); font-size: .95rem;
    background: rgba(5,1,10,0.6); backdrop-filter: blur(4px);
    border-radius: 24px;
}
.loader-ring {
    width: 40px; height: 40px;
    border: 3px solid rgba(200,80,232,0.2);
    border-top-color: #D946EF;
    border-radius: 50%;
    animation: ringSpin 1s linear infinite;
}
@keyframes ringSpin { to { transform: rotate(360deg); } }

/* ===== Bottom panels ===== */
.bottom-panels {
    display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem;
}
.panel {
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px;
    padding: 1.6rem;
    backdrop-filter: blur(10px);
    transition: border-color .25s, background .25s;
}
.panel:hover {
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.045);
}
.panel-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1.3rem;
    padding-bottom: .9rem;
    border-bottom: 1px solid rgba(255,255,255,.06);
}
.panel-head h3 {
    margin: 0; font-size: 1.1rem; color: #fff; font-weight: 700;
    display: inline-flex; align-items: center; gap: .5rem;
}
.panel-head h3 i { color: #ff4ff5; }
.panel-sub {
    font-size: .75rem; letter-spacing: 2px; font-weight: 700;
    color: rgba(255,255,255,.4);
    display: inline-flex; align-items: center; gap: .4rem;
}
.live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #7dff9e; box-shadow: 0 0 8px #7dff9e;
    animation: tagBlink 1.4s ease-in-out infinite;
}

/* City leaderboard */
.city-list { list-style: none; padding: 0; margin: 0; }
.city-list li {
    display: grid;
    grid-template-columns: 32px minmax(60px, auto) 1fr auto;
    align-items: center;
    gap: .9rem;
    padding: .65rem 0;
    border-bottom: 1px dashed rgba(255,255,255,.06);
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.city-list li:hover { background: rgba(200,80,232,0.04); padding-left: .4rem; padding-right: .4rem; }
.city-list li:last-child { border-bottom: 0; }
.city-list .rank {
    width: 28px; height: 28px; border-radius: 8px;
    display: grid; place-items: center;
    background: rgba(255,255,255,.06); font-weight: 700; font-size: .85rem;
    color: rgba(255,255,255,.6);
}
.city-list .rank-1 .rank { background: linear-gradient(135deg, #ffd700, #ffb700); color: #000; box-shadow: 0 4px 12px rgba(255,215,0,.4); }
.city-list .rank-2 .rank { background: linear-gradient(135deg, #e8e8e8, #b0b0b0); color: #000; }
.city-list .rank-3 .rank { background: linear-gradient(135deg, #cd7f32, #a06020); color: #fff; }
.city-list .name { font-weight: 600; color: #fff; font-size: .95rem; }
.bar-wrap {
    height: 6px; background: rgba(255,255,255,.05);
    border-radius: 3px; overflow: hidden; min-width: 60px;
}
.bar {
    height: 100%;
    background: linear-gradient(90deg, #A21CAF, #D946EF, #FACC15);
    border-radius: 3px;
    transition: width .8s ease;
    box-shadow: 0 0 10px rgba(200,80,232,.5);
}
.city-list .count { color: #FACC15; font-weight: 800; font-size: .95rem; min-width: 36px; text-align: right; }
.city-list .empty, .recent-list .empty {
    color: rgba(255,255,255,.4); text-align: center; padding: 2rem 0; font-size: .9rem;
    display: block; grid-template-columns: none;
}

/* Recent messages */
.recent-list { list-style: none; padding: 0; margin: 0; max-height: 420px; overflow-y: auto; }
.recent-list::-webkit-scrollbar { width: 6px; }
.recent-list::-webkit-scrollbar-thumb { background: rgba(200,80,232,.3); border-radius: 3px; }
.recent-item {
    display: flex; gap: .9rem;
    padding: .9rem 0;
    border-bottom: 1px dashed rgba(255,255,255,.06);
}
.recent-item:last-child { border-bottom: 0; }
.recent-avatar {
    flex-shrink: 0;
    width: 40px; height: 40px; border-radius: 12px;
    display: grid; place-items: center;
    background: linear-gradient(135deg, #D946EF, #A21CAF);
    color: #fff; font-weight: 800; font-size: 1rem;
    box-shadow: 0 4px 12px rgba(200,80,232,.4);
}
.recent-body { flex: 1; min-width: 0; }
.recent-meta {
    display: flex; align-items: center; gap: .8rem; margin-bottom: .3rem; flex-wrap: wrap;
}
.r-nick { color: #fff; font-weight: 600; font-size: .92rem; }
.r-city {
    color: #FACC15; font-size: .8rem; font-weight: 600;
    display: inline-flex; align-items: center; gap: .25rem;
}
.r-city i { font-size: .7rem; }
.r-msg { color: #f3caff; font-size: .88rem; line-height: 1.5; }
.r-msg.placeholder { color: rgba(255,255,255,.3); font-style: italic; }

/* ===== Modal ===== */
.modal-mask {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(0,0,0,.75);
    display: grid; place-items: center;
    backdrop-filter: blur(12px);
}
.modal-card {
    position: relative;
    background: linear-gradient(145deg, #1a0624, #0a0215);
    border: 1px solid rgba(200,80,232,.35);
    border-radius: 24px;
    padding: 2.2rem; width: 92%; max-width: 460px;
    max-height: calc(100dvh - 40px);
    box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(200,80,232,.15) inset;
    overflow-y: auto;
    overflow-x: hidden;
}
.modal-glow {
    position: absolute; inset: -2px; z-index: 0; pointer-events: none;
    background: radial-gradient(circle at 50% 0%, rgba(200,80,232,.4), transparent 60%);
}
.modal-card > *:not(.modal-glow) { position: relative; z-index: 1; }

.modal-close {
    position: absolute; top: 1rem; right: 1rem;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,.06); border: 0;
    color: rgba(255,255,255,.7); font-size: 1rem; cursor: pointer;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
    display: grid; place-items: center;
}
.modal-close:hover { background: rgba(200,80,232,.2); color: #fff; transform: rotate(90deg); }

.modal-header { text-align: center; margin-bottom: 1.8rem; }
.modal-icon {
    font-size: 2.2rem; margin-bottom: .6rem;
    display: inline-block;
    animation: iconBounce 2s ease-in-out infinite;
}
@keyframes iconBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}
.modal-card h2 {
    margin: 0 0 .4rem; color: #fff; font-size: 1.5rem; font-weight: 800;
}
.modal-hint { color: rgba(255,255,255,.55); font-size: .88rem; margin: 0; }

.field { display: block; margin-bottom: 1.1rem; position: relative; }
.field span {
    display: block; margin-bottom: .5rem;
    font-size: .82rem; color: rgba(255,255,255,.75); font-weight: 600;
}
.field .req { color: #D946EF; font-style: normal; margin-left: 2px; }
.field .opt {
    color: rgba(255,255,255,.35); font-style: normal; font-weight: 400;
    font-size: .75rem; margin-left: 4px;
}
.field input, .field textarea, .field .select-box {
    width: 100%;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    color: #fff;
    padding: .85rem 1rem; border-radius: 12px;
    font-size: .95rem; outline: none;
    font-family: inherit; box-sizing: border-box;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.field .select-box {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    padding-right: 2.4rem;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='none' stroke='%23eb07ee' stroke-width='2' d='M1 1l5 5 5-5'/></svg>");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    cursor: pointer;
}
.field .select-box:disabled {
    opacity: .5;
    cursor: not-allowed;
}
.field .select-box option {
    background: #1a0624;
    color: #fff;
}
.field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .8rem;
}
.field-row .field-inline { margin-bottom: 1.1rem; }
.field-row .field-inline:only-child { grid-column: 1 / -1; }
.field textarea {
    resize: none;
    min-height: 72px;
    line-height: 1.5;
}
.field-message { padding-bottom: .2rem; }
.field-message textarea { padding-right: 2.6rem; }

.emoji-toggle {
    position: absolute;
    top: 2.05rem;
    right: .55rem;
    width: 2rem; height: 2rem;
    display: inline-flex; align-items: center; justify-content: center;
    border: 0; border-radius: 8px;
    background: transparent;
    color: rgba(255,255,255,.55);
    font-size: 1rem; cursor: pointer;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
.emoji-toggle:hover { color: #D946EF; background: rgba(200,80,232,.08); }
.emoji-toggle.active { color: #D946EF; background: rgba(200,80,232,.12); }

.emoji-panel {
    margin-top: .5rem;
    width: 100%;
    max-height: 168px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: .5rem;
    background: rgba(20,10,30,.96);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0,0,0,.35);
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
}
.emoji-panel::-webkit-scrollbar { width: 6px; }
.emoji-panel::-webkit-scrollbar-thumb { background: rgba(200,80,232,.35); border-radius: 3px; }
.emoji-panel::-webkit-scrollbar-track { background: transparent; }

.emoji-item {
    border: 0; background: transparent; cursor: pointer;
    padding: .35rem 0; font-size: 1.2rem; line-height: 1;
    border-radius: 6px; color: #fff;
    transition: background .15s;
}
.emoji-item:hover { background: rgba(200,80,232,.18); }

.emoji-fade-enter-active, .emoji-fade-leave-active { transition: opacity .15s, max-height .2s; overflow: hidden; }
.emoji-fade-enter-from, .emoji-fade-leave-to { opacity: 0; max-height: 0; }
.emoji-fade-enter-to, .emoji-fade-leave-from { opacity: 1; max-height: 200px; }
.field input:focus, .field textarea:focus, .field .select-box:focus {
    border-color: rgba(200,80,232,.6);
    background: rgba(200,80,232,.05);
    box-shadow: 0 0 0 3px rgba(200,80,232,.15);
}
.field-count {
    position: absolute; bottom: .6rem; right: .8rem;
    font-size: .7rem; color: rgba(255,255,255,.35);
    pointer-events: none;
}

.modal-actions { display: flex; gap: .8rem; margin-top: 1.5rem; }
.btn-cancel, .btn-submit {
    flex: 1; padding: .9rem; border-radius: 12px; font-size: .95rem; cursor: pointer;
    border: 0; font-weight: 700;
    transition-property: transform, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}
.btn-cancel {
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.8);
    border: 1px solid rgba(255,255,255,.08);
}
.btn-cancel:hover { background: rgba(255,255,255,.1); }
.btn-submit {
    background: linear-gradient(135deg, #D946EF, #A21CAF);
    color: #fff;
    display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
    box-shadow: 0 8px 24px rgba(200,80,232,.4);
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(200,80,232,.55); }
.btn-submit:disabled { opacity: .6; cursor: not-allowed; }

/* Modal transition */
.modal-fade-enter-active, .modal-fade-leave-active {
    transition: opacity .25s;
}
.modal-fade-enter-active .modal-card, .modal-fade-leave-active .modal-card {
    transition: transform .3s cubic-bezier(.2,.9,.3,1.2);
}
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal-card, .modal-fade-leave-to .modal-card {
    transform: translateY(20px) scale(.95);
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
    .map-hero { grid-template-columns: 1fr; padding: 1.8rem; }
    .hero-title { font-size: 2.2rem; }
    .bottom-panels { grid-template-columns: 1fr; }
    .map-toolbar { grid-template-columns: 1fr; }
    .toolbar-right { justify-content: space-between; }
}
@media (max-width: 640px) {
    .page-inner { padding: 0 var(--page-padding-x); }
    .fan-map-page { padding: var(--page-padding-y) 0 var(--page-padding-bottom); }
    .hero-tag { margin-bottom: 0.8rem; font-size: 0.7rem; letter-spacing: 2px; padding: 0.3rem 0.7rem; }
    .hero-title { font-size: 1.6rem; margin-bottom: 0.45rem; letter-spacing: 0; }
    .hero-sub { font-size: 0.85rem; margin-bottom: 1rem; }
    .map-hero { padding: 1rem; border-radius: 18px; gap: 0.9rem; margin-bottom: 0.9rem; }
    .btn-mark, .already-marked { width: 100%; justify-content: center; padding: 0.78rem 1rem; font-size: 0.92rem; }
    .hero-right { grid-template-columns: repeat(3, 1fr); gap: 0.45rem; }
    .stat-total { grid-column: auto; }
    .stat-card { padding: 0.6rem 0.4rem; border-radius: 10px; }
    .stat-card:hover { transform: none; }
    .stat-total .stat-num { font-size: 1.2rem; }
    .stat-num { font-size: 1.15rem; margin-bottom: 0.25rem; }
    .stat-label { font-size: 0.62rem; gap: 0.25rem; }
    .stat-label i { font-size: 0.62rem; }

    /* Toolbar */
    .map-toolbar { gap: 0.5rem 0.6rem; margin-bottom: 0.6rem; }
    .map-context strong { font-size: 0.92rem; }
    .context-kicker { font-size: 0.6rem; letter-spacing: 1.5px; }
    .toolbar-left { justify-content: space-between; gap: 0.5rem; }
    .toolbar-right { width: 100%; gap: 0.4rem; }
    .view-switch { flex: 1; padding: 3px; border-radius: 12px; }
    .view-switch button { flex: 1; justify-content: center; padding: 0.5rem 0.6rem; font-size: 0.82rem; border-radius: 9px; }
    .mode-switch { padding: 3px; border-radius: 12px; }
    .mode-switch button { width: 32px; height: 32px; border-radius: 9px; font-size: 0.82rem; }
    .btn-back { padding: 0.45rem 0.8rem; font-size: 0.78rem; }
    .map-legend { gap: 0.55rem; font-size: 0.68rem; flex-wrap: wrap; }
    .legend-gradient { width: 50px; height: 6px; }
    .legend-tip { display: none; }

    /* Map */
    .map-wrapper { padding: 0.4rem; border-radius: 16px; margin-bottom: 1rem; }
    .echarts-container {
        height: 60vh;
        min-height: 340px;
        max-height: 460px;
        /* 双指缩放、单指拖动；隐含中、仅占位，不与页面滚动冲突 */
        touch-action: pan-x pan-y;
    }

    /* Panels */
    .panel { padding: 1rem; border-radius: 16px; }
    .panel-head { margin-bottom: 0.9rem; padding-bottom: 0.7rem; }
    .panel-head h3 { font-size: 0.98rem; }
    .city-list li { grid-template-columns: 26px minmax(48px, auto) 1fr auto; gap: 0.5rem; padding: 0.5rem 0; }
    .city-list .rank { width: 24px; height: 24px; font-size: 0.78rem; border-radius: 6px; }
    .city-list .name { font-size: 0.85rem; }
    .city-list .count { font-size: 0.85rem; min-width: 30px; }
    .bar-wrap { min-width: 40px; }
    .recent-avatar { width: 34px; height: 34px; font-size: 0.9rem; border-radius: 10px; }
    .recent-meta { gap: 0.5rem; }
    .r-nick { font-size: 0.85rem; }
    .r-city { font-size: 0.72rem; }
    .r-msg { font-size: 0.82rem; }

    /* Modal */
    .modal-card { padding: 1.4rem 1.2rem; border-radius: 18px; max-height: calc(100dvh - 24px); width: calc(100vw - 24px); }
    .modal-card h2 { font-size: 1.25rem; }
    .modal-icon { font-size: 1.8rem; }
    .modal-header { margin-bottom: 1.3rem; }
    .field { margin-bottom: 0.9rem; }
    .field input, .field textarea, .field .select-box { padding: 0.7rem 0.85rem; font-size: 0.9rem; border-radius: 10px; }
    .field-row { grid-template-columns: 1fr; gap: 0; }
    .emoji-panel { grid-template-columns: repeat(7, 1fr); max-height: 140px; }
    .emoji-item { font-size: 1.05rem; }
    .modal-actions { flex-direction: column; gap: 0.6rem; margin-top: 1.2rem; }
    .map-corner { display: none; }
}
@media (max-width: 380px) {
    .hero-right { grid-template-columns: repeat(3, 1fr); }
    .stat-num { font-size: 1.05rem; }
    .stat-total .stat-num { font-size: 1.1rem; }
    .echarts-container { height: 56vh; min-height: 320px; }
}

/* ===== Poster modal ===== */
.already-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ff4ff5;
    box-shadow: 0 0 12px rgba(255,79,245,0.5);
    margin-right: 4px;
}
.btn-poster {
    margin-left: 12px;
    background: linear-gradient(135deg, rgba(250,204,21,0.2), rgba(200,80,232,0.2));
    color: #FACC15;
    border: 1px solid rgba(250,204,21,0.5);
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.85rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition-property: transform, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}
.btn-poster:hover {
    background: linear-gradient(135deg, rgba(250,204,21,0.35), rgba(200,80,232,0.35));
    transform: translateY(-1px);
}
.poster-card {
    position: relative;
    width: min(420px, 92vw);
    max-height: 92vh;
    overflow: hidden;
    border-radius: 20px;
    background: linear-gradient(160deg, #1a0624, #0f0418);
    border: 1px solid rgba(200,80,232,0.3);
    padding: 22px 22px 18px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,80,232,0.15) inset;
}
.poster-head { text-align: center; margin-bottom: 14px; }
.poster-head h2 { color: #fff; margin: 0 0 4px; font-size: 1.3rem; }
.poster-head p { color: rgba(255,255,255,0.55); margin: 0; font-size: 0.85rem; }
.poster-preview {
    flex: 1;
    min-height: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: rgba(0,0,0,0.4);
    overflow: auto;
    padding: 10px;
    margin-bottom: 14px;
}
.poster-img {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(200,80,232,0.3);
}
.poster-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
}
.poster-actions {
    display: flex;
    gap: 12px;
}
.poster-actions .btn-cancel,
.poster-actions .btn-submit {
    flex: 1;
}
.poster-actions .btn-regen {
    flex: 0 0 auto;
    padding: 0 16px;
    background: rgba(200,80,232,0.12);
    color: #f3caff;
    border: 1px solid rgba(200,80,232,0.45);
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s, transform 0.1s;
}
.poster-actions .btn-regen:hover:not(:disabled) {
    background: rgba(200,80,232,0.22);
    transform: translateY(-1px);
}
.poster-actions .btn-regen:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
@media (max-width: 480px) {
    .poster-actions .btn-regen {
        padding: 0 12px;
        font-size: 0.82rem;
    }
}
</style>
