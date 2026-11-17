<template>
    <section class="fm-wrap" @click="goToMap">
        <!-- Section header 与首页其它区块保持一致 -->
        <div class="fm-header">
            <span class="fm-tag">COMMUNITY</span>
            <h2>全球 <span class="fm-hl">棋士</span> 在线</h2>
            <p class="fm-sub">点亮你所在的城市，让世界看见我们</p>
        </div>

        <div class="fm-card">
            <!-- 背景光晕 -->
            <div class="fm-aurora"></div>
            <div class="fm-grid-bg"></div>

            <div class="fm-body">
                <!-- 左：数据区 -->
                <div class="fm-left">
                    <div class="fm-stat">
                        <div class="fm-stat-num">
                            <span class="fm-num">{{ total.toLocaleString() }}</span>
                            <span class="fm-unit">位棋士已报到</span>
                        </div>
                        <div class="fm-live">
                            <span class="fm-dot"></span> LIVE · 实时更新
                        </div>
                    </div>

                    <div class="fm-chips">
                        <span v-for="(c, i) in topCities" :key="c.city" class="fm-chip" :style="{ animationDelay: i * 0.08 + 's' }">
                            <i class="fas fa-map-pin"></i>
                            {{ c.city }}
                            <em>{{ c.count }}</em>
                        </span>
                        <span v-if="!topCities.length" class="fm-chip empty">等你来打头阵</span>
                    </div>

                    <div class="fm-actions">
                        <button class="fm-cta" @click.stop="goToMap">
                            <i class="fas fa-map-marker-alt"></i>
                            {{ alreadyMarked ? '查看完整地图' : '点我报到' }}
                            <i class="fas fa-arrow-right fm-cta-arrow"></i>
                        </button>
                        <span v-if="alreadyMarked" class="fm-marked">
                            <i class="fas fa-check-circle"></i> 已在 {{ mineCity }}
                        </span>
                    </div>
                </div>

                <!-- 右：SVG 地图 + 脉冲点 -->
                <div class="fm-right" aria-hidden="true">
                    <div class="fm-globe-glow"></div>
                    <svg class="fm-map" viewBox="0 0 500 260" preserveAspectRatio="xMidYMid meet">
                        <!-- World outline（简化路径，足以形成轮廓剪影） -->
                        <g fill="rgba(200,80,232,0.12)" stroke="rgba(200,80,232,0.35)" stroke-width="0.6">
                            <path d="M60,120 Q70,80 100,75 T160,85 Q180,95 175,120 Q165,145 140,150 T90,145 Q55,140 60,120 Z" />
                            <path d="M200,90 Q240,70 290,78 T370,85 Q400,95 410,120 T405,160 Q385,180 340,175 T250,165 Q205,150 200,130 Z" />
                            <path d="M220,175 Q240,190 260,210 T245,245 Q225,250 215,230 T220,175 Z" />
                            <path d="M380,180 Q410,185 425,205 T420,235 Q405,245 390,230 T380,195 Z" />
                            <path d="M430,105 Q445,115 442,130 T430,145 Q420,140 425,120 Z" />
                        </g>
                        <!-- 经纬网 -->
                        <g stroke="rgba(255,255,255,0.06)" stroke-width="0.5" fill="none">
                            <ellipse cx="250" cy="130" rx="200" ry="90" />
                            <ellipse cx="250" cy="130" rx="200" ry="45" />
                            <line x1="50" y1="130" x2="450" y2="130" />
                            <line x1="250" y1="40" x2="250" y2="220" />
                        </g>
                        <!-- 动态脉冲点 -->
                        <g>
                            <circle v-for="(p, i) in pulses" :key="i"
                                :cx="p.x" :cy="p.y" r="2.5"
                                fill="#FACC15" class="fm-pulse"
                                :style="{ animationDelay: i * 0.4 + 's' }" />
                            <circle v-for="(p, i) in pulses" :key="'r'+i"
                                :cx="p.x" :cy="p.y" r="2.5"
                                fill="none" stroke="#FACC15" stroke-width="1"
                                class="fm-pulse-ring"
                                :style="{ animationDelay: i * 0.4 + 's' }" />
                        </g>
                    </svg>
                </div>
            </div>

            <!-- 底部：最新报到 ticker -->
            <div class="fm-ticker" v-if="recent.length">
                <span class="fm-ticker-label"><i class="fas fa-bolt"></i> 最新报到</span>
                <div class="fm-ticker-track">
                    <div class="fm-ticker-row">
                        <span v-for="(r, i) in tickerLoop" :key="i" class="fm-ticker-item">
                            <span class="fm-t-city">{{ r.city }}</span>
                            <span class="fm-t-nick">{{ r.nickname || '匿名棋士' }}</span>
                            <span class="fm-t-msg" v-if="r.message">「{{ r.message }}」</span>
                            <span class="fm-t-sep">·</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useFanMapStore } from '@/stores/fanMap';

const router = useRouter();
const userStore = useUserStore();
const fanMapStore = useFanMapStore();

const total = computed(() => fanMapStore.total);
const topCities = computed(() => fanMapStore.cities.slice(0, 6));
const recent = computed(() => fanMapStore.recent);
const alreadyMarked = computed(() => fanMapStore.marked);
const mineCity = computed(() => fanMapStore.mine?.city || '');

// SVG 坐标里的伪随机脉冲位置（固定 6 个，既有节奏又不杂乱）
const pulses = [
    { x: 120, y: 110 },   // 北美
    { x: 240, y: 130 },   // 亚洲
    { x: 260, y: 105 },   // 欧洲
    { x: 280, y: 200 },   // 南美
    { x: 395, y: 215 },   // 澳洲
    { x: 310, y: 150 }    // 东南亚
];

// 复制一份以实现无缝滚动
const tickerLoop = computed(() => [...recent.value, ...recent.value]);

async function load() {
    fanMapStore.bindSync();
    // 两个请求并行；store 内部已做 60s 内存缓存（与后端 Redis 对齐）
    await Promise.all([
        fanMapStore.loadStats({ recentLimit: 10 }),
        fanMapStore.loadMine({ isLoggedIn: userStore.isLoggedIn }),
    ]);
}

function goToMap() { router.push({ name: 'fan-map' }); }

onMounted(load);
</script>

<style scoped>
/* ===== Section header ===== */
.fm-wrap {
    cursor: pointer;
}
.fm-header {
    text-align: center;
    margin-bottom: 40px;
}
.fm-tag {
    display: block;
    font-size: 0.9rem;
    color: var(--primary, #D946EF);
    letter-spacing: 3px;
    margin-bottom: 10px;
    font-weight: 700;
}
.fm-header h2 {
    font-size: 3rem;
    color: #fff;
    margin: 0 0 12px;
}
.fm-hl {
    color: var(--accent-pink, #D946EF);
}
.fm-sub {
    color: rgba(255,255,255,.55);
    font-size: 1rem;
    margin: 0;
}

/* ===== Card ===== */
.fm-card {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    background:
        linear-gradient(145deg, rgba(26,6,36,0.85), rgba(15,4,24,0.95));
    border: 1px solid rgba(200,80,232,0.2);
    transition: transform .4s ease, box-shadow .4s ease, border-color .4s ease;
}
.fm-wrap:hover .fm-card {
    transform: translateY(-3px);
    border-color: rgba(200,80,232,0.45);
    box-shadow: 0 20px 60px rgba(200,80,232,0.25), 0 0 0 1px rgba(200,80,232,0.15) inset;
}

.fm-aurora {
    position: absolute; inset: -1px;
    background:
        radial-gradient(circle at 85% 15%, rgba(200,80,232,0.35), transparent 45%),
        radial-gradient(circle at 10% 90%, rgba(250,204,21,0.18), transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(139,47,192,0.12), transparent 60%);
    opacity: .9;
    pointer-events: none;
    animation: fmAurora 12s ease-in-out infinite alternate;
}
@keyframes fmAurora {
    from { transform: scale(1) rotate(0deg); opacity: .7; }
    to   { transform: scale(1.08) rotate(3deg); opacity: 1; }
}

.fm-grid-bg {
    position: absolute; inset: 0;
    background-image:
        linear-gradient(rgba(200,80,232,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200,80,232,0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
    pointer-events: none;
}

/* ===== Body ===== */
.fm-body {
    position: relative;
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 30px;
    padding: 48px 48px 36px;
}

/* Left */
.fm-left { display: flex; flex-direction: column; gap: 24px; }

.fm-stat-num {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
}
.fm-num {
    font-size: 4.2rem;
    font-weight: 900;
    background: linear-gradient(135deg, #FACC15, #D946EF 60%, #A21CAF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    letter-spacing: -2px;
}
.fm-unit {
    color: rgba(255,255,255,.7);
    font-size: 1rem;
}
.fm-live {
    margin-top: 8px;
    display: inline-flex; align-items: center; gap: 8px;
    color: #7dff9e;
    font-size: 0.8rem;
    letter-spacing: 1px;
    font-weight: 600;
}
.fm-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #7dff9e;
    box-shadow: 0 0 10px #7dff9e;
    animation: fmBlink 1.4s ease-in-out infinite;
}
@keyframes fmBlink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .3; transform: scale(.8); }
}

.fm-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.fm-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(200,80,232,0.25);
    color: #fff;
    font-size: 0.88rem;
    backdrop-filter: blur(6px);
    animation: fmFadeUp .6s ease both;
    transition-property: transform, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}
.fm-chip:hover {
    background: rgba(200,80,232,0.15);
    transform: translateY(-2px);
}
.fm-chip i { color: #D946EF; font-size: .75rem; }
.fm-chip em {
    color: #FACC15;
    font-style: normal;
    font-weight: 700;
    margin-left: 2px;
}
.fm-chip.empty { color: rgba(255,255,255,.4); border-style: dashed; }
@keyframes fmFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}

.fm-actions {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    margin-top: 4px;
}
.fm-cta {
    display: inline-flex; align-items: center; gap: 10px;
    background: linear-gradient(135deg, #D946EF, #A21CAF);
    color: #fff;
    border: 0;
    padding: 14px 28px;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    border-radius: 999px;
    cursor: pointer;
    box-shadow: 0 10px 28px rgba(200,80,232,0.45);
    transition: transform .25s, box-shadow .25s;
}
.fm-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(200,80,232,0.6);
}
.fm-cta-arrow { font-size: .8rem; transition: transform .25s; }
.fm-cta:hover .fm-cta-arrow { transform: translateX(4px); }

.fm-marked {
    color: #7dff9e;
    font-size: .9rem;
    display: inline-flex; align-items: center; gap: 6px;
}

/* Right: SVG map */
.fm-right {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    min-height: 260px;
}
.fm-globe-glow {
    position: absolute;
    width: 80%; aspect-ratio: 1/1;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(200,80,232,0.25) 0%, transparent 65%);
    animation: fmGlow 6s ease-in-out infinite alternate;
    pointer-events: none;
}
@keyframes fmGlow {
    from { opacity: .6; transform: scale(1); }
    to   { opacity: 1; transform: scale(1.1); }
}
.fm-map {
    position: relative;
    width: 100%; height: auto;
    filter: drop-shadow(0 0 14px rgba(200,80,232,0.25));
}
.fm-pulse {
    filter: drop-shadow(0 0 6px #FACC15);
    animation: fmPulseDot 2.4s ease-in-out infinite;
    transform-origin: center;
}
.fm-pulse-ring {
    opacity: 0;
    animation: fmPulseRing 2.4s ease-out infinite;
    transform-origin: center;
    transform-box: fill-box;
}
@keyframes fmPulseDot {
    0%, 100% { opacity: .5; }
    50% { opacity: 1; }
}
@keyframes fmPulseRing {
    0%   { r: 2.5; opacity: .9; stroke-width: 1.2; }
    100% { r: 18;  opacity: 0;   stroke-width: 0.2; }
}

/* ===== Ticker ===== */
.fm-ticker {
    position: relative;
    display: flex; align-items: center;
    border-top: 1px solid rgba(200,80,232,0.15);
    background: rgba(0,0,0,0.25);
}
.fm-ticker-label {
    flex-shrink: 0;
    padding: 12px 20px;
    background: linear-gradient(90deg, rgba(200,80,232,0.25), transparent);
    color: #FACC15;
    font-size: .85rem;
    font-weight: 700;
    letter-spacing: 1px;
    display: inline-flex; align-items: center; gap: 8px;
}
.fm-ticker-track {
    flex: 1;
    overflow: hidden;
    position: relative;
    mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
    -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
}
.fm-ticker-row {
    display: inline-flex;
    gap: 0;
    white-space: nowrap;
    animation: fmTicker 40s linear infinite;
    padding: 12px 0;
}
.fm-wrap:hover .fm-ticker-row { animation-play-state: paused; }
@keyframes fmTicker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
}
.fm-ticker-item {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: .88rem;
    padding: 0 14px;
    color: rgba(255,255,255,.8);
}
.fm-t-city { color: #FACC15; font-weight: 700; }
.fm-t-nick { color: rgba(255,255,255,.55); }
.fm-t-msg  { color: #f3caff; }
.fm-t-sep  { color: rgba(200,80,232,.5); margin-left: 6px; }

/* ===== Responsive ===== */
@media (max-width: 900px) {
    .fm-header h2 { font-size: 2.2rem; }
    .fm-body { grid-template-columns: 1fr; padding: 32px 24px 24px; gap: 20px; }
    .fm-num { font-size: 3.2rem; }
    .fm-right { min-height: 200px; }
}
@media (max-width: 480px) {
    .fm-num { font-size: 2.6rem; }
    .fm-cta { width: 100%; justify-content: center; }
    .fm-ticker-label { padding: 10px 12px; font-size: .75rem; }
}
</style>
