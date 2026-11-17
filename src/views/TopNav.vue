<template>
    <!-- ============ 顶部导航栏 ============ -->
    <nav class="top-nav" :class="{ scrolled: isScrolled }">
        <div class="nav-inner">
            <!-- Logo -->
            <router-link to="/" class="logo" @click="closeDrawer">
                <span class="logo-gem">G.E.M.</span>
                <span class="logo-sub">Fan Club</span>
            </router-link>

            <!-- 桌面端主菜单（>1024px 显示文字+图标，768~1024 仅图标） -->
            <ul class="nav-links" ref="navLinksRef">
                <router-link
                    v-for="item in navItems"
                    :key="item.path"
                    :to="item.path"
                    class="nav-item"
                    :data-path="item.path"
                >
                    <i :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                </router-link>
                <!-- 滑动指示器：跟随激活项平滑移动 -->
                <span
                    class="nav-indicator"
                    :style="indicatorStyle"
                    :class="{ visible: indicatorVisible }"
                ></span>
            </ul>

            <!-- 右侧用户区：桌面完整胶囊 / 移动头像+汉堡 -->
            <div class="nav-right">
                <!-- 桌面端：用户胶囊 -->
                <template v-if="userStore.isLoggedIn">
                    <div class="user-profile desktop-only" @click="navigateToUserPage">
                        <img :src="userStore.avatar" alt="头像" class="user-avatar" />
                        <span class="user-nickname">{{ userStore.nickName }}</span>
                    </div>
                    <button class="btn-logout desktop-only" @click="userStore.logout" aria-label="退出">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </template>
                <button v-else class="btn-login desktop-only" @click="openLoginModal">
                    <i class="fas fa-user"></i> 登录
                </button>

                <!-- 移动端：头像/登录按钮 -->
                <button
                    v-if="userStore.isLoggedIn"
                    class="mobile-avatar-btn mobile-only"
                    @click="navigateToUserPage"
                    aria-label="我的"
                >
                    <img :src="userStore.avatar" alt="头像" />
                </button>
                <button
                    v-else
                    class="mobile-avatar-btn mobile-only login"
                    @click="openLoginModal"
                    aria-label="登录"
                >
                    <i class="fas fa-user"></i>
                </button>

                <!-- 移动端：汉堡按钮 -->
                <button
                    type="button"
                    class="menu-toggle mobile-only"
                    :class="{ active: isDrawerOpen }"
                    @click="toggleDrawer"
                    aria-label="菜单"
                >
                    <span></span><span></span><span></span>
                </button>
            </div>
        </div>
    </nav>

    <!-- ============ 移动端：右侧滑出抽屉 ============ -->
    <transition name="drawer">
        <div v-if="isDrawerOpen" class="drawer-mask" @click="closeDrawer"></div>
    </transition>
    <aside class="drawer" :class="{ open: isDrawerOpen }" role="dialog" aria-label="导航抽屉">
        <div class="drawer-header">
            <div v-if="userStore.isLoggedIn" class="drawer-user" @click="navigateToUserPage">
                <img :src="userStore.avatar" alt="头像" class="drawer-avatar" />
                <div class="drawer-user-info">
                    <div class="drawer-nick">{{ userStore.nickName }}</div>
                    <div class="drawer-tip">查看个人主页 <i class="fas fa-arrow-right"></i></div>
                </div>
            </div>
            <div v-else class="drawer-user guest" @click="openLoginModal">
                <div class="drawer-avatar guest-avatar"><i class="fas fa-user"></i></div>
                <div class="drawer-user-info">
                    <div class="drawer-nick">未登录</div>
                    <div class="drawer-tip">点击登录账号 <i class="fas fa-arrow-right"></i></div>
                </div>
            </div>
        </div>

        <div class="drawer-section-title">探索</div>
        <div class="drawer-grid">
            <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="drawer-grid-item"
                :class="{ 'is-active': isPathActive(item.path) }"
                @click="closeDrawer"
            >
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
            </router-link>
        </div>

        <div v-if="userStore.isLoggedIn" class="drawer-footer">
            <button class="drawer-logout" @click="handleLogout">
                <i class="fas fa-sign-out-alt"></i> 退出登录
            </button>
        </div>
    </aside>

    <!-- ============ 移动端：底部 TabBar ============ -->
    <nav class="bottom-tab mobile-only" aria-label="底部导航">
        <router-link
            v-for="tab in bottomTabs"
            :key="tab.path"
            :to="tab.path"
            class="bottom-tab-item"
            :class="{ 'tab-me': tab.path === '/user', 'is-active': isPathActive(tab.path) }"
        >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
        </router-link>
    </nav>

    <LoginModal ref="loginModal" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import LoginModal from '@/components/Login/LoginModal.vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const loginModal = ref(null);
const userStore = useUserStore();

const isDrawerOpen = ref(false);
const isScrolled = ref(false);

// 桌面端滑动指示器
const navLinksRef = ref(null);
const indicatorStyle = ref({ left: '0px', width: '0px' });
const indicatorVisible = ref(false);
// 抽屉锁屏时的 scrollY 备份
const lockedScrollY = ref(0);

// 完整导航（抽屉 & 桌面端共用）
const navItems = [
    { path: '/', label: '首页', icon: 'fas fa-home' },
    { path: '/song', label: '歌曲', icon: 'fas fa-music' },
{ path: '/quote', label: '广场', icon: 'fas fa-pen-nib' },
    { path: '/story', label: '快拍', icon: 'fab fa-instagram' },
    { path: '/fan-map', label: '地图', icon: 'fas fa-map-marked-alt' },
    { path: '/games', label: '游戏', icon: 'fas fa-gamepad' },
    { path: '/ai', label: 'AI-GEM', icon: 'fas fa-robot' },
    { path: '/shop', label: '商店', icon: 'fas fa-store' },
    { path: '/info', label: '资讯', icon: 'fas fa-newspaper' },
];

// 移动端底部 TabBar 只保留 5 个高频，个人中心由顶部头像进入
const bottomTabs = [
    { path: '/', label: '首页', icon: 'fas fa-home' },
    { path: '/song', label: '歌曲', icon: 'fas fa-music' },
    { path: '/story', label: '快拍', icon: 'fab fa-instagram' },
    { path: '/games', label: '游戏', icon: 'fas fa-gamepad' },
    { path: '/ai', label: 'AI', icon: 'fas fa-robot' },
];

const openLoginModal = () => {
    closeDrawer();
    loginModal.value?.openModal();
};

const navigateToUserPage = () => {
    closeDrawer();
    if (userStore.isLoggedIn && userStore.userId) {
        router.push({ path: '/user', query: { id: userStore.userId, t: Date.now() } });
    } else {
        openLoginModal();
    }
};

const toggleDrawer = () => {
    isDrawerOpen.value = !isDrawerOpen.value;
};

const closeDrawer = () => {
    isDrawerOpen.value = false;
};

// 精确匹配激活：首页(/) 只在完全相等时激活，其他路径走前缀匹配
const isPathActive = (path) => {
    if (path === '/') return route.path === '/';
    return route.path === path || route.path.startsWith(path + '/');
};

// 更新桌面端滑动指示器位置
const updateIndicator = async () => {
    await nextTick();
    const container = navLinksRef.value;
    if (!container) return;
    const activeEl = container.querySelector('.nav-item.router-link-exact-active')
        || container.querySelector('.nav-item.router-link-active[data-path="' + route.path + '"]');
    if (!activeEl) {
        indicatorVisible.value = false;
        return;
    }
    const cRect = container.getBoundingClientRect();
    const aRect = activeEl.getBoundingClientRect();
    indicatorStyle.value = {
        left: (aRect.left - cRect.left + aRect.width / 2 - 11) + 'px',
        width: '22px',
    };
    indicatorVisible.value = true;
};

const handleLogout = () => {
    userStore.logout();
    closeDrawer();
};

// 滚动时顶栏加深
const handleScroll = () => {
    isScrolled.value = window.scrollY > 10;
};

// 抽屉打开时锁定 body 滚动（iOS Safari 兼容方案）
watch(isDrawerOpen, (open) => {
    if (open) {
        lockedScrollY.value = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lockedScrollY.value}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
    } else {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, lockedScrollY.value);
    }
});

// 路由切换：关闭抽屉 + 更新指示器
watch(() => route.path, () => {
    closeDrawer();
    updateIndicator();
});

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateIndicator);
    handleScroll();
    updateIndicator();
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', updateIndicator);
    // 兜底还原 body 样式
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
});
</script>

<style scoped>
/* =========================================================
   顶部导航栏
   ========================================================= */
.top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: calc(var(--nav-height, 70px) + var(--safe-area-top, 0px));
    padding-top: var(--safe-area-top, 0px);
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.top-nav.scrolled {
    background: rgba(10, 10, 18, 0.88);
    border-bottom-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
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

/* --------- Logo --------- */
.logo {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    line-height: 1.1;
    flex-shrink: 0;
    transition: transform 0.3s var(--ease-bounce);
}

.logo:hover { transform: scale(1.04); }

.logo-gem {
    font-size: 1.55rem;
    font-weight: 900;
    letter-spacing: 2px;
    background: linear-gradient(135deg, #fff 0%, #f3caff 60%, #eb07ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(235, 7, 238, 0.25);
}

.logo-sub {
    font-size: 0.58rem;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 5px;
    text-transform: uppercase;
    font-weight: 500;
    margin-top: 2px;
}

/* --------- 主菜单（桌面） --------- */
.nav-links {
    display: flex;
    list-style: none;
    align-items: center;
    gap: 0.25rem;
    flex: 1;
    justify-content: center;
    position: relative;
}

/* 滑动激活指示器：在激活项之间平滑过渡 */
.nav-indicator {
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 3px;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent-pink));
    box-shadow: 0 0 12px rgba(235, 7, 238, 0.7);
    opacity: 0;
    pointer-events: none;
    transition: left 0.35s var(--ease-smooth),
                width 0.35s var(--ease-smooth),
                opacity 0.25s ease;
}

.nav-indicator.visible { opacity: 1; }

.nav-item {
    position: relative;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    padding: 0.55rem 1rem;
    font-size: 0.92rem;
    font-weight: 500;
    letter-spacing: 0.3px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
    transition: color 0.25s ease, background 0.25s ease;
}

.nav-item i {
    font-size: 0.92rem;
    opacity: 0.75;
    transition: transform 0.3s var(--ease-bounce), color 0.25s ease;
}

.nav-item:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
}

.nav-item:hover i {
    transform: translateY(-1px);
    color: var(--primary-light);
}

/* 激活态：文字颜色 + 图标高亮，下划线由共享 .nav-indicator 负责 */
/* 注意：首页 (/) 由于是所有路由的父级，router-link-active 会误命中，
   这里只使用 router-link-exact-active 作为精确激活判据 */
.nav-item.router-link-exact-active {
    color: #fff;
}

.nav-item.router-link-exact-active i {
    color: var(--primary);
    opacity: 1;
}

/* 非首页路径：前缀匹配也视为激活（例如 /song/123 激活 /song） */
.nav-item.router-link-active:not([data-path="/"]) {
    color: #fff;
}

.nav-item.router-link-active:not([data-path="/"]) i {
    color: var(--primary);
    opacity: 1;
}

/* --------- 右侧容器 --------- */
.nav-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
}

/* 桌面端：用户胶囊 */
.user-profile {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0.9rem 0.3rem 0.3rem;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.user-profile:hover {
    background: rgba(235, 7, 238, 0.1);
    border-color: rgba(235, 7, 238, 0.3);
}

.user-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.15);
}

.user-profile:hover .user-avatar { border-color: var(--primary); }

.user-nickname {
    color: #fff;
    font-size: 0.88rem;
    font-weight: 500;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.btn-logout {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.55);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.btn-logout:hover {
    background: rgba(255, 70, 70, 0.15);
    border-color: rgba(255, 70, 70, 0.4);
    color: #ff6b6b;
    transform: rotate(90deg);
}

.btn-login {
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.25), rgba(165, 5, 222, 0.25));
    border: 1px solid rgba(235, 7, 238, 0.45);
    color: #fff;
    padding: 0.5rem 1.3rem;
    border-radius: var(--radius-pill);
    font-size: 0.88rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    cursor: pointer;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.btn-login:hover {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    box-shadow: 0 4px 20px rgba(235, 7, 238, 0.5);
    transform: translateY(-1px);
}

/* 移动端显隐控制 */
.desktop-only { display: flex; }
.mobile-only { display: none; }

/* 移动端头像按钮 */
.mobile-avatar-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    cursor: pointer;
    overflow: hidden;
    display: none;
    align-items: center;
    justify-content: center;
}

.mobile-avatar-btn.login {
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.3), rgba(165, 5, 222, 0.3));
    border-color: rgba(235, 7, 238, 0.5);
}

.mobile-avatar-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 汉堡按钮 */
.menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    padding: 0;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    cursor: pointer;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.menu-toggle span {
    display: block;
    width: 20px;
    height: 2px;
    background: #fff;
    border-radius: 2px;
    transition-property: transform, opacity; transition-duration: 0.3s; transition-timing-function: var(--ease-bounce);
    transform-origin: center;
}

.menu-toggle.active {
    background: rgba(235, 7, 238, 0.2);
    border-color: rgba(235, 7, 238, 0.5);
}

.menu-toggle.active span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
}

.menu-toggle.active span:nth-child(2) {
    opacity: 0;
    transform: scaleX(0);
}

.menu-toggle.active span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
}

/* =========================================================
   右侧抽屉（移动端）
   ========================================================= */
.drawer-mask {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

.drawer-enter-active,
.drawer-leave-active { transition: opacity 0.3s ease; }
.drawer-enter-from,
.drawer-leave-to { opacity: 0; }

.drawer {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1101;
    width: min(320px, 86vw);
    height: 100vh;
    padding: calc(var(--safe-area-top, 0px) + 1rem) 1.1rem
             calc(var(--safe-area-bottom, 0px) + 1rem);
    background: linear-gradient(160deg, rgba(20, 10, 35, 0.98), rgba(10, 10, 18, 0.98));
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: -20px 0 60px rgba(0, 0, 0, 0.5);
    transform: translateX(100%);
    transition: transform 0.35s var(--ease-smooth);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.drawer.open { transform: translateX(0); }

/* 抽屉用户头 */
.drawer-user {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.15), rgba(92, 107, 192, 0.12));
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition-property: transform, box-shadow, background, color;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}

.drawer-user:hover {
    border-color: rgba(235, 7, 238, 0.35);
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.22), rgba(92, 107, 192, 0.16));
}

.drawer-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(235, 7, 238, 0.5);
    flex-shrink: 0;
}

.drawer-avatar.guest-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.3rem;
}

.drawer-user-info { min-width: 0; flex: 1; }
.drawer-nick {
    color: #fff;
    font-size: 1.02rem;
    font-weight: 600;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.drawer-tip {
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.78rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
}
.drawer-tip i { font-size: 0.7rem; }

.drawer-section-title {
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.72rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 0 0.3rem;
    margin-top: 0.25rem;
}

/* 抽屉菜单网格 3 列 */
.drawer-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.drawer-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.9rem 0.3rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 0.78rem;
    font-weight: 500;
    transition-property: transform, box-shadow, background, color;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}

.drawer-grid-item i {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.7);
    transition-property: transform, box-shadow, background, color;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}

.drawer-grid-item:hover,
.drawer-grid-item:active {
    background: rgba(235, 7, 238, 0.12);
    border-color: rgba(235, 7, 238, 0.35);
    transform: translateY(-1px);
}

.drawer-grid-item.is-active {
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.22), rgba(165, 5, 222, 0.22));
    border-color: rgba(235, 7, 238, 0.5);
    color: #fff;
    box-shadow: 0 4px 16px rgba(235, 7, 238, 0.25);
}

.drawer-grid-item.is-active i {
    color: var(--primary);
}

.drawer-footer { margin-top: auto; padding-top: 0.5rem; }

.drawer-logout {
    width: 100%;
    padding: 0.85rem;
    border-radius: 12px;
    background: rgba(255, 70, 70, 0.08);
    border: 1px solid rgba(255, 70, 70, 0.2);
    color: #ff7a7a;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition-property: transform, box-shadow, background, color;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}

.drawer-logout:hover {
    background: rgba(255, 70, 70, 0.18);
    border-color: rgba(255, 70, 70, 0.4);
}

/* =========================================================
   底部 TabBar（移动端）
   ========================================================= */
.bottom-tab {
    display: none;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    padding: 0.3rem max(0.25rem, var(--safe-area-left, 0px))
             calc(0.3rem + var(--safe-area-bottom, 0px))
             max(0.25rem, var(--safe-area-right, 0px));
    /* 更深的背景避免 iOS 橡皮筋滚动时透底 */
    background: rgba(10, 10, 18, 0.94);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.35);
}

/* 顶部向上的渐变遮罩，让内容滚动到 TabBar 底部时有柔和过渡 */
.bottom-tab::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -20px;
    height: 20px;
    background: linear-gradient(to top, rgba(10, 10, 18, 0.5), rgba(10, 10, 18, 0));
    pointer-events: none;
}

.bottom-tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0.4rem 0.2rem;
    color: rgba(255, 255, 255, 0.55);
    text-decoration: none;
    font-size: 0.66rem;
    font-weight: 500;
    position: relative;
    transition: color 0.25s ease;
}

.bottom-tab-item i {
    font-size: 1.15rem;
    transition: transform 0.3s var(--ease-bounce);
}

.bottom-tab-item:active { transform: scale(0.95); }

/* 使用自定义 .is-active 避免首页误命中（首页 / 会把所有路由都算作 active） */
.bottom-tab-item.is-active {
    color: var(--primary-light);
}

.bottom-tab-item.is-active i {
    color: var(--primary);
    transform: translateY(-2px);
    filter: drop-shadow(0 0 6px rgba(235, 7, 238, 0.6));
}

.bottom-tab-item.is-active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 3px;
    border-radius: 0 0 3px 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent-pink));
    box-shadow: 0 2px 10px rgba(235, 7, 238, 0.6);
}

/* =========================================================
   响应式断点
   ========================================================= */
/* 平板 (769 ~ 1100)：文字隐藏，只留图标 */
@media screen and (max-width: 1100px) {
    .nav-inner { padding: 0 1.25rem; gap: 1rem; }
    .nav-item { padding: 0.5rem 0.7rem; }
    .nav-item span { display: none; }
    .nav-item i { font-size: 1.1rem; }
    .user-nickname { display: none; }
}

/* 移动端 (≤768px) */
@media screen and (max-width: 768px) {
    .nav-inner {
        padding: 0 max(0.9rem, var(--safe-area-left, 0px)) 0
                  max(0.9rem, var(--safe-area-right, 0px));
        gap: 0.6rem;
    }

    /* 隐藏桌面主菜单和桌面用户区 */
    .nav-links { display: none; }
    .desktop-only { display: none !important; }
    .mobile-only { display: flex !important; }

    .mobile-avatar-btn { display: inline-flex; }

    .logo-gem { font-size: 1.25rem; letter-spacing: 1px; }
    .logo-sub { display: none; }

    .top-nav {
        background: rgba(10, 10, 18, 0.82);
    }

    /* 底部 TabBar 仅在移动端出现 */
    .bottom-tab { display: flex; }
}

@media screen and (max-width: 380px) {
    .nav-inner { gap: 0.4rem; }
    .bottom-tab-item { font-size: 0.58rem; padding: 0.35rem 0.1rem; }
    .bottom-tab-item i { font-size: 1rem; }
}
</style>