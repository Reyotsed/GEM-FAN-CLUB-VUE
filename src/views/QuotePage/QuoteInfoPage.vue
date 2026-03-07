<template>
    <transition name="modal-fade">
        <div class="modal-overlay" v-if="visible" @click.self="closeModal">
            <div class="quote-info-modal">
                <button class="close-button" @click="closeModal" title="关闭">
                    <span class="close-icon">×</span>
                </button>
                
                <!-- 主要内容区域 -->
                <div class="modal-content">
                    <!-- 左侧图片区域 -->
                    <div class="left-section">
                        <div class="carousel-container">
                            <button class="carousel-button prev" @click="prevImage" v-if="quoteData.pictureList.length > 1">
                                <i class="arrow-icon">❮</i>
                            </button>
                            
                            <div class="image-wrapper" @click="nextImage">
                                <transition name="image-fade" mode="out-in">
                                    <img 
                                        :key="currentImageIndex"
                                        :src="quoteData.pictureList[currentImageIndex]" 
                                        alt="quote-picture"
                                        class="main-image"
                                    >
                                </transition>
                                <div class="image-overlay-hint" v-if="quoteData.pictureList.length > 1">
                                    点击切换图片
                                </div>
                            </div>

                            <button class="carousel-button next" @click="nextImage" v-if="quoteData.pictureList.length > 1">
                                <i class="arrow-icon">❯</i>
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
                        <!-- 顶部语录内容 -->
                        <div class="quote-header">
                            <div class="quote-decoration">❝</div>
                            <div class="quote-text-container">
                                <p class="quote-content">{{ quoteData.quoteInfo.content }}</p>
                            </div>
                            
                            <!-- 作者和互动栏 -->
                            <div class="meta-row">
                                <div class="author-info" @click="goToUserPage(quoteData.quoteInfo.userId)">
                                    <div class="avatar-wrapper">
                                        <img :src="quoteData.userAvatar" alt="user avatar" class="author-avatar">
                                        <div class="avatar-ring"></div>
                                    </div>
                                    <div class="author-details">
                                        <span class="author-name">{{ quoteData.userNickName }}</span>
                                        <span class="publish-time">{{ formatTime(quoteData.quoteInfo.createdAt) }}</span>
                                    </div>
                                </div>
                                
                                <div class="interaction-group">
                                    <button class="like-btn" @click="addlike(quoteData)" :class="{ 'is-liked': quoteData.isliked }">
                                        <span class="heart-icon">{{ quoteData.isliked ? '❤️' : '🤍' }}</span>
                                        <span class="count">{{ quoteData.quoteInfo.likesCount }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 评论区 -->
                        <div class="comments-container">
                            <div class="comments-header">
                                <h3>评论 <span class="comment-count">{{ comments.length }}</span></h3>
                            </div>
                            
                            <div class="comments-scroll-area">
                                <!-- 评论输入框 (顶部) -->
                                <div class="main-comment-input" v-if="userStore.isLoggedIn">
                                    <CommentInput @submit="handleCommentSubmit" placeholder="写下你的想法..." />
                                </div>
                                <div v-else class="login-tip" @click="goToLogin">
                                    <span>登录后参与讨论</span>
                                </div>

                                <!-- 评论列表 -->
                                <div class="comments-list">
                                    <transition-group name="list">
                                        <div v-for="comment in comments" :key="comment.commentId" class="comment-card">
                                            <div class="comment-main">
                                                <div class="comment-avatar-wrapper" @click="goToUserPage(comment.userId)">
                                                    <img :src="comment.userAvatar" class="comment-avatar">
                                                </div>
                                                <div class="comment-content-wrapper">
                                                    <div class="comment-header">
                                                        <span class="username">{{ comment.userNickName }}</span>
                                                        <span class="time">{{ formatTime(comment.createdAt) }}</span>
                                                    </div>
                                                    <div class="comment-bubble">
                                                        <div class="comment-text">{{ comment.formattedContent }}</div>
                                                    </div>
                                                    
                                                    <div class="comment-actions">
                                                        <button class="action-btn reply" @click="showReplyInput(comment)">
                                                            回复
                                                        </button>
                                                        <button class="action-btn like" @click="likeComment(comment)" :class="{ 'has-liked': comment.hasLiked }">
                                                            <span class="icon">🤍</span> {{ comment.likeNum || 0 }}
                                                        </button>
                                                    </div>

                                                    <!-- 回复输入框 -->
                                                    <div v-if="comment.showReplyInput && userStore.isLoggedIn" class="reply-input-wrapper">
                                                        <CommentInput 
                                                            @submit="(content) => handleReplySubmit(content, comment.commentId)"
                                                            :placeholder="`回复 @${comment.userNickName}`"
                                                            :autoFocus="true"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- 回复列表 (嵌套) -->
                                            <div v-if="comment.replies && comment.replies.length > 0" class="replies-wrapper">
                                                <div v-for="reply in displayedReplies(comment)" :key="reply.commentId" class="reply-card">
                                                    <img :src="reply.userAvatar" class="reply-avatar" @click="goToUserPage(reply.userId)">
                                                    <div class="reply-body">
                                                        <div class="reply-header">
                                                            <span class="username">{{ reply.userNickName }}</span>
                                                            <span class="time">{{ formatTime(reply.createdAt) }}</span>
                                                        </div>
                                                        <div class="reply-bubble">
                                                            <div class="comment-text">
                                                                <span v-if="reply.replyToUser" class="reply-target">@{{ reply.replyToUser }} </span>
                                                                {{ reply.formattedContent }}
                                                            </div>
                                                        </div>
                                                        <div class="comment-actions">
                                                            <button class="action-btn reply" @click="showReplyInput(reply, comment.commentId)">
                                                                回复
                                                            </button>
                                                            <button class="action-btn like" @click="likeComment(reply)" :class="{ 'has-liked': reply.hasLiked }">
                                                                <span class="icon">🤍</span> {{ reply.likeNum || 0 }}
                                                            </button>
                                                        </div>
                                                        
                                                        <div v-if="reply.showReplyInput && userStore.isLoggedIn" class="reply-input-wrapper">
                                                            <CommentInput 
                                                                @submit="(content) => handleReplySubmit(content, comment.commentId, reply.userId)" 
                                                                :placeholder="`回复 @${reply.userNickName}`"
                                                                :autoFocus="true"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <button v-if="hasMoreReplies(comment)" class="more-replies-btn" @click="loadMoreReplies(comment)">
                                                    查看更多回复 ({{ comment.replies.length - comment.displayCount }})
                                                </button>
                                            </div>
                                        </div>
                                    </transition-group>
                                    
                                    <div v-if="comments.length === 0" class="empty-comments">
                                        <div class="empty-icon">💬</div>
                                        <p>还没有评论，快来抢沙发吧~</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
    <LoginModal ref="loginModalRef" />
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import apiClient from '@/utils/api';
import CommentInput from '@/components/user/CommentInput.vue';
import LoginModal from '@/components/Login/LoginModal.vue';

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
const router = useRouter();
const userStore = useUserStore();
const loginModalRef = ref(null);

const currentImageIndex = ref(0);
const activeReplyId = ref<string | null>(null);

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
    pictureList: [] as string[],
    isliked: false
});

const comments = ref<any[]>([]);

const closeModal = () => {
    emit('update:visible', false);
    activeReplyId.value = null;
};

// 轮播控制
const nextImage = () => {
    if (quoteData.value.pictureList.length <= 1) return;
    currentImageIndex.value = (currentImageIndex.value + 1) % quoteData.value.pictureList.length;
};

const prevImage = () => {
    if (quoteData.value.pictureList.length <= 1) return;
    currentImageIndex.value = (currentImageIndex.value - 1 + quoteData.value.pictureList.length) % quoteData.value.pictureList.length;
};

// 数据加载
const loadQuoteData = async () => {
    if (!props.quoteId) return;
    
    try {
        const userId = userStore.isLoggedIn ? userStore.userId : '';
        const [cardRes] = await Promise.all([
            apiClient.get(`/quote/quoteCardDetail/${props.quoteId}`, { params: { userId } }),
            loadComments()
        ]);

        const card = cardRes.data.data;
        quoteData.value = {
            ...quoteData.value,
            quoteInfo: card.quoteInfo,
            userNickName: card.userNickName,
            isliked: card.liked,
            userAvatar: '', // Placeholder
            pictureList: [] // Placeholder
        };

        // 图片加载
        const imagePromises = (card.picturePaths || []).map((path: string) => apiClient.getImageUrl(path, 1200));
        const avatarPromise = card.userAvatarPath ? apiClient.getImageUrl(card.userAvatarPath, 80) : Promise.resolve('');

        const [avatarUrl, ...imageUrls] = await Promise.all([avatarPromise, ...imagePromises]);
        quoteData.value.userAvatar = avatarUrl;
        quoteData.value.pictureList = imageUrls;

    } catch (error) {
        console.error('Error loading details:', error);
    }
};

// 评论加载与处理
const loadComments = async () => {
    try {
        const res = await apiClient.get(`/quote/comments/${props.quoteId}`);
        const rawComments = res.data.data;
        
        // 构建评论树
        const commentMap = new Map();
        const roots: any[] = [];
        
        rawComments.forEach((c: any) => {
            c.replies = [];
            c.showReplyInput = false;
            c.displayCount = 3;
            commentMap.set(c.commentId, c);
        });

        rawComments.forEach((c: any) => {
            if (c.parentId) {
                const parent = commentMap.get(c.parentId);
                if (parent) parent.replies.push(c);
            } else {
                roots.push(c);
            }
        });

        // 丰富用户信息
        const processComment = async (c: any) => {
            try {
                const userRes = await apiClient.get('/user/getUserInfo', { params: { userId: c.userId } });
                c.userNickName = userRes.data.data.nickName;
                c.userAvatar = await apiClient.getImageUrl(userRes.data.data.avatar, 80);
            } catch {
                c.userNickName = '未知用户';
                c.userAvatar = '/default-avatar.png';
            }
            c.formattedContent = await formatCommentContent(c.content);
            return c;
        };

        // 处理所有评论
        const processAll = async (list: any[]) => {
            return Promise.all(list.map(async (item) => {
                await processComment(item);
                if (item.replies.length) {
                    await processAll(item.replies);
                    // 排序回复
                    item.replies.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                }
                return item;
            }));
        };

        await processAll(roots);
        
        // 排序主评论
        roots.sort((a, b) => {
            if (a.likeNum !== b.likeNum) return b.likeNum - a.likeNum;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        comments.value = roots;

    } catch (error) {
        console.error('Error comments:', error);
    }
};

const formatCommentContent = async (content: string) => {
    if (!content.startsWith('#:@')) return content;
    const match = content.match(/^#:@(\d+):/);
    if (!match) return content;
    
    // 这里简单处理去掉ID前缀，实际项目中可能需要保留ID用于跳转
    return content.replace(/^#:@\d+:\s*/, '');
};

// 交互操作
const handleCommentSubmit = async (text: string) => {
    if (!text.trim()) return;
    try {
        await apiClient.post('/quote/comment', {
            quoteId: props.quoteId,
            userId: userStore.userId,
            content: text,
            parentId: null
        });
        await loadComments();
    } catch (e) {
        console.error(e);
    }
};

const handleReplySubmit = async (text: string, parentId: string, replyToUserId?: string) => {
    if (!text.trim()) return;
    try {
        const content = replyToUserId ? `#:@${replyToUserId}: ${text}` : text;
        await apiClient.post('/quote/comment', {
            quoteId: props.quoteId,
            userId: userStore.userId,
            content,
            parentId
        });
        activeReplyId.value = null;
        await loadComments();
    } catch (e) {
        console.error(e);
    }
};

const showReplyInput = (item: any, parentCommentId?: string) => {
    if (!userStore.isLoggedIn) {
        // alert('请先登录');
        loginModalRef.value?.openModal();
        return;
    }

    // 重置其他输入框
    comments.value.forEach(c => {
        c.showReplyInput = false;
        c.replies?.forEach((r: any) => r.showReplyInput = false);
    });

    item.showReplyInput = true;
};

const likeComment = async (comment: any) => {
    if (!userStore.isLoggedIn) return;
    try {
        await apiClient.post('/quote/comment/like', {
            commentId: comment.commentId,
            userId: userStore.userId
        });
        comment.likeNum = (comment.likeNum || 0) + 1;
        comment.hasLiked = true; // Visual feedback
    } catch (e) { console.error(e); }
};

const addlike = async (quote: any) => {
    if (!userStore.isLoggedIn) return;
    quote.isliked = !quote.isliked;
    const url = quote.isliked ? '/quote/addLike' : '/quote/eraseLike';
    const offset = quote.isliked ? 1 : -1;
    
    try {
        await apiClient.get(url, {
            params: { quoteId: quote.quoteInfo.quoteId, userId: userStore.userId }
        });
        quote.quoteInfo.likesCount += offset;
    } catch {
        quote.isliked = !quote.isliked; // Revert
    }
};

const goToUserPage = (userId: string) => {
    router.push({ path: '/user', query: { id: userId } });
    closeModal();
};

const goToLogin = () => {
    // router.push('/login');
    // closeModal();
    loginModalRef.value?.openModal();
};

const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const displayedReplies = (comment: any) => comment.replies.slice(0, comment.displayCount);
const hasMoreReplies = (comment: any) => comment.replies.length > comment.displayCount;
const loadMoreReplies = (comment: any) => comment.displayCount += 5;

// 生命周期
watch(() => props.visible, (val) => {
    if (val) {
        loadQuoteData();
        currentImageIndex.value = 0;
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

onUnmounted(() => {
    document.body.style.overflow = '';
});
</script>

<style scoped>
/* 动画定义 */
.modal-fade-enter-active, .modal-fade-leave-active {
    transition: all 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
    opacity: 0;
    backdrop-filter: blur(0);
}

.image-fade-enter-active, .image-fade-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
}
.image-fade-enter-from, .image-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

.list-enter-active, .list-leave-active {
    transition: all 0.4s ease;
}
.list-enter-from, .list-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* 模态框基础 */
.modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.quote-info-modal {
    width: 1100px;
    height: 85vh;
    max-height: 850px;
    background: linear-gradient(145deg, rgba(28, 28, 45, 0.9), rgba(15, 15, 25, 0.95));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
    display: flex;
    overflow: hidden;
    position: relative;
    backdrop-filter: blur(40px);
    transition: transform 0.3s ease;
}

.close-button {
    position: absolute;
    top: 20px; right: 20px;
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 20px;
    cursor: pointer;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}
.close-button:hover {
    background: rgba(235, 7, 238, 0.8);
    border-color: rgba(235, 7, 238, 0.8);
    transform: rotate(90deg) scale(1.1);
}

.modal-content {
    display: flex;
    width: 100%;
    height: 100%;
}

/* 左侧图片区 */
.left-section {
    flex: 1.3;
    background: #000;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
}

.carousel-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    position: relative;
    background: radial-gradient(circle at center, rgba(30,30,40,1) 0%, rgba(10,10,15,1) 100%);
}

.main-image {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.5s ease;
}

.image-overlay-hint {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
}
.image-wrapper:hover .image-overlay-hint {
    opacity: 1;
}

.carousel-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.3);
    color: white;
    border: 1px solid rgba(255,255,255,0.1);
    width: 48px; height: 48px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
}
.carousel-button:hover {
    background: rgba(235, 7, 238, 0.8);
    border-color: rgba(235, 7, 238, 0.8);
    transform: translateY(-50%) scale(1.1);
}
.prev { left: 24px; }
.next { right: 24px; }

.carousel-indicators {
    position: absolute;
    bottom: 30px;
    display: flex;
    gap: 10px;
    z-index: 10;
}
.indicator {
    width: 8px; height: 8px;
    background: rgba(255,255,255,0.3);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid transparent;
}
.indicator.active {
    background: white;
    transform: scale(1.2);
    box-shadow: 0 0 10px rgba(255,255,255,0.5);
}
.indicator:hover {
    background: rgba(255,255,255,0.6);
}

/* 右侧内容区 */
.right-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: rgba(255,255,255,0.01);
    min-width: 400px;
}

.quote-header {
    padding: 30px 40px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(to bottom, rgba(255,255,255,0.02), transparent);
}

.quote-decoration {
    font-size: 80px;
    color: rgba(235, 7, 238, 0.15);
    font-family: 'Times New Roman', serif;
    line-height: 0.5;
    margin-bottom: 10px;
    margin-left: -10px;
}

.quote-text-container {
    margin-bottom: 25px;
}

.quote-content {
    font-size: 1.35rem;
    line-height: 1.6;
    color: rgba(255,255,255,0.95);
    font-weight: 400;
    letter-spacing: 0.5px;
    font-family: 'Georgia', serif; /* More elegant font for quotes */
}

.meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
}

.author-info {
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 12px;
    transition: background 0.3s;
    margin-left: -10px;
}
.author-info:hover {
    background: rgba(255,255,255,0.05);
}

.avatar-wrapper {
    position: relative;
    width: 48px; height: 48px;
}
.author-avatar {
    width: 100%; height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    object-fit: cover;
    transition: border-color 0.3s;
}
.author-info:hover .author-avatar {
    border-color: #eb07ee;
}

.author-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.author-name {
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
}
.publish-time {
    color: rgba(255,255,255,0.5);
    font-size: 0.8rem;
}

.interaction-group {
    display: flex;
    align-items: center;
}

.like-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    padding: 8px 20px;
    border-radius: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
    font-size: 0.95rem;
}
.like-btn:hover {
    background: rgba(235, 7, 238, 0.15);
    border-color: rgba(235, 7, 238, 0.3);
    transform: translateY(-2px);
}
.like-btn.is-liked {
    background: rgba(235, 7, 238, 0.15);
    border-color: rgba(235, 7, 238, 0.4);
}
.like-btn.is-liked .count {
    color: #eb07ee;
    font-weight: bold;
}

/* 评论区 */
.comments-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

.comments-header {
    padding: 18px 40px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    background: rgba(0,0,0,0.1);
}
.comments-header h3 {
    margin: 0;
    font-size: 1rem;
    color: rgba(255,255,255,0.9);
    font-weight: 600;
}
.comment-count {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
    margin-left: 6px;
    font-weight: normal;
}

.comments-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px 40px;
}
.comments-scroll-area::-webkit-scrollbar {
    width: 6px;
}
.comments-scroll-area::-webkit-scrollbar-track {
    background: transparent;
}
.comments-scroll-area::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
}
.comments-scroll-area::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2);
}

.main-comment-input {
    margin-bottom: 30px;
    position: sticky;
    top: 0;
    z-index: 5;
    background: transparent; /* CommentInput component handles its own background usually, but here just wrapper */
}

.login-tip {
    text-align: center;
    padding: 15px;
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-size: 0.9rem;
    margin-bottom: 25px;
    border: 1px dashed rgba(255,255,255,0.1);
    transition: all 0.3s;
}
.login-tip:hover {
    background: rgba(255,255,255,0.08);
    color: #eb07ee;
    border-color: rgba(235, 7, 238, 0.3);
}

/* 评论卡片 - Chat Bubble Style */
.comment-card {
    margin-bottom: 24px;
}

.comment-main {
    display: flex;
    gap: 16px;
}

.comment-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    border: 2px solid rgba(255,255,255,0.1);
    transition: border-color 0.3s;
}
.comment-avatar-wrapper:hover .comment-avatar {
    border-color: #eb07ee;
}

.comment-content-wrapper {
    flex: 1;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    padding: 0 4px;
}
.username {
    font-weight: 600;
    font-size: 0.9rem;
    color: #e0e0e0;
}
.time {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
}

.comment-bubble {
    background: rgba(255,255,255,0.05);
    padding: 12px 16px;
    border-radius: 4px 16px 16px 16px;
    color: rgba(255,255,255,0.9);
    line-height: 1.5;
    font-size: 0.95rem;
    margin-bottom: 8px;
    transition: background 0.3s;
}
.comment-card:hover .comment-bubble {
    background: rgba(255,255,255,0.08);
}

.comment-actions {
    display: flex;
    gap: 16px;
    padding-left: 4px;
}
.action-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 0.8rem;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
}
.action-btn:hover {
    color: #eb07ee;
}
.action-btn.has-liked {
    color: #eb07ee;
}

.reply-input-wrapper {
    margin-top: 15px;
    animation: fadeIn 0.3s ease;
    padding-left: 4px;
}

/* 回复列表 */
.replies-wrapper {
    margin-left: 56px;
    margin-top: 15px;
    padding-left: 20px;
    border-left: 2px solid rgba(255,255,255,0.05);
}

.reply-card {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
}
.reply-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
}
.reply-body {
    flex: 1;
}
.reply-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}
.reply-bubble {
    background: rgba(255,255,255,0.03);
    padding: 10px 14px;
    border-radius: 4px 14px 14px 14px;
    color: rgba(255,255,255,0.85);
    font-size: 0.9rem;
    margin-bottom: 6px;
}
.reply-target {
    color: #eb07ee;
    font-weight: 600;
    margin-right: 4px;
}

.more-replies-btn {
    background: none;
    border: none;
    color: rgba(235, 7, 238, 0.8);
    font-size: 0.85rem;
    cursor: pointer;
    padding: 5px 0;
    margin-left: 10px;
    font-weight: 500;
}
.more-replies-btn:hover {
    text-decoration: underline;
    color: #eb07ee;
}

.empty-comments {
    text-align: center;
    padding: 60px 0;
    color: rgba(255,255,255,0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
.empty-icon {
    font-size: 40px;
    opacity: 0.5;
    margin-bottom: 10px;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 移动端适配 */
@media (max-width: 900px) {
    .quote-info-modal {
        flex-direction: column;
        width: 100%;
        height: 100%;
        max-height: none;
        border-radius: 0;
    }
    
    .left-section {
        flex: none;
        height: 40vh;
        border-right: none;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .right-section {
        flex: 1;
        overflow: hidden;
        min-width: auto;
    }
    
    .quote-header {
        padding: 20px 24px;
    }
    .quote-content {
        font-size: 1.1rem;
    }
    
    .comments-scroll-area {
        padding: 15px 24px;
    }
    
    .close-button {
        top: 15px; right: 15px;
        background: rgba(0,0,0,0.5);
    }
}
</style>