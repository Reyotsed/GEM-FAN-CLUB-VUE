<template>
    <div class="page-background">
        <div class="user-page">
            <!-- 上部分：用户基本信息 -->
            <div class="user-info-section">
                <div class="user-info-container">
                    <div class="user-avatar-container">
                        <img :src="userInfo.avatar" alt="用户头像" class="user-avatar">
                    </div>
                    <div class="user-details">
                        <!-- 添加标题行容器，将昵称和编辑按钮放在同一行 -->
                        <div class="user-header">
                            <h1>{{ userInfo.nickName }}</h1>
                            <!-- 将编辑按钮放在右侧 -->
                            <button v-if="isCurrentUser" class="edit-profile-button" @click="openEditModal">
                                <span class="edit-icon">✏️</span> 编辑个人资料
                            </button>
                        </div>
                        <div class="user-meta">
                            <span class="user-id">ID: {{ userInfo.userId }}</span>
                            <span class="user-join-date">加入于: {{ userInfo.joinTime }}</span>
                            <span class="user-birthday">生日: {{ userInfo.birthday }}</span>
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
                        <i class="nav-icon">📝</i> 语录
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
                        <h2 class="content-title">语录</h2>
                        <div class="quote-list" v-if="userQuotes.length > 0">
                            <div v-for="quote in userQuotes" 
                                 :key="quote.quoteId" 
                                 class="quote-item"
                                 @click="goToQuoteDetail(quote.quoteId)">
                                <div class="quote-item-content-picture">
                                    <div class="quote-item-content-picture-item" v-if="quote.pictureList && quote.pictureList[0]">
                                        <img :src="quote.pictureList[0]" alt="quote-picture">
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
                            <p>暂无语录内容</p>
                        </div>
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

    <!-- 语录详情弹窗 -->
    <QuoteInfoPage
        v-model:visible="showQuoteDetail"
        :quote-id="selectedQuoteId"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';
import UploadModal from '@/components/upload/UploadModal.vue';
import EditProfileModal from '@/components/user/EditProfileModal.vue';
import QuoteInfoPage from '@/views/QuotePage/QuoteInfoPage.vue';
import { showToast, showConfirm } from '@/utils/toast';

interface UserInfo {
    userId: string;
    nickName: string;
    avatar: string;
    joinTime: string;
    birthday: string;
    personIntroduction: string;
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
    personIntroduction: ''
});
const isCurrentUser = ref(false);
const currentContent = ref('quote');
const showEditModal = ref(false);
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
            // 获取用户头像
            const avatarUrl = await apiClient.getImageUrl(userInfo.value.avatar);
            userInfo.value.avatar = avatarUrl;
            
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
                picturesRes.data.data.map(pic => apiClient.getImageUrl(pic.filePath))
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
    console.log('Edit quote:', quote);
};

// Delete quote with custom confirm dialog
const deleteQuote = async (quote) => {
    const confirmed = await showConfirm('确定要删除这条语录吗？', '删除确认');
    if (!confirmed) return;
    
    try {
        await apiClient.delete(`/quote/delete/${quote.quoteId}`);
        userQuotes.value = userQuotes.value.filter(q => q.quoteId !== quote.quoteId);
        showToast('语录已删除', 'success');
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
/* 新增加的背景容器 */
.page-background {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #fff6fe 0%, #f8f0ff 100%);
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    position: absolute;
    top: var(--nav-height, 70px);
    left: 0;
    right: 0;
    box-sizing: border-box;
}

.user-page {
    display: flex;
    flex-direction: column;
    width: 1200px;
    flex-shrink: 0;
    background-color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin: 0 auto;
    box-sizing: border-box;
}

/* 上部分：用户基本信息 */
.user-info-section {
    display: flex;
    width: 100%;
    background: linear-gradient(135deg, #eb07ee, #a505de);
    color: white;
    padding: 2.5rem 0;
    position: relative;
    overflow: hidden;
}

/* 添加装饰元素 */
.user-info-section::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
}

.user-info-section::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: -30px;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
}

.user-info-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    padding: 0 3rem;
    position: relative;
    z-index: 1;
}

.user-avatar-container {
    margin-right: 3rem;
    position: relative;
}

.user-avatar {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 5px solid white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    object-fit: cover;
    transition: all 0.3s ease;
}

/* 添加头像悬停效果 */
.user-avatar-container:hover .user-avatar {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.user-details {
    flex: 1;
}

.user-details h1 {
    font-size: 2.8rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    font-weight: 700;
}

.user-meta {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 1.8rem;
}

.user-meta span {
    margin-right: 2rem;
    font-size: 1.1rem;
    opacity: 0.9;
    padding: 0.3rem 0.8rem;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.5rem;
}

.user-bio {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 1.5rem;
    border-radius: 10px;
    max-width: 800px;
    backdrop-filter: blur(5px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.user-bio p {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.6;
}

/* 下部分：导航和内容区域 */
.content-section {
    display: flex;
    width: 100%;
    padding: 2rem;
    gap: 2rem;
    box-sizing: border-box;
    flex-shrink: 0;
    flex-grow: 0;
}

/* 左侧导航 */
.sidebar {
    width: 250px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    padding: 1.5rem 0;
    flex-shrink: 0;
    transition: all 0.3s ease;
}

.sidebar:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.nav-title {
    text-align: center;
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    color: #444;
    padding: 0 1rem;
    position: relative;
}

.nav-title::after {
    content: '';
    display: block;
    width: 50px;
    height: 3px;
    background: linear-gradient(to right, #eb07ee, #a505de);
    margin: 0.8rem auto 0;
    border-radius: 2px;
}

.nav-button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.9rem 1.5rem;
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    text-align: left;
    color: #555;
    transition: all 0.2s ease;
    margin-bottom: 0.2rem;
}

.nav-button:hover {
    background-color: #f8f8f8;
    color: #eb07ee;
    padding-left: 1.8rem;
}

.nav-button.active {
    background-color: #f0f0f0;
    color: #eb07ee;
    font-weight: bold;
    border-left: 4px solid #eb07ee;
}

.nav-icon {
    margin-right: 0.8rem;
    font-size: 1.3rem;
}

/* 右侧内容区域 */
.content-area {
    flex: 1;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    padding: 2rem;
    min-height: 600px;
    min-width: 800px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.content-area:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.content-title {
    font-size: 1.8rem;
    color: #333;
    padding-bottom: 1.2rem;
    border-bottom: 1px solid #eee;
    margin-bottom: 2rem;
    position: relative;
}

.content-title::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100px;
    height: 3px;
    background: linear-gradient(to right, #eb07ee, #a505de);
    border-radius: 2px;
}

/* 空内容提示 */
.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 500px;
    width: 100%;
    color: #999;
    background-color: #f9f9f9;
    border-radius: 10px;
    transition: all 0.3s ease;
    margin-top: 1rem;
}

.empty-content:hover {
    background-color: #f5f5f5;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.7;
}

.empty-content p {
    font-size: 1.3rem;
    font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1300px) {
    .user-page {
        width: 1000px;
    }
}

@media (max-width: 1100px) {
    .user-page {
        width: 900px;
    }
}

@media (max-width: 768px) {
    .page-background {
        padding: 0;
        min-height: 100vh;
    }
    
    .user-page {
        width: 100%;
        min-height: 100vh;
        border-radius: 0;
    }

    .content-section {
        flex-direction: column;
        padding: 1rem;
    }

    .sidebar {
        width: 100%;
        margin-bottom: 1rem;
        border-radius: 8px;
    }

    .content-area {
        width: 100%;
        padding: 1rem;
        min-width: unset;
    }

    .quote-list {
        grid-template-columns: 1fr;
        gap: 15px;
        padding: 10px;
    }

    .quote-item {
        width: 100%;
        margin-bottom: 1rem;
    }

    .user-info-container {
        flex-direction: column;
        align-items: center;
        padding: 1rem;
    }

    .user-avatar-container {
        margin: 0 0 1rem 0;
    }

    .user-details {
        width: 100%;
        text-align: center;
    }

    .user-meta {
        justify-content: center;
        flex-wrap: wrap;
    }

    .user-meta span {
        margin: 0.25rem;
    }

    .user-bio {
        width: 100%;
    }

    .nav-button {
        padding: 0.8rem 1rem;
        font-size: 1rem;
    }
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
        width: 140px;
        height: 140px;
    }
}

/* 添加上传容器样式 */
.upload-container {
    width: 100%;
    padding: 1rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 添加编辑按钮样式 */
.edit-profile-button {
    display: inline-flex;
    align-items: center;
    padding: 0.6rem 1.2rem;
    background-color: rgba(255, 255, 255, 0.3);
    border: none;
    border-radius: 20px;
    cursor: pointer;
    color: white;
    font-weight: 500;
    transition: all 0.2s ease;
    backdrop-filter: blur(5px);
}

.edit-profile-button:hover {
    background-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.edit-icon {
    margin-right: 0.5rem;
    font-size: 1.1rem;
}

/* 添加用户标题行样式 */
.user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    width: 100%;
}

.user-header h1 {
    margin: 0;
    font-size: 2.8rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    font-weight: 700;
}

.quote-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
}

.quote-item {
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    width: 100%;
    box-sizing: border-box;
}

.quote-item:hover {
    transform: translateY(-5px);
}

.quote-item-content-picture {
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    background-color: #f5f5f5;
}

.quote-item-content-picture-item {
    width: 100%;
    height: 100%;
}

.quote-item-content-picture-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.quote-item-content {
    padding: 15px;
}

.quote-item-content-text {
    font-size: 1rem;
    color: #333;
    line-height: 1.5;
    margin-bottom: 10px;
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
    border-top: 1px solid #eee;
    background-color: #f9f9f9;
}

.quote-meta {
    display: flex;
    gap: 15px;
    color: #666;
    font-size: 0.9rem;
}

.delete-btn {
    background: none;
    border: none;
    color: #ff4444;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    transition: all 0.2s;
    font-size: 1.2rem;
}

.delete-btn:hover {
    background: #ffebee;
}

.quote-content {
    width: 100%;
    min-height: 500px;
}
</style>