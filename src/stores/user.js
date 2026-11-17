// src/stores/user.js
import { defineStore } from 'pinia';
import apiClient from '@/utils/api';
import { storage } from '@/utils/storage';
import { logger } from '@/utils/logger';

export const useUserStore = defineStore('user', {
  state: () => ({
    // 乐观恢复：初始化时直接从 localStorage 读，避免刷新闪烁
    token: storage.getToken(),
    userId: storage.getUserId(),
    nickName: storage.getNickName(),
    avatar: storage.getAvatar(),
    isLoggedIn: !!storage.getToken(),
  }),
  actions: {
    setToken(token) {
      this.token = token;
      storage.setToken(token);
      this.isLoggedIn = true;
    },
    setUserId(userId) {
      this.userId = String(userId);
      storage.setUserId(userId);
    },
    setNickName(nickName) {
      this.nickName = nickName;
      storage.setNickName(nickName);
    },
    setAvatar(avatar) {
      this.avatar = avatar;
      storage.setAvatar(avatar);
    },
    logout() {
      this.token = null;
      this.userId = null;
      this.nickName = null;
      this.avatar = null;
      storage.clearAuth();
      this.isLoggedIn = false;
    },
    async autoLogin() {
      const token = storage.getToken();
      if (!token) {
        this.isLoggedIn = false;
        return;
      }
      try {
        const response = await apiClient.post('/account/autoLogin', {}, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (response.data.code !== 200) {
          this.logout();
          return;
        }
        const data = response.data.data;
        this.setToken(token);
        this.setUserId(data.userId);
        this.setNickName(data.nickName);
        // 异步加载头像 blob（失败不影响登录态）
        try {
          const avatarUrl = await apiClient.getImageUrl(data.avatar);
          this.setAvatar(avatarUrl);
        } catch (e) {
          logger.warn('头像加载失败:', e);
        }
      } catch (error) {
        logger.error('autoLogin failed:', error);
        this.logout();
      }
    },
  },
});