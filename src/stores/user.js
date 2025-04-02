// src/stores/user.js
import { defineStore } from 'pinia';
import apiClient from '@/utils/api';


export const useUserStore = defineStore('user', {
  state: () => ({
    token: null,
    userId: null,
    nickName: null,
    avatar: null,
    isLoggedIn: false, // 用于记录用户是否已登录
  }),
  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem('token', token);
      this.isLoggedIn = true;
    },
    setUserId(userId) {
      this.userId = userId;
      localStorage.setItem('userId', JSON.stringify(userId));
    },
    setNickName(nickName) {
      this.nickName = nickName;
      localStorage.setItem('nickName', nickName);
    },
    setAvatar(avatar) {
      this.avatar = avatar;
      localStorage.setItem('avatar', avatar);
    },
    logout() {
      this.token = null;
      this.userId = null;
      this.nickName = null;
      this.avatar = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('nickName');
      localStorage.removeItem('avatar');
      this.isLoggedIn = false;
    },
    autoLogin(){
      console.log("autoLogin");
      const token = localStorage.getItem('token');
      if(token === "null") {
        
      }else{
        apiClient.post('/account/autoLogin',
          {},
          {headers: { Authorization: "Bearer " + localStorage.getItem('token')} }
        ).then(response => {
          if (response.data.code != 200) {
            this.logout();
          }
          else{
            this.setToken(token);
            this.setUserId(response.data.data.userId);
            this.setNickName(response.data.data.nickName);
            // 根据avatarUrl获取头像
            apiClient.getImageUrl(response.data.data.avatar).then(avatarUrl => {
                this.setAvatar(avatarUrl);
            });
          }
        }).catch(error => {
          console.log(error);
          this.logout();
        });
      }
    }
  },
});