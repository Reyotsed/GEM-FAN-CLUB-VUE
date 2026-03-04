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
            <div class="form-group">
              <label for="email">邮箱</label>
              <input
                type="text"
                id="group"
                v-model="registForm.email"
                placeholder="请输入邮箱"
              />
            </div>

            <div class="form-group">
              <label for="nickName">昵称</label>
              <input
                type="text"
                id="nickName"
                v-model="registForm.nickName"
                placeholder="请输入昵称"
              />
            </div>

            <div class="form-group">
              <label for="password">密码</label>
              <input
                type="password"
                id="password"
                v-model="registForm.password"
                placeholder="请输入密码"
              />
            </div>

            <div class="form-group">
              <label for="checkCode">验证码</label>
              <input
                type="text"
                id="checkCode"
                v-model="registForm.checkCode"
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
        </div>
        
        <div class="modal-footer">
          <div v-if="activeTab === 'register'" class="login-container">
            <button class="submit-btn" @click="handleRegister">注册</button>
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
  import apiClient from '@/utils/api'; // 替换成我们的API客户端
  import { useUserStore } from '@/stores/user';
  import { showToast } from '@/utils/toast';

  // 是否显示模态窗口
  const isModalVisible = ref(false);
  
  // 当前活跃的标签页
  const activeTab = ref('login');

  // 验证码图片：
  const checkCodeFig = ref("");
  // 验证码id:
  const checkCodeKey = ref('');
  
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
  });

  // 用户仓库
  const userStore = useUserStore();
  
  // 切换标签页
  const switchTab = (tab) => {
    activeTab.value = tab;
  };
  
  // 打开模态窗口
  const openModal = () => {
    isModalVisible.value = true;
  };
  
  // 关闭模态窗口
  const closeModal = () => {
    isModalVisible.value = false;
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
        console.log('登录成功:', response.data);

        userStore.setToken(response.data.data.token);
        userStore.autoLogin();

        closeModal();
        showToast('登录成功', 'success');
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
    try {
      const response = await apiClient.post('/account/register',
        new URLSearchParams({
          email: registForm.email,
          password: registForm.password,
          nickName: registForm.nickName,
          checkCodeKey: checkCodeKey.value,
          checkCode: registForm.checkCode,
        }),
      );
      // console.log('response:', response);

      if (response.data.code == 200) {
        console.log('注册成功:', response.data);
        closeModal();
        showToast('注册成功，请登录', 'success');
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
  transition: all 0.3s ease;
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
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(223, 13, 238, 0.2);
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
  background: rgba(223, 13, 238, 0.3);
  border-radius: 3px;
}
.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(223, 13, 238, 0.5);
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
  transition: all 0.3s ease;
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
  color: #df0dee;
  border-bottom: 2px solid #df0dee;
  text-shadow: 0 0 10px rgba(223, 13, 238, 0.6);
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
  transition: all 0.3s ease;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-group input:focus {
  outline: none;
  border-color: #df0dee;
  box-shadow: 0 0 15px rgba(223, 13, 238, 0.3);
  background-color: rgba(0, 0, 0, 0.5);
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
  background: linear-gradient(135deg, #df0dee, #a505de);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(223, 13, 238, 0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.submit-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(223, 13, 238, 0.5);
}

.submit-btn:active {
  transform: scale(0.98);
}

.close-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.close-modal:hover {
  background-color: rgba(223, 13, 238, 0.2);
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
  border: 1px solid rgba(223, 13, 238, 0.5);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #df0dee;
  transition: all 0.3s ease;
}

.image-container button:hover {
  background: rgba(223, 13, 238, 0.1);
  box-shadow: 0 0 10px rgba(223, 13, 238, 0.2);
}
</style>