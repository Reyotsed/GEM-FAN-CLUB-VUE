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
            // 获取用户头像（缩略图 160px，个人主页头像较大）
            const avatarUrl = await apiClient.getImageUrl(userInfo.value.avatar, 160);
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
/* 页面背景 - 暗色主题 */
.page-background {
    width: 100%;
    min-height: 100vh;
    background: var(--bg-dark, #0a0a12);
    margin: 0;
    padding: 2rem 0;
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
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    margin: 0 auto;
    box-sizing: border-box;
}

/* 上部分：用户基本信息 - 紫色渐变 banner */
.user-info-section {
    display: flex;
    width: 100%;
    background: linear-gradient(135deg, rgba(235, 7, 238, 0.4), rgba(165, 5, 222, 0.5));
    color: white;
    padding: 2.5rem 0;
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
    background: radial-gradient(circle, rgba(235, 7, 238, 0.15) 0%, transparent 70%);
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
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 30px rgba(235, 7, 238, 0.3);
    object-fit: cover;
    transition: all 0.4s ease;
}

.user-avatar-container:hover .user-avatar {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 12px 40px rgba(235, 7, 238, 0.5);
}

.user-details {
    flex: 1;
}

.user-details h1 {
    font-size: 2.6rem;
    margin-bottom: 1rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    font-weight: 700;
    color: #fff;
}

.user-meta {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    gap: 0.5rem;
}

.user-meta span {
    margin-right: 1rem;
    font-size: 0.95rem;
    opacity: 0.9;
    padding: 0.3rem 0.9rem;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    backdrop-filter: blur(4px);
    color: rgba(255, 255, 255, 0.9);
}

.user-bio {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.2rem 1.5rem;
    border-radius: 12px;
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
    padding: 1.5rem;
    gap: 1.5rem;
    box-sizing: border-box;
    flex-shrink: 0;
    flex-grow: 0;
}

/* 左侧导航 - 暗色毛玻璃 */
.sidebar {
    width: 220px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
    padding: 1.5rem 0;
    flex-shrink: 0;
    transition: all 0.3s ease;
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
    background: linear-gradient(to right, var(--primary, #eb07ee), var(--primary-dark, #a505de));
    margin: 0.7rem auto 0;
    border-radius: 2px;
}

.nav-button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.85rem 1.5rem;
    background-color: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    text-align: left;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.25s ease;
    margin-bottom: 0.15rem;
}

.nav-button:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-light, #f3caff);
    padding-left: 1.8rem;
}

.nav-button.active {
    background: rgba(235, 7, 238, 0.12);
    color: var(--primary-light, #f3caff);
    font-weight: 600;
    border-left: 3px solid var(--primary, #eb07ee);
    box-shadow: inset 0 0 20px rgba(235, 7, 238, 0.05);
}

.nav-icon {
    margin-right: 0.8rem;
    font-size: 1.2rem;
}

/* 右侧内容区域 - 暗色毛玻璃 */
.content-area {
    flex: 1;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 2rem;
    min-height: 600px;
    min-width: 800px;
    overflow: hidden;
    transition: all 0.3s ease;
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
    background: linear-gradient(to right, var(--primary, #eb07ee), var(--primary-dark, #a505de));
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
    border-radius: 16px;
    transition: all 0.3s ease;
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
        padding: 0;
        min-height: 100vh;
    }
    
    .user-page {
        width: 100%;
        min-height: 100vh;
        border-radius: 0;
        border: none;
    }

    .content-section {
        flex-direction: column;
        padding: 1rem;
    }

    .sidebar {
        width: 100%;
        margin-bottom: 0.5rem;
        border-radius: 12px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 0.8rem;
        gap: 0.5rem;
    }

    .nav-title {
        width: 100%;
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }

    .nav-title::after {
        display: none;
    }

    .nav-button {
        flex: 1;
        justify-content: center;
        padding: 0.7rem 0.8rem;
        border-radius: 10px;
        font-size: 0.9rem;
    }

    .nav-button.active {
        border-left: none;
        background: rgba(235, 7, 238, 0.2);
        border: 1px solid rgba(235, 7, 238, 0.3);
    }

    .content-area {
        width: 100%;
        padding: 1rem;
        min-width: unset;
        min-height: 400px;
    }

    .quote-list {
        grid-template-columns: 1fr;
        gap: 15px;
        padding: 5px;
    }

    .quote-item {
        width: 100%;
    }

    .user-info-container {
        flex-direction: column;
        align-items: center;
        padding: 1.5rem 1rem;
    }

    .user-avatar-container {
        margin: 0 0 1rem 0;
    }

    .user-avatar {
        width: 100px;
        height: 100px;
    }

    .user-details {
        width: 100%;
        text-align: center;
    }

    .user-details h1 {
        font-size: 1.8rem;
    }

    .user-meta {
        justify-content: center;
        flex-wrap: wrap;
    }

    .user-meta span {
        margin: 0.2rem;
        font-size: 0.85rem;
        padding: 0.2rem 0.7rem;
    }

    .user-bio {
        width: 100%;
    }

    .user-bio p {
        font-size: 0.95rem;
    }

    .user-header {
        flex-direction: column;
        gap: 0.8rem;
    }

    .user-header h1 {
        font-size: 1.8rem;
    }

    .content-title {
        font-size: 1.3rem;
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
    padding: 0.5rem 1.2rem;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    cursor: pointer;
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
}

.edit-profile-button:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(235, 7, 238, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
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

/* 语录列表 - 暗色卡片 */
.quote-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 5px;
    width: 100%;
    box-sizing: border-box;
}

.quote-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

.quote-item:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(235, 7, 238, 0.2);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(235, 7, 238, 0.08);
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
    transition: all 0.2s;
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
</style>