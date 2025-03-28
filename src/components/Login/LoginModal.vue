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
            <a href="#" class="forgot-password">忘记密码？</a>
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
  /* 添加相同的样式 */
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
  }
  
  .modal-content {
    background-color: white;
    width: 400px;
    padding: 20px;
    border-radius: 8px;
    position: relative;
  }
  
  .tab-container {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
  }
  
  .tab {
    padding: 10px 20px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  
  .tab.active {
    color: #3388ff;
    border-bottom: 2px solid #3388ff;
  }
  
  .form-group {
    display: flex;
    margin-bottom: 15px;
    margin-left: 5px;
    margin-right: 5px;
    white-space: nowrap;
  }
  
  .form-group label {
    display: flex;
    margin-right: 10px;
    /* margin-bottom: 5px; */
    color: #666;
    
  }
  
  .form-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .forgot-password {
    float: right;
    color: #3388ff;
    text-decoration: none;
    font-size: 12px;
  }
  
  .get-sms-code {
    margin-top: 5px;
    background-color: #f0f0f0;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
  .login-container {
    flex-direction: column;
    display: flex;
    justify-content: space-between;
    width: 100%;
    place-items: center;
  }
  

  
  .register-btn {
    background-color: #3388ff;
    color: white;
  
  }
  
  .submit-btn {
    background-color: #3388ff;
    color: white;
    
  }
  
  .close-modal {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 20px;
    cursor: pointer;
  }
  .image-container {
    text-align: center;
    margin: 0px;
  }

  img {
    max-width: 500px;
    max-height: 500px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  </style>