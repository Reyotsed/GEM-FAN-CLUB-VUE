<template>
    <nav class="top-nav">
        <div class="nav-inner">
            <router-link to="/" class="logo">
                <span class="logo-gem">G.E.M.</span>
                <span class="logo-sub">Fan Club</span>
            </router-link>
            
            <!-- Hamburger menu button -->
            <div class="menu-toggle" :class="{ active: isMobileMenuOpen }" @click="toggleMenu">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <!-- Nav links -->
            <ul class="nav-links" :class="{ 'mobile-nav': isMobileMenuOpen }">
                <router-link to="/" @click="closeMenu">
                    <i class="fas fa-home"></i> 首页
                </router-link>
                <router-link to="/song" @click="closeMenu">
                    <i class="fas fa-music"></i> 歌曲
                </router-link>
                <router-link to="/quote" @click="closeMenu">
                    <i class="fas fa-pen-nib"></i> 动态
                </router-link>
                <router-link to="/games" @click="closeMenu">
                    <i class="fas fa-gamepad"></i> 游戏
                </router-link>
                <router-link to="/picture" @click="closeMenu">
                    <i class="fas fa-images"></i> 照片
                </router-link>
                <router-link to="/ai" @click="closeMenu">
                    <i class="fas fa-robot"></i> AI-GEM
                </router-link>
                <router-link to="/shop" @click="closeMenu">
                    <i class="fas fa-store"></i> 商店
                </router-link>
                <router-link to="/info" @click="closeMenu">
                    <i class="fas fa-newspaper"></i> 资讯
                </router-link>
            </ul>

            <!-- User section -->
            <div class="user-section">
                <template v-if="userStore.isLoggedIn">
                    <div class="user-profile" @click.prevent="navigateToUserPage">
                        <img 
                            :src="userStore.avatar" 
                            alt="用户头像" 
                            class="user-avatar"
                        >
                        <span class="user-nickname">{{ userStore.nickName }}</span>
                    </div>
                    <button @click="userStore.logout" class="btn-logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </template>
                <template v-else>
                    <button @click="openLoginModal" class="btn-login">
                        <i class="fas fa-user"></i> 登录
                    </button>
                    <LoginModal ref="loginModal" />
                </template>
            </div>
        </div>
    </nav>
</template>
  
<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import LoginModal from '@/components/Login/LoginModal.vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const loginModal = ref(null);
const userStore = useUserStore();
const isMobileMenuOpen = ref(false);

const openLoginModal = () => {
    loginModal.value.openModal();
};

const navigateToUserPage = () => {
    if (userStore.isLoggedIn && userStore.userId) {
        // Always push with a fresh timestamp to force re-render when already on user page
        router.push({
            path: '/user',
            query: { id: userStore.userId, t: Date.now() }
        });
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
.top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: calc(var(--nav-height, 70px) + var(--safe-area-top, 0px));
    padding-top: var(--safe-area-top, 0px);
    background: rgba(10, 10, 18, 0.6); /* 深色半透明背景 */
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s ease;
}

/* 滚动时加深背景（如果需要JS配合，这里先做静态优化） */
.top-nav.scrolled {
    background: rgba(10, 10, 18, 0.9);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
}

.nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 2rem;
    gap: 2rem;
}

/* Logo */
.logo {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    line-height: 1.1;
    flex-shrink: 0;
    transition: transform 0.3s var(--ease-bounce);
    position: relative;
}

.logo:hover {
    transform: scale(1.05);
}

.logo-gem {
    font-size: 1.6rem;
    font-weight: 900;
    color: #fff;
    letter-spacing: 2px;
    text-shadow: 0 0 15px rgba(235, 7, 238, 0.8), 0 0 30px rgba(235, 7, 238, 0.4);
    background: linear-gradient(to right, #fff, #f3caff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.logo-sub {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 6px;
    text-transform: uppercase;
    font-weight: 500;
    margin-left: 2px;
}

/* Nav links */
.nav-links {
    display: flex;
    list-style: none;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
}

.nav-links a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    padding: 0.6rem 1.2rem;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.5px;
    transition: all 0.3s var(--ease-out);
    position: relative;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
}

.nav-links a i {
    font-size: 0.9rem;
    opacity: 0.7;
    transition: transform 0.3s ease, color 0.3s ease;
}

/* 悬停效果 */
.nav-links a:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
}

.nav-links a:hover i {
    transform: translateY(-2px);
    color: var(--primary-light);
    opacity: 1;
}

/* 激活状态 */
.nav-links a.router-link-active,
.nav-links a.router-link-exact-active {
    color: #fff;
    background: rgba(235, 7, 238, 0.15);
    font-weight: 600;
    box-shadow: 0 0 20px rgba(235, 7, 238, 0.2);
    border: 1px solid rgba(235, 7, 238, 0.3);
}

.nav-links a.router-link-active i,
.nav-links a.router-link-exact-active i {
    color: var(--primary);
    opacity: 1;
}

/* User section */
.user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    padding: 0.4rem 1rem 0.4rem 0.4rem;
    border-radius: var(--radius-pill);
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.user-profile:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.user-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
}

.user-profile:hover .user-avatar {
    border-color: var(--primary);
    transform: scale(1.05);
}

.user-nickname {
    color: #fff;
    font-size: 0.9rem;
    font-weight: 500;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.btn-login {
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.2), rgba(165, 5, 222, 0.2));
    border: 1px solid rgba(235, 7, 238, 0.4);
    color: #fff;
    padding: 0.5rem 1.5rem;
    border-radius: var(--radius-pill);
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    backdrop-filter: blur(4px);
    transition: all 0.3s ease;
    box-shadow: 0 0 10px rgba(235, 7, 238, 0.1);
}

.btn-login:hover {
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.4), rgba(165, 5, 222, 0.4));
    border-color: rgba(235, 7, 238, 0.8);
    transform: translateY(-1px);
    box-shadow: 0 0 20px rgba(235, 7, 238, 0.4);
}

.btn-logout {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    padding: 0;
    transition: all 0.3s ease;
}

.btn-logout:hover {
    background: rgba(255, 70, 70, 0.2);
    border-color: rgba(255, 70, 70, 0.4);
    color: #ff4646;
    transform: rotate(90deg);
}

/* Hamburger menu */
.menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    cursor: pointer;
    z-index: 1001;
    border-radius: 50%;
    transition: background 0.3s ease;
    gap: 6px;
}

.menu-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
}

.menu-toggle span {
    display: block;
    width: 24px;
    height: 2px;
    background-color: white;
    border-radius: 2px;
    transition: all 0.3s var(--ease-bounce);
    transform-origin: center;
}

.menu-toggle.active span:first-child {
    transform: rotate(45deg) translate(6px, 6px);
}

.menu-toggle.active span:nth-child(2) {
    opacity: 0;
    transform: scaleX(0);
}

.menu-toggle.active span:last-child {
    transform: rotate(-45deg) translate(6px, -6px);
}

/* Mobile */
@media screen and (max-width: 1024px) {
    .nav-inner {
        padding: 0 1.5rem;
        gap: 1rem;
    }
    
    .nav-links {
        gap: 0.2rem;
    }
    
    .nav-links a {
        padding: 0.5rem 0.8rem;
        font-size: 0.9rem;
    }
    
    .nav-links a span {
        display: none; /* 平板模式下只显示图标 */
    }
    
    .nav-links a i {
        font-size: 1.1rem;
        margin: 0;
    }
}

@media screen and (max-width: 768px) {
    .menu-toggle {
        display: flex;
    }

    .nav-links {
        display: none;
        position: fixed;
        top: calc(var(--nav-height, 70px) + var(--safe-area-top, 0px));
        left: 0;
        right: 0;
        background: rgba(10, 10, 18, 0.95);
        backdrop-filter: blur(20px);
        flex-direction: column;
        padding: 1rem;
        gap: 0.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: slideDown 0.4s var(--ease-bounce);
        max-height: calc(100vh - var(--nav-height, 70px) - var(--safe-area-top, 0px));
        overflow-y: auto;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .nav-links.mobile-nav {
        display: flex;
    }

    .nav-links a {
        padding: 1rem 1.5rem;
        width: 100%;
        border-radius: 12px;
        font-size: 1rem;
        background: rgba(255, 255, 255, 0.03);
        justify-content: flex-start;
    }
    
    .nav-links a span {
        display: inline; /* 手机模式下恢复显示文字 */
    }

    .nav-links a:hover,
    .nav-links a.router-link-active {
        background: rgba(235, 7, 238, 0.15);
        transform: translateX(5px);
    }
    
    .user-section {
        margin-left: auto; /* 将用户区域推到右边 */
    }
}

@media screen and (max-width: 480px) {
    .user-nickname {
        display: none;
    }

    .user-section {
        gap: 0.5rem;
    }

    .logo-gem {
        font-size: 1.4rem;
    }

    .logo-sub {
        display: none;
    }

    .btn-login {
        padding: 0.4rem 1rem;
        font-size: 0.85rem;
    }
    
    .btn-login span {
        display: none;
    }
    
    .btn-login i {
        margin: 0;
    }
}
</style>