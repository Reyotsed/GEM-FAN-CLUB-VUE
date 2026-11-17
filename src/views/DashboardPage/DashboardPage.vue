<template>
  <div class="dash-wrap">
    <!-- 全景极光环境装饰层 -->
    <div class="bg-aurora"></div>
    <div class="bg-grid"></div>
    <div class="bg-particles">
      <span class="particle" v-for="(style, n) in particleStyles" :key="n" :style="style"></span>
    </div>

    <!-- 全息安全验证面板（登录） -->
    <div v-if="!authed" class="login-wrapper">
      <div class="login-glow-ring"></div>
      <div class="glass-glow-card login-card" v-motion
           :initial="{ opacity: 0, y: 30, scale: 0.96 }"
           :animate="{ opacity: 1, y: 0, scale: 1 }"
           :transition="{ duration: 0.6, ease: 'easeOut' }">
        <div class="lock-header">
          <div class="lock-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h2 class="text-gradient-neon">安全控制台验证</h2>
          <p class="lock-subtitle">请输入凭证以访问运营和监控大屏</p>
        </div>
        
        <div class="form-body">
          <div class="input-group">
            <i class="fas fa-user-shield"></i>
            <input v-model="loginForm.username" placeholder="管理员账号" autocomplete="username" />
          </div>
          <div class="input-group">
            <i class="fas fa-key"></i>
            <input v-model="loginForm.password" type="password" placeholder="安全密钥" autocomplete="current-password" @keyup.enter="doLogin" />
          </div>
          
          <button @click="doLogin" class="btn-glow-neon login-btn" :disabled="logging">
            <i v-if="logging" class="fas fa-circle-notch fa-spin"></i>
            <span>{{ logging ? '正在建立全息握手...' : '建立安全连接' }}</span>
          </button>
          
          <Transition name="fade">
            <p v-if="loginError" class="err-msg">
              <i class="fas fa-exclamation-circle"></i> {{ loginError }}
            </p>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 运营看板大屏主体 -->
    <template v-else>
      <header class="dash-header" v-motion
              :initial="{ opacity: 0, y: -20 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.5, ease: 'easeOut' }">
        <div class="header-left">
          <div class="brand-badge">SYSTEM CONTROL</div>
          <h1 class="text-gradient-neon">GEM Fan Club <span class="header-sep">·</span> 运营大屏</h1>
        </div>
        <div class="actions">
          <div class="time-capsule">
            <span class="pulse-radar"></span>
            <span class="time-text">{{ now }}</span>
          </div>
          <button @click="loadAll(); insightsRefreshKey++" class="btn-glow-neon refresh-btn">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': isRefreshing }"></i>
            <span>重新校准</span>
          </button>
          <button @click="logout" class="btn-logout">
            <i class="fas fa-power-off"></i>
          </button>
        </div>
      </header>

      <!-- KPI 核心数据磁贴 -->
      <section class="kpi-row">
        <div class="glass-glow-card kpi" v-motion
             v-for="(kpi, i) in kpiList" :key="i"
             :initial="{ opacity: 0, y: 20, scale: 0.95 }"
             :animate="{ opacity: 1, y: 0, scale: 1 }"
             :transition="{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }">
          <div class="kpi-header">
            <span class="kpi-icon" :style="{ '--icon-color': kpi.color, '--icon-bg': kpi.bg }">
              <i :class="kpi.icon"></i>
            </span>
            <div class="kpi-title">{{ kpi.label }}</div>
          </div>
          <div class="kpi-value">
            <span class="value-num" :class="kpi.textClass">
              {{ formatKPIValue(kpi.key, displayKPIs[kpi.key]) }}
            </span>
            <span v-if="kpi.unit" class="value-unit">{{ kpi.unit }}</span>
          </div>
          <div class="kpi-footer">
            <span class="footer-label">今日实时</span>
          </div>
        </div>
      </section>

      <!-- 图表控制板区 -->
      <section class="chart-row">
        <div class="glass-glow-card chart-card" v-motion
             :initial="{ opacity: 0, y: 25 }"
             :animate="{ opacity: 1, y: 0 }"
             :transition="{ duration: 0.5, delay: 0.3, ease: 'easeOut' }">
          <div class="card-title-bar">
            <div class="title-left">
              <span class="accent-line"></span>
              <h3>页面热度分布（今日 PV TOP）</h3>
            </div>
            <span class="sub-label">实时统计</span>
          </div>
          <div ref="pvBar" class="chart"></div>
        </div>
        
        <div class="glass-glow-card chart-card" v-motion
             :initial="{ opacity: 0, y: 25 }"
             :animate="{ opacity: 1, y: 0 }"
             :transition="{ duration: 0.5, delay: 0.38, ease: 'easeOut' }">
          <div class="card-title-bar">
            <div class="title-left">
              <span class="accent-line pink"></span>
              <h3>用户行为交互分布</h3>
            </div>
            <span class="sub-label">事件触发</span>
          </div>
          <div ref="eventPie" class="chart"></div>
        </div>
      </section>

      <section class="chart-row">
        <div class="glass-glow-card chart-card wide" v-motion
             :initial="{ opacity: 0, y: 25 }"
             :animate="{ opacity: 1, y: 0 }"
             :transition="{ duration: 0.5, delay: 0.45, ease: 'easeOut' }">
          <div class="card-title-bar">
            <div class="title-left">
              <span class="accent-line cyan"></span>
              <h3>近 30 天首页活跃趋势（PV）</h3>
            </div>
            <span class="sub-label">趋势洞察</span>
          </div>
          <div ref="trendLine" class="chart trend-chart"></div>
        </div>
      </section>

      <!-- Agent 智能体大屏指标 -->
      <section class="agent-row glass-glow-card" v-motion
               :initial="{ opacity: 0, y: 25 }"
               :animate="{ opacity: 1, y: 0 }"
               :transition="{ duration: 0.5, delay: 0.5, ease: 'easeOut' }">
        <div class="card-title-bar">
          <div class="title-left">
            <span class="accent-line"></span>
            <h3>🤖 AI-Agent 智能体核心指标（今日）</h3>
          </div>
          <span class="sub-label text-gradient-neon">COSMIC AI</span>
        </div>
        <div class="agent-grid">
          <div class="agent-kpi" v-for="(agent, j) in agentKPIs" :key="j">
            <div class="agent-kpi-icon" :style="{ color: agent.color }">
              <i :class="agent.icon"></i>
            </div>
            <div class="agent-kpi-body">
              <div class="kpi-num" :class="agent.textClass">
                {{ formatKPIValue(agent.key, displayKPIs[agent.key]) }}
              </div>
              <div class="kpi-lbl">{{ agent.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- API 高发状态监控表格 -->
      <section class="api-row glass-glow-card" v-motion
               :initial="{ opacity: 0, y: 25 }"
               :animate="{ opacity: 1, y: 0 }"
               :transition="{ duration: 0.5, delay: 0.55, ease: 'easeOut' }">
        <div class="card-title-bar">
          <div class="title-left">
            <span class="accent-line cyan"></span>
            <h3>🔌 API 系统级网关调用指标（今日）</h3>
          </div>
          <span class="sub-label">接口健康监控</span>
        </div>
        
        <div class="table-container">
          <table class="api-table">
            <thead>
              <tr>
                <th>后端接口</th>
                <th>调用频次</th>
                <th>平均响应耗时</th>
                <th>首字节耗时 (TTFB)</th>
                <th>错误触发数</th>
                <th>接口错误率</th>
                <th>慢请求数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in apiRows" :key="r.endpoint">
                <td class="endpoint">
                  <span class="method-badge" :class="getMethodClass(r.endpoint)">
                    {{ getMethodType(r.endpoint) }}
                  </span>
                  <span class="endpoint-text">{{ getCleanEndpoint(r.endpoint) }}</span>
                </td>
                <td class="tabular font-semibold">{{ r.count }}</td>
                <td class="tabular">{{ r.avgCostMs }}ms</td>
                <td class="tabular">
                  <span v-if="r.firstTokenMs != null" class="glow-pill" 
                        :class="r.firstTokenMs > 3000 ? 'glow-pill-danger' : (r.firstTokenMs > 1500 ? 'glow-pill-warning' : 'glow-pill-success')">
                    {{ r.firstTokenMs }}ms
                  </span>
                  <span v-else class="text-faint">—</span>
                </td>
                <td class="tabular">
                  <span v-if="r.errors > 0" class="badge-error">
                    <i class="fas fa-exclamation-triangle"></i> {{ r.errors }}
                  </span>
                  <span v-else class="text-success font-semibold">0</span>
                </td>
                <td class="tabular">
                  <span class="glow-pill" :class="r.errorRate > 0.05 ? 'glow-pill-danger' : (r.errorRate > 0 ? 'glow-pill-warning' : 'glow-pill-success')">
                    {{ (r.errorRate * 100).toFixed(2) }}%
                  </span>
                </td>
                <td class="tabular">
                  <span v-if="r.slowCount > 0" class="badge-slow">
                    {{ r.slowCount }}
                  </span>
                  <span v-else class="text-faint">0</span>
                </td>
              </tr>
              <tr v-if="!apiRows.length">
                <td colspan="7" class="empty-state">
                  <div class="empty-icon">🔌</div>
                  <div>网关暂无实时捕获数据</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 运营洞察：新老访客 / 留存 / 首页去向 / 落地页 / 游戏漏斗 / 每日猜歌 -->
      <InsightsPanel :api="fetchInsights" :refresh-key="insightsRefreshKey" @unauthorized="logout" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import axios from 'axios'
import InsightsPanel from './InsightsPanel.vue'
let echarts = null  // lazy-loaded on first renderCharts()

// 独立 axios 实例，专走看板鉴权 token
const baseURL = import.meta.env.VITE_API_BASEURL + import.meta.env.VITE_API_PREFIX
const TOKEN_KEY = 'dashboard_token'
const dashApi = axios.create({ baseURL, timeout: 15000 })
dashApi.interceptors.request.use(cfg => {
  const t = sessionStorage.getItem(TOKEN_KEY)
  if (t) cfg.headers['X-Dashboard-Token'] = t
  return cfg
})

const authed = ref(!!sessionStorage.getItem(TOKEN_KEY))
const insightsRefreshKey = ref(0)
const fetchInsights = (days) => dashApi.get('/stats/insights', { params: { days } })
const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const logging = ref(false)
const isRefreshing = ref(false)

const overview = ref(null)
const apiRows = ref([])
const trendData = ref({ dates: [], counts: [] })

const pvBar = ref(null)
const eventPie = ref(null)
const trendLine = ref(null)
let charts = []
let timer = null

const now = ref(new Date().toLocaleString('zh-CN', { hour12: false }))
let timeTimer = null

const aiChatCount = computed(() => overview.value?.todayEvents?.['ai_chat'] || 0)
const errorCount = computed(() => overview.value?.todayEvents?.['error:frontend'] || 0)

// ===== 数字自增滚动缓动逻辑 =====
const displayKPIs = ref({
  todayPv: 0,
  todayUv: 0,
  todayUvRegistered: 0,
  todayUvGuest: 0,
  aiChatCount: 0,
  errorCount: 0,
  tokensToday: 0,
  costUsdToday: 0,
  avgDurationMs: 0,
  aiInvokeCount: 0
})

const targetKPIValues = ref({
  todayPv: 0,
  todayUv: 0,
  todayUvRegistered: 0,
  todayUvGuest: 0,
  aiChatCount: 0,
  errorCount: 0,
  tokensToday: 0,
  costUsdToday: 0,
  avgDurationMs: 0,
  aiInvokeCount: 0
})

function animateAllKPIs() {
  // 设置自增目标值
  targetKPIValues.value = {
    todayPv: overview.value?.todayPv || 0,
    todayUv: overview.value?.todayUv || 0,
    todayUvRegistered: overview.value?.todayUvRegistered || 0,
    todayUvGuest: overview.value?.todayUvGuest || 0,
    aiChatCount: aiChatCount.value || 0,
    errorCount: errorCount.value || 0,
    tokensToday: overview.value?.agent?.tokensToday || 0,
    costUsdToday: overview.value?.agent?.costUsdToday || 0,
    avgDurationMs: overview.value?.agent?.avgDurationMs || 0,
    aiInvokeCount: overview.value?.todayEvents?.['agent:invoke'] || 0
  }

  // 对每一个 KPI 执行滚动动画
  Object.keys(targetKPIValues.value).forEach(key => {
    animateValue(key, displayKPIs.value[key] || 0, targetKPIValues.value[key], 1200)
  })
}

function animateValue(key, start, end, duration) {
  if (start === end) {
    displayKPIs.value[key] = end
    return
  }
  let startTimestamp = null
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp
    const progress = Math.min((timestamp - startTimestamp) / duration, 1)
    const easedProgress = progress * (2 - progress) // easeOutQuad
    
    displayKPIs.value[key] = start + easedProgress * (end - start)
    
    if (progress < 1) {
      window.requestAnimationFrame(step)
    } else {
      displayKPIs.value[key] = end
    }
  }
  window.requestAnimationFrame(step)
}

function formatKPIValue(key, value) {
  if (key === 'costUsdToday') {
    return '$' + (value || 0).toFixed(4)
  }
  if (key === 'avgDurationMs') {
    return Math.round(value || 0).toLocaleString() + 'ms'
  }
  return Math.round(value || 0).toLocaleString()
}

// ===== KPI 磁贴设计定义 =====
const kpiList = computed(() => [
  {
    label: '今日网站总访问 (PV)',
    key: 'todayPv',
    icon: 'fas fa-eye',
    color: '#E8A0F5',
    bg: 'rgba(255, 79, 245, 0.12)',
    textClass: 'text-gradient-neon',
    trendIcon: 'fas fa-arrow-up',
    trendText: '12.4%',
    trendClass: 'trend-up',
    unit: '次'
  },
  {
    label: '今日活跃用户 (UV)',
    key: 'todayUv',
    icon: 'fas fa-users',
    color: '#00ccdf',
    bg: 'rgba(0, 204, 223, 0.12)',
    textClass: 'text-gradient-cyan',
    trendIcon: 'fas fa-arrow-up',
    trendText: '8.1%',
    trendClass: 'trend-up',
    unit: '人'
  },
  {
    label: '实名已注册 UV',
    key: 'todayUvRegistered',
    icon: 'fas fa-user-check',
    color: '#7c5cff',
    bg: 'rgba(124, 92, 255, 0.12)',
    textClass: 'text-registered',
    trendIcon: 'fas fa-arrow-up',
    trendText: '14.5%',
    trendClass: 'trend-up',
    unit: '人'
  },
  {
    label: '游离游客访客 UV',
    key: 'todayUvGuest',
    icon: 'fas fa-user-secret',
    color: '#8a8db0',
    bg: 'rgba(138, 141, 176, 0.12)',
    textClass: 'text-guest',
    trendIcon: 'fas fa-arrow-down',
    trendText: '2.3%',
    trendClass: 'trend-down',
    unit: '人'
  },
  {
    label: '今日 AI 聊天会话',
    key: 'aiChatCount',
    icon: 'fas fa-robot',
    color: '#FACC15',
    bg: 'rgba(250, 204, 21, 0.12)',
    textClass: 'text-gradient-gold',
    trendIcon: 'fas fa-arrow-up',
    trendText: '22.8%',
    trendClass: 'trend-up',
    unit: '次'
  },
  {
    label: '今日前端捕获错误',
    key: 'errorCount',
    icon: 'fas fa-exclamation-triangle',
    color: '#ff4b4b',
    bg: 'rgba(255, 75, 75, 0.12)',
    textClass: 'text-danger',
    trendIcon: 'fas fa-arrow-down',
    trendText: '35.1%',
    trendClass: 'trend-up-good', // 错误率降低是好事，显示绿色
    unit: '个'
  }
])

const agentKPIs = [
  { label: 'Tokens 耗用总额', key: 'tokensToday', icon: 'fas fa-coins', color: '#E8A0F5', textClass: 'text-gradient-neon' },
  { label: '推理花费资费 (USD)', key: 'costUsdToday', icon: 'fas fa-file-invoice-dollar', color: '#FACC15', textClass: 'text-gradient-gold' },
  { label: '平均响应用时', key: 'avgDurationMs', icon: 'fas fa-stopwatch', color: '#00ccdf', textClass: 'text-gradient-cyan' },
  { label: '智能体调用频次', key: 'aiInvokeCount', icon: 'fas fa-magic', color: '#7c5cff', textClass: 'text-registered' }
]

// ===== 背景粒子装饰特效 =====
function particleStyle(n) {
  const size = 2 + Math.random() * 3
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${(n / 10) * 100 + (Math.random() - 0.5) * 10}%`,
    top: `${Math.random() * 100}%`,
    animationDuration: `${10 + Math.random() * 12}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: 0.2 + Math.random() * 0.4
  }
}
const particleStyles = Array.from({ length: 10 }, (_, i) => particleStyle(i + 1))

// ===== 登录与刷新逻辑 =====
async function doLogin() {
  if (!loginForm.value.username || !loginForm.value.password) return
  logging.value = true
  loginError.value = ''
  try {
    const { data } = await dashApi.post('/stats/dashboard/login', loginForm.value)
    if (data.code === 200 && data.data?.token) {
      sessionStorage.setItem(TOKEN_KEY, data.data.token)
      authed.value = true
      await nextTick()
      loadAll()
    } else {
      loginError.value = data.message || '安全凭证不匹配，拒绝授予访问权限'
    }
  } catch (e) {
    loginError.value = e?.response?.data?.message || '无法与验证服务器建立安全连接'
  } finally {
    logging.value = false
  }
}

function logout() {
  sessionStorage.removeItem(TOKEN_KEY)
  authed.value = false
  charts.forEach(c => c?.dispose?.())
  charts = []
  if (timer) clearInterval(timer)
}

async function loadAll() {
  isRefreshing.value = true
  try {
    const [ov, api, trend] = await Promise.all([
      dashApi.get('/stats/overview'),
      dashApi.get('/stats/api'),
      dashApi.get('/stats/trend', { params: { statKey: 'pv:home', days: 30 } }),
    ])
    if (ov.data.code === 401) return logout()
    overview.value = ov.data.data
    apiRows.value = api.data.data?.rows || []
    trendData.value = trend.data.data || { dates: [], counts: [] }
    
    // 触发数字自增滚动动画
    animateAllKPIs()
    
    await nextTick()
    await renderCharts()
  } catch (e) {
    if (e?.response?.status === 401) logout()
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 500)
  }
}

// ===== API网关表格辅助函数 =====
function getMethodType(endpoint) {
  if (endpoint.startsWith('GET ')) return 'GET'
  if (endpoint.startsWith('POST ')) return 'POST'
  if (endpoint.startsWith('PUT ')) return 'PUT'
  if (endpoint.startsWith('DELETE ')) return 'DELETE'
  return 'API'
}

function getCleanEndpoint(endpoint) {
  return endpoint.replace(/^(GET|POST|PUT|DELETE)\s+/, '')
}

function getMethodClass(endpoint) {
  const method = getMethodType(endpoint)
  return `method-${method.toLowerCase()}`
}

// ===== 深度艺术图表渲染 (ECharts Art Customization) =====
async function renderCharts() {
  if (!echarts) echarts = await import('echarts')
  charts.forEach(c => c?.dispose?.())
  charts = []

  // 1. 柱状图：不规则微渐变圆角柱状图
  if (pvBar.value && overview.value) {
    const detail = overview.value.todayPvDetail || {}
    const entries = Object.entries(detail).sort((a, b) => b[1] - a[1]).slice(0, 10)
    const c = echarts.init(pvBar.value)
    
    c.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(10, 14, 30, 0.95)',
        borderColor: 'rgba(200, 80, 232, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e6e7ee', fontSize: 12 }
      },
      grid: { left: 90, right: 30, top: 15, bottom: 20 },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
        axisLabel: { color: 'rgba(255, 255, 255, 0.45)', fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: entries.map(e => e[0]).reverse(),
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: '#8a8db0', fontSize: 11, fontWeight: 500 }
      },
      series: [{
        type: 'bar',
        data: entries.map(e => e[1]).reverse(),
        barWidth: '55%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: 'rgba(124, 92, 255, 0.85)' },
            { offset: 1, color: 'rgba(200, 80, 232, 0.95)' }
          ]),
          borderRadius: [0, 6, 6, 0],
          shadowBlur: 10,
          shadowColor: 'rgba(200, 80, 232, 0.3)'
        },
        label: {
          show: true,
          position: 'right',
          color: '#fff',
          fontWeight: 700,
          fontSize: 11,
          distance: 8
        }
      }]
    })
    charts.push(c)
  }

  // 2. 饼图：全息发散玫瑰圆环图
  if (eventPie.value && overview.value) {
    const ev = overview.value.todayEvents || {}
    const data = Object.entries(ev).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }))
    const c = echarts.init(eventPie.value)
    
    // 计算总事件数，用于展示在空心中心
    const totalEvents = data.reduce((sum, item) => sum + item.value, 0)

    c.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 30, 0.95)',
        borderColor: 'rgba(0, 204, 223, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e6e7ee' },
        formatter: '{b} : {c} 次 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemGap: 14,
        itemWidth: 10,
        itemHeight: 10,
        borderRadius: 5,
        textStyle: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 11, fontWeight: 500 }
      },
      // 中间全息文字
      title: {
        text: totalEvents.toLocaleString(),
        subtext: '总交互事件',
        left: '34.5%',
        top: '41%',
        textAlign: 'center',
        textStyle: { color: '#fff', fontSize: 22, fontWeight: 800, fontFamily: 'monospace' },
        subtextStyle: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600 }
      },
      series: [{
        type: 'pie',
        radius: ['52%', '76%'],
        center: ['35%', '50%'],
        roseType: 'radius', // 玫瑰圆环，极具张力
        itemStyle: {
          borderRadius: 8,
          borderColor: '#1a1d3a',
          borderWidth: 2
        },
        label: { show: false },
        data: data.map((item, idx) => {
          // 定制科技感十足的霓虹色彩序列
          const colors = [
            ['#D946EF', '#E8A0F5'], // 粉红紫
            ['#00ccdf', '#00a0d0'], // 极光蓝
            ['#7c5cff', '#5c6bc0'], // 皇家靛蓝
            ['#FACC15', '#ff8000'], // 流光金
            ['#34d399', '#059669'], // 荧光绿
            ['#f87171', '#dc2626']  // 炽热红
          ]
          const colorPair = colors[idx % colors.length]
          return {
            name: item.name,
            value: item.value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: colorPair[0] },
                { offset: 1, color: colorPair[1] }
              ])
            }
          }
        })
      }]
    })
    charts.push(c)
  }

  // 3. 折线图：极光渐变发光区域趋势图
  if (trendLine.value && trendData.value.dates.length) {
    const c = echarts.init(trendLine.value)
    c.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 14, 30, 0.95)',
        borderColor: 'rgba(255, 79, 245, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e6e7ee' }
      },
      grid: { left: 50, right: 30, top: 25, bottom: 40 },
      xAxis: {
        type: 'category',
        data: trendData.value.dates,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255, 255, 255, 0.45)', rotate: 35, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
        axisLabel: { color: 'rgba(255, 255, 255, 0.45)', fontSize: 10 }
      },
      series: [{
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 3.5,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#7c5cff' },
            { offset: 0.5, color: '#E8A0F5' },
            { offset: 1, color: '#FACC15' }
          ]),
          shadowBlur: 14,
          shadowColor: 'rgba(255, 79, 245, 0.5)'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 79, 245, 0.22)' },
            { offset: 1, color: 'rgba(255, 79, 245, 0.00)' }
          ])
        },
        data: trendData.value.counts
      }]
    })
    charts.push(c)
  }
}

const onResize = () => charts.forEach(c => c?.resize?.())

onMounted(() => {
  if (authed.value) loadAll()
  window.addEventListener('resize', onResize)
  
  // 30s 自动轮询刷新大屏数据
  timer = setInterval(() => { if (authed.value) loadAll() }, 30000)

  // 1s 顶栏校准时钟
  timeTimer = setInterval(() => {
    now.value = new Date().toLocaleString('zh-CN', { hour12: false })
  }, 1000)
})

onUnmounted(() => {
  charts.forEach(c => c?.dispose?.())
  window.removeEventListener('resize', onResize)
  if (timer) clearInterval(timer)
  if (timeTimer) clearInterval(timeTimer)
})
</script>

<style scoped>
/* ========== 环境与极光背景 ========== */
.dash-wrap {
  padding: 32px;
  background-color: #05050d;
  min-height: 100vh;
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
  font-family: inherit;
}

.bg-aurora {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 45% 35% at 20% 5%, rgba(200,80,232,0.12), transparent 60%),
    radial-gradient(ellipse 50% 35% at 80% 85%, rgba(0,204,223,0.08), transparent 60%),
    linear-gradient(180deg, #070714 0%, #030308 100%);
}

.bg-grid {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
  -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
}

.bg-particles {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
}

.particle {
  position: absolute; border-radius: 50%; background: var(--accent-pink);
  animation: floatParticle linear infinite; filter: blur(1.5px);
}

@keyframes floatParticle {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.2; }
  100% { transform: translateY(-30vh) scale(0.6); opacity: 0; }
}

.dash-wrap > *:not(.bg-aurora):not(.bg-grid):not(.bg-particles) {
  position: relative;
  z-index: 1;
}

/* ========== 安全验证面板（登录） ========== */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  position: relative;
}

.login-glow-ring {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 80, 232, 0.08) 0%, transparent 70%);
  filter: blur(20px);
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 40px;
  border-radius: 24px;
  border: 1px solid rgba(200, 80, 232, 0.25) !important;
  box-shadow: 
    0 24px 70px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(200, 80, 232, 0.08) !important;
}

.lock-header {
  text-align: center;
  margin-bottom: 30px;
}

.lock-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(200, 80, 232, 0.12);
  border: 1px solid rgba(200, 80, 232, 0.3);
  color: var(--primary);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 0 20px rgba(200, 80, 232, 0.2);
}

.lock-header h2 {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.lock-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group i {
  position: absolute;
  left: 16px;
  color: var(--text-muted);
  font-size: 15px;
  transition: color 0.3s ease;
}

.input-group input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  transition: all 0.3s ease;
}

.input-group input:focus {
  border-color: rgba(200, 80, 232, 0.5);
  background: rgba(200, 80, 232, 0.04);
  box-shadow: 
    0 0 0 4px rgba(200, 80, 232, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
}

.input-group input:focus + i {
  color: var(--primary);
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  gap: 8px;
}

.err-msg {
  color: #f87171;
  font-size: 12px;
  text-align: center;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.2);
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ========== 大屏头部 (Header) ========== */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-badge {
  font-size: 9px;
  color: var(--primary-light);
  letter-spacing: 2.5px;
  font-weight: 800;
}

.dash-header h1 {
  font-size: 24px;
  font-weight: 900;
  margin: 0;
  letter-spacing: 0.5px;
}

.header-sep {
  color: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.time-capsule {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 12px;
}

.pulse-radar {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px #34d399;
  animation: radar-pulse 2s cubic-bezier(0.25, 0, 0, 1) infinite;
}

@keyframes radar-pulse {
  0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
  100% { box-shadow: 0 0 0 8px rgba(52, 211, 153, 0); }
}

.time-text {
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.refresh-btn {
  padding: 8px 16px;
  font-size: 12px;
  gap: 6px;
}

.btn-logout {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(248, 113, 113, 0.05);
  border: 1px solid rgba(248, 113, 113, 0.2);
  color: #f87171;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.45);
  box-shadow: 0 0 15px rgba(248, 113, 113, 0.2);
  transform: scale(1.05);
}

/* ========== KPI 网格 (KPI List) ========== */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.kpi {
  padding: 20px 18px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: var(--icon-bg);
  border: 1.5px solid rgba(255, 255, 255, 0.04);
  color: var(--icon-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.kpi-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.kpi-value {
  margin: 12px 0 6px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.value-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.text-registered {
  color: #7c5cff;
}

.text-guest {
  color: #8a8db0;
}

.value-unit {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.kpi-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 700;
}

.trend-up {
  color: #ff4b4b; /* 访问上升一般用红色 */
}

.trend-down {
  color: rgba(255, 255, 255, 0.4);
}

.trend-up-good {
  color: #34d399; /* 错误下降用绿色 */
}

.footer-label {
  color: var(--text-muted);
}

/* ========== 图表卡片区 ========== */
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  padding: 20px;
}

.chart-card.wide {
  grid-column: 1 / -1;
}

.card-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.accent-line {
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background-color: var(--primary);
  box-shadow: 0 0 8px var(--primary);
}

.accent-line.pink {
  background-color: var(--accent-pink);
  box-shadow: 0 0 8px var(--accent-pink);
}

.accent-line.cyan {
  background-color: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
}

.title-left h3 {
  margin: 0;
  font-size: 13px;
  color: #c8caea;
  font-weight: 700;
}

.sub-label {
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 1.5px;
  font-weight: 700;
  text-transform: uppercase;
}

.chart {
  width: 100%;
  height: 280px;
}

.trend-chart {
  height: 240px;
}

/* ========== Agent 指标排版 ========== */
.agent-row {
  padding: 20px;
  margin-bottom: 24px;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.agent-kpi {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.agent-kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.agent-kpi-body {
  display: flex;
  flex-direction: column;
}

.agent-kpi-body .kpi-num {
  font-size: 20px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.2;
}

.agent-kpi-body .kpi-lbl {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: 600;
}

/* ========== API 网关调用监控表格 ========== */
.api-row {
  padding: 20px;
  margin-bottom: 30px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(255, 255, 255, 0.01);
}

.api-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  text-align: left;
}

.api-table th {
  background: rgba(255, 255, 255, 0.02);
  padding: 14px 16px;
  color: var(--text-secondary);
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.api-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.api-table tbody tr {
  transition: background 0.25s ease;
}

.api-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.api-table tbody tr:last-child td {
  border-bottom: none;
}

/* API 请求方式标签风格 */
.method-badge {
  display: inline-flex;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 800;
  font-family: monospace;
  margin-right: 8px;
  letter-spacing: 0.5px;
}

.method-get { background: rgba(52, 211, 153, 0.15); color: #34d399; }
.method-post { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
.method-put { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.method-delete { background: rgba(248, 113, 113, 0.15); color: #f87171; }

.endpoint {
  display: flex;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
}

.endpoint-text {
  color: #c8caea;
  font-weight: 500;
}

.tabular {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

.badge-error {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
  border: 1px solid rgba(248, 113, 113, 0.2);
}

.badge-slow {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

/* ========== Vue 过渡动画 ========== */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* ========== 响应式断点适配 (≤ 1200px) ========== */
@media (max-width: 1200px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
  .agent-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .dash-wrap { padding: 16px; }
  .dash-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .dash-header .actions { width: 100%; justify-content: space-between; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kpi { padding: 14px; min-height: 110px; }
  .value-num { font-size: 20px; }
  .agent-grid { grid-template-columns: 1fr; gap: 10px; }
  .login-card { padding: 24px; }
  .lock-header h2 { font-size: 18px; }
}

@media (max-width: 480px) {
  .kpi-row { grid-template-columns: 1fr; }
}
</style>