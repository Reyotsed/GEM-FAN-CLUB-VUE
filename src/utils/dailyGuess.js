import { storage } from './storage'
import { getFingerprint } from './fingerprint'
import apiClient from './api'

const DONE_KEY = 'gem_daily_guess_done'

/** 本地日期 yyyy-MM-dd（与服务端 Asia/Shanghai 口径一致） */
export function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 玩家 ID：登录用户用 userId，游客用指纹（同一设备稳定） */
export function getPlayerId() {
  const uid = storage.getUserId()
  if (uid) return `u_${uid}`
  try {
    return `fp_${getFingerprint()}`
  } catch (_) {
    return null
  }
}

/** 本设备的游客玩家 ID（不论当前是否登录，都是这台设备的游客身份） */
export function getGuestId() {
  try {
    return `fp_${getFingerprint()}`
  } catch (_) {
    return null
  }
}

const CLAIM_DONE_PREFIX = 'gem_daily_guess_claimed:'

/**
 * 登录后认领本设备的游客战绩（一个账号 + 一个设备只需成功一次）。
 * 返回 { ok, claimed, data }：
 *  - ok=false 表示网络/服务异常，调用方可稍后重试（不会打本地「已完成」标记）
 *  - claimed=true 表示本次真的合并了数据
 * 幂等：服务端同一游客只会被认领一次，本地也会按账号记一份，避免每次进页面都请求。
 */
export async function claimGuestRecords(userId) {
  const guestId = getGuestId()
  if (!userId || !guestId) return { ok: true, claimed: false }
  const localKey = CLAIM_DONE_PREFIX + userId
  try {
    if (localStorage.getItem(localKey) === guestId) return { ok: true, claimed: false }
  } catch (_) {}

  try {
    const res = await apiClient.post('/daily-guess/claim', { guestId })
    if (res.data.code !== 200) return { ok: false, claimed: false }
    const data = res.data.data || {}
    // 这些结果都意味着「不需要再认领」：已合并 / 已被本账号领过 / 游客本就没数据
    const settled = data.claimed || ['already', 'empty'].includes(data.reason)
    // taken：被别的账号领走，本设备也无需再试
    if (settled || data.reason === 'taken') {
      try { localStorage.setItem(localKey, guestId) } catch (_) {}
    }
    return { ok: true, claimed: !!data.claimed, data }
  } catch (_) {
    return { ok: false, claimed: false }
  }
}

export function markDailyGuessDone(date) {
  try { localStorage.setItem(DONE_KEY, date) } catch (_) {}
}

export function isDailyGuessDoneToday() {
  try { return localStorage.getItem(DONE_KEY) === todayStr() } catch (_) { return false }
}

const STREAK_KEY = 'gem_daily_guess_streak'

/** 缓存最近一次拿到的连胜，供首页等不请求接口的地方展示 */
export function cacheStreak(current) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify({ current, date: todayStr() })) } catch (_) {}
}

/** 读取缓存连胜：仅当缓存日期是今天或昨天才认为仍有效 */
export function getCachedStreak() {
  try {
    const v = JSON.parse(localStorage.getItem(STREAK_KEY) || 'null')
    if (!v || !v.current) return 0
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const pad = (n) => String(n).padStart(2, '0')
    const yesterday = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    return v.date === todayStr() || v.date === yesterday ? v.current : 0
  } catch (_) { return 0 }
}

/** 生成 Wordle 风格分享文案 */
export function buildShareText(view, url) {
  const { no, guesses = [], status, maxAttempts } = view
  const blocks = guesses.map(g => (g.correct ? '🟩' : g.skip ? '⬛' : '🟥'))
  while (blocks.length < maxAttempts) blocks.push('⬜')
  const score = status === 'won' ? `${guesses.length}/${maxAttempts}` : `X/${maxAttempts}`
  const streak = view.streak?.current > 1 ? `  🔥连胜 ${view.streak.current} 天` : ''
  return `🎧 G.E.M. 每日猜歌 #${no}  ${score}${streak}\n🔊${blocks.join('')}\n${url}`
}

/** 分享：优先系统分享面板，不支持则复制到剪贴板 */
export async function shareText(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch (_) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok ? 'copied' : 'failed'
  }
}
