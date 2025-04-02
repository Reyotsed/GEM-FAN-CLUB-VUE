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
                        <div v-if="userStore.isLoggedIn">
                            <CommentInput @submit="handleCommentSubmit" />
                        </div>
                        <div v-else class="login-prompt">
                            请先登录后再发表评论
                        </div>

                        <!-- 评论列表 -->
                        <div class="comments-list">
                            <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
                                <div class="comment-header">
                                    <img :src="comment.userAvatar" alt="commenter avatar" class="commenter-avatar">
                                    <span class="commenter-name">{{ comment.userNickName }}</span>
                                    <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                                </div>
                                <div class="comment-content">
                                    {{ comment.formattedContent }}
                                </div>
                                <div class="comment-actions">
                                    <button class="reply-btn" @click="showReplyInput(comment)">
                                        回复
                                    </button>
                                    <div class="like-count">
                                        <span class="like-icon" @click="likeComment(comment)">
                                            🤍
                                        </span>
                                        {{ comment.likeNum }}
                                    </div>
                                </div>
                                <!-- 回复输入框 -->
                                <div v-if="comment.showReplyInput && userStore.isLoggedIn" class="reply-input">
                                    <CommentInput @submit="(content) => handleReplySubmit(content, comment.commentId)" />
                                </div>
                                <!-- 回复列表 -->
                                <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                                    <div v-for="reply in displayedReplies(comment)" :key="reply.commentId" class="reply-item">
                                        <div class="comment-header">
                                            <img :src="reply.userAvatar" alt="replier avatar" class="commenter-avatar">
                                            <span class="commenter-name">{{ reply.userNickName }}</span>
                                            <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
                                        </div>
                                        <div class="comment-content">
                                            {{ reply.formattedContent }}
                                        </div>
                                        <div class="comment-actions">
                                            <button class="reply-btn" @click="showReplyInput(reply, comment.commentId)">
                                                回复
                                            </button>
                                            <div class="like-count">
                                                <span class="like-icon" @click="likeComment(reply)">
                                                    🤍
                                                </span>
                                                {{ reply.likeNum }}
                                            </div>
                                        </div>
                                        <div v-if="reply.showReplyInput && userStore.isLoggedIn" class="reply-input">
                                            <CommentInput 
                                                @submit="(content) => handleReplySubmit(content, comment.commentId, reply.userId)" 
                                                :placeholder="`回复 @${reply.userNickName}：`"
                                            />
                                        </div>
                                    </div>
                                    <!-- 展开更多按钮 -->
                                    <div v-if="hasMoreReplies(comment)" class="load-more-replies">
                                        <button class="load-more-btn" @click="loadMoreReplies(comment)">
                                            展开更多回复 (剩余 {{ comment.replies.length - comment.displayCount }} 条)
                                        </button>
                                    </div>
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
import CommentInput from '@/components/user/CommentInput.vue';

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
        quoteId: '',
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
const activeReplyId = ref(null);

const closeModal = () => {
    emit('update:visible', false);
    activeReplyId.value = null;
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
        const commentsData = commentsRes.data.data;
        
        // 将评论数据组织成树形结构
        const commentMap = new Map();
        const rootComments = [];

        // 首先将所有评论放入 Map 中
        for (const comment of commentsData) {
            comment.replies = [];
            comment.showReplyInput = false;
            comment.displayCount = 3; // 初始显示3条回复
            commentMap.set(comment.commentId, comment);
        }

        // 组织评论的树形结构
        for (const comment of commentsData) {
            if (comment.parentId) {
                const parentComment = commentMap.get(comment.parentId);
                if (parentComment) {
                    parentComment.replies.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        }

        // 为每个评论获取用户信息并格式化内容
        const enrichedComments = await Promise.all(rootComments.map(async (comment) => {
            const enrichedComment = await enrichCommentWithUserInfo(comment);
            // 格式化主评论内容
            enrichedComment.formattedContent = await formatCommentContent(enrichedComment.content);
            
            if (enrichedComment.replies && enrichedComment.replies.length > 0) {
                // 对回复进行格式化和排序
                const enrichedReplies = await Promise.all(
                    enrichedComment.replies.map(async (reply) => {
                        const enrichedReply = await enrichCommentWithUserInfo(reply);
                        enrichedReply.formattedContent = await formatCommentContent(enrichedReply.content);
                        return enrichedReply;
                    })
                );
                
                // 对回复进行排序
                enrichedComment.replies = enrichedReplies.sort((a, b) => {
                    if (a.likeNum !== b.likeNum) {
                        return b.likeNum - a.likeNum; // 点赞数降序
                    }
                    return new Date(a.createdAt) - new Date(b.createdAt); // 时间升序
                });
            }
            return enrichedComment;
        }));

        // 对主评论进行排序
        const sortedComments = enrichedComments.sort((a, b) => {
            if (a.likeNum !== b.likeNum) {
                return b.likeNum - a.likeNum; // 点赞数降序
            }
            return new Date(a.createdAt) - new Date(b.createdAt); // 时间升序
        });

        comments.value = sortedComments;
    } catch (error) {
        console.error('Error loading comments:', error);
    }
};

// 为评论添加用户信息的辅助函数
const enrichCommentWithUserInfo = async (comment) => {
    try {
        const userRes = await apiClient.get('/user/getUserInfo', {
            params: { userId: comment.userId }
        });
        const avatarUrl = await apiClient.getImageUrl(userRes.data.data.avatar);
        return {
            ...comment,
            userNickName: userRes.data.data.nickName,
            userAvatar: avatarUrl
        };
    } catch (error) {
        console.error('Error enriching comment with user info:', error);
        return {
            ...comment,
            userNickName: '未知用户',
            userAvatar: '' // 可以设置一个默认头像
        };
    }
};

const showReplyInput = (comment, parentCommentId = null) => {
    if (!userStore.isLoggedIn) {
        alert('请先登录后再回复评论');
        return;
    }
    
    // 如果点击的是当前已打开的评论框，则关闭它
    if (activeReplyId.value === comment.commentId) {
        activeReplyId.value = null;
        return;
    }

    // 关闭所有评论框
    comments.value.forEach(c => {
        c.showReplyInput = false;
        if (c.replies) {
            c.replies.forEach(r => {
                r.showReplyInput = false;
            });
        }
    });

    // 打开当前点击的评论框
    comment.showReplyInput = true;
    activeReplyId.value = comment.commentId;
};

const handleCommentSubmit = async (commentText) => {
    try {
        // 直接评论 Quote，不需要 parentId
        await apiClient.post('/quote/comment', {
            quoteId: props.quoteId,
            userId: userStore.userId,
            content: commentText,
            parentId: null  // 直接评论时 parentId 为 null
        });
        await loadComments();
    } catch (error) {
        console.error('Error submitting comment:', error);
    }
};

const handleReplySubmit = async (content, parentId, replyToUserId = null) => {
    try {
        // 如果是回复评论的评论，添加@用户ID前缀
        const finalContent = replyToUserId ? `#:@${replyToUserId}:  ${content}` : content;
        
        await apiClient.post('/quote/comment', {
            quoteId: props.quoteId,
            userId: userStore.userId,
            content: finalContent,
            parentId: parentId
        });
        // 提交成功后关闭评论框
        activeReplyId.value = null;
        await loadComments();
    } catch (error) {
        console.error('Error submitting reply:', error);
    }
};

// 格式化评论内容，处理@用户的显示
const formatCommentContent = async (content) => {
    if (!content.startsWith('#:@')) {
        return content;
    }

    try {
        // 提取用户ID
        const match = content.match(/^#:@(\d+):/);
        if (!match) return content;

        const userId = match[1];
        // 获取用户信息
        const userRes = await apiClient.get('/user/getUserInfo', {
            params: { userId }
        });
        const nickName = userRes.data.data.nickName;
        
        // 替换@标记为用户昵称
        return content.replace(`#:@${userId}:`, `@${nickName}: `);
    } catch (error) {
        console.error('Error formatting comment content:', error);
        return content;
    }
};

const likeComment = async (comment) => {
    if (!userStore.isLoggedIn) {
        alert('请先登录后再点赞');
        return;
    }
    try {
        // 这里需要后端提供点赞评论的接口
        await apiClient.post('/quote/comment/like', {
            commentId: comment.commentId,
            userId: userStore.userId
        });
        comment.likeNum++;
    } catch (error) {
        console.error('Error liking comment:', error);
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

// 获取要显示的回复列表
const displayedReplies = (comment) => {
    if (!comment.replies) return [];
    return comment.replies.slice(0, comment.displayCount);
};

// 检查是否还有更多回复
const hasMoreReplies = (comment) => {
    return comment.replies && comment.replies.length > comment.displayCount;
};

// 加载更多回复
const loadMoreReplies = (comment) => {
    comment.displayCount += 3; // 每次增加3条回复
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
    width: 50%;
    height: 100%;
    background: #fff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.right-section {
    width: 50%;
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
    background-color: #fff;
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
    background: rgba(0, 0, 0, 0.2);
    border: none;
    color: #333;
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
    background: rgba(0, 0, 0, 0.3);
}

.carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.2);
    color: #333;
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
    background: rgba(0, 0, 0, 0.3);
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
    background: rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.2s;
}

.indicator.active {
    background: #333;
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

.comment-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-left: 42px;
}

.reply-btn {
    background: none;
    border: none;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.reply-btn:hover {
    background-color: #f0f0f0;
}

.like-count {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #666;
}

.like-icon {
    cursor: pointer;
    transition: transform 0.2s;
}

.like-icon:hover {
    transform: scale(1.2);
}

.reply-input {
    margin-left: 42px;
    margin-top: 8px;
}

.replies-list {
    margin-left: 42px;
    margin-top: 8px;
}

.reply-item {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 8px;
    margin-top: 8px;
}

.load-more-replies {
    margin-top: 8px;
    margin-left: 42px;
    text-align: left;
}

.load-more-btn {
    background: none;
    border: none;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
}

.load-more-btn:hover {
    background-color: #f0f0f0;
    color: #333;
}
</style>