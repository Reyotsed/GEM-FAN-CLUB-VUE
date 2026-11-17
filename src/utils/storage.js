/**
 * Storage SSOT - 统一的 localStorage 访问层
 * 所有业务代码必须通过这里读写 localStorage，禁止直接调用
 */

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_ID: 'userId',
  NICK_NAME: 'nickName',
  AVATAR: 'avatar',
  FINGERPRINT: 'gem_fan_fp',
  FAN_MARKED: 'gem_fan_marked',
};

export const storage = {
  // ---------- Auth ----------
  getToken() {
    const t = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return t && t !== 'null' && t !== 'undefined' ? t : null;
  },
  setToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },

  /** 获取 userId，自动去除历史残留的 JSON 引号 */
  getUserId() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ID) || '';
    return raw.replace(/"/g, '') || null;
  },
  setUserId(userId) {
    localStorage.setItem(STORAGE_KEYS.USER_ID, JSON.stringify(userId));
  },

  getNickName() {
    return localStorage.getItem(STORAGE_KEYS.NICK_NAME) || null;
  },
  setNickName(name) {
    localStorage.setItem(STORAGE_KEYS.NICK_NAME, name);
  },

  getAvatar() {
    return localStorage.getItem(STORAGE_KEYS.AVATAR) || null;
  },
  setAvatar(avatar) {
    localStorage.setItem(STORAGE_KEYS.AVATAR, avatar);
  },

  /** 一次清除所有鉴权相关字段 */
  clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.NICK_NAME);
    localStorage.removeItem(STORAGE_KEYS.AVATAR);
  },

  // ---------- Fingerprint ----------
  getFingerprint() {
    return localStorage.getItem(STORAGE_KEYS.FINGERPRINT);
  },
  setFingerprint(fp) {
    localStorage.setItem(STORAGE_KEYS.FINGERPRINT, fp);
  },

  isFanMarked() {
    return localStorage.getItem(STORAGE_KEYS.FAN_MARKED) === '1';
  },
  setFanMarked() {
    localStorage.setItem(STORAGE_KEYS.FAN_MARKED, '1');
  },
};
