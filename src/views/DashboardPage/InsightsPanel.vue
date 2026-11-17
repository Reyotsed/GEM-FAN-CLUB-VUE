<template>
  <section class="ins">
    <div class="ins-head">
      <div class="ins-title">
        <span class="accent-line"></span>
        <h2>运营洞察</h2>
        <span class="ins-sub">口径：历史为每日 00:05 落库数据，今日为实时</span>
      </div>
      <div class="ins-range" role="tablist">
        <button
          v-for="d in [7, 14, 30, 90]"
          :key="d"
          :class="{ 'is-active': days === d }"
          @click="setDays(d)"
        >{{ d }} 天</button>
      </div>
    </div>

    <div v-if="!data" class="ins-empty">{{ loading ? '加载中…' : '暂无数据' }}</div>

    <template v-else>
      <!-- KPI -->
      <div class="ins-kpis">
        <div v-for="k in kpis" :key="k.label" class="glass-glow-card ins-kpi">
          <span class="ins-kpi-label">{{ k.label }}</span>
          <span class="ins-kpi-value">{{ k.value }}</span>
          <span class="ins-kpi-hint">{{ k.hint }}</span>
        </div>
      </div>

      <!-- 趋势 -->
      <div class="ins-grid">
        <div class="glass-glow-card ins-card wide">
          <div class="ins-card-h"><h3>访客趋势（新访客 / 回访 / 注册用户）</h3></div>
          <div ref="uvChart" class="ins-chart"></div>
        </div>
      </div>

      <div class="ins-grid">
        <div class="glass-glow-card ins-card">
          <div class="ins-card-h">
            <h3>首页去向</h3>
            <span class="ins-tag">首页 PV {{ data.homePv }} · 分发率 {{ homeDispatchRate }}</span>
          </div>
          <div ref="homeChart" class="ins-chart"></div>
        </div>
        <div class="glass-glow-card ins-card">
          <div class="ins-card-h">
            <h3>会话落地页</h3>
            <span class="ins-tag">会话 {{ data.totals.sessions }}</span>
          </div>
          <div ref="landingChart" class="ins-chart"></div>
        </div>
      </div>

      <div class="ins-grid">
        <div class="glass-glow-card ins-card">
          <div class="ins-card-h"><h3>游戏漏斗（进入 → 开局 → 完成）</h3></div>
          <table class="ins-table">
            <thead>
              <tr><th>游戏</th><th>进入</th><th>开局</th><th>完成</th><th>开局率</th><th>完成率</th></tr>
            </thead>
            <tbody>
              <tr v-for="g in data.games" :key="g.key">
                <td>{{ g.name }}</td>
                <td class="num">{{ g.visit }}</td>
                <td class="num">{{ g.start }}</td>
                <td class="num">{{ g.complete }}</td>
                <td class="num">{{ rate(g.start, g.visit) }}</td>
                <td class="num">{{ rate(g.complete, g.start) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="glass-glow-card ins-card">
          <div class="ins-card-h"><h3>每日猜歌</h3><span class="ins-tag">参与 / 猜中 / 分享</span></div>
          <div ref="dailyChart" class="ins-chart"></div>
        </div>
      </div>

      <div class="ins-grid">
        <div class="glass-glow-card ins-card">
          <div class="ins-card-h">
            <h3>新访客留存</h3>
            <span class="ins-tag">次日 {{ pctText(data.totals.d1Rate) }} · 7 日 {{ pctText(data.totals.d7Rate) }}</span>
          </div>
          <table class="ins-table">
            <thead><tr><th>首访日期</th><th>新访客</th><th>次日留存</th><th>7 日留存</th></tr></thead>
            <tbody>
              <tr v-for="c in cohortsDesc" :key="c.date">
                <td>{{ c.date.slice(5) }}</td>
                <td class="num">{{ c.newUsers }}</td>
                <td class="num" :style="heat(c.d1, c.newUsers)">{{ cohortCell(c.d1, c.newUsers) }}</td>
                <td class="num" :style="heat(c.d7, c.newUsers)">{{ cohortCell(c.d7, c.newUsers) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="glass-glow-card ins-card">
          <div class="ins-card-h"><h3>模块 PV 排行</h3><span class="ins-tag">首页模块点击见下方</span></div>
          <div ref="pageChart" class="ins-chart"></div>
          <div v-if="data.homeClick.length" class="ins-chips">
            <span v-for="c in data.homeClick" :key="c.key" class="ins-chip">
              {{ label(c.key) }} <b>{{ c.count }}</b>
            </span>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  api: { type: Function, required: true },
  refreshKey: { type: Number, default: 0 },
})
const emit = defineEmits(['unauthorized'])

const LABELS = {
  home: '首页', song: '歌曲', quote: '广场', quote_detail: '帖子详情', shop: '商店', ai: 'AI',
  info: '资讯', user: '个人中心', games: '游戏大厅', guess_song: '听歌猜歌名', lyrics_chain: '歌词接龙',
  ticket_rush: '抢票模拟器', hummingbird_strike: '痛击蜂鸟', quiz: '知识问答', story: '快拍',
  fan_map: '粉丝地图', daily_guess: '每日猜歌', picture: '图片', concert_banner: '演唱会横幅',
  social_weibo: '微博', social_youtube: 'YouTube', social_netease: '网易云', social_bilibili: 'B站',
  social_xiaohongshu: '小红书', social_instagram: 'Instagram', social_douyin: '抖音',
}
const label = (k) => LABELS[k] || k

const days = ref(14)
const data = ref(null)
const loading = ref(false)

const uvChart = ref(null)
const homeChart = ref(null)
const landingChart = ref(null)
const dailyChart = ref(null)
const pageChart = ref(null)
let charts = []
let echarts = null

const rate = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
const pctText = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`)
const cohortCell = (n, base) => (n == null ? '—' : base > 0 ? `${n} (${Math.round((n / base) * 100)}%)` : `${n}`)
const heat = (n, base) => {
  if (n == null || !base) return {}
  const a = Math.min(0.55, (n / base) * 0.9)
  return { background: `rgba(52, 211, 153, ${a.toFixed(2)})` }
}

const homeDispatchRate = computed(() => {
  const out = (data.value?.homeTo || []).reduce((s, r) => s + r.count, 0)
  return rate(out, data.value?.homePv || 0)
})

const cohortsDesc = computed(() => [...(data.value?.cohorts || [])].reverse())

const kpis = computed(() => {
  const t = data.value?.totals || {}
  const avgUv = data.value ? (t.uv / data.value.days).toFixed(1) : 0
  return [
    { label: '累计 UV', value: t.uv ?? 0, hint: `日均 ${avgUv}` },
    { label: '新访客', value: t.uvNew ?? 0, hint: `回访 ${t.uvReturning ?? 0}` },
    { label: '次日留存', value: pctText(t.d1Rate), hint: '新访客次日回访' },
    { label: '7 日留存', value: pctText(t.d7Rate), hint: '新访客第 7 天回访' },
    { label: '注册', value: t.register ?? 0, hint: `转化 ${rate(t.register, t.uvNew)}` },
    { label: '分享 / 回流', value: `${t.shares ?? 0} / ${t.shareLandings ?? 0}`, hint: '分享次数 / 分享链接进入' },
  ]
})

async function load() {
  loading.value = true
  try {
    const res = await props.api(days.value)
    if (res.data.code === 401) return emit('unauthorized')
    if (res.data.code !== 200) return
    data.value = res.data.data
    await nextTick()
    await render()
  } catch (e) {
    if (e?.response?.status === 401) emit('unauthorized')
  } finally {
    loading.value = false
  }
}

function setDays(d) {
  if (days.value === d) return
  days.value = d
  load()
}

const AXIS = {
  axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
  axisTick: { show: false },
  axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
}
const TOOLTIP = {
  backgroundColor: 'rgba(10,14,30,0.95)',
  borderColor: 'rgba(200,80,232,0.3)',
  textStyle: { color: '#e6e7ee', fontSize: 12 },
}

function barOption(rows, color) {
  const top = rows.slice(0, 10).reverse()
  return {
    tooltip: { ...TOOLTIP, trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 90, right: 40, top: 10, bottom: 20 },
    xAxis: { type: 'value', minInterval: 1, ...AXIS },
    yAxis: { type: 'category', data: top.map(r => label(r.key)), ...AXIS, splitLine: { show: false } },
    series: [{
      type: 'bar',
      data: top.map(r => r.count),
      barWidth: '55%',
      itemStyle: { color, borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: 'right', color: '#fff', fontSize: 11 },
    }],
  }
}

function emptyOption(text) {
  return { title: { text, left: 'center', top: 'middle', textStyle: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500 } } }
}

async function render() {
  if (!echarts) echarts = await import('echarts')
  charts.forEach(c => c.dispose())
  charts = []
  const d = data.value
  const s = d.series
  const dates = d.dates.map(x => x.slice(5))
  const mk = (el, opt) => {
    if (!el) return
    const c = echarts.init(el)
    c.setOption({ backgroundColor: 'transparent', ...opt })
    charts.push(c)
  }

  mk(uvChart.value, {
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    legend: { top: 0, textStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 11 } },
    grid: { left: 40, right: 20, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: dates, ...AXIS },
    yAxis: { type: 'value', minInterval: 1, ...AXIS },
    series: [
      { name: '新访客', type: 'bar', stack: 'uv', data: s['uv:new'], itemStyle: { color: '#a78bfa' }, barMaxWidth: 22 },
      { name: '回访', type: 'bar', stack: 'uv', data: s['uv:returning'], itemStyle: { color: '#00ccdf', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 22 },
      { name: 'UV(总)', type: 'line', smooth: true, data: s['uv'], symbol: 'circle', symbolSize: 5, lineStyle: { color: '#FACC15', width: 2 }, itemStyle: { color: '#FACC15' } },
      { name: '注册用户', type: 'line', smooth: true, data: s['uv:registered'], symbol: 'none', lineStyle: { color: '#f472b6', width: 2, type: 'dashed' }, itemStyle: { color: '#f472b6' } },
    ],
  })

  mk(homeChart.value, d.homeTo.length ? barOption(d.homeTo, '#a78bfa') : emptyOption('暂无数据（新埋点上线后开始累计）'))
  mk(landingChart.value, d.landing.length ? barOption(d.landing, '#00ccdf') : emptyOption('暂无数据（新埋点上线后开始累计）'))
  mk(pageChart.value, d.pagePv.length ? barOption(d.pagePv, '#E8A0F5') : emptyOption('暂无数据'))

  mk(dailyChart.value, {
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    legend: { top: 0, textStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 11 } },
    grid: { left: 36, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: dates, ...AXIS },
    yAxis: { type: 'value', minInterval: 1, ...AXIS },
    series: [
      { name: '开局', type: 'bar', data: s['event:daily_guess:start'], itemStyle: { color: 'rgba(167,139,250,0.5)', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 18 },
      { name: '猜中', type: 'bar', data: s['event:daily_guess:win'], itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 18 },
      { name: '分享', type: 'line', smooth: true, data: s['event:share:daily_guess'], lineStyle: { color: '#FACC15' }, itemStyle: { color: '#FACC15' } },
    ],
  })
}

const onResize = () => charts.forEach(c => c.resize())

watch(() => props.refreshKey, () => load())

onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  charts.forEach(c => c.dispose())
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.ins { margin-top: 8px; margin-bottom: 30px; }
.glass-glow-card {
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.ins-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.ins-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ins-title h2 { margin: 0; font-size: 18px; font-weight: 800; color: #fff; }
.ins-sub { font-size: 11px; color: var(--text-muted, rgba(255,255,255,0.45)); }
.accent-line {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: #a78bfa;
  box-shadow: 0 0 8px #a78bfa;
}
.ins-range {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.ins-range button {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.ins-range button.is-active { background: rgba(167, 139, 250, 0.25); color: #fff; }

.ins-empty { text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.4); }

.ins-kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.ins-kpi { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.ins-kpi-label { font-size: 11px; font-weight: 600; color: rgba(255, 255, 255, 0.55); }
.ins-kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
.ins-kpi-hint { font-size: 11px; color: rgba(255, 255, 255, 0.4); }

.ins-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.ins-card { padding: 18px; min-width: 0; }
.ins-card.wide { grid-column: 1 / -1; }
.ins-card-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
}
.ins-card-h h3 { margin: 0; font-size: 13px; color: #c8caea; font-weight: 700; }
.ins-tag { font-size: 11px; color: rgba(255, 255, 255, 0.5); font-variant-numeric: tabular-nums; }
.ins-chart { width: 100%; height: 260px; }

.ins-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.ins-table th {
  text-align: left;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.ins-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.88);
}
.ins-table .num {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

.ins-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ins-chip {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}
.ins-chip b { color: #fff; margin-left: 4px; font-variant-numeric: tabular-nums; }

@media (max-width: 1200px) {
  .ins-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ins-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .ins-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .ins-kpi-value { font-size: 20px; }
  .ins-table { font-size: 11.5px; }
  .ins-table th, .ins-table td { padding: 6px; }
}
</style>
