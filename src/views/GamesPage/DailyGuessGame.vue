<template>
  <div class="daily-guess gx-page gx-purple">
    <header class="gx-header">
      <button class="gx-back" @click="$router.push('/games')" aria-label="返回">‹</button>
      <div class="gx-title-wrap">
        <span class="gx-icon">🎧</span>
        <h2 class="gx-title">每日猜歌</h2>
      </div>
      <button class="gx-back dg-help-btn" @click="showHelp = true" aria-label="玩法说明">?</button>
    </header>

    <div v-if="loading" class="dg-state">
      <div class="dg-spinner"></div>
      <p>加载今日歌曲…</p>
    </div>
    <div v-else-if="error" class="dg-state">
      <p>{{ error }}</p>
      <button class="gx-btn gx-btn-ghost" @click="load">重试</button>
    </div>

    <template v-else-if="view">
      <!-- 主卡 -->
      <section class="dg-card dg-main">
        <div class="dg-top">
          <span class="dg-meta">
            第 {{ view.no }} 期<template v-if="!finished"> · 还剩 {{ view.maxAttempts - view.guesses.length }} 次机会</template>
          </span>
          <span class="dg-streak" :class="{ 'is-on': view.streak.current > 0 }">连胜 <b>{{ view.streak.current }}</b> 天</span>
        </div>

        <template v-if="!finished">
          <h1 class="dg-h1">听前奏，猜歌名</h1>
          <p class="dg-lead">每天一首邓紫棋的歌。先听一小段，猜不出就解锁更长的。</p>
        </template>
        <template v-else>
          <h1 class="dg-h1">《{{ view.answer?.title }}》</h1>
          <p class="dg-lead">{{ view.status === 'won' ? `你用 ${view.guesses.length} 次猜中了` : '今天没猜中，明天再来' }}</p>
        </template>

        <button class="dg-cta" :class="{ 'is-playing': playing }" :disabled="!audioReady" @click="togglePlay">
          <svg v-if="!playing" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>
          {{ playLabel }}
        </button>

        <div class="dg-track" aria-label="可听时长档位">
          <div class="dg-segs">
            <i
              v-for="(g, idx) in segs"
              :key="idx"
              class="dg-seg"
              :class="{ 'is-open': g.open, 'is-now': g.now }"
              :style="{ flexGrow: g.w }"
            ></i>
            <span class="dg-needle" :style="{ left: needle + '%' }"></span>
          </div>
          <div class="dg-seg-labels">
            <span
              v-for="(g, idx) in segs"
              :key="idx"
              :class="{ 'is-now': g.now }"
              :style="{ flexGrow: g.w }"
            >{{ g.now || idx === segs.length - 1 ? fmtS(g.s) : '' }}</span>
          </div>
        </div>

        <a
          v-if="finished && view.answer?.wyyId"
          class="dg-link"
          :href="`https://music.163.com/#/song?id=${view.answer.wyyId}`"
          target="_blank"
          rel="noopener"
        >去网易云听完整版 ›</a>

        <audio
          ref="audioEl"
          :src="audioSrc"
          preload="auto"
          @canplaythrough="audioReady = true"
          @loadedmetadata="onMeta"
          @error="onAudioError"
        ></audio>
      </section>

      <!-- 认领成功提示 -->
      <div v-if="claimNotice" class="dg-claim-tip" role="status">
        <span>{{ claimNotice }}</span>
        <button class="dg-claim-close" aria-label="关闭" @click="claimNotice = ''">×</button>
      </div>

      <!-- 未登录提示：战绩只对登录用户永久保存 -->
      <div v-if="!isLoggedIn" class="dg-login-tip">
        <span class="dg-login-text">
          <template v-if="!finished">登录后，战绩和连胜会<b>永久保存</b>到个人页</template>
          <template v-else>你现在是游客，<b>换设备或清缓存会丢失战绩</b>，登录后可永久保存</template>
        </span>
        <button class="dg-login-btn" @click="openLogin">登录</button>
      </div>

      <!-- 输入 -->
      <section v-if="!finished" class="dg-card dg-input-card">
        <div class="dg-search">
          <input
            v-model="query"
            class="gx-input dg-input"
            placeholder="输入歌名，从列表里选一个"
            autocomplete="off"
            @focus="dropdownOpen = true"
            @input="onInput"
            @blur="dropdownOpen = false"
            @keydown.down.prevent="moveActive(1)"
            @keydown.up.prevent="moveActive(-1)"
            @keydown.enter.prevent="pickActive"
            @keydown.esc="dropdownOpen = false"
          />
          <ul v-if="dropdownOpen && suggestions.length" class="dg-suggest">
            <li
              v-for="(s, idx) in suggestions"
              :key="s.id"
              :class="{ 'is-active': idx === activeIdx }"
              @mousedown.prevent="pick(s)"
            >{{ s.title }}</li>
          </ul>
        </div>
        <div class="dg-actions">
          <button class="dg-btn dg-btn-ghost" :disabled="submitting" @click="submit(null)">
            跳过 · 解锁 +{{ nextSkipGain }} 秒
          </button>
          <button class="dg-btn dg-btn-solid" :disabled="!selected || submitting" @click="submit(selected.id)">提交</button>
        </div>
      </section>

      <!-- 猜测记录 -->
      <ol v-if="view.guesses.length" class="dg-list">
        <li
          v-for="(g, i) in view.guesses"
          :key="i"
          class="dg-row"
          :class="g.correct ? 'is-correct' : g.skip ? 'is-skip' : 'is-wrong'"
        >
          <span class="dg-row-idx">{{ i + 1 }}</span>
          <span class="dg-row-text">{{ g.skip ? '跳过' : g.title }}</span>
          <span class="dg-row-mark">{{ g.correct ? '正确' : g.skip ? '' : '不对' }}</span>
        </li>
      </ol>

      <!-- 排行榜（答题中也可见：让没开始玩的人先看到有人在比，形成挑战动力） -->
      <section v-if="!finished" class="dg-card dg-rankcard" aria-label="排行榜">
        <div class="dg-rc-head">
          <h3>排行榜</h3>
          <div class="dg-rc-tabs" role="tablist">
            <button :class="{ 'is-active': preTab === 'today' }" @click="openPreRank('today')">今日榜</button>
            <button :class="{ 'is-active': preTab === 'streak' }" @click="openPreRank('streak')">连胜榜</button>
          </div>
        </div>

        <div v-if="rankLoading && !rank" class="dg-rank-empty">加载中…</div>
        <div v-else-if="!rank" class="dg-rank-empty">
          榜单加载失败
          <button class="dg-btn dg-btn-ghost dg-mini" @click="loadRank">重试</button>
        </div>
        <template v-else>
          <!-- 今日榜 -->
          <template v-if="preTab === 'today'">
            <ol v-if="rank.today.length" class="dg-board">
              <li v-for="r in rank.today.slice(0, 5)" :key="r.rank" class="dg-board-row" :class="{ 'is-me': r.me, 'is-top': r.rank <= 3 }">
                <span class="dg-board-rank">{{ r.rank }}</span>
                <span class="dg-board-name">{{ r.name }}<em v-if="r.me">我</em></span>
                <span class="dg-board-val"><b>{{ r.attempts }}</b> 次猜中</span>
              </li>
            </ol>
            <div v-else class="dg-rank-empty">今天还没有人猜中，<b>抢下第一名</b></div>
            <p class="dg-rc-hint">
              <template v-if="rank.todayTotal > 0">今天已有 <b>{{ rank.todayTotal }}</b> 人猜中 · 次数越少排名越高，猜中后上榜</template>
              <template v-else>猜中后上榜 · 次数越少排名越高</template>
            </p>
          </template>

          <!-- 连胜榜 -->
          <template v-else>
            <ol v-if="rank.streak.length" class="dg-board">
              <li v-for="r in rank.streak.slice(0, 5)" :key="r.rank" class="dg-board-row" :class="{ 'is-me': r.me, 'is-top': r.rank <= 3 }">
                <span class="dg-board-rank">{{ r.rank }}</span>
                <span class="dg-board-name">{{ r.name }}<em v-if="r.me">我</em></span>
                <span class="dg-board-val"><b>{{ r.days }}</b> 天</span>
              </li>
            </ol>
            <div v-else class="dg-rank-empty">还没有人连胜，<b>来当第一个</b></div>
            <p class="dg-rc-hint">{{ streakHint }}</p>
          </template>
        </template>
      </section>

      <!-- 结果：战绩 / 榜单 -->
      <section v-if="finished" class="dg-result">
        <div class="gx-tabs dg-tabs" role="tablist">
          <button class="gx-tab" :class="{ 'is-active': tab === 'stats' }" @click="tab = 'stats'">我的战绩</button>
          <button class="gx-tab" :class="{ 'is-active': tab === 'today' }" @click="openRank('today')">今日榜</button>
          <button class="gx-tab" :class="{ 'is-active': tab === 'streak' }" @click="openRank('streak')">连胜榜</button>
        </div>

        <!-- 我的战绩 -->
        <div v-show="tab === 'stats'" class="dg-card dg-pane">
          <div class="dg-nums">
            <div><b>{{ view.streak.current }}</b><span>当前连胜</span></div>
            <div><b>{{ view.streak.max }}</b><span>最长连胜</span></div>
            <div><b>{{ view.streak.played }}</b><span>参与天数</span></div>
            <div><b>{{ winRate }}<small>%</small></b><span>胜率</span></div>
          </div>

          <div class="dg-block">
            <h4>近 7 天</h4>
            <ol class="dg-week">
              <li v-for="d in view.history" :key="d.date" class="dg-day" :class="dayClass(d)" :title="dayTitle(d)">
                <i>{{ dayMark(d) }}</i>
                <span>{{ d.date.slice(8) }}</span>
              </li>
            </ol>
          </div>

          <div v-if="view.stats" class="dg-block">
            <h4>今日 {{ view.stats.players }} 人参与 · 猜中用了几次</h4>
            <div v-for="(n, idx) in distRows" :key="idx" class="dg-dist-row" :class="{ 'is-me': n.me }">
              <span class="dg-dist-label">{{ n.label }}</span>
              <span class="dg-dist-bar"><i :style="{ width: n.width }"></i></span>
              <span class="dg-dist-num">{{ n.count }}</span>
            </div>
          </div>
        </div>

        <!-- 排行榜 -->
        <div v-show="tab !== 'stats'" class="dg-card dg-pane">
          <div v-if="rankLoading" class="dg-rank-empty">加载中…</div>
          <div v-else-if="!rank" class="dg-rank-empty">
            榜单加载失败
            <button class="dg-btn dg-btn-ghost dg-mini" @click="openRank(tab)">重试</button>
          </div>
          <template v-else>
            <div class="dg-me-bar">
              <template v-if="!editingName">
                <span class="dg-me-name">我是 <b>{{ rank.myName }}</b></span>
                <button v-if="rank.canRename" class="dg-link-btn" @click="startRename">改名</button>
                <span v-else class="dg-me-tip">昵称取自个人资料</span>
              </template>
              <form v-else class="dg-rename" @submit.prevent="saveName">
                <input v-model="nameInput" class="gx-input dg-rename-input" maxlength="12" placeholder="1-12 个字符" />
                <button class="dg-btn dg-btn-solid dg-mini" type="submit" :disabled="nameSaving">保存</button>
                <button class="dg-btn dg-btn-ghost dg-mini" type="button" @click="editingName = false">取消</button>
              </form>
            </div>

            <template v-if="tab === 'today'">
              <ol v-if="rank.today.length" class="dg-board">
                <li v-for="r in rank.today" :key="r.rank" class="dg-board-row" :class="{ 'is-me': r.me, 'is-top': r.rank <= 3 }">
                  <span class="dg-board-rank">{{ r.rank }}</span>
                  <span class="dg-board-name">{{ r.name }}<em v-if="r.me">我</em></span>
                  <span class="dg-board-val"><b>{{ r.attempts }}</b> 次猜中</span>
                </li>
              </ol>
              <div v-else class="dg-rank-empty">今天还没有人猜中，来当第一名吧</div>
              <p v-if="rank.todayMe && rank.todayMe.rank > rank.today.length" class="dg-board-me">
                你排第 <b>{{ rank.todayMe.rank }}</b> 名 · {{ rank.todayMe.attempts }} 次猜中
              </p>
              <p v-else-if="view.status === 'lost'" class="dg-board-me">今天没猜中，不上榜，明天再来</p>
              <p class="dg-board-note">共 {{ rank.todayTotal }} 人猜中 · 次数少者靠前，次数相同先完成者靠前</p>
            </template>

            <template v-else>
              <ol v-if="rank.streak.length" class="dg-board">
                <li v-for="r in rank.streak" :key="r.rank" class="dg-board-row" :class="{ 'is-me': r.me, 'is-top': r.rank <= 3 }">
                  <span class="dg-board-rank">{{ r.rank }}</span>
                  <span class="dg-board-name">{{ r.name }}<em v-if="r.me">我</em></span>
                  <span class="dg-board-val"><b>{{ r.days }}</b> 天</span>
                </li>
              </ol>
              <div v-else class="dg-rank-empty">还没有人连胜，先猜中今天这首吧</div>
              <p v-if="rank.streakMe && rank.streakMe.rank > rank.streak.length" class="dg-board-me">
                你排第 <b>{{ rank.streakMe.rank }}</b> 名 · 连胜 {{ rank.streakMe.days }} 天
              </p>
              <p class="dg-board-note">连续每天猜中累计；中断一天则清零</p>
            </template>
          </template>
        </div>

        <p v-if="view.answer?.describe" class="dg-desc">{{ view.answer.describe }}</p>

        <div class="dg-actions">
          <button class="dg-btn dg-btn-solid" @click="share">{{ shareLabel }}</button>
          <button class="dg-btn dg-btn-ghost" @click="$router.push('/games/guess-song')">再玩听歌猜歌名</button>
        </div>
        <p class="dg-next">下一首将在 <strong>{{ countdown }}</strong> 后揭晓</p>
      </section>
    </template>

    <LoginModal ref="loginModal" />

    <!-- 玩法说明 -->
    <div v-if="showHelp" class="gx-modal" @click.self="closeHelp">
      <div class="gx-modal-content dg-help">
        <h3>每日猜歌怎么玩</h3>
        <ul>
          <li>每天 0 点，全站统一换一首邓紫棋的歌</li>
          <li>点<b>播放</b>，先听最开头的一小段</li>
          <li>搜出歌名并提交；猜错或跳过，会解锁更长的片段</li>
          <li>最多 <b>6 次机会</b>，次数越少、完成越早，<b>今日榜</b>排名越高</li>
          <li>连续每天猜中，累计<b>连胜</b>，进入连胜榜</li>
        </ul>
        <div class="gx-actions">
          <button class="gx-btn gx-btn-primary" @click="closeHelp">知道了</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import LoginModal from '@/components/Login/LoginModal.vue'
import apiClient from '@/utils/api'
import { showToast } from '@/utils/toast'
import { trackEvent, EVENTS } from '@/utils/stats'
import { getPlayerId, markDailyGuessDone, cacheStreak, buildShareText, shareText, claimGuestRecords } from '@/utils/dailyGuess'
import './games-shared.css'

const HELP_SEEN_KEY = 'gem_daily_guess_help_seen'

const view = ref(null)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const candidates = ref([])
const query = ref('')
const selected = ref(null)
const dropdownOpen = ref(false)
const activeIdx = ref(0)
const showHelp = ref(false)
const shareLabel = ref('分享成绩')

// 结果页：标签 / 排行榜 / 昵称
const tab = ref('stats')
const rank = ref(null)
const rankLoading = ref(false)
const editingName = ref(false)
const nameInput = ref('')
const nameSaving = ref(false)

const audioEl = ref(null)
const audioReady = ref(false)
const playing = ref(false)
const playhead = ref(0)
let rafId = 0

// 玩家身份随登录态变化：登录用户用 userId（战绩永久保存），游客用设备指纹
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const playerId = ref(getPlayerId())
const loginModal = ref(null)
const openLogin = () => loginModal.value?.openModal()
// 音频由服务端按「当前已解锁时长」截取下发：地址必须带 playerId，且每解锁一档就换一个版本号，
// 否则浏览器会继续播放上一档缓存的短片段。登录用户的音频请求需要 token，因此改为 fetch 成 Blob 再播放。
const audioSrc = ref('')
let audioObjectUrl = ''
const audioVersion = computed(() => (view.value ? `${view.value.date}-${view.value.guesses.length}-${view.value.status}` : ''))

const loadAudio = async () => {
  if (!view.value || !playerId.value) return
  const ver = audioVersion.value
  audioReady.value = false
  try {
    const res = await apiClient.get('/daily-guess/audio', {
      params: { playerId: playerId.value, v: ver },
      responseType: 'blob',
    })
    // 期间对局已前进 / 身份已切换：丢弃过期结果
    if (ver !== audioVersion.value) return
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl)
    audioObjectUrl = URL.createObjectURL(res.data)
    audioSrc.value = audioObjectUrl
  } catch (_) {
    if (view.value) showToast('音频加载失败，请刷新重试', 'error')
  }
}

const finished = computed(() => view.value && view.value.status !== 'playing')
/** 解锁档位（秒）：由服务端按实际音频时长算好下发，前端不再自行推算 */
const clips = computed(() => view.value?.clipSeconds || [1, 2, 4, 7, 11, 16])
const maxSeconds = computed(() => clips.value[clips.value.length - 1])
const currentIdx = computed(() => Math.min(view.value?.guesses.length || 0, clips.value.length - 1))
const unlockedSeconds = computed(() => {
  if (!view.value) return clips.value[0]
  if (finished.value) return maxSeconds.value
  return clips.value[currentIdx.value]
})
const nextSkipGain = computed(() => {
  const c = clips.value
  const i = view.value?.guesses.length || 0
  return i + 1 < c.length ? +(c[i + 1] - c[i]).toFixed(1) : 0
})

/** 档位条：每段宽度按秒数占比，指针位置与播放进度线性对应 */
const segs = computed(() =>
  clips.value.map((s, i) => ({
    s,
    w: s - (i ? clips.value[i - 1] : 0),
    open: s <= unlockedSeconds.value + 0.01,
    now: !finished.value && i === currentIdx.value,
  }))
)
const needle = computed(() => Math.min(100, (playhead.value / maxSeconds.value) * 100))
const fmtS = (s) => `${Number.isInteger(s) ? s : s.toFixed(1)}s`

const playLabel = computed(() => {
  if (!audioReady.value) return '音频加载中…'
  if (playing.value) return '停止'
  if (finished.value) return `再听一遍（完整 ${fmtS(maxSeconds.value).replace('s', ' 秒')}）`
  return `播放 ${fmtS(unlockedSeconds.value).replace('s', ' 秒')}片段`
})

const guessedIds = computed(() => new Set((view.value?.guesses || []).map(g => g.songId).filter(Boolean)))
const suggestions = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = candidates.value.filter(c => !guessedIds.value.has(c.id))
  if (!q) return list.slice(0, 8)
  return list.filter(c => c.title.toLowerCase().includes(q)).slice(0, 8)
})

const winRate = computed(() => {
  const s = view.value?.streak
  return s && s.played ? Math.round((s.wins / s.played) * 100) : 0
})

const distRows = computed(() => {
  const st = view.value?.stats
  if (!st) return []
  const counts = [...st.distribution, st.lost]
  const max = Math.max(1, ...counts)
  const myIdx = view.value.status === 'won' ? view.value.guesses.length - 1 : counts.length - 1
  return counts.map((count, i) => ({
    label: i < st.distribution.length ? String(i + 1) : '没猜中',
    count,
    width: `${Math.max(4, (count / max) * 100)}%`,
    me: i === myIdx,
  }))
})

// ---------- 近 7 天 ----------
const dayClass = (d) => {
  const isToday = d.date === view.value.date
  const r = isToday && !finished.value ? null : d.r
  return {
    'is-today': isToday,
    'is-win': r && r.startsWith('w'),
    'is-lose': r === 'l',
  }
}
const dayMark = (d) => {
  const isToday = d.date === view.value.date
  const r = isToday && !finished.value ? null : d.r
  if (!r) return isToday ? '•' : ''
  return r === 'l' ? '✗' : '✓'
}
const dayTitle = (d) => {
  const r = d.date === view.value.date && !finished.value ? null : d.r
  const state = !r ? '未参与' : r === 'l' ? '未猜中' : `${r.slice(1)} 次猜中`
  return `第 ${d.no} 期 · ${state}`
}

// ---------- 搜索 ----------
const onInput = () => {
  dropdownOpen.value = true
  activeIdx.value = 0
  if (selected.value && query.value !== selected.value.title) selected.value = null
}
const pick = (s) => {
  selected.value = s
  query.value = s.title
  dropdownOpen.value = false
}
const moveActive = (d) => {
  dropdownOpen.value = true
  const n = suggestions.value.length
  if (n) activeIdx.value = (activeIdx.value + d + n) % n
}
const pickActive = () => {
  if (selected.value && query.value === selected.value.title) return submit(selected.value.id)
  const s = suggestions.value[activeIdx.value]
  if (s) pick(s)
}

// ---------- 音频 ----------
const onMeta = () => {
  audioReady.value = true
}

const stopAudio = () => {
  cancelAnimationFrame(rafId)
  const a = audioEl.value
  if (a) a.pause()
  playing.value = false
}

const tick = () => {
  const a = audioEl.value
  if (!a) return
  playhead.value = a.currentTime
  if (a.currentTime >= unlockedSeconds.value || a.ended) {
    stopAudio()
    playhead.value = Math.min(a.currentTime, unlockedSeconds.value)
    return
  }
  rafId = requestAnimationFrame(tick)
}

const togglePlay = async () => {
  const a = audioEl.value
  if (!a) return
  if (playing.value) return stopAudio()
  try {
    a.currentTime = 0
    playhead.value = 0
    await a.play()
    playing.value = true
    rafId = requestAnimationFrame(tick)
  } catch (e) {
    showToast('播放失败，请再点一次', 'warning')
  }
}

const onAudioError = () => {
  // 空 src 初始化阶段也会触发 error，仅在已有音频地址时提示
  if (view.value && audioSrc.value) showToast('音频播放失败，请刷新重试', 'error')
}

// ---------- 数据 ----------
const syncStreak = () => {
  if (view.value) cacheStreak(view.value.streak.current)
}

const load = async () => {
  if (!playerId.value) {
    error.value = '无法识别设备，请关闭无痕模式后重试'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const [today, cands] = await Promise.all([
      apiClient.get('/daily-guess/today', { params: { playerId: playerId.value } }),
      apiClient.get('/daily-guess/candidates'),
    ])
    if ((today.data.code === 401 || today.data.code === 403) && playerId.value.startsWith('u_')) {
      // 登录态已失效（token 过期 / 与账号不符）：退出登录，立刻以游客身份重新加载。
      // 这里自己完成身份回退，而不是依赖 userId 的 watch——否则 load() 在此直接返回，页面会卡在错误状态。
      userStore.logout()
      showToast('登录已过期，已切换为游客身份', 'warning')
      const guest = getPlayerId()
      if (guest && guest !== playerId.value) {
        playerId.value = guest
        rank.value = null
        tab.value = 'stats'
        return load()
      }
    }
    if (today.data.code !== 200) throw new Error(today.data.message || '加载失败')
    view.value = today.data.data
    candidates.value = cands.data.data || []
    syncStreak()
    if (finished.value) markDailyGuessDone(view.value.date)
    loadAudio()
  } catch (e) {
    error.value = e.message || '网络错误'
  } finally {
    loading.value = false
  }
}

const submit = async (songId) => {
  if (submitting.value || finished.value) return
  stopAudio()
  submitting.value = true
  const isFirst = view.value.guesses.length === 0
  try {
    const res = await apiClient.post('/daily-guess/guess', { playerId: playerId.value, songId })
    if (res.data.code !== 200) throw new Error(res.data.message || '提交失败')
    view.value = res.data.data
    syncStreak()
    loadAudio()
    if (isFirst) trackEvent(EVENTS.DAILY_GUESS_START)
    query.value = ''
    selected.value = null
    activeIdx.value = 0

    const last = view.value.guesses[view.value.guesses.length - 1]
    if (navigator.vibrate) navigator.vibrate(last?.correct ? [40, 40, 40] : [80])
    if (finished.value) {
      markDailyGuessDone(view.value.date)
      trackEvent(EVENTS.DAILY_GUESS_COMPLETE, { attempts: view.value.guesses.length, won: view.value.status === 'won' })
      if (view.value.status === 'won') trackEvent(EVENTS.DAILY_GUESS_WIN, { attempts: view.value.guesses.length })
      loadRank()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (last && !last.correct && !last.skip) {
      showToast(`不对哦，已解锁到 ${fmtS(unlockedSeconds.value)}，再听听看`, 'info', 1800)
    }
  } catch (e) {
    showToast(e.message || '提交失败', 'error')
  } finally {
    submitting.value = false
  }
}

// ---------- 排行榜 / 昵称 ----------
const loadRank = async () => {
  rankLoading.value = true
  try {
    const res = await apiClient.get('/daily-guess/leaderboard', { params: { playerId: playerId.value } })
    rank.value = res.data.code === 200 ? res.data.data : null
  } catch (_) {
    rank.value = null
  } finally {
    rankLoading.value = false
  }
}

// 答题中的榜单卡片：默认今日榜，切换时才上报埋点，避免每次进页面都算一次"查看榜单"
const preTab = ref('today')
const openPreRank = (which) => {
  if (preTab.value === which) return
  preTab.value = which
  trackEvent(EVENTS.DAILY_GUESS_RANK_VIEW, { board: which, stage: 'pre' })
}

/** 连胜榜下方的激励文案：告诉玩家"离榜首还差几天 / 断了会失去什么" */
const streakHint = computed(() => {
  const mine = view.value?.streak?.current || 0
  const top = rank.value?.streak?.[0]?.days || 0
  if (mine > 0 && top > mine) return `你当前连胜 ${mine} 天，距榜首还差 ${top - mine} 天 · 今天猜中就 +1`
  if (mine > 0 && top === mine) return `你正与榜首并列 ${mine} 天 · 今天猜中就能超过他`
  if (mine > 0) return `你当前连胜 ${mine} 天 · 今天猜中就 +1，别让它断了`
  if (top > 0) return `榜首已连胜 ${top} 天 · 今天猜中，从 1 天开始追`
  return '连续每天猜中累计，中断一天则清零'
})

const openRank = async (which) => {
  const first = tab.value === 'stats'
  tab.value = which
  if (first || !rank.value) trackEvent(EVENTS.DAILY_GUESS_RANK_VIEW, { board: which })
  await loadRank()
}

const startRename = () => {
  nameInput.value = rank.value?.myName?.startsWith('游客') ? '' : rank.value?.myName || ''
  editingName.value = true
}

const saveName = async () => {
  const name = nameInput.value.trim()
  if (!name) return showToast('请输入昵称', 'warning')
  nameSaving.value = true
  try {
    const res = await apiClient.post('/daily-guess/nickname', { playerId: playerId.value, name })
    if (res.data.code !== 200) throw new Error(res.data.message || '保存失败')
    editingName.value = false
    trackEvent(EVENTS.DAILY_GUESS_SET_NAME)
    await loadRank()
  } catch (e) {
    showToast(e.message || '保存失败', 'error')
  } finally {
    nameSaving.value = false
  }
}

const share = async () => {
  const url = `${location.origin}/games/daily?from=share`
  const r = await shareText(buildShareText(view.value, url))
  if (r === 'shared' || r === 'copied') trackEvent(EVENTS.SHARE_DAILY_GUESS, { method: r })
  if (r === 'copied') {
    shareLabel.value = '已复制，去粘贴给朋友吧'
    setTimeout(() => { shareLabel.value = '分享成绩' }, 2500)
  } else if (r === 'failed') {
    showToast('复制失败，请截图分享', 'warning')
  }
}

const closeHelp = () => {
  showHelp.value = false
  try { localStorage.setItem(HELP_SEEN_KEY, '1') } catch (_) {}
}

// ---------- 倒计时 ----------
const countdown = ref('')
let cdTimer = null
const updateCountdown = () => {
  const now = new Date()
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  const s = Math.max(0, Math.floor((next - now) / 1000))
  const pad = (n) => String(n).padStart(2, '0')
  countdown.value = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
  if (s === 0 && finished.value) load()
}

// 登录或退出后切换玩家身份。
// 登录时：先认领本设备的游客战绩，再用账号身份加载今天的对局（否则会先拿到一个空对局，今天看起来可以重玩）
const claiming = ref(false)
const claimNotice = ref('')

const switchIdentity = async () => {
  const next = getPlayerId()
  if (next === playerId.value) return
  stopAudio()
  loading.value = true
  try {
    if (next && next.startsWith('u_')) {
      claiming.value = true
      const r = await claimGuestRecords(userStore.userId)
      claiming.value = false
      if (r.claimed) claimNotice.value = claimMessage(r.data)
    }
  } finally {
    claiming.value = false
  }
  playerId.value = next
  rank.value = null
  tab.value = 'stats'
  await load()
  loadRank()
}

const claimMessage = (d) => {
  if (!d) return ''
  const parts = []
  if (d.added > 0) parts.push(`已同步 ${d.added} 天游客战绩`)
  if (d.curStreak > 0) parts.push(`当前连胜 ${d.curStreak} 天`)
  if (d.today === 'kept_account' || d.today === 'kept_account_partial') parts.push('今天的挑战以账号记录为准')
  return parts.join('，')
}

watch(() => userStore.userId, () => { switchIdentity() })

onMounted(() => {
  // 首次进入不再弹说明：首屏已用一句话 + 三步讲清；右上角 ? 仍可随时查看
  ;(async () => {
    if (playerId.value && playerId.value.startsWith('u_')) {
      const r = await claimGuestRecords(userStore.userId)
      if (r.claimed) claimNotice.value = claimMessage(r.data)
    }
    await load()
    loadRank()
  })()
  updateCountdown()
  cdTimer = setInterval(updateCountdown, 1000)
})
onUnmounted(() => {
  stopAudio()
  if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl)
  clearInterval(cdTimer)
})
</script>

<style scoped>
/* 统一色板：只用 gx 主色（紫）；绿/红仅用于「对/错」语义 */
.daily-guess { --dg-w: 520px; gap: 10px; }
.daily-guess > * { width: 100%; max-width: var(--dg-w); }
.daily-guess > .gx-header { max-width: var(--gx-max-w); }
.dg-help-btn { font-size: 1rem; font-weight: 800; }

.dg-state { text-align: center; padding: 48px 16px; color: var(--text-secondary); }
.dg-spinner {
  width: 36px; height: 36px; margin: 0 auto 12px; border-radius: 50%;
  border: 3px solid var(--gx-accent-soft); border-top-color: var(--gx-accent);
  animation: dg-spin 0.8s linear infinite;
}
@keyframes dg-spin { to { transform: rotate(360deg); } }

.dg-card {
  padding: 16px; border-radius: 20px;
  background: var(--gx-panel); border: 1px solid var(--gx-stroke-strong);
}

/* ============ 主卡 ============ */
.dg-main { display: flex; flex-direction: column; gap: 12px; padding: 18px 16px 16px; }
.dg-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.dg-meta { font-size: 0.76rem; color: rgba(255, 255, 255, 0.5); }
.dg-streak {
  font-size: 0.74rem; color: rgba(255, 255, 255, 0.5); padding: 3px 10px; border-radius: 99px;
  border: 1px solid var(--gx-stroke-strong); white-space: nowrap;
}
.dg-streak b { color: #fff; font-variant-numeric: tabular-nums; }
.dg-streak.is-on { color: var(--gx-accent); border-color: var(--gx-accent-line); background: var(--gx-accent-soft); }
.dg-streak.is-on b { color: var(--gx-accent); }

.dg-h1 { margin: 2px 0 0; font-size: 1.7rem; line-height: 1.2; font-weight: 800; letter-spacing: -0.01em; color: #fff; word-break: break-all; }
.dg-lead { margin: 0; font-size: 0.84rem; line-height: 1.6; color: rgba(255, 255, 255, 0.6); }

.dg-cta {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; min-height: 50px; border: none; border-radius: 14px; cursor: pointer;
  font-size: 0.98rem; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, var(--gx-accent), var(--gx-accent-2));
  box-shadow: 0 8px 22px var(--gx-accent-glow);
  transition: transform 0.15s, opacity 0.2s;
}
.dg-cta:active:not(:disabled) { transform: scale(0.985); }
.dg-cta:disabled { opacity: 0.5; cursor: progress; }
.dg-cta.is-playing { background: var(--gx-accent-soft); color: var(--gx-accent); box-shadow: inset 0 0 0 1.5px var(--gx-accent-line); }

.dg-track { display: flex; flex-direction: column; gap: 6px; }
.dg-segs { position: relative; display: flex; gap: 3px; height: 6px; }
.dg-seg { flex-basis: 0; min-width: 0; border-radius: 99px; background: rgba(255, 255, 255, 0.1); transition: background 0.3s; }
.dg-seg.is-open { background: var(--gx-accent-line); }
.dg-seg.is-now { background: var(--gx-accent); }
.dg-needle { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; border-radius: 2px; background: #fff; }
.dg-seg-labels { display: flex; gap: 3px; }
.dg-seg-labels span { flex-basis: 0; min-width: 0; text-align: right; font-size: 0.64rem; line-height: 1; color: rgba(255, 255, 255, 0.35); font-variant-numeric: tabular-nums; }
.dg-seg-labels span.is-now { color: var(--gx-accent); font-weight: 700; }

.dg-link { align-self: flex-start; font-size: 0.82rem; font-weight: 600; color: var(--gx-accent); text-decoration: none; }

/* ============ 未登录提示 ============ */
.dg-login-tip {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 12px 10px 14px; border-radius: 14px;
  background: var(--gx-accent-soft); border: 1px solid var(--gx-accent-line);
}
.dg-login-text { font-size: 0.8rem; line-height: 1.5; color: rgba(255, 255, 255, 0.8); }
.dg-login-text b { color: #fff; }
.dg-login-btn {
  flex: 0 0 auto; min-height: 34px; padding: 0 16px; border-radius: 10px; border: none; cursor: pointer;
  font-size: 0.82rem; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, var(--gx-accent), var(--gx-accent-2));
}
.dg-login-btn:active { transform: scale(0.96); }

.dg-claim-tip {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px 10px 14px; border-radius: 14px; font-size: 0.8rem; line-height: 1.5;
  color: rgba(255, 255, 255, 0.9); background: var(--gx-accent-soft); border: 1px solid var(--gx-accent-line);
}
.dg-claim-close {
  flex: 0 0 auto; width: 26px; height: 26px; border: none; border-radius: 50%; cursor: pointer;
  font-size: 1.1rem; line-height: 1; color: rgba(255, 255, 255, 0.7); background: transparent;
}

/* ============ 输入 ============ */
.dg-input-card { position: relative; z-index: 2; display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.dg-search { position: relative; }
.dg-input { height: 48px; font-size: 0.96rem; text-align: left; border-radius: 12px; }
.dg-suggest {
  position: absolute; left: 0; right: 0; bottom: calc(100% + 6px); margin: 0; padding: 6px; list-style: none;
  max-height: 240px; overflow-y: auto; border-radius: 14px;
  background: var(--gx-panel-strong); border: 1px solid var(--gx-stroke-strong); box-shadow: 0 -16px 40px rgba(0, 0, 0, 0.45);
}
.dg-suggest li { padding: 12px; border-radius: 10px; font-size: 0.92rem; cursor: pointer; }
.dg-suggest li:hover, .dg-suggest li.is-active { background: var(--gx-accent-soft); color: #fff; }

.dg-actions { display: grid; grid-template-columns: 1.3fr 1fr; gap: 8px; }
.dg-btn {
  min-height: 46px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: transform 0.15s, opacity 0.2s;
}
.dg-btn:active:not(:disabled) { transform: scale(0.97); }
.dg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.dg-btn-ghost { color: rgba(255, 255, 255, 0.8); background: transparent; border: 1px solid var(--gx-stroke-strong); }
.dg-btn-solid { color: #fff; border: none; background: linear-gradient(135deg, var(--gx-accent), var(--gx-accent-2)); }

/* ============ 猜测记录 ============ */
.dg-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.dg-row {
  display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; gap: 10px;
  min-height: 42px; padding: 0 12px; border-radius: 12px; font-size: 0.88rem;
  border: 1px solid var(--gx-stroke); background: var(--gx-glass); animation: dg-in 0.3s ease both;
}
.dg-row-idx { font-size: 0.72rem; color: rgba(255, 255, 255, 0.35); text-align: center; font-variant-numeric: tabular-nums; }
.dg-row-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dg-row-mark { font-size: 0.74rem; font-weight: 700; }
.dg-row.is-skip { color: rgba(255, 255, 255, 0.45); }
.dg-row.is-wrong { color: var(--gx-danger); border-color: rgba(248, 113, 113, 0.28); }
.dg-row.is-correct { color: var(--gx-success); border-color: rgba(52, 211, 153, 0.4); background: rgba(52, 211, 153, 0.08); }
@keyframes dg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* ============ 答题中的榜单卡片 ============ */
.dg-rankcard { display: flex; flex-direction: column; gap: 10px; padding: 14px 14px 12px; }
.dg-rc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.dg-rc-head h3 { margin: 0; font-size: 0.92rem; font-weight: 800; }
.dg-rc-tabs {
  display: inline-flex; padding: 3px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.05); border: 1px solid var(--gx-stroke);
}
.dg-rc-tabs button {
  border: none; background: transparent; cursor: pointer; padding: 5px 12px; border-radius: 999px;
  font-size: 0.74rem; font-weight: 700; color: rgba(255, 255, 255, 0.55);
}
.dg-rc-tabs button.is-active { color: #fff; background: var(--gx-accent-soft); box-shadow: inset 0 0 0 1px var(--gx-accent-line); }
.dg-rc-hint { margin: 0; text-align: center; font-size: 0.74rem; line-height: 1.6; color: rgba(255, 255, 255, 0.5); }
.dg-rc-hint b { color: var(--gx-accent); }
.dg-rankcard .dg-rank-empty b { color: var(--gx-accent); }

/* ============ 结果 ============ */
.dg-result { display: flex; flex-direction: column; gap: 12px; }
.dg-tabs { margin: 2px auto 0; }
.dg-pane { display: flex; flex-direction: column; gap: 18px; }
.dg-desc { margin: 0; padding: 0 6px; text-align: center; font-size: 0.78rem; line-height: 1.7; color: rgba(255, 255, 255, 0.5); }

/* 战绩：一行大数字，无方框，仅用细分隔线 */
.dg-nums { display: grid; grid-template-columns: repeat(4, 1fr); }
.dg-nums > div { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 2px 0; }
.dg-nums > div + div { border-left: 1px solid var(--gx-stroke); }
.dg-nums b { font-size: 1.7rem; line-height: 1; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; }
.dg-nums b small { font-size: 0.8rem; font-weight: 700; margin-left: 1px; color: rgba(255, 255, 255, 0.6); }
.dg-nums span { font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); }

.dg-block h4 { margin: 0 0 10px; font-size: 0.76rem; font-weight: 600; color: rgba(255, 255, 255, 0.5); }

.dg-week { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.dg-day { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.dg-day i {
  width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
  font-style: normal; font-size: 0.72rem; font-weight: 800; color: rgba(255, 255, 255, 0.3);
  border: 1px solid var(--gx-stroke-strong);
}
.dg-day span { font-size: 0.62rem; color: rgba(255, 255, 255, 0.35); font-variant-numeric: tabular-nums; }
.dg-day.is-win i { color: #fff; background: var(--gx-accent); border-color: var(--gx-accent); }
.dg-day.is-lose i { color: rgba(255, 255, 255, 0.45); border-style: dashed; }
.dg-day.is-today span { color: #fff; font-weight: 700; }
.dg-day.is-today i { border-color: var(--gx-accent); }

.dg-dist-row { display: grid; grid-template-columns: 40px minmax(0, 1fr) 24px; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 0.74rem; font-variant-numeric: tabular-nums; }
.dg-dist-label { color: rgba(255, 255, 255, 0.5); text-align: right; font-size: 0.68rem; }
.dg-dist-bar { height: 8px; border-radius: 99px; background: rgba(255, 255, 255, 0.06); overflow: hidden; }
.dg-dist-bar i { display: block; height: 100%; border-radius: 99px; background: var(--gx-accent-line); transition: width 0.6s ease; }
.dg-dist-row.is-me .dg-dist-bar i { background: var(--gx-accent); }
.dg-dist-num { text-align: right; color: rgba(255, 255, 255, 0.6); }

/* 排行榜 */
.dg-me-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 34px; font-size: 0.8rem; }
.dg-me-name { color: rgba(255, 255, 255, 0.55); }
.dg-me-name b { color: #fff; }
.dg-me-tip { font-size: 0.7rem; color: rgba(255, 255, 255, 0.35); }
.dg-link-btn { background: none; border: none; color: var(--gx-accent); font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 6px 4px; }
.dg-rename { display: flex; gap: 6px; width: 100%; align-items: center; }
.dg-rename-input { flex: 1; min-width: 0; height: 38px; padding: 0 12px !important; font-size: 0.85rem !important; text-align: left; }
.dg-mini { min-height: 38px !important; padding: 0 12px !important; font-size: 0.78rem !important; }

.dg-board { list-style: none; margin: 0; padding: 0; }
.dg-board-row {
  display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 8px;
  padding: 11px 8px; font-size: 0.86rem; border-bottom: 1px solid var(--gx-stroke); animation: dg-in 0.35s ease both;
}
.dg-board-row:last-child { border-bottom: none; }
.dg-board-row:nth-child(2) { animation-delay: 0.04s; }
.dg-board-row:nth-child(3) { animation-delay: 0.08s; }
.dg-board-row:nth-child(n+4) { animation-delay: 0.12s; }
.dg-board-row.is-me { background: var(--gx-accent-soft); border-radius: 12px; border-bottom-color: transparent; }
.dg-board-rank { text-align: center; font-weight: 700; color: rgba(255, 255, 255, 0.4); font-variant-numeric: tabular-nums; }
.dg-board-row.is-top .dg-board-rank { color: var(--gx-accent); font-size: 1.05rem; font-weight: 800; }
.dg-board-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dg-board-name em {
  margin-left: 6px; padding: 1px 6px; border-radius: 99px; font-style: normal; font-size: 0.62rem; font-weight: 700;
  color: #fff; background: var(--gx-accent);
}
.dg-board-val { color: rgba(255, 255, 255, 0.5); font-size: 0.76rem; white-space: nowrap; }
.dg-board-val b { color: #fff; font-size: 0.98rem; font-variant-numeric: tabular-nums; margin-right: 2px; }
.dg-board-me { margin: 0; text-align: center; font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); }
.dg-board-me b { color: var(--gx-accent); }
.dg-board-note { margin: 0; text-align: center; font-size: 0.68rem; color: rgba(255, 255, 255, 0.3); }
.dg-rank-empty { text-align: center; padding: 20px 8px; font-size: 0.82rem; color: rgba(255, 255, 255, 0.45); display: flex; flex-direction: column; gap: 10px; align-items: center; }

.dg-next { margin: 0; text-align: center; font-size: 0.78rem; color: rgba(255, 255, 255, 0.45); }
.dg-next strong { color: #fff; font-variant-numeric: tabular-nums; }

/* ============ 帮助 ============ */
.dg-help { text-align: left; }
.dg-help h3 { margin: 0 0 10px; text-align: center; }
.dg-help ul { margin: 0 0 14px; padding-left: 18px; font-size: 0.88rem; line-height: 1.85; color: rgba(255, 255, 255, 0.8); }
.dg-help b { color: #fff; }

@media (prefers-reduced-motion: reduce) { .dg-row, .dg-board-row { animation: none; } }
@media (max-width: 380px) {
  .dg-h1 { font-size: 1.5rem; }
  .dg-nums b { font-size: 1.4rem; }
}
</style>
