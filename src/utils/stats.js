import apiClient from './api'

/**
 * 路由名称到统计 key 的映射
 */
const PAGE_KEY_MAP = {
  'home': 'home',
  'song': 'song',
  'quote': 'quote',
  'quoteInfo': 'quote_detail',
  'picture': 'picture',
  'shop': 'shop',
  'AI': 'ai',
  'info': 'info',
  'user': 'user',
  'games': 'games',
  'guess-song': 'guess_song',
  'lyrics-chain': 'lyrics_chain',
  'ticket-rush': 'ticket_rush',
  'quiz': 'quiz',
}

/**
 * 获取当前用户ID（不带引号）
 */
function getUserId() {
  return (localStorage.getItem('userId') || '').replace(/"/g, '') || null
}

/**
 * 上报页面访问（PV）
 * 由路由守卫自动调用，无需手动埋点
 * @param {string} routeName - Vue Router 的 route.name
 */
export function trackPageView(routeName) {
  const pageKey = PAGE_KEY_MAP[routeName]
  if (!pageKey) return

  // fire-and-forget，不阻塞页面
  apiClient.post('/stats/track', {
    type: 'pv',
    key: pageKey,
    userId: getUserId()
  }).catch(() => {
    // 统计失败不影响用户体验，静默处理
  })
}

/**
 * 上报用户行为事件
 * 需要在业务代码中手动调用
 * @param {string} eventKey - 事件标识，如 'game_start:guess_song'
 */
export function trackEvent(eventKey) {
  apiClient.post('/stats/track', {
    type: 'event',
    key: eventKey,
    userId: getUserId()
  }).catch(() => {
    // 统计失败不影响用户体验，静默处理
  })
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
}
