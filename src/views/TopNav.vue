<template>
    <div class="page-container">
        <nav class="top-nav" :class="{ 'nav-hidden': false }">
            <div class="logo">G E M</div>
            
            <!-- 汉堡菜单按钮 -->
            <div class="menu-toggle" @click="toggleMenu">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <!-- 导航链接，添加mobile-nav类 -->
            <ul class="nav-links" :class="{ 'mobile-nav': isMobileMenuOpen }">
                <router-link to="/" @click="closeMenu">首页</router-link>
                <router-link to="/song" @click="closeMenu">歌曲</router-link>
                <router-link to="/quote" @click="closeMenu">语录</router-link>
                <router-link to="/video" @click="closeMenu">视频</router-link>
                <router-link to="/picture" @click="closeMenu">照片</router-link>
                <router-link to="/ai" @click="closeMenu">AI-GEM</router-link>
                <router-link to="/shop" @click="closeMenu">商店</router-link>
                <router-link to="/info" @click="closeMenu">资讯</router-link>
            </ul>

            <!-- 用户部分保持不变 -->
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

const isMobileMenuOpen = ref(false);

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

const toggleMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMenu = () => {
    isMobileMenuOpen.value = false;
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

/* 汉堡菜单按钮样式 */
.menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    width: 30px;
    height: 21px;
    cursor: pointer;
    margin-left: 1rem;
    z-index: 1001;
}

.menu-toggle span {
    display: block;
    width: 100%;
    height: 3px;
    background-color: white;
    border-radius: 3px;
    transition: all 0.3s ease;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
    .menu-toggle {
        display: flex;
    }

    .nav-links {
        display: none;
        position: fixed;
        top: 50px;
        left: 0;
        width: 100%;
        background-color: #eb07ee;
        flex-direction: column;
        padding: 1rem 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .nav-links.mobile-nav {
        display: flex;
    }

    .nav-links a {
        padding: 1rem 2rem;
        width: 100%;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-links a:last-child {
        border-bottom: none;
    }

    .user-section {
        margin-left: auto;
        margin-right: 1rem;
    }

    .top-nav {
        justify-content: flex-start;
    }

    /* 当菜单打开时的汉堡按钮动画 */
    .menu-toggle.active span:first-child {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }

    .menu-toggle.active span:last-child {
        transform: rotate(-45deg) translate(5px, -5px);
    }
}

/* 优化用户部分在移动端的显示 */
@media screen and (max-width: 480px) {
    .user-nickname {
        display: none;
    }

    .user-section {
        gap: 0.5rem;
    }

    .logo {
        margin-left: 1rem;
        font-size: 1.2rem;
    }
}
</style>