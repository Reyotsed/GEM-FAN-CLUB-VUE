<template>
  <Teleport to="body">
    <div v-if="isModalVisible" class="modal">
      <div class="modal-content">
        <div class="tab-container">
          <div
            class="tab"
            :class="{ active: activeTab === 'login' }"
            @click="switchTab('login')"
          >
            密码登录
          </div>
          <div
            class="tab"
            :class="{ active: activeTab === 'register' }"
            @click="switchTab('register')"
          >
            注册
          </div>
        </div>
  
        <div class="tab-content">
          <div v-if="activeTab === 'login'" class="tab-pane">
            <div class="form-group">
              <label for="email">邮箱</label>
              <input
                type="text"
                id="email"
                v-model="loginForm.email"
                placeholder="请输入邮箱"
              />
            </div>
            <div class="form-group">
              <label for="password">密码</label>
              <input
                type="password"
                id="password"
                v-model="loginForm.password"
                placeholder="请输入密码"
              />
            </div>
            <div class="form-group">
              <label for="checkCode">验证码</label>
              <input
                type="text"
                id="checkCode"
                v-model="loginForm.checkCode"
                placeholder="请输入验证码"
              />
            </div>
            <div class="image-container">
              <!-- 动态绑定图片的 src 属性 -->
              <img :src="checkCodeFig" alt="动态图片" @error="handleImageError" />
              <!-- 模拟按钮，点击后改变 checkCode 的值 -->
              <button @click="updateCheckCode">更新验证码</button>
            </div>
          </div>
  
          <div v-if="activeTab === 'register'" class="tab-pane">
            <div v-if="!registeredProfile" class="register-intro">
              <h3>创建你的 GEM 粉丝档案</h3>
              <p>记录你和她的开始，注册后生成专属粉丝档案卡。</p>
            </div>

            <div v-if="!registeredProfile" class="form-group">
              <label for="email">邮箱</label>
              <input
                type="text"
                id="group"
                v-model="registForm.email"
                placeholder="请输入邮箱"
              />
            </div>

            <div v-if="!registeredProfile" class="form-group">
              <label for="nickName">昵称</label>
              <input
                type="text"
                id="nickName"
                v-model="registForm.nickName"
                placeholder="请输入昵称"
              />
            </div>

            <div v-if="!registeredProfile" class="form-group">
              <label for="password">密码</label>
              <input
                type="password"
                id="password"
                v-model="registForm.password"
                placeholder="请输入密码"
              />
            </div>

            <div v-if="!registeredProfile" class="form-group">
              <label for="fanSinceYear">入坑年份</label>
              <input
                type="number"
                id="fanSinceYear"
                v-model="registForm.fanSinceYear"
                min="2008"
                :max="currentYear"
                placeholder="例如 2018"
              />
            </div>

            <div v-if="!registeredProfile" class="form-group">
              <label for="favoriteSong">本命歌曲</label>
              <input
                type="text"
                id="favoriteSong"
                v-model="registForm.favoriteSong"
                maxlength="30"
                placeholder="例如 光年之外"
              />
            </div>

            <div v-if="!registeredProfile" class="form-group">
              <label for="fanBio">一句话介绍</label>
              <input
                type="text"
                id="fanBio"
                v-model="registForm.fanBio"
                maxlength="40"
                placeholder="因为她，我一直相信光。"
              />
            </div>

            <div v-if="!registeredProfile" class="form-group">
              <label for="checkCode">验证码</label>
              <input
                type="text"
                id="checkCode"
                v-model="registForm.checkCode"
                placeholder="请输入验证码"
              />
            </div>
            <div v-if="!registeredProfile" class="image-container">
              <!-- 动态绑定图片的 src 属性 -->
              <img :src="checkCodeFig" alt="动态图片" @error="handleImageError" />
              <!-- 模拟按钮，点击后改变 checkCode 的值 -->
              <button @click="updateCheckCode">更新验证码</button>
            </div>

            <div v-if="registeredProfile" class="profile-success">
              <img v-if="profilePosterUrl" class="profile-poster" :src="profilePosterUrl" alt="粉丝档案卡" />
              <div v-else class="poster-loading">正在生成粉丝档案卡...</div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div v-if="activeTab === 'register'" class="login-container">
            <button v-if="!registeredProfile" class="submit-btn" @click="handleRegister">创建粉丝档案</button>
            <div v-else class="profile-actions">
              <button class="submit-btn" @click="handleDownloadProfilePoster">保存</button>
              <button class="secondary-btn" @click="goToFanMap">去全球粉丝地图</button>
              <button class="secondary-btn" :disabled="isPosterRefreshing" @click="refreshProfilePoster">
                {{ isPosterRefreshing ? '换图中...' : '换一张图' }}
              </button>
            </div>
          </div>
          <div v-if="activeTab === 'login'" class="login-container">
            <button class="submit-btn" @click="handleLogin">登录</button>
          </div>
        </div>
  
        <span class="close-modal" @click="closeModal">&times;</span>
      </div>
    </div>
  </Teleport>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted  } from 'vue';
  import { useRouter } from 'vue-router';
  import apiClient from '@/utils/api'; // 替换成我们的API客户端
  import { useUserStore } from '@/stores/user';
  import { showToast } from '@/utils/toast';
  import { trackEvent, EVENTS } from '@/utils/stats';
  import { generateFanProfilePoster, downloadFanProfilePoster } from '@/utils/fanProfilePoster';

  // 是否显示模态窗口
  const isModalVisible = ref(false);
  
  // 当前活跃的标签页
  const activeTab = ref('login');

  // 验证码图片：
  const checkCodeFig = ref("");
  // 验证码id:
  const checkCodeKey = ref('');
  const currentYear = new Date().getFullYear();
  const registeredProfile = ref(null);
  const profilePosterBlob = ref(null);
  const profilePosterUrl = ref('');
  const isPosterRefreshing = ref(false);
  
  // 登录表单数据
  const loginForm = reactive({
    email: '',
    password: '',
    checkCode: '',
  });

  // 注册表单数据
  const registForm = reactive({
    email: '',
    nickName: '',
    password: '',
    checkCode: '',
    fanSinceYear: '',
    favoriteSong: '',
    fanBio: '',
  });

  // 用户仓库
  const userStore = useUserStore();
  const router = useRouter();
  
  const resetRegisteredProfile = () => {
    registeredProfile.value = null;
    profilePosterBlob.value = null;
    if (profilePosterUrl.value) {
      URL.revokeObjectURL(profilePosterUrl.value);
      profilePosterUrl.value = '';
    }
  };

  // 切换标签页
  const switchTab = (tab) => {
    activeTab.value = tab;
    if (tab === 'register') {
      resetRegisteredProfile();
    }
  };
  
  // 打开模态窗口
  const openModal = () => {
    isModalVisible.value = true;
  };
  
  // 关闭模态窗口
  const closeModal = () => {
    isModalVisible.value = false;
    resetRegisteredProfile();
  };

  const updateCheckCode = async () => {
    try {
      const response = await apiClient.post('/account/checkCode');
      // console.log('获取验证码成功:', response.data);
      if (response.data.code == 200) {
        checkCodeFig.value = response.data.data.checkCode;
        // console.log('checkCode:', response.data);
        checkCodeKey.value = response.data.data.checkCodeKey;
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (error) {
      console.error('获取图片验证码失败', error);
      // alert('获取验证码图片失败');
    }
  };

  const handleImageError = () => {
    console.error('验证码图片加载失败');
    // 可以尝试重新获取验证码
    // updateCheckCode();
  };

  // 持久化用户当前选中的 posterBg 到后端
  const persistPosterBg = async (bgUrl) => {
    if (!bgUrl || !registeredProfile.value) return;
    const u = registeredProfile.value;
    try {
      await apiClient.post('/user/updateUserInfo', null, {
        params: {
          userId: u.userId,
          nickName: u.nickName || '',
          birthday: u.birthday || '',
          personIntroduction: u.personIntroduction || '',
          posterBg: bgUrl,
        },
      });
      registeredProfile.value = { ...u, posterBg: bgUrl };
    } catch (e) {
      console.warn('保存粉丝卡背景失败', e);
    }
  };

  const refreshProfilePoster = async () => {
    if (!registeredProfile.value || isPosterRefreshing.value) return;
    isPosterRefreshing.value = true;
    try {
      // 注册成功后“换一张图”：忽略已保存的 bg，强制随机一张
      const profileForGen = { ...registeredProfile.value, posterBg: '' };
      const { blob, bgUrl } = await generateFanProfilePoster(profileForGen);
      if (profilePosterUrl.value) URL.revokeObjectURL(profilePosterUrl.value);
      profilePosterBlob.value = blob;
      profilePosterUrl.value = URL.createObjectURL(blob);
      // 自动持久化当前展示的 bg
      await persistPosterBg(bgUrl);
    } catch (error) {
      console.error('粉丝档案卡生成失败', error);
      showToast('换图失败，请重试', 'error');
    } finally {
      isPosterRefreshing.value = false;
    }
  };

  const handleLogin = async () => {
    try {
      const response = await apiClient.post('/account/login',
      new URLSearchParams({
        email: loginForm.email,
        password: loginForm.password,
        checkCodeKey: checkCodeKey.value,
        checkCode: loginForm.checkCode,
      }));

      if (response.data.code == 200) {
        trackEvent(EVENTS.LOGIN);

        userStore.setToken(response.data.data.token);
        userStore.autoLogin();

        closeModal();
        showToast('登录成功', 'success');
      } else if (response.data.code == 503) {
        showToast(response.data.message, 'warning');
        updateCheckCode();
      } else {
        showToast(response.data.message, 'error');
        // 更新验证码
        updateCheckCode();
      }
    } catch (error) {
      console.error('登录失败', error);
      showToast('登录失败', 'error');
      updateCheckCode();
    }
  };

  // 处理注册按钮点击
  const handleRegister = async () => {
    // 前端基础校验，避免浪费验证码
    const emailReg = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailReg.test(registForm.email)) {
      showToast('邮箱格式不正确', 'error');
      return;
    }
    if (!registForm.nickName || registForm.nickName.length > 20) {
      showToast('昵称需 1-20 位', 'error');
      return;
    }
    if (!registForm.password || registForm.password.length < 6 || registForm.password.length > 32) {
      showToast('密码需 6-32 位', 'error');
      return;
    }
    if (!registForm.checkCode) {
      showToast('请输入验证码', 'error');
      return;
    }
    const fanSinceYear = Number(registForm.fanSinceYear);
    if (!fanSinceYear || fanSinceYear < 2008 || fanSinceYear > currentYear) {
      showToast(`入坑年份需在 2008-${currentYear} 之间`, 'error');
      return;
    }
    if (!registForm.favoriteSong || registForm.favoriteSong.length > 30) {
      showToast('本命歌曲需 1-30 位', 'error');
      return;
    }
    if (registForm.fanBio && registForm.fanBio.length > 40) {
      showToast('一句话介绍最多 40 位', 'error');
      return;
    }
    try {
      const response = await apiClient.post('/account/register',
        new URLSearchParams({
          email: registForm.email,
          password: registForm.password,
          nickName: registForm.nickName,
          fanSinceYear: String(fanSinceYear),
          favoriteSong: registForm.favoriteSong,
          fanBio: registForm.fanBio,
          checkCodeKey: checkCodeKey.value,
          checkCode: registForm.checkCode,
        }),
      );
      // console.log('response:', response);

      if (response.data.code == 200) {
        trackEvent(EVENTS.REGISTER);
        const { token, userInfo } = response.data.data;
        userStore.setToken(token);
        await userStore.autoLogin();
        registeredProfile.value = userInfo;
        await refreshProfilePoster();
        showToast('注册成功，已自动登录', 'success');
      } else {
        showToast(response.data.message, 'error');
        // 更新验证码
        updateCheckCode();
      }
    } catch (error) {
      console.error('注册失败', error);
      showToast('注册失败', 'error');
      updateCheckCode();
    }
  };

  const handleDownloadProfilePoster = async () => {
    if (!registeredProfile.value) return;
    try {
      let blob = profilePosterBlob.value;
      if (!blob) {
        const result = await generateFanProfilePoster(registeredProfile.value);
        blob = result.blob;
      }
      downloadFanProfilePoster(blob);
    } catch (error) {
      console.error('粉丝档案卡生成失败', error);
      showToast('粉丝档案卡生成失败', 'error');
    }
  };

  const goToFanMap = () => {
    closeModal();
    router.push({ name: 'fan-map' });
  };

  onMounted(() => {
    updateCheckCode();
  });
  // 暴露方法，供父组件调用
  defineExpose({
    openModal,
  });
  </script>
  
<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: rgba(30, 30, 40, 0.85);
  width: 420px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(200, 80, 232, 0.2);
  animation: modalFadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 自定义滚动条 */
.modal-content::-webkit-scrollbar {
  width: 6px;
}
.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}
.modal-content::-webkit-scrollbar-thumb {
  background: rgba(200, 80, 232, 0.3);
  border-radius: 3px;
}
.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 80, 232, 0.5);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.tab-container {
  display: flex;
  margin-bottom: 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.tab {
  padding: 12px 24px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 600;
  transition-property: color, border-color, text-shadow;
  transition-duration: 0.25s;
  transition-timing-function: ease;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  flex: 1;
  text-align: center;
}

.tab:hover {
  color: #fff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.tab.active {
  color: #D946EF;
  border-bottom: 2px solid #D946EF;
  text-shadow: 0 0 10px rgba(200, 80, 232, 0.6);
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-group label {
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 14px;
  text-align: left;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 15px;
  transition-property: border-color, box-shadow, background-color;
  transition-duration: 0.25s;
  transition-timing-function: ease;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-group input:focus {
  outline: none;
  border-color: #D946EF;
  box-shadow: 0 0 15px rgba(200, 80, 232, 0.3);
  background-color: rgba(0, 0, 0, 0.5);
}

/* ===== 表单验证状态 ===== */
.form-group .input-error {
  border-color: var(--color-danger, #F87171);
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15);
}
.form-group .input-error:focus {
  border-color: var(--color-danger, #F87171);
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.2);
}

.field-error {
  color: var(--color-danger, #F87171);
  font-size: 0.8rem;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: fieldShake 0.4s ease;
}

@keyframes fieldShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.modal-footer {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.login-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  gap: 15px;
}

.submit-btn {
  background: linear-gradient(135deg, #D946EF, #A21CAF);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition-property: filter, transform, box-shadow;
  transition-duration: 0.25s;
  transition-timing-function: ease;
  box-shadow: 0 4px 15px rgba(200, 80, 232, 0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.submit-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(200, 80, 232, 0.5);
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn:disabled,
.secondary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

.profile-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.profile-actions .submit-btn,
.profile-actions .secondary-btn {
  padding: 12px 10px;
  font-size: 13px;
  letter-spacing: 0;
}

.secondary-btn {
  background: linear-gradient(135deg, #A21CAF, #D946EF);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition-property: filter, transform, box-shadow;
  transition-duration: 0.25s;
  transition-timing-function: ease;
  box-shadow: 0 4px 15px rgba(200, 80, 232, 0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.secondary-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(200, 80, 232, 0.5);
}

.secondary-btn:active {
  transform: scale(0.98);
}

.close-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition-property: background-color, color, transform;
  transition-duration: 0.25s;
  transition-timing-function: ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.close-modal:hover {
  background-color: rgba(200, 80, 232, 0.2);
  color: #fff;
  transform: rotate(90deg);
}

.image-container {
  text-align: center;
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-container img {
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.3s;
}

.image-container img:hover {
  opacity: 1;
}

.image-container button {
  background: transparent;
  border: 1px solid rgba(200, 80, 232, 0.5);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #D946EF;
  transition-property: background, box-shadow;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}

.image-container button:hover {
  background: rgba(200, 80, 232, 0.1);
  box-shadow: 0 0 10px rgba(200, 80, 232, 0.2);
}

.register-intro {
  margin-bottom: 20px;
  text-align: center;
}

.register-intro h3 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.register-intro p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.profile-success {
  text-align: center;
}

.success-badge {
  background: linear-gradient(135deg, #FACC15, #D946EF);
  color: white;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  display: inline-block;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(200, 80, 232, 0.35);
}

.profile-poster {
  width: min(100%, 260px);
  max-height: 462px;
  object-fit: contain;
  border-radius: 18px;
  border: 1px solid rgba(250, 204, 21, 0.45);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45), 0 0 28px rgba(200, 80, 232, 0.35);
}

.poster-loading {
  color: rgba(255, 255, 255, 0.75);
  padding: 80px 0;
}

/* ========= 移动端适配 ========= */
@media (max-width: 640px) {
  .modal {
    align-items: flex-start;
    padding: 4vh 0;
  }
  .modal-content {
    width: 100%;
    max-width: 100%;
    max-height: 92vh;
    padding: 22px 18px 18px;
    border-radius: 18px;
    margin: 0 12px;
  }
  .tab-container { margin-bottom: 18px; }
  .tab { padding: 10px 16px; font-size: 15px; }
  .form-group { margin-bottom: 14px; }
  .form-group label { font-size: 13px; margin-bottom: 6px; }
  .form-group input { padding: 10px 12px; font-size: 14px; border-radius: 10px; }
  .image-container { padding: 8px; gap: 10px; }
  .image-container img { height: 36px; }
  .image-container button { padding: 7px 12px; font-size: 12px; }
  .modal-footer { margin-top: 18px; }
  .submit-btn,
  .secondary-btn {
    padding: 12px 18px;
    font-size: 14px;
    letter-spacing: 0.5px;
    border-radius: 10px;
  }
  .login-container { gap: 10px; }
  .register-intro h3 { font-size: 16px; }
  .register-intro p { font-size: 13px; }
  .profile-actions {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .profile-actions .submit-btn {
    grid-column: 1 / -1;
  }
  .profile-actions .submit-btn,
  .profile-actions .secondary-btn {
    padding: 11px 8px;
    font-size: 12px;
  }
  .profile-poster {
    width: min(100%, 240px);
    border-radius: 16px;
  }
  .close-modal {
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    font-size: 24px;
  }
}

@media (max-width: 380px) {
  .modal-content { padding: 20px 14px 16px; }
  .tab { padding: 9px 10px; font-size: 14px; }
  .form-group input { font-size: 13px; padding: 9px 11px; }
  .submit-btn,
  .secondary-btn { font-size: 13px; padding: 11px 14px; }
  .profile-poster { width: min(100%, 220px); }
}
</style>