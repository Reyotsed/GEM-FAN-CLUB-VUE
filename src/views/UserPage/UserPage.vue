<template>
    <div class="page-background">
        <div class="user-page">
            <!-- 上部分：用户基本信息 -->
            <div class="user-info-section">
                <div class="user-info-container">
                    <div class="user-avatar-container" @click="showCard">
                        <img :src="userInfo.avatar" alt="用户头像" class="user-avatar">
                    </div>
                    <div class="user-details">
                        <!-- 添加标题行容器，将昵称和编辑按钮放在同一行 -->
                        <div class="user-header">
                            <div class="user-name-wrap">
                                <h1>{{ userInfo.nickName }}</h1>
                            </div>
                            <!-- 将编辑按钮放在右侧 -->
                            <div v-if="isCurrentUser" class="profile-actions">
                                <button class="fan-card-button" @click="openFanCardModal">
                                    <span class="edit-icon">🎴</span> 粉丝档案卡
                                </button>
                                <button class="edit-profile-button" @click="openEditModal">
                                    <span class="edit-icon">✏️</span> 编辑个人资料
                                </button>
                            </div>
                        </div>
                        <p v-if="userInfo.fanBio" class="fan-bio">“{{ userInfo.fanBio }}”</p>
                        <div class="user-meta">
                            <span class="user-join-date">加入于: {{ userInfo.joinTime }}</span>
                            <span class="user-birthday">生日: {{ userInfo.birthday }}</span>
                            <span v-if="userInfo.fanSinceYear" class="fan-since">🌟 入坑年份: {{ userInfo.fanSinceYear }}（{{ fanYears }}年老粉）</span>
                            <span v-if="userInfo.favoriteSong" class="fan-song">🎵 本命: {{ userInfo.favoriteSong }}</span>
                        </div>
                        <div class="user-bio">
                            <p>{{ userInfo.personIntroduction || '这个人很懒，什么都没有留下...' }}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 下部分：导航和内容区域 -->
            <div class="content-section">
                <!-- 左侧导航 -->
                <div class="sidebar">
                    <div class="nav-title">用户中心</div>
                    <button 
                        class="nav-button" 
                        :class="{ active: currentContent === 'quote' }" 
                        @click="switchContent('quote')"
                    >
                        <i class="nav-icon">📝</i> 广场
                    </button>
                    <button 
                        class="nav-button" 
                        :class="{ active: currentContent === 'video' }" 
                        @click="switchContent('video')"
                    >
                        <i class="nav-icon">🎬</i> 视频
                    </button>
                    <button 
                        class="nav-button" 
                        :class="{ active: currentContent === 'post' }" 
                        v-if="isCurrentUser" 
                        @click="switchContent('post')"
                    >
                        <i class="nav-icon">✏️</i> 投稿
                    </button>
                    <button
                        class="nav-button"
                        :class="{ active: currentContent === 'guess' }"
                        v-if="isCurrentUser"
                        @click="switchContent('guess')"
                    >
                        <i class="nav-icon">🎧</i> 猜歌
                    </button>
                </div>
                
                <!-- 右侧内容区域 -->
                <div class="content-area">
                    <!-- 投稿模块 - 只有当用户登录且是当前用户时显示 -->
                    <div v-if="isCurrentUser && currentContent === 'post'" class="post-section">
                        <h2 class="content-title">发布新内容</h2>
                        <div class="upload-container">
                            <UploadModal />
                        </div>
                    </div>
                    
                    <!-- 语录内容 -->
                    <div v-if="currentContent === 'quote'" class="quote-content">
                        <h2 class="content-title">广场</h2>
                        <div class="quote-list" v-if="userQuotes.length > 0">
                            <div v-for="quote in userQuotes" 
                                 :key="quote.quoteId" 
                                 class="quote-item"
                                 @click="goToQuoteDetail(quote.quoteId)">
                                <div class="quote-item-content-picture">
                                    <div class="quote-item-content-picture-item" v-if="quote.pictureList && quote.pictureList[0]">
                                        <img :src="quote.pictureList[0]" alt="quote-picture" loading="lazy" decoding="async">
                                    </div>
                                </div>
                                <div class="quote-item-content">
                                    <div class="quote-item-content-text">
                                        {{ quote.content }}
                                    </div>
                                </div>
                                <div class="quote-item-footer">
                                    <div class="quote-meta">
                                        <span class="quote-time">{{ formatTime(quote.createdAt) }}</span>
                                        <span class="quote-likes">❤️ {{ quote.likesCount }}</span>
                                    </div>
                                    <button class="delete-btn" 
                                            @click.stop="deleteQuote(quote)" 
                                            v-if="isCurrentUser">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="empty-content" v-else>
                            <div class="empty-icon">📝</div>
                            <p>暂无广场内容</p>
                        </div>
                    </div>
                    
                    <!-- 每日猜歌战绩（仅本人） -->
                    <div v-if="isCurrentUser && currentContent === 'guess'" class="guess-content">
                        <h2 class="content-title">每日猜歌战绩</h2>
                        <div v-if="guessLoading" class="gp-empty">加载中…</div>
                        <div v-else-if="!guess" class="gp-empty">
                            战绩加载失败
                            <button class="gp-retry" @click="loadGuessProfile">重试</button>
                        </div>
                        <template v-else>
                            <div v-if="!guess.played" class="gp-empty">
                                还没有参与过每日猜歌，登录状态下完成一局就会开始记录
                                <router-link class="gp-go" to="/games/daily">去玩今天这一期</router-link>
                            </div>
                            <template v-else>
                                <div class="gp-nums">
                                    <div><b>{{ guess.curStreak }}</b><span>当前连胜</span></div>
                                    <div><b>{{ guess.maxStreak }}</b><span>最高连胜</span></div>
                                    <div><b>{{ guess.played }}</b><span>参与天数</span></div>
                                    <div><b>{{ guess.winRate }}<small>%</small></b><span>胜率</span></div>
                                </div>

                                <div class="gp-block">
                                    <h4>近 30 天</h4>
                                    <ol class="gp-cal">
                                        <li v-for="d in guess.calendar" :key="d.date" :class="guessDayClass(d)" :title="guessDayTitle(d)"></li>
                                    </ol>
                                    <div class="gp-legend">
                                        <span><i class="is-win"></i>猜中</span>
                                        <span><i class="is-lose"></i>没猜中</span>
                                        <span><i></i>未参与</span>
                                    </div>
                                </div>

                                <div class="gp-block">
                                    <h4>猜中用了几次</h4>
                                    <div v-for="(n, idx) in guess.distribution" :key="idx" class="gp-dist-row">
                                        <span class="gp-dist-label">{{ idx + 1 }} 次</span>
                                        <span class="gp-dist-bar"><i :style="{ width: guessBar(n) }"></i></span>
                                        <span class="gp-dist-num">{{ n }}</span>
                                    </div>
                                </div>
                            </template>
                        </template>
                    </div>

                    <!-- 视频内容 -->
                    <div v-if="currentContent === 'video'" class="video-content">
                        <h2 class="content-title">视频</h2>
                        <div class="empty-content" v-if="true">
                            <div class="empty-icon">🎬</div>
                            <p>暂无视频内容</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 引入编辑个人信息模态框 -->
    <EditProfileModal 
        :is-visible="showEditModal" 
        :user-info="userInfo" 
        @close="closeEditModal" 
        @updated="handleProfileUpdated"
    />

    <!-- 粉丝档案卡入口（换背景） -->
    <FanCardModal
        :is-visible="showFanCardModal"
        :user-info="userInfo"
        @close="showFanCardModal = false"
        @updated="handleFanCardUpdated"
    />

    <!-- 语录详情弹窗 -->
    <QuoteInfoPage
        v-model:visible="showQuoteDetail"
        :quote-id="selectedQuoteId"
    />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';
import UploadModal from '@/components/upload/UploadModal.vue';
import EditProfileModal from '@/components/user/EditProfileModal.vue';
import FanCardModal from '@/components/user/FanCardModal.vue';
import QuoteInfoPage from '@/views/QuotePage/QuoteInfoPage.vue';
import { showToast, showConfirm } from '@/utils/toast';
import { showUserCard } from '@/utils/userCardStore';

interface UserInfo {
    userId: string;
    nickName: string;
    avatar: string;
    joinTime: string;
    birthday: string;
    personIntroduction: string;
    fanSinceYear?: number | null;
    favoriteSong?: string | null;
    fanBio?: string | null;
    fanTag?: string | null;
    posterBg?: string | null;
    mark?: {
        id?: number | null;
        city?: string | null;
        province?: string | null;
        message?: string | null;
        rank?: number | null;
        total?: number | null;
    } | null;
}

interface Quote {
    quoteId: string;
    content: string;
    createdAt: string;
    likesCount: number;
    pictureList: string[];
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const userInfo = ref<UserInfo>({
    userId: '',
    nickName: '',
    avatar: '',
    joinTime: '',
    birthday: '',
    personIntroduction: '',
    fanSinceYear: null,
    favoriteSong: '',
    fanBio: '',
    fanTag: ''
});

// 计算入坑年数
const fanYears = computed(() => {
    const since = userInfo.value.fanSinceYear;
    if (!since) return 0;
    const diff = new Date().getFullYear() - Number(since);
    return diff < 0 ? 0 : diff;
});
const isCurrentUser = ref(false);
const currentContent = ref('quote');
const showEditModal = ref(false);
const showFanCardModal = ref(false);
const userQuotes = ref<Quote[]>([]);
const showQuoteDetail = ref(false);
const selectedQuoteId = ref('');

// 格式化时间的函数
const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
};

// 打开编辑模态框
const openEditModal = () => {
    showEditModal.value = true;
};

// 打开粉丝档案卡入口
const openFanCardModal = () => {
    showFanCardModal.value = true;
};

// 粉丝档案卡背景更新后
const handleFanCardUpdated = (bgUrl: string) => {
    userInfo.value.posterBg = bgUrl;
};

// 点击头像弹出粉丝档案卡
const showCard = () => {
    if (userInfo.value.userId) showUserCard(userInfo.value.userId);
};

// 关闭编辑模态框
const closeEditModal = () => {
    showEditModal.value = false;
};

// 个人信息更新后的处理函数
const handleProfileUpdated = () => {
    // 重新加载用户信息
    loadUserInfo(route.query.id);
};

// 加载用户信息的函数
const loadUserInfo = async (userId) => {
    if (userId) {
        try {
            const res = await apiClient.get(`/user/getUserInfo`, {
                params: { userId }
            });
            userInfo.value = res.data.data;
            // 判断当前登录用户是否是该用户
            isCurrentUser.value = userStore.userId === userId;
            // 获取用户头像（缩略图 160px）
            const avatarUrl = await apiClient.getImageUrl(userInfo.value.avatar, 160);
            userInfo.value.avatar = avatarUrl;

            // 仅在查看自己主页时附带报到信息（后端 /fan-map/mine 返回当前登录用户的报到记录）
            if (isCurrentUser.value) {
                try {
                    const [mineRes, statsRes] = await Promise.all([
                        apiClient.get('/fan-map/mine'),
                        apiClient.get('/fan-map/stats', { params: { recentLimit: 1 } }),
                    ]);
                    const mine = mineRes.data?.data;
                    const stats = statsRes.data?.data;
                    if (mine?.marked) {
                        userInfo.value.mark = {
                            id: mine.id,
                            city: mine.city,
                            province: mine.province,
                            message: mine.message,
                            total: stats?.total || 0,
                            rank: null,
                        };
                    } else {
                        userInfo.value.mark = null;
                    }
                } catch (_) { /* 报到信息拉取失败不阻断主页加载 */ }
            }

            // 加载用户语录
            await loadUserQuotes();

            // 默认显示语录标签
            currentContent.value = 'quote';
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }
};

// 加载用户语录的函数
const loadUserQuotes = async () => {
    try {
        const res = await apiClient.get('/quote/userQuotes', {
            params: { userId: route.query.id }
        });
        const quotesData = res.data.data;
        
        // 为每个语录加载图片
        const enrichedQuotes = await Promise.all(quotesData.map(async (quote) => {
            const picturesRes = await apiClient.get('/quote/quotePicture', {
                params: { quoteId: quote.quoteId }
            });
            
            const pictureUrls = await Promise.all(
                picturesRes.data.data.map(pic => apiClient.getImageUrl(pic.filePath, 400))
            );
            
            return {
                ...quote,
                pictureList: pictureUrls
            };
        }));
        
        userQuotes.value = enrichedQuotes;
    } catch (error) {
        console.error('Error loading user quotes:', error);
    }
};

// 编辑语录的函数
const editQuote = (quote) => {
    // TODO: 实现编辑功能
};

// Delete quote with custom confirm dialog
const deleteQuote = async (quote) => {
        const confirmed = await showConfirm('确定要删除这条广场帖子吗？', '删除确认');
    if (!confirmed) return;
    
    try {
        await apiClient.delete(`/quote/delete/${quote.quoteId}`, {
            params: { userId: userStore.userId }
        });
        userQuotes.value = userQuotes.value.filter(q => q.quoteId !== quote.quoteId);
        showToast('帖子已删除', 'success');
    } catch (error) {
        console.error('Error deleting quote:', error);
        showToast('删除失败', 'error');
    }
};

// 监听路由参数变化
watch(
    () => route.query.id,
    (newUserId) => {
        if (newUserId) {
            loadUserInfo(newUserId);
        }
    },
    { immediate: true } // 立即执行一次
);

// 监听内容切换
watch(() => currentContent.value, (newVal) => {
    if (newVal === 'quote') {
        loadUserQuotes();
    }
});

// 切换内容区域
const switchContent = (contentType) => {
    currentContent.value = contentType;
    if (contentType === 'guess' && !guess.value && !guessLoading.value) loadGuessProfile();
};

// ---------- 每日猜歌战绩（仅本人，数据来自 MySQL 永久存档） ----------
const guess = ref(null);
const guessLoading = ref(false);

const loadGuessProfile = async () => {
    guessLoading.value = true;
    try {
        const res = await apiClient.get('/daily-guess/profile', { params: { days: 30 } });
        guess.value = res.data.code === 200 ? res.data.data : null;
    } catch (_) {
        guess.value = null;
    } finally {
        guessLoading.value = false;
    }
};

const guessDayClass = (d) => ({
    'is-win': d.r && d.r.startsWith('w'),
    'is-lose': d.r === 'l',
});
const guessDayTitle = (d) => {
    const state = !d.r ? '未参与' : d.r === 'l' ? '没猜中' : `${d.r.slice(1)} 次猜中`;
    return `${d.date} · ${state}`;
};
const guessBar = (n) => {
    const max = Math.max(1, ...(guess.value?.distribution || [0]));
    return n ? `${Math.max(6, (n / max) * 100)}%` : '0%';
};

// 添加跳转到详情页的方法
const goToQuoteDetail = (quoteId: string) => {
    selectedQuoteId.value = String(quoteId);
    showQuoteDetail.value = true;
};

onMounted(() => {
  // 确保页面滚动到顶部
  window.scrollTo(0, 0);
});
</script>

<style scoped>
/* 页面背景 - 暗色主题 */
.page-background {
    width: 100%;
    min-height: 100vh;
    background: transparent;
    margin: 0;
    padding: var(--page-padding-y) 0 var(--page-padding-bottom);
    display: flex;
    flex-direction: column;
    position: relative;
    top: auto;
    left: 0;
    right: 0;
    box-sizing: border-box;
}

.user-page {
    display: flex;
    flex-direction: column;
    width: min(var(--container-max), calc(100% - 32px));
    flex-shrink: 0;
    background: var(--surface-bg);
    backdrop-filter: var(--glass-blur);
    border-radius: var(--card-radius);
    border: 1px solid var(--surface-border);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    margin: 0 auto;
    box-sizing: border-box;
}

/* 上部分：用户基本信息 - 紫色渐变 banner */
.user-info-section {
    display: flex;
    width: 100%;
    background: linear-gradient(135deg, rgba(200, 80, 232, 0.4), rgba(139, 47, 192, 0.5));
    color: white;
    padding: var(--space-10) 0;
    position: relative;
    overflow: hidden;
}

/* 装饰元素 */
.user-info-section::before {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    border-radius: 50%;
}

.user-info-section::after {
    content: '';
    position: absolute;
    bottom: -50px;
    left: -50px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(200, 80, 232, 0.15) 0%, transparent 70%);
    border-radius: 50%;
}

.user-info-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    padding: 0 var(--space-12);
    position: relative;
    z-index: 1;
}

.user-avatar-container {
    margin-right: var(--space-12);
    position: relative;
    cursor: pointer;
}

.user-avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 30px rgba(200, 80, 232, 0.3);
    object-fit: cover;
    transition-property: transform, opacity;
  transition-duration: 0.4s;
  transition-timing-function: ease;
}

.user-avatar-container:hover .user-avatar {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 12px 40px rgba(200, 80, 232, 0.5);
}

.user-details {
    flex: 1;
}

.user-details h1 {
    font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
    margin-bottom: 1rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    font-weight: 700;
    color: #fff;
}

.user-meta {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: var(--space-6);
    gap: var(--space-2);
}

.user-meta span {
    margin-right: 1rem;
    font-size: 0.95rem;
    opacity: 0.9;
    padding: 0.3rem 0.9rem;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-pill);
    display: inline-flex;
    align-items: center;
    backdrop-filter: blur(4px);
    color: rgba(255, 255, 255, 0.9);
}

.user-bio {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: var(--space-5) var(--space-6);
    border-radius: var(--radius-md);
    max-width: 800px;
    backdrop-filter: blur(8px);
}

.user-bio p {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.85);
}

/* 下部分：导航和内容区域 */
.content-section {
    display: flex;
    width: 100%;
    padding: var(--space-6);
    gap: var(--space-6);
    box-sizing: border-box;
    flex-shrink: 0;
    flex-grow: 0;
}

/* 左侧导航 - 暗色毛玻璃 */
.sidebar {
    width: 220px;
    background: var(--surface-bg);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    padding: 1.5rem 0;
    flex-shrink: 0;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: var(--ease-out);
}

.sidebar:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
}

.nav-title {
    text-align: center;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1.2rem;
    color: rgba(255, 255, 255, 0.8);
    padding: 0 1rem;
    position: relative;
}

.nav-title::after {
    content: '';
    display: block;
    width: 40px;
    height: 2px;
    background: linear-gradient(to right, var(--primary, #D946EF), var(--primary-dark, #A21CAF));
    margin: 0.7rem auto 0;
    border-radius: 2px;
}

.nav-button {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: var(--button-height);
    padding: 0.85rem 1.5rem;
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    text-align: left;
    color: rgba(255, 255, 255, 0.6);
    transition-property: transform, box-shadow, background, color;
  transition-duration: 0.25s;
  transition-timing-function: ease;
    margin-bottom: 0.15rem;
}

.nav-button:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-light, #f3caff);
    padding-left: 1.8rem;
}

.nav-button.active {
    background: rgba(200, 80, 232, 0.12);
    color: var(--primary-light, #f3caff);
    font-weight: 600;
    border-left: 3px solid var(--primary, #D946EF);
    box-shadow: inset 0 0 20px rgba(200, 80, 232, 0.05);
}

.nav-icon {
    margin-right: 0.8rem;
    font-size: 1.2rem;
}

/* 右侧内容区域 - 暗色毛玻璃 */
.content-area {
    flex: 1;
    background: var(--surface-bg);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    padding: var(--card-padding);
    min-height: 600px;
    min-width: 0;
    overflow: hidden;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: var(--ease-out);
}

.content-area:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.08);
}

.content-title {
    font-size: 1.6rem;
    color: rgba(255, 255, 255, 0.9);
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 1.5rem;
    position: relative;
}

.content-title::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 80px;
    height: 2px;
    background: linear-gradient(to right, var(--primary, #D946EF), var(--primary-dark, #A21CAF));
    border-radius: 2px;
}

/* 空内容提示 */
.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    width: 100%;
    color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
    margin-top: 1rem;
}

.empty-content:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
}

.empty-icon {
    font-size: 3.5rem;
    margin-bottom: 1.2rem;
    opacity: 0.5;
}

.empty-content p {
    font-size: 1.2rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
}

/* 响应式设计 */
@media (max-width: 1300px) {
    .user-page {
        width: 1000px;
    }
}

@media (max-width: 1100px) {
    .user-page {
        width: 95%;
    }
}

@media (max-width: 768px) {
    .page-background {
        padding: var(--page-padding-y) 0 var(--page-padding-bottom);
        min-height: 100vh;
    }

    .user-page {
        width: 100%;
        min-height: auto;
        border-radius: 0;
        border: none;
        box-shadow: none;
    }

    /* Banner: 紧凑卡片式 */
    .user-info-section {
        padding: 1.5rem 0 1.25rem;
        background: linear-gradient(160deg, rgba(200, 80, 232, 0.45) 0%, rgba(120, 5, 222, 0.55) 60%, rgba(40, 12, 70, 0.5) 100%);
    }

    .user-info-section::before {
        top: -120px;
        right: -120px;
        width: 220px;
        height: 220px;
    }

    .user-info-section::after {
        bottom: -80px;
        left: -80px;
        width: 180px;
        height: 180px;
    }

    .user-info-container {
        flex-direction: column;
        align-items: center;
        padding: 0 1.25rem;
        gap: 1rem;
    }

    .user-avatar-container {
        margin: 0;
    }

    .user-avatar {
        width: 96px;
        height: 96px;
        border-width: 3px;
        box-shadow: 0 6px 24px rgba(200, 80, 232, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.06);
    }

    .user-details {
        width: 100%;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.85rem;
    }

    .user-header {
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 0;
        width: 100%;
        align-items: center;
    }

    .user-name-wrap {
        justify-content: center;
        gap: 0.5rem;
    }

    .user-details h1,
    .user-header h1 {
        font-size: 1.5rem;
        margin: 0;
        line-height: 1.25;
        letter-spacing: 0.3px;
    }

    .fan-tag {
        padding: 0.22rem 0.7rem;
        font-size: 0.72rem;
        letter-spacing: 0;
    }

    .fan-bio {
        margin: 0;
        font-size: 0.88rem;
        padding: 0 0.5rem;
        line-height: 1.55;
        max-width: 100%;
        color: rgba(255,255,255,0.78);
    }

    /* 操作按钮：紧凑胶囊行 */
    .profile-actions {
        width: 100%;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: nowrap;
        margin-top: 0.15rem;
    }

    .fan-card-button,
    .edit-profile-button {
        flex: 1 1 0;
        max-width: 50%;
        justify-content: center;
        padding: 0.5rem 0.6rem;
        font-size: 0.8rem;
        border-radius: 999px;
        white-space: nowrap;
        min-height: 34px;
    }

    .edit-icon {
        margin-right: 0.3rem;
        font-size: 0.9rem;
    }

    /* meta 标签：横向滚动避免换行错位 */
    .user-meta {
        justify-content: flex-start;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding: 0.15rem 0 0.4rem;
        margin: 0.25rem -1.25rem 0;
        width: calc(100% + 2.5rem);
        gap: 0.4rem;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        scroll-padding: 1.25rem;
    }

    .user-meta::-webkit-scrollbar { display: none; }

    .user-meta::before,
    .user-meta::after {
        content: '';
        flex: 0 0 0.85rem;
    }

    .user-meta span {
        margin: 0;
        font-size: 0.74rem;
        padding: 0.25rem 0.75rem;
        white-space: nowrap;
        flex-shrink: 0;
        line-height: 1.4;
    }

    .user-bio {
        width: 100%;
        padding: 0.75rem 0.95rem;
        border-radius: 12px;
        margin-top: 0.15rem;
    }

    .user-bio p {
        font-size: 0.86rem;
        line-height: 1.6;
    }

    /* 内容区 */
    .content-section {
        flex-direction: column;
        padding: 0.85rem 0.85rem 1rem;
        gap: 0.85rem;
    }

    /* sidebar: tab 风格 */
    .sidebar {
        width: 100%;
        margin-bottom: 0;
        border-radius: 14px;
        display: flex;
        flex-wrap: nowrap;
        align-items: stretch;
        padding: 0.35rem;
        gap: 0.25rem;
        background: rgba(255,255,255,0.04);
        position: sticky;
        top: 0;
        z-index: 5;
        backdrop-filter: blur(12px);
    }

    .nav-title { display: none; }

    .nav-button {
        flex: 1 1 0;
        justify-content: center;
        padding: 0.6rem 0.3rem;
        border-radius: 10px;
        font-size: 0.85rem;
        margin: 0;
        min-height: 36px;
    }

    .nav-button:hover {
        padding-left: 0.3rem;
    }

    .nav-button.active {
        border-left: none;
        background: linear-gradient(135deg, rgba(200, 80, 232, 0.28), rgba(120, 5, 222, 0.28));
        border: 1px solid rgba(200, 80, 232, 0.35);
        box-shadow: 0 4px 14px rgba(200, 80, 232, 0.18);
    }

    .nav-icon {
        margin-right: 0.3rem;
        font-size: 1rem;
    }

    .content-area {
        width: 100%;
        padding: 1rem 0.9rem 1.25rem;
        min-width: unset;
        min-height: 360px;
        border-radius: 14px;
    }

    .content-title {
        font-size: 1.1rem;
        padding-bottom: 0.6rem;
        margin-bottom: 0.85rem;
    }

    .quote-list {
        grid-template-columns: 1fr;
        gap: 0.85rem;
        padding: 0;
    }

    .quote-item {
        width: 100%;
        border-radius: 14px;
    }

    .quote-item-content { padding: 0.75rem 0.9rem; }
    .quote-item-content-text { font-size: 0.88rem; -webkit-line-clamp: 2; }
    .quote-item-footer { padding: 0.5rem 0.9rem; }
    .quote-meta { font-size: 0.76rem; gap: 0.7rem; }
}

/* 极窄屏（小屏手机 / 折叠屏内屏窄态） */
@media (max-width: 380px) {
    .user-info-section { padding: 1.25rem 0 1.1rem; }
    .user-info-container { padding: 0 1rem; gap: 0.85rem; }

    .user-avatar { width: 84px; height: 84px; }

    .user-details h1,
    .user-header h1 { font-size: 1.35rem; }

    .fan-bio { font-size: 0.82rem; }

    .fan-card-button,
    .edit-profile-button {
        padding: 0.45rem 0.4rem;
        font-size: 0.74rem;
        min-height: 32px;
    }

    .user-meta { margin: 0.2rem -1rem 0; width: calc(100% + 2rem); }
    .user-meta span { font-size: 0.7rem; padding: 0.2rem 0.6rem; }

    .user-bio { padding: 0.7rem 0.85rem; }
    .user-bio p { font-size: 0.82rem; }

    .content-section { padding: 0.6rem; gap: 0.6rem; }
    .content-area { padding: 0.85rem 0.75rem; }
    .nav-button { font-size: 0.76rem; padding: 0.55rem 0.25rem; }
}

/* 平板端样式优化 */
@media (min-width: 769px) and (max-width: 1024px) {
    .user-page {
        width: 95%;
    }

    .quote-list {
        grid-template-columns: repeat(2, 1fr);
    }

    .user-avatar {
        width: 130px;
        height: 130px;
    }
}

/* 上传容器 */
.upload-container {
    width: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
}

/* 编辑按钮 */
.edit-profile-button {
    display: inline-flex;
    align-items: center;
    min-height: var(--button-height);
    padding: 0 var(--space-5);
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-pill);
    cursor: pointer;
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
    backdrop-filter: blur(5px);
}

.edit-profile-button:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(200, 80, 232, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
}

/* 粉丝档案卡入口按钮 */
.profile-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.fan-card-button {
    display: inline-flex;
    align-items: center;
    min-height: var(--button-height);
    padding: 0 var(--space-5);
    border: none;
    border-radius: var(--radius-pill);
    cursor: pointer;
    color: #fff;
    font-weight: 600;
    font-size: 0.9rem;
    background: linear-gradient(135deg, rgba(200, 80, 232, 0.85), rgba(120, 5, 222, 0.85));
    box-shadow: 0 4px 14px rgba(200, 80, 232, 0.35);
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.fan-card-button:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
    box-shadow: 0 6px 20px rgba(200, 80, 232, 0.5);
}

.edit-icon {
    margin-right: 0.5rem;
    font-size: 1rem;
}

/* 用户标题行 */
.user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    width: 100%;
}

.user-header h1 {
    margin: 0;
    font-size: 2.6rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    font-weight: 700;
}

.user-name-wrap {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
}

.fan-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #D946EF, #A21CAF);
    border-radius: 20px;
    box-shadow: 0 4px 14px rgba(200, 80, 232, 0.35);
    letter-spacing: 0.5px;
}

.fan-bio {
    margin: 0 0 1rem 0;
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.85);
    font-style: italic;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
}

.user-meta .fan-since,
.user-meta .fan-song {
    background: rgba(200, 80, 232, 0.18);
    border-color: rgba(200, 80, 232, 0.35);
    color: #fbe6ff;
}

/* 语录列表 - 暗色卡片 */
.quote-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-5);
    padding: var(--space-1);
    width: 100%;
    box-sizing: border-box;
}

.quote-item {
    background: var(--surface-bg);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: var(--ease-out);
    width: 100%;
    box-sizing: border-box;
}

.quote-item:hover {
    transform: translateY(-4px);
    background: var(--surface-bg-hover);
    border-color: var(--surface-border-hover);
    box-shadow: var(--shadow-primary);
}

.quote-item-content-picture {
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.03);
}

.quote-item-content-picture-item {
    width: 100%;
    height: 100%;
}

.quote-item-content-picture-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
}

.quote-item:hover .quote-item-content-picture-item img {
    transform: scale(1.05);
}

.quote-item-content {
    padding: 15px;
}

.quote-item-content-text {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.quote-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.15);
}

.quote-meta {
    display: flex;
    gap: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
}

.delete-btn {
    background: none;
    border: none;
    color: rgba(255, 68, 68, 0.7);
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 8px;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.2s;
  transition-timing-function: ease;
    font-size: 1.1rem;
}

.delete-btn:hover {
    background: rgba(255, 68, 68, 0.15);
    color: #ff4444;
}

.quote-content {
    width: 100%;
    min-height: 400px;
}

/* ========== 每日猜歌战绩（单一紫色，绿/红不使用） ========== */
.guess-content { width: 100%; min-height: 400px; }
.gp-empty {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    padding: 48px 16px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.5); text-align: center;
}
.gp-go, .gp-retry {
    padding: 9px 18px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
    color: #fff; text-decoration: none; border: none;
    background: linear-gradient(135deg, #a78bfa, #7c3aed);
}

.gp-nums { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 26px; }
.gp-nums > div { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 4px 0; }
.gp-nums > div + div { border-left: 1px solid rgba(255, 255, 255, 0.08); }
.gp-nums b {
    font-size: 2rem; line-height: 1; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums;
}
.gp-nums b small { font-size: 0.9rem; font-weight: 700; margin-left: 1px; color: rgba(255, 255, 255, 0.6); }
.gp-nums span { font-size: 0.74rem; color: rgba(255, 255, 255, 0.45); }

.gp-block { margin-bottom: 24px; }
.gp-block h4 { margin: 0 0 12px; font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.5); }

.gp-cal {
    list-style: none; margin: 0; padding: 0;
    display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; max-width: 420px;
}
.gp-cal li {
    aspect-ratio: 1; border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.12);
}
.gp-cal li.is-win { background: #a78bfa; border-color: #a78bfa; }
.gp-cal li.is-lose { border-style: dashed; border-color: rgba(255, 255, 255, 0.4); }
.gp-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 0.72rem; color: rgba(255, 255, 255, 0.45); }
.gp-legend span { display: inline-flex; align-items: center; gap: 6px; }
.gp-legend i { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.12); }
.gp-legend i.is-win { background: #a78bfa; border-color: #a78bfa; }
.gp-legend i.is-lose { border-style: dashed; border-color: rgba(255, 255, 255, 0.4); }

.gp-dist-row {
    display: grid; grid-template-columns: 40px minmax(0, 1fr) 28px; align-items: center; gap: 10px;
    max-width: 420px; margin-bottom: 6px; font-size: 0.78rem; font-variant-numeric: tabular-nums;
}
.gp-dist-label { text-align: right; color: rgba(255, 255, 255, 0.5); }
.gp-dist-bar { height: 8px; border-radius: 99px; background: rgba(255, 255, 255, 0.06); overflow: hidden; }
.gp-dist-bar i { display: block; height: 100%; border-radius: 99px; background: #a78bfa; transition: width 0.6s ease; }
.gp-dist-num { text-align: right; color: rgba(255, 255, 255, 0.6); }

@media (max-width: 640px) {
    .gp-nums b { font-size: 1.5rem; }
    .gp-cal { grid-template-columns: repeat(10, 1fr); gap: 4px; }
}

</style>
