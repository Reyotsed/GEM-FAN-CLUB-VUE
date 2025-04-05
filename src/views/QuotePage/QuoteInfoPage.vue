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
        required: true
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

// 监听 visible 变化，控制页面滚动
watch(() => props.visible, (newVal) => {
    if (newVal) {
        loadQuoteData();
        currentImageIndex.value = 0;
        document.body.classList.add('modal-open');
    } else {
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
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
}

.quote-info-modal {
    position: relative;
    width: 60%;
    height: 80vh;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 15px 40px rgba(111, 134, 214, 0.25);
    animation: modalFadeIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    display: flex;
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
    width: 100%;
    height: 100%;
}

.left-section {
    width: 60%;
    height: 100%;
    background: #fafafa;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.right-section {
    width: 40%;
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
    background-color: #fafafa;
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
    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: 0 8px 25px rgba(111, 134, 214, 0.2);
    border-radius: 4px;
}

.image-container:hover img {
    transform: scale(1.05);
}

.close-button {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    color: #333;
    font-size: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1001;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-button:hover {
    background: #fff;
    transform: rotate(90deg);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 2;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.carousel-button:hover {
    background: #fff;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.carousel-button.prev {
    left: 1.2rem;
}

.carousel-button.next {
    right: 1.2rem;
}

.carousel-indicators {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    z-index: 2;
    background: rgba(255, 255, 255, 0.7);
    padding: 0.5rem 0.8rem;
    border-radius: 20px;
    backdrop-filter: blur(5px);
}

.indicator {
    width: 8px;
    height: 8px;
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
    padding: 20px;
    border-bottom: 1px solid #eaefff;
    background: linear-gradient(to bottom, #ffffff, #f8f9ff);
}

.author-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    margin-bottom: 12px;
    transition: transform 0.2s ease;
}

.author-info:hover {
    transform: translateY(-2px);
}

.author-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fff;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.author-info:hover .author-avatar {
    transform: scale(1.05);
}

.user-details {
    flex: 1;
}

.author-name {
    font-weight: 600;
    color: #5b6f9d;
    display: block;
    font-size: 16px;
    transition: color 0.2s ease;
}

.author-info:hover .author-name {
    color: #9567b1;
}

.quote-content {
    font-size: 16px;
    line-height: 1.6;
    color: #333;
    margin: 14px 0;
    word-break: break-word;
    padding: 0 4px;
    letter-spacing: 0.01em;
}

.quote-content p {
    margin: 0;
}

.interaction {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}

.like-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.9);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(111, 134, 214, 0.08);
    transition: all 0.3s ease;
}

.like-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(111, 134, 214, 0.12);
}

.like-icon {
    font-size: 20px;
    transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.like-count {
    font-size: 15px;
    color: #555;
    font-weight: 600;
}

.like-icon.liked {
    transform: scale(1.2);
    animation: heartBeat 0.4s ease-in-out;
}

@keyframes heartBeat {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1.2); }
}

.comments-section {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    -webkit-overflow-scrolling: touch;
    background-color: #f6f8ff;
}

.comments-section h3 {
    font-size: 16px;
    color: #5b6f9d;
    margin: 0 0 16px 0;
    font-weight: 600;
    position: relative;
    display: inline-block;
}

.comments-section h3:after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 40px;
    height: 3px;
    background: #9567b1;
    border-radius: 2px;
}

.login-prompt {
    color: #999;
    text-align: center;
    padding: 20px 0;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 10px;
    margin: 10px 0;
    border: 1px dashed #ddd;
}

.comments-list {
    margin-top: 16px;
}

.comment-item {
    padding: 16px;
    margin-bottom: 12px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.comment-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.commenter-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
}

.comment-header:hover .commenter-avatar {
    transform: scale(1.05);
}

.commenter-name {
    font-weight: 600;
    color: #5b6f9d;
    font-size: 14px;
    transition: color 0.2s ease;
}

.comment-header:hover .commenter-name {
    color: #9567b1;
}

.comment-time {
    color: #999;
    font-size: 12px;
    margin-left: auto;
}

.comment-content {
    color: #333;
    line-height: 1.5;
    margin-left: 46px;
    font-size: 14px;
    padding: 4px 0;
}

/* 自定义评论区滚动条 */
.comments-section::-webkit-scrollbar {
    width: 6px;
}

.comments-section::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.comments-section::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
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
        padding: 16px;
    }
}

/* 平板设备样式 */
@media (min-width: 769px) and (max-width: 1024px) {
    .quote-info-modal {
        width: 80%;
    }
}

/* 添加全局样式 */
:global(body.modal-open) {
    overflow: hidden;
    padding-right: 15px; /* 防止滚动条消失导致页面抖动 */
}

.comment-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-left: 46px;
}

.reply-btn {
    background: none;
    border: none;
    color: #6f86d6;
    font-size: 13px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 20px;
    transition: all 0.2s ease;
    background: rgba(111, 134, 214, 0.05);
}

.reply-btn:hover {
    background-color: rgba(111, 134, 214, 0.1);
    color: #5b6f9d;
}

.like-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #666;
}

.like-icon {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.like-icon:hover {
    transform: scale(1.2);
}

.reply-input {
    margin-left: 46px;
    margin-top: 12px;
}

.replies-list {
    margin-left: 46px;
    margin-top: 12px;
}

.reply-item {
    background: #f9f9f9;
    border-radius: 10px;
    padding: 12px;
    margin-top: 10px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.reply-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
}

.load-more-replies {
    margin-top: 12px;
    margin-left: 46px;
    text-align: left;
}

.load-more-btn {
    background: none;
    border: none;
    color: #6f86d6;
    font-size: 13px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 20px;
    transition: all 0.2s ease;
    background: rgba(111, 134, 214, 0.05);
}

.load-more-btn:hover {
    background-color: rgba(111, 134, 214, 0.1);
    color: #5b6f9d;
}
</style>