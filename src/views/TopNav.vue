<template>
    <div class="page-container">
        <nav class="top-nav" :class=" 'nav-hidden' ">
            <div class="logo">G E M</div>
            <ul class="nav-links">
                <router-link to="/">首页</router-link>
                <router-link to="/song">歌曲</router-link>
                <router-link to="/quote">语录</router-link>
                <router-link to="/video">视频</router-link>
                <router-link to="/picture">照片</router-link>
                <router-link to="/ai">AI-GEM</router-link>
                <router-link to="/shop">商店</router-link>
                <router-link to="/info">资讯</router-link>
                <!-- 更多导航项 -->
            </ul>
            <div class="user-section">
                <img 
                    v-if="userStore.isLoggedIn" 
                    :src="userStore.avatar" 
                    alt="用户头像" 
                    class="user-avatar" 
                    @click.prevent="navigateToUserPage" 
                    role="button"
                    aria-label="查看个人主页"
                >
                <span v-if="userStore.isLoggedIn" class="user-nickname">{{ userStore.nickName }}</span>
                <div v-if="userStore.isLoggedIn === false" class="login-button">
                    <button @click="openLoginModal">登录</button>
                    <LoginModal ref="loginModal" />
                </div>
                <div v-else>
                    <button @click="userStore.logout" class="login-button">退出</button>
                </div>
            </div>
        </nav>

        <div class="content-wrapper">
            <router-view></router-view>
        </div>
    </div>
</template>
  
<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import LoginModal from '@/components/Login/LoginModal.vue';
import { usePageStore } from '@/stores/page';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const loginModal = ref(null);

const pageStore = usePageStore();

const userStore = useUserStore();

const openLoginModal  = () => {
    // 把登录窗口设置为可视的
    loginModal.value.openModal();
};

// 修改导航到用户页面的方法
const navigateToUserPage = () => {
    console.log('User store state:', userStore);
    console.log('Is logged in?', userStore.isLoggedIn);
    console.log('User ID:', userStore.userId);
    
    if (userStore.isLoggedIn && userStore.userId) {
        // 检查当前是否已经在用户页面，且是否查看的是同一用户
        if (route.path === '/user' && route.query.id === userStore.userId) {
            // 如果已经在查看自己的用户页面，直接刷新页面
            window.location.reload();
        } else {
            // 否则正常导航
            router.push({
                path: '/user',
                query: { id: userStore.userId }
            });
        }
    } else {
        console.error('Cannot navigate: User not logged in or missing ID');
    }
};
</script>
  
<style scoped>
.page-container {
    min-height: 100vh;
    margin-top: 0px;
    width: 100%;
}

.top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #eb07ee;
    color: white;
    padding: 10px;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    height: 50px; /* 固定导航栏高度 */
}

.content-wrapper {
    padding-top: 0px; /* 与导航栏高度相同 */
    width: 100%;
}

.user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-right: 2rem;
}

.user-nickname {
    color: white;
    font-size: 16px;
}

.login-button {
    font-size: 16px;
    color: rgb(2, 123, 251);
}

.logo{
    margin-left: 2rem;
    color: white;
    text-decoration: none;
    font-size: 1.5rem;
    font-weight: bold;
}
.nav-links {
    display: flex;
    list-style: none;
}
.nav-links li {
    margin-left: 5rem; /* 增加左边距，拉开元素之间的距离 */
    margin-right: 5rem;
}
.nav-links a {
    color: white;
    text-decoration: none;
    transition: color 0.3s ease ;
    padding: 0.5rem 2rem; /* 增加内边距，让链接区域更大 */
}
.nav-links a:hover {
    color: #4CAF50;
}
.nav-links a.active {
    color: #4CAF50;
    font-weight: bold;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.user-avatar:hover {
    transform: scale(1.1);
    border-color: white;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* 登录按钮样式 */
.login-button:hover {
    background-color: #0a2cee;
}

</style>