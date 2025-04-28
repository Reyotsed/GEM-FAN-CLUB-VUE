<template>
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
                type="text"
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
  </template>
  
  <script setup>
  import { ref, reactive, onMounted  } from 'vue';
  import apiClient from '@/utils/api'; // 替换成我们的API客户端
  import { useUserStore } from '@/stores/user';

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
        alert(response.data.message);
      }
    } catch (error) {
      console.error('获取图片验证码失败', error);
      // alert('获取验证码图片失败');
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
        console.log('登录成功:', response.data);

        userStore.setToken(response.data.data.token);
        userStore.autoLogin();

        closeModal();
      } else {
        alert(response.data.message);
        // 更新验证码
        updateCheckCode();
      }
    } catch (error) {
      console.error('登录失败', error);
      alert('登录失败');
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
      } else {
        alert(response.data.message);
        // 更新验证码
        updateCheckCode();
      }
    } catch (error) {
      console.error('注册失败', error);
      alert('注册失败');
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
  }
  
  .modal-content {
    background: linear-gradient(135deg, #fff0fa 0%, #f3e6ff 100%);
    width: 420px;
    padding: 30px;
    border-radius: 16px;
    position: relative;
    box-shadow: 0 10px 25px rgba(223, 13, 238, 0.1);
    animation: modalFadeIn 0.3s ease;
    border: 1px solid #f3caff;
  }
  
  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .tab-container {
    display: flex;
    margin-bottom: 25px;
    border-bottom: 1px solid #f3caff;
  }
  
  .tab {
    padding: 12px 24px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font-weight: 500;
    transition: all 0.3s ease;
    color: #7a3fa7;
  }
  
  .tab:hover {
    color: #df0dee;
  }
  
  .tab.active {
    color: #df0dee;
    border-bottom: 2px solid #df0dee;
  }
  
  .form-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 20px;
    margin-left: 5px;
    margin-right: 5px;
  }
  
  .form-group label {
    margin-bottom: 0;
    margin-right: 12px;
    color: #7a3fa7;
    font-weight: 500;
    font-size: 14px;
    min-width: 60px;
    text-align: right;
  }
  
  .form-group input {
    flex: 1;
    padding: 12px;
    border: 1px solid #f3caff;
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.3s ease;
    background-color: #fff6fd;
    box-shadow: 0 1px 4px rgba(223, 13, 238, 0.08);
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #df0dee;
    box-shadow: 0 0 0 3px #f3caff88;
    background-color: #fff0fa;
  }
  
  .forgot-password {
    color: #df0dee;
    text-decoration: none;
    font-size: 13px;
    transition: all 0.3s ease;
  }
  
  .forgot-password:hover {
    color: #a505de;
    text-decoration: underline;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 25px;
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
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
    letter-spacing: 1px;
  }
  
  .submit-btn:hover {
    filter: brightness(1.08) saturate(1.2);
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 4px 16px rgba(223, 13, 238, 0.18);
  }
  
  .submit-btn:active {
    filter: brightness(0.98);
    transform: scale(0.98);
  }
  
  .close-modal {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 24px;
    cursor: pointer;
    color: #7a3fa7;
    transition: all 0.3s ease;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .close-modal:hover {
    background-color: #fff6fd;
    color: #df0dee;
  }
  
  .image-container {
    text-align: center;
    margin: 15px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  
  .image-container img {
    max-width: 120px;
    max-height: 40px;
    border: 1px solid #f3caff;
    border-radius: 8px;
    transition: all 0.3s ease;
    background: #fff6fd;
  }
  
  .image-container img:hover {
    transform: scale(1.05);
  }
  
  .image-container button {
    background: #fff6fd;
    border: 1px solid #f3caff;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: #7a3fa7;
    transition: all 0.3s ease;
    box-shadow: 0 1px 4px rgba(223, 13, 238, 0.08);
  }
  
  .image-container button:hover {
    background: #fff0fa;
    color: #df0dee;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(223, 13, 238, 0.13);
  }
  </style>