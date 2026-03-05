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
                    <!-- 内容区（上方） -->
                    <div class="quote-content-wrapper">
                        <div class="quote-content">
                            <p>{{ quoteData.quoteInfo.content }}</p>
                        </div>
                    </div>
                    <!-- 作者和点赞区（下方同一行） -->
                    <div class="author-like-row">
                        <div class="author-info" @click="goToUserPage(quoteData.quoteInfo.userId)">
                            <img :src="quoteData.userAvatar" alt="user avatar" class="author-avatar">
                            <span class="author-name">{{ quoteData.userNickName }}</span>
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
        // 单次聚合请求：获取语录详情 + 用户信息 + 图片路径 + 点赞状态
        const userId = userStore.isLoggedIn ? userStore.userId : '';
        const [cardRes] = await Promise.all([
            apiClient.get(`/quote/quoteCardDetail/${props.quoteId}`, {
                params: { userId }
            }),
            // 同时启动评论加载
            loadComments()
        ]);

        const card = cardRes.data.data;
        quoteData.value.quoteInfo = card.quoteInfo;
        quoteData.value.userNickName = card.userNickName;
        quoteData.value.isliked = card.liked;

        // 并行加载所有图片 blob + 用户头像（详情页用 1200px 宽图，头像 80px）
        const imagePromises = (card.picturePaths || []).map((path: string) =>
            apiClient.getImageUrl(path, 1200)
        );
        const avatarPromise = card.userAvatarPath
            ? apiClient.getImageUrl(card.userAvatarPath, 80)
            : Promise.resolve('');

        const [avatarUrl, ...imageUrls] = await Promise.all([avatarPromise, ...imagePromises]);
        quoteData.value.userAvatar = avatarUrl;
        quoteData.value.pictureList = imageUrls;

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
        const avatarUrl = await apiClient.getImageUrl(userRes.data.data.avatar, 80);
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
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
}

.quote-info-modal {
    position: relative;
    width: 60%;
    height: 80vh;
    background: rgba(20, 20, 40, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(235, 7, 238, 0.08);
    animation: modalFadeIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    display: flex;
    backdrop-filter: blur(20px);
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
    background: rgba(0, 0, 0, 0.3);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.right-section {
    width: 40%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
}

.carousel-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
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
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
    border-radius: 6px;
}

.image-container:hover img {
    transform: scale(1.03);
}

.close-button {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
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
    backdrop-filter: blur(10px);
}

.close-button:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    transform: rotate(90deg);
}

.carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
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
    backdrop-filter: blur(10px);
}

.carousel-button:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    transform: translateY(-50%) scale(1.1);
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
    background: rgba(0, 0, 0, 0.4);
    padding: 0.5rem 0.8rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    cursor: pointer;
    transition: all 0.2s;
}

.indicator.active {
    background: var(--primary-light, #f3caff);
    transform: scale(1.2);
    box-shadow: 0 0 6px rgba(235, 7, 238, 0.4);
}

.quote-content-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
}

.quote-content {
    text-align: center;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.85);
    margin: 0 auto 10px auto;
    word-break: break-word;
    padding: 12px 16px;
    letter-spacing: 0.02em;
}

.author-like-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    padding: 8px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    min-height: unset;
    gap: 0;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.author-info:hover {
    opacity: 0.8;
}

.author-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.author-info:hover .author-avatar {
    border-color: var(--primary, #eb07ee);
}

.author-name {
    font-weight: 500;
    color: var(--primary-light, #f3caff);
    font-size: 13px;
    transition: color 0.2s ease;
}

.interaction {
    display: flex;
    align-items: center;
}

.like-button {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.3rem 0.8rem;
    border-radius: 14px;
    transition: all 0.3s ease;
}

.like-button:hover {
    background: rgba(235, 7, 238, 0.1);
    border-color: rgba(235, 7, 238, 0.2);
}

.like-icon {
    font-size: 14px;
}

.like-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
}

/* 评论区 */
.comments-section {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    -webkit-overflow-scrolling: touch;
    background: rgba(0, 0, 0, 0.1);
}

.comments-section h3 {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0 0 14px 0;
    font-weight: 600;
    position: relative;
    display: inline-block;
}

.comments-section h3:after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 36px;
    height: 2px;
    background: linear-gradient(to right, var(--primary, #eb07ee), var(--primary-dark, #a505de));
    border-radius: 2px;
}

.login-prompt {
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    padding: 20px 0;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    margin: 10px 0;
    border: 1px dashed rgba(255, 255, 255, 0.1);
}

.comments-list {
    margin-top: 14px;
}

.comment-item {
    padding: 14px;
    margin-bottom: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    transition: all 0.2s ease;
}

.comment-item:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.commenter-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

.comment-header:hover .commenter-avatar {
    transform: scale(1.05);
    border-color: rgba(235, 7, 238, 0.3);
}

.commenter-name {
    font-weight: 600;
    color: var(--primary-light, #f3caff);
    font-size: 13px;
    transition: color 0.2s ease;
}

.comment-header:hover .commenter-name {
    color: #fff;
}

.comment-time {
    color: rgba(255, 255, 255, 0.35);
    font-size: 12px;
    margin-left: auto;
}

.comment-content {
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.6;
    margin-left: 44px;
    font-size: 14px;
    padding: 4px 0;
}

/* 评论区滚动条 */
.comments-section::-webkit-scrollbar {
    width: 5px;
}

.comments-section::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 3px;
}

.comments-section::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
}

.comments-section::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* 移动端 */
@media (max-width: 768px) {
    .quote-info-modal {
        width: 100%;
        height: 100vh;
        border-radius: 0;
        margin: 0;
        border: none;
    }

    .modal-content {
        flex-direction: column;
    }

    .left-section {
        width: 100%;
        height: 40%;
        min-height: 280px;
    }

    .right-section {
        width: 100%;
        height: 60%;
        overflow-y: auto;
    }

    .close-button {
        top: 12px;
        left: 12px;
    }

    .comments-section {
        padding: 14px;
        height: 100%;
        overflow-y: auto;
    }

    .author-like-row {
        margin-bottom: 4px;
        padding: 6px 12px;
    }

    .author-avatar {
        width: 22px;
        height: 22px;
    }

    .author-name {
        font-size: 12px;
    }

    .quote-content {
        font-size: 14px;
        padding: 8px 12px;
    }

    .like-button {
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
    }

    .like-icon {
        font-size: 12px;
    }

    .like-count {
        font-size: 11px;
    }

    .comment-item {
        padding: 12px;
        margin-bottom: 8px;
    }

    .comment-content {
        font-size: 13px;
        line-height: 1.5;
        margin-left: 40px;
    }

    .reply-item {
        padding: 10px;
        margin-top: 8px;
    }

    .image-container {
        padding: 2%;
    }

    .image-container img {
        max-width: 95%;
        max-height: 95%;
        min-width: 60%;
        min-height: 60%;
    }

    .carousel-button {
        width: 34px;
        height: 34px;
        font-size: 16px;
    }

    .carousel-indicators {
        bottom: 1rem;
        padding: 0.4rem 0.6rem;
    }

    .indicator {
        width: 6px;
        height: 6px;
    }
}

/* 小屏手机 */
@media (max-width: 360px) {
    .left-section {
        height: 35%;
        min-height: 230px;
    }

    .right-section {
        height: 65%;
    }

    .comments-section {
        padding: 10px;
    }

    .comment-item {
        padding: 10px;
    }

    .comment-content {
        font-size: 13px;
        margin-left: 36px;
    }

    .reply-item {
        padding: 8px;
    }
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
    .quote-info-modal {
        width: 85%;
    }
}

/* 全局 body 锁定 */
:global(body.modal-open) {
    overflow: hidden;
    padding-right: 15px;
}

.comment-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-left: 44px;
}

.reply-btn {
    background: rgba(235, 7, 238, 0.08);
    border: none;
    color: var(--primary-light, #f3caff);
    font-size: 13px;
    cursor: pointer;
    padding: 5px 12px;
    border-radius: 16px;
    transition: all 0.2s ease;
}

.reply-btn:hover {
    background: rgba(235, 7, 238, 0.15);
    color: #fff;
}

.like-count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
}

.like-icon {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.like-icon:hover {
    transform: scale(1.2);
}

.reply-input {
    margin-left: 44px;
    margin-top: 10px;
}

.replies-list {
    margin-left: 44px;
    margin-top: 10px;
}

.reply-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 12px;
    margin-top: 8px;
    transition: all 0.2s ease;
}

.reply-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.08);
}

.load-more-replies {
    margin-top: 10px;
    margin-left: 44px;
    text-align: left;
}

.load-more-btn {
    background: rgba(235, 7, 238, 0.08);
    border: none;
    color: var(--primary-light, #f3caff);
    font-size: 13px;
    cursor: pointer;
    padding: 5px 14px;
    border-radius: 16px;
    transition: all 0.2s ease;
}

.load-more-btn:hover {
    background: rgba(235, 7, 238, 0.15);
    color: #fff;
}
</style>