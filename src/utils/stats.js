import apiClient from './api'
import { storage } from './storage'
import { getFingerprint } from './fingerprint'

/**
 * 路由名称到统计 key 的映射
 */
const PAGE_KEY_MAP = {
  'home': 'home',
  'song': 'song',
  'quote': 'quote',
  'quoteInfo': 'quote_detail',
  'shop': 'shop',
  'AI': 'ai',
  'info': 'info',
  'user': 'user',
  'games': 'games',
  'guess-song': 'guess_song',
  'lyrics-chain': 'lyrics_chain',
  'ticket-rush': 'ticket_rush',
  'hummingbird-strike': 'hummingbird_strike',
  'quiz': 'quiz',
  'story': 'story',
  'fan-map': 'fan_map',
  'daily-guess': 'daily_guess',
}

/** 路由名 -> pageKey，未映射返回 null */
export function toPageKey(routeName) {
  return PAGE_KEY_MAP[routeName] || null
}

/**
 * 获取当前用户ID；未登录时回退到 fingerprint，确保游客 UV 也能统计
 */
export function getUserId() {
  const uid = storage.getUserId()
  if (uid) return uid
  try {
    return `fp_${getFingerprint()}`
  } catch (_) {
    return null
  }
}

// 简易内存级 PV 去重缓存：同一用户同一页面 5 分钟内只上报一次
const _pvCache = new Map()
const PV_DEDUP_MS = 5 * 60 * 1000

/**
 * 上报页面访问（PV）
 * 由路由守卫自动调用，无需手动埋点
 * @param {string} routeName - Vue Router 的 route.name
 */
export function trackPageView(routeName) {
  const pageKey = PAGE_KEY_MAP[routeName]
  if (!pageKey) return

  const uid = getUserId()
  const cacheKey = `${pageKey}:${uid || 'anon'}`
  const now = Date.now()
  if ((now - (_pvCache.get(cacheKey) || 0)) < PV_DEDUP_MS) return
  _pvCache.set(cacheKey, now)

  // fire-and-forget，不阻塞页面
  apiClient.post('/stats/track', {
    type: 'pv',
    key: pageKey,
    userId: uid
  }).catch(() => {
    // 统计失败不影响用户体验，静默处理
  })
}

/**
 * 上报用户行为事件
 * 需要在业务代码中手动调用
 * @param {string} eventKey - 事件标识，如 'game_start:guess_song'
 * @param {object} [extra] - 可选的扩展维度（耗时、成本等）
 */
export function trackEvent(eventKey, extra) {
  apiClient.post('/stats/track', {
    type: 'event',
    key: eventKey,
    userId: getUserId(),
    extra: extra || null,
  }).catch(() => {
    // 统计失败不影响用户体验，静默处理
  })
}

/**
 * 导航级自动埋点（由 router.afterEach 调用）：
 * - session_start + landing:<page>：会话首个页面（30 分钟无活动视为新会话）
 * - share_landing:<page>：通过分享链接（?from=share）进入
 * - home_to:<page>：从首页跳到其他模块（衡量首页分发效率）
 */
const SESSION_KEY = 'gem_stats_session_at'
const SESSION_IDLE_MS = 30 * 60 * 1000

export function trackNavigation(to, from) {
  const toKey = toPageKey(to?.name)
  if (!toKey) return

  try {
    const now = Date.now()
    const last = Number(sessionStorage.getItem(SESSION_KEY) || 0)
    if (!last || now - last > SESSION_IDLE_MS) {
      trackEvent(EVENTS.SESSION_START)
      trackEvent(`landing:${toKey}`)
    }
    sessionStorage.setItem(SESSION_KEY, String(now))
  } catch (_) { /* 隐私模式下 sessionStorage 不可用 */ }

  if (to?.query?.from === 'share' && from?.name == null) {
    trackEvent(`share_landing:${toKey}`)
  }

  const fromKey = toPageKey(from?.name)
  if (fromKey === 'home' && toKey !== 'home') {
    trackEvent(`home_to:${toKey}`)
  }
}

/**
 * 预定义的事件常量，方便使用时避免拼写错误
 */
export const EVENTS = {
  // 游戏相关
  GAME_START_GUESS_SONG: 'game_start:guess_song',
  GAME_COMPLETE_GUESS_SONG: 'game_complete:guess_song',
  GAME_START_LYRICS_CHAIN: 'game_start:lyrics_chain',
  GAME_COMPLETE_LYRICS_CHAIN: 'game_complete:lyrics_chain',
  GAME_START_TICKET_RUSH: 'game_start:ticket_rush',
  GAME_COMPLETE_TICKET_RUSH: 'game_complete:ticket_rush',
  GAME_START_HUMMINGBIRD_STRIKE: 'game_start:hummingbird_strike',
  GAME_COMPLETE_HUMMINGBIRD_STRIKE: 'game_complete:hummingbird_strike',

  // AI 对话
  AI_CHAT: 'ai_chat',

  // 歌曲
  SONG_PLAY: 'song_play',

  // 语录
  QUOTE_LIKE: 'quote_like',
  QUOTE_COMMENT: 'quote_comment',

  // 账号
  LOGIN: 'login',
  REGISTER: 'register',

  // 新增
  FAN_MARK_CREATE: 'fan_mark:create',
  STORY_VIEW: 'story:view',
  UPLOAD_IMAGE: 'upload:image',
  SHOP_VIEW_ITEM: 'shop:view_item',
  CONCERT_VIEW_DETAIL: 'concert:view_detail',
  ERROR_FRONTEND: 'error:frontend',
  PWA_OFFLINE_READY: 'pwa_offline_ready',

  // 会话
  SESSION_START: 'session_start',

  // 每日猜歌
  DAILY_GUESS_START: 'daily_guess:start',
  DAILY_GUESS_COMPLETE: 'daily_guess:complete',
  DAILY_GUESS_WIN: 'daily_guess:win',
  DAILY_GUESS_RANK_VIEW: 'daily_guess:rank_view',
  DAILY_GUESS_SET_NAME: 'daily_guess:set_name',
  SHARE_DAILY_GUESS: 'share:daily_guess',

  // 首页模块点击：home_click:<target>
  homeClick: (target) => `home_click:${target}`,
}
