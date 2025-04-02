<template>
    <div class="modal-overlay" v-if="visible" @click.self="closeModal">
        <div class="quote-info-modal">
            <!-- 主要内容区域 -->
            <div class="modal-content">
                <!-- 左侧图片区域 -->
                <div class="left-section">
                    <button class="close-button" @click="closeModal">×</button>
                    <div class="carousel-container">
                        <button class="carousel-button prev" @click="prevImage" v-if="quoteData.pictureList.length > 1">
                            <span>❮</span>
                        </button>
                        <div class="image-container">
                            <img :src="quoteData.pictureList[currentImageIndex]" alt="quote-picture">
                        </div>
                        <button class="carousel-button next" @click="nextImage" v-if="quoteData.pictureList.length > 1">
                            <span>❯</span>
                        </button>
                        <div class="carousel-indicators" v-if="quoteData.pictureList.length > 1">
                            <span 
                                v-for="(_, index) in quoteData.pictureList" 
                                :key="index"
                                :class="['indicator', { active: currentImageIndex === index }]"
                                @click="currentImageIndex = index"
                            ></span>
                        </div>
                    </div>
                </div>

                <!-- 右侧内容区域 -->
                <div class="right-section">
                    <!-- 用户信息和互动区 -->
                    <div class="user-section">
                        <div class="author-info" @click="goToUserPage(quoteData.quoteInfo.userId)">
                            <img :src="quoteData.userAvatar" alt="user avatar" class="author-avatar">
                            <div class="user-details">
                                <span class="author-name">{{ quoteData.userNickName }}</span>
                            </div>
                        </div>
                        <div class="quote-content">
                            <p>{{ quoteData.quoteInfo.content }}</p>
                        </div>
                        <div class="interaction">
                            <div class="like-button" @click="addlike(quoteData)">
                                <span :class="['like-icon', { 'liked': quoteData.isliked }]">
                                    <span v-if="quoteData.isliked">❤️</span>
                                    <span v-else>🤍</span>
                                </span>
                                <span class="like-count">{{ quoteData.quoteInfo.likesCount }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 评论区 -->
                    <div class="comments-section">
                        <h3>评论区</h3>
                        <!-- 评论输入框 -->
                        <div class="comment-input" v-if="userStore.isLoggedIn">
                            <textarea 
                                v-model="newComment" 
                                placeholder="写下你的评论..."
                                rows="3"
                            ></textarea>
                            <button @click="submitComment" class="submit-comment">发表评论</button>
                        </div>
                        <div v-else class="login-prompt">
                            请先登录后再发表评论
                        </div>

                        <!-- 评论列表 -->
                        <div class="comments-list">
                            <div v-for="comment in comments" :key="comment.id" class="comment-item">
                                <div class="comment-header">
                                    <img :src="comment.userAvatar" alt="commenter avatar" class="commenter-avatar">
                                    <span class="commenter-name">{{ comment.userNickName }}</span>
                                    <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                                </div>
                                <div class="comment-content">
                                    {{ comment.content }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import apiClient from '@/utils/api';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    quoteId: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:visible']);

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const currentImageIndex = ref(0);

const quoteData = ref({
    quoteInfo: {
        quoteId: 0,
        content: '',
        likesCount: 0,
        userId: '',
        createdAt: '',
        updatedAt: ''
    },
    userNickName: '',
    userAvatar: '',
    pictureList: [],
    isliked: false
});

const comments = ref([]);
const newComment = ref('');

const closeModal = () => {
    emit('update:visible', false);
};

// 轮播控制方法
const nextImage = () => {
    currentImageIndex.value = (currentImageIndex.value + 1) % quoteData.value.pictureList.length;
};

const prevImage = () => {
    currentImageIndex.value = (currentImageIndex.value - 1 + quoteData.value.pictureList.length) % quoteData.value.pictureList.length;
};

const loadQuoteData = async () => {
    if (!props.quoteId) return;
    
    try {
        // 获取quote详情
        const quoteRes = await apiClient.get(`/quote/quoteDetail/${props.quoteId}`);
        quoteData.value.quoteInfo = quoteRes.data.data;

        // 获取图片列表
        const picturesRes = await apiClient.get('/quote/quotePicture', {
            params: { quoteId: props.quoteId }
        });
        
        // 清空之前的图片列表
        quoteData.value.pictureList = [];
        
        // 获取每张图片
        for (const pic of picturesRes.data.data) {
            // 使用缓存获取图片URL
            const imageUrl = await apiClient.getImageUrl(pic.filePath);
            quoteData.value.pictureList.push(imageUrl);
        }

        // 获取作者信息
        const userRes = await apiClient.get('/user/getUserInfo', {
            params: { userId: quoteData.value.quoteInfo.userId }
        });
        quoteData.value.userNickName = userRes.data.data.nickName;
        
        // 获取作者头像
        const avatarUrl = await apiClient.getImageUrl(userRes.data.data.avatar);
        quoteData.value.userAvatar = avatarUrl;

        // 如果用户已登录，检查是否已点赞
        if (userStore.isLoggedIn) {
            const likeRes = await apiClient.get('/quote/isLiked', {
                params: {
                    quoteId: props.quoteId,
                    userId: userStore.userId
                }
            });
            quoteData.value.isliked = likeRes.data.data;
        }

        // 获取评论列表
        loadComments();
    } catch (error) {
        console.error('Error loading quote details:', error);
    }
};

watch(() => props.visible, (newVal) => {
    if (newVal) {
        loadQuoteData();
        currentImageIndex.value = 0;
        // 禁用背景页面滚动，但允许弹窗内部滚动
        document.body.classList.add('modal-open');
    } else {
        // 恢复页面滚动
        document.body.classList.remove('modal-open');
    }
});

// 组件卸载时确保恢复页面滚动
onUnmounted(() => {
    document.body.classList.remove('modal-open');
});

const loadComments = async () => {
    try {
        const commentsRes = await apiClient.get(`/quote/comments/${props.quoteId}`);
        comments.value = await Promise.all(commentsRes.data.data.map(async (comment) => {
            const userRes = await apiClient.get('/user/getUserInfo', {
                params: { userId: comment.userId }
            });
            const avatarUrl = await apiClient.getImageUrl(userRes.data.data.avatar);
            return {
                ...comment,
                userNickName: userRes.data.data.nickName,
                userAvatar: avatarUrl
            };
        }));
    } catch (error) {
        console.error('Error loading comments:', error);
    }
};

const submitComment = async () => {
    if (!newComment.value.trim()) return;
    
    try {
        await apiClient.post('/quote/comment', {
            quoteId: props.quoteId,
            userId: userStore.userId,
            content: newComment.value
        });
        newComment.value = '';
        await loadComments();
    } catch (error) {
        console.error('Error submitting comment:', error);
    }
};

const addlike = async (quote) => {
    if (!userStore.isLoggedIn) return;
    
    quote.isliked = !quote.isliked;
    if (quote.isliked) {
        await apiClient.get('/quote/addLike', {
            params: {
                quoteId: quote.quoteInfo.quoteId,
                userId: userStore.userId
            }
        });
        quote.quoteInfo.likesCount++;
    } else {
        await apiClient.get('/quote/eraseLike', {
            params: {
                quoteId: quote.quoteInfo.quoteId,
                userId: userStore.userId
            }
        });
        quote.quoteInfo.likesCount--;
    }
};

const goToUserPage = (userId) => {
    router.push({ path: '/user', query: { id: userId } });
};

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    overflow: hidden;
}

.quote-info-modal {
    position: relative;
    width: 60%;
    height: 80vh;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.modal-content {
    display: flex;
    height: 100%;
}

.left-section {
    width: 65%;
    height: 100%;
    background: #000;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.right-section {
    width: 35%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
}

.carousel-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #000;
}

.image-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5%;
    cursor: zoom-in;
}

.image-container img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    min-width: 70%;
    min-height: 70%;
    transition: transform 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.image-container:hover img {
    transform: scale(1.03);
}

.close-button {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    color: white;
    font-size: 20px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1001;
    transition: background-color 0.3s;
}

.close-button:hover {
    background: rgba(0, 0, 0, 0.7);
}

.carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.4);
    color: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.3s;
    z-index: 2;
    font-size: 18px;
}

.carousel-button:hover {
    background: rgba(0, 0, 0, 0.6);
}

.carousel-button.prev {
    left: 1rem;
}

.carousel-button.next {
    right: 1rem;
}

.carousel-indicators {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    z-index: 2;
}

.indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.2s;
}

.indicator.active {
    background: white;
    transform: scale(1.2);
}

.user-section {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    margin-bottom: 8px;
}

.author-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #f0f0f0;
}

.user-details {
    flex: 1;
}

.author-name {
    font-weight: 600;
    color: #333;
    display: block;
    font-size: 15px;
}

.quote-content {
    font-size: 15px;
    line-height: 1.5;
    color: #333;
    margin: 10px 0;
    word-break: break-word;
}

.quote-content p {
    margin: 0;
}

.interaction {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

.like-button {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
}

.like-icon {
    font-size: 18px;
    transition: transform 0.2s;
}

.like-count {
    font-size: 14px;
    color: #666;
}

.like-icon.liked {
    transform: scale(1.2);
}

.comments-section {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    -webkit-overflow-scrolling: touch;
    background-color: #fafafa;
}

.comments-section h3 {
    font-size: 15px;
    color: #333;
    margin: 0 0 16px 0;
    font-weight: 600;
}

.login-prompt {
    color: #999;
    text-align: center;
    padding: 16px 0;
    font-size: 14px;
}

.comment-input {
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

textarea {
    width: 100%;
    padding: 12px;
    border: none;
    border-bottom: 1px solid #eee;
    resize: none;
    font-size: 14px;
    outline: none;
}

.submit-comment {
    background: #ff2442;
    color: white;
    border: none;
    padding: 8px 16px;
    width: 100%;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.submit-comment:hover {
    background: #e6213c;
}

.comments-list {
    margin-top: 8px;
}

.comment-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
}

.commenter-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #f0f0f0;
}

.commenter-name {
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.comment-time {
    color: #999;
    font-size: 12px;
    margin-left: auto;
}

.comment-content {
    color: #333;
    line-height: 1.4;
    margin-left: 42px;
    font-size: 14px;
}

/* 自定义评论区滚动条 */
.comments-section::-webkit-scrollbar {
    width: 4px;
}

.comments-section::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.comments-section::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
}

.comments-section::-webkit-scrollbar-thumb:hover {
    background: #ccc;
}

/* 移动端样式 */
@media (max-width: 768px) {
    .quote-info-modal {
        width: 100%;
        height: 100vh;
        border-radius: 0;
        margin: 0;
    }

    .modal-content {
        flex-direction: column;
    }

    .left-section {
        width: 100%;
        height: 50%;
    }

    .right-section {
        width: 100%;
        height: 50%;
    }

    .close-button {
        top: 12px;
        left: 12px;
    }

    .comments-section {
        padding: 12px;
    }
}

/* 平板设备样式 */
@media (min-width: 769px) and (max-width: 1024px) {
    .quote-info-modal {
        width: 80%;
    }
}

/* 添加全局样式 */
:global(.modal-open) {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
}
</style>