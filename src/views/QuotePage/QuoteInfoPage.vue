<template>
    <transition name="modal-fade">
        <div class="modal-overlay" v-if="visible" @click.self="closeModal">
            <div class="quote-info-modal">
                <!-- 顶部作者栏（头像+昵称+关闭按钮） -->
                <div class="author-bar">
                    <div class="author-info" @click="goToUserPage(quoteData.quoteInfo.userId)">
                        <img :src="quoteData.userAvatar" alt="user avatar" class="author-avatar">
                        <span class="author-name">{{ quoteData.userNickName }}</span>
                    </div>
                    <button class="close-button" @click="closeModal" title="关闭">
                        <span class="close-icon">×</span>
                    </button>
                </div>

                <!-- 左侧图片区 -->
                <div class="modal-content">
                    <div class="left-section" v-if="quoteData.pictureList.length > 0">
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
                                        loading="lazy"
                                        decoding="async"
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
                </div>

                <!-- 右侧内容栏（桌面端独立滚动列，移动端与图片同列） -->
                <div class="right-pane">
                    <div class="right-pane-scroll">
                        <!-- 语录正文 + 发帖时间 + 点赞 -->
                        <div class="quote-header">
                        <p class="quote-content">{{ quoteData.quoteInfo.content }}</p>
                        <div class="meta-row">
                            <span class="publish-time">{{ formatTime(quoteData.quoteInfo.createdAt) }}</span>
                            <button class="like-btn" @click="addlike(quoteData)" :class="{ 'is-liked': quoteData.isliked }">
                                <span class="heart-icon">{{ quoteData.isliked ? '❤️' : '🤍' }}</span>
                                <span class="count">{{ quoteData.quoteInfo.likesCount }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- 评论区 -->
                    <div class="comments-container">
                            <div class="comments-header">
                                <h3>共 {{ comments.length }} 条评论</h3>
                            </div>
                            
                            <!-- 评论列表 (不再独立滚动，跟随外层 modal-content 一起滚动) -->
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
                                                        <button class="action-btn reply" @click="startReply(comment)">
                                                            回复
                                                        </button>
                                                        <button class="action-btn like" @click="likeComment(comment)" :class="{ 'has-liked': comment.hasLiked }">
                                                            <span class="icon" :class="{ pop: comment.hasLiked }">{{ comment.hasLiked ? '❤️' : '🤍' }}</span>
                                                            <span class="like-count">{{ comment.likeNum || 0 }}</span>
                                                        </button>
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
                                                            <button class="action-btn reply" @click="startReply(reply, comment.commentId)">
                                                                回复
                                                            </button>
                                                            <button class="action-btn like" @click="likeComment(reply)" :class="{ 'has-liked': reply.hasLiked }">
                                                                <span class="icon" :class="{ pop: reply.hasLiked }">{{ reply.hasLiked ? '❤️' : '🤍' }}</span>
                                                                <span class="like-count">{{ reply.likeNum || 0 }}</span>
                                                            </button>
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

                    <!-- 底部输入栏 -->
                    <div class="comment-footer">
                        <!-- 回复目标提示条 -->
                        <div v-if="replyTarget" class="reply-target-bar">
                            <div class="reply-target-info">
                                <span class="reply-target-label">回复</span>
                                <span class="reply-target-name">{{ replyTarget.nickName }}</span>
                                <span class="reply-target-preview">：{{ replyTarget.preview }}</span>
                            </div>
                            <button class="reply-target-cancel" @click="cancelReply" title="取消回复">×</button>
                        </div>
                    <div v-if="userStore.isLoggedIn" class="xhs-input-bar" :class="{ 'is-expanded': footerExpanded || footerText.length > 0 }">
                        <img :src="userStore.avatar || quoteData.userAvatar" class="xhs-avatar" alt="me" v-if="userStore.avatar">
                        <div class="xhs-avatar xhs-avatar-fallback" v-else>💬</div>
                        <div class="xhs-input-wrap">
                            <textarea
                                v-model="footerText"
                                class="xhs-input"
                                :rows="1"
                                            :placeholder="replyTarget ? `回复 ${replyTarget.nickName}...` : '说点什么...'"
                                            @focus="footerExpanded = true"
                                @blur="onFooterBlur"
                                @keydown.enter.exact.prevent="submitFooter"
                            ></textarea>
                            <button class="xhs-emoji" @mousedown.prevent="toggleFooterEmoji" type="button">😊</button>
                            <div v-if="showFooterEmoji" class="xhs-emoji-panel" @mousedown.prevent>
                                <button v-for="e in quickEmojis" :key="e" class="xhs-emoji-item" @click="appendFooterEmoji(e)">{{ e }}</button>
                            </div>
                        </div>
                        <button
                            class="xhs-send"
                            :class="{ active: footerText.trim().length > 0 }"
                            :disabled="!footerText.trim()"
                            @click="submitFooter"
                        >发送</button>
                    </div>
                    <div v-else class="login-tip" @click="goToLogin">
                        <span>登录后参与讨论</span>
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
import { trackEvent, EVENTS } from '@/utils/stats';
import { showUserCard } from '@/utils/userCardStore';

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

// 底部小红书风格输入栏状态
const footerText = ref('');
const footerExpanded = ref(false);
const showFooterEmoji = ref(false);
const quickEmojis = [
    '\u2764\uFE0F','\u{1F9E1}','\u{1F49B}','\u{1F49A}','\u{1F499}','\u{1F49C}','\u{1F5A4}','\u{1F90D}','\u{1F496}','\u{1F494}',
    '\u{1F525}','\u2728','\u{1F31F}','\u2B50','\u{1F308}','\u{1F338}','\u{1F339}','\u{1F33B}','\u{1F340}','\u2600\uFE0F',
    '\u{1F600}','\u{1F601}','\u{1F602}','\u{1F923}','\u{1F603}','\u{1F604}','\u{1F605}','\u{1F60A}','\u{1F60D}','\u{1F970}',
    '\u{1F618}','\u{1F60E}','\u{1F914}','\u{1F609}','\u{1F60C}','\u{1F60B}','\u{1F61C}','\u{1F929}','\u{1F973}','\u{1F60F}',
    '\u{1F62D}','\u{1F622}','\u{1F631}','\u{1F621}','\u{1F624}','\u{1F644}','\u{1F634}','\u{1F917}','\u{1F92D}','\u{1F92B}',
    '\u{1F44D}','\u{1F44E}','\u{1F44C}','\u{1F44F}','\u{1F64C}','\u{1F64F}','\u{1F4AA}','\u270C\uFE0F','\u{1F91D}','\u{1F440}'
];

// 当前回复目标（null 表示发顶级评论）
const replyTarget = ref<{ nickName: string; preview: string; parentId: string; replyToUserId?: string } | null>(null);
const footerInputRef = ref<HTMLTextAreaElement | null>(null);

const startReply = (item: any, parentCommentId?: string) => {
    if (!userStore.isLoggedIn) {
        loginModalRef.value?.openModal();
        return;
    }
    const raw = item.formattedContent || item.content || '';
    replyTarget.value = {
        nickName: item.userNickName,
        preview: raw.length > 30 ? raw.slice(0, 30) + '...' : raw,
        parentId: parentCommentId || item.commentId,
        replyToUserId: parentCommentId ? item.userId : undefined
    };
    footerExpanded.value = true;
    setTimeout(() => {
        document.querySelector<HTMLTextAreaElement>('.xhs-input')?.focus();
    }, 0);
};
const cancelReply = () => {
    replyTarget.value = null;
};

const onFooterBlur = () => {
    setTimeout(() => {
        if (!footerText.value && !showFooterEmoji.value) footerExpanded.value = false;
    }, 150);
};
const toggleFooterEmoji = () => {
    showFooterEmoji.value = !showFooterEmoji.value;
    footerExpanded.value = true;
};
const appendFooterEmoji = (e: string) => {
    footerText.value += e;
    showFooterEmoji.value = false;
};
const submitFooter = async () => {
    const text = footerText.value.trim();
    if (!text) return;
    if (replyTarget.value) {
        await handleReplySubmit(text, replyTarget.value.parentId, replyTarget.value.replyToUserId);
        replyTarget.value = null;
    } else {
        await handleCommentSubmit(text);
    }
    footerText.value = '';
    showFooterEmoji.value = false;
    footerExpanded.value = false;
};

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
        const res = await apiClient.get(`/quote/comments/${props.quoteId}`, {
            params: userStore.isLoggedIn ? { userId: userStore.userId } : {}
        });
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
    trackEvent(EVENTS.QUOTE_COMMENT);
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
    const before = !!comment.hasLiked;
    const offset = before ? -1 : 1;
    comment.hasLiked = !before;
    comment.likeNum = Math.max(0, (comment.likeNum || 0) + offset);
    try {
        const res = await apiClient.post('/quote/comment/like', {
            commentId: comment.commentId,
            userId: userStore.userId
        });
        // 以服务端返回的最新状态为准，防止与本地推断不一致
        if (typeof res?.data?.data === 'boolean') {
            comment.hasLiked = res.data.data;
        }
    } catch (e) {
        comment.hasLiked = before;
        comment.likeNum = Math.max(0, (comment.likeNum || 0) - offset);
        console.error(e);
    }
};

const addlike = async (quote: any) => {
    if (!userStore.isLoggedIn) return;
    if (quote._likeBusy) return; // 防连点 race
    quote._likeBusy = true;

    const before = quote.isliked;
    const url = before ? '/quote/eraseLike' : '/quote/addLike';

    try {
        const res = await apiClient.post(url, null, {
            params: { quoteId: quote.quoteInfo.quoteId, userId: userStore.userId }
        });
        quote.isliked = !before;
        if (quote.isliked) {
            trackEvent(EVENTS.QUOTE_LIKE);
        }
        const latest = res?.data?.data;
        if (typeof latest === 'number') {
            quote.quoteInfo.likesCount = latest;
        }
    } catch {
        // 失败时不动状态
    } finally {
        quote._likeBusy = false;
    }
};

const goToUserPage = (userId: string) => {
    showUserCard(userId);
};

const goToLogin = () => {
    // router.push('/login');
    // closeModal();
    loginModalRef.value?.openModal();
};

const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    const yearPart = sameYear ? '' : `${d.getFullYear()}年`;
    return `${yearPart}${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
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
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
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
    transition-property: transform, opacity;
  transition-duration: 0.4s;
  transition-timing-function: ease;
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
    max-width: calc(100vw - 40px);
    height: 90vh;
    max-height: 900px;
    background: linear-gradient(145deg, rgba(28, 28, 45, 0.9), rgba(15, 15, 25, 0.95));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
    /* 桌面端：二列网格 (图片 | 右侧内容区) + 顶部作者栏跨列 */
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
        "author author"
        "image  content";
    overflow: hidden;
    position: relative;
    backdrop-filter: blur(40px);
    transition: transform 0.3s ease;
}

.author-bar { grid-area: author; }
.modal-content { grid-area: image; min-height: 0; min-width: 0; overflow: hidden; }
.right-pane {
    grid-area: content;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    border-left: 1px solid rgba(255,255,255,0.05);
}
.right-pane-scroll {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}
.right-pane-scroll::-webkit-scrollbar { width: 6px; }
.right-pane-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
.right-pane-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

/* 顶部作者栏 */
.author-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
    gap: 12px;
}
.author-bar .author-info {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 4px 10px 4px 4px;
    border-radius: 30px;
    transition: background .25s;
    min-width: 0;
    flex: 1;
}
.author-bar .author-info:hover { background: rgba(255,255,255,0.04); }
.author-bar .author-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid rgba(255,255,255,0.15);
    transition: border-color .25s;
    flex-shrink: 0;
}
.author-bar .author-info:hover .author-avatar { border-color: #eb07ee; }
.author-bar .author-name {
    color: #fff;
    font-weight: 600;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.close-button {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255,255,255,0.8);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition-property: transform, box-shadow, opacity, background, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease;
    flex-shrink: 0;
}
.close-button:hover {
    background: rgba(235, 7, 238, 0.8);
    border-color: rgba(235, 7, 238, 0.8);
    color: #fff;
    transform: rotate(90deg);
}

.modal-content {
    display: flex;
    width: 100%;
    height: 100%;
    background: #000;
}

/* 图片区 (桌面端填满左栏，移动端高度固定) */
.left-section {
    flex: 1;
    width: 100%;
    height: 100%;
    background: #000;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
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
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.3s;
  transition-timing-function: ease;
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
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.3s;
  transition-timing-function: ease;
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

/* 右侧内容区 (已废弃，保留以防调用) */
.right-section { display: contents; }

.quote-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
}

.quote-content {
    font-size: 1.05rem;
    line-height: 1.65;
    color: rgba(255,255,255,0.95);
    font-weight: 400;
    letter-spacing: 0.3px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
}

.meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    gap: 12px;
}
.meta-row .publish-time {
    color: rgba(255,255,255,0.4);
    font-size: 0.78rem;
}

.like-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    padding: 6px 14px;
    border-radius: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.3s;
  transition-timing-function: ease;
    font-size: 0.85rem;
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

/* 评论区 (不再独立滚动，跟随 modal-content 一起滚) */
.comments-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.comments-header {
    padding: 16px 20px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    background: transparent;
}
.comments-header h3 {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.55);
    font-weight: 500;
    letter-spacing: 0.3px;
}

.comments-list {
    padding: 12px 20px 16px;
}

/* modal-content 滚动条 */
.modal-content::-webkit-scrollbar {
    width: 6px;
}
.modal-content::-webkit-scrollbar-track {
    background: transparent;
}
.modal-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
}
.modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2);
}

/* 底部输入栏 - 小红书风格（单行胶囊，所有元素36px基线对齐） */
.comment-footer {
    flex-shrink: 0;
    padding: 10px 20px 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(10, 10, 18, 0.88);
    backdrop-filter: blur(20px);
}
/* 回复目标提示条 */
.reply-target-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 12px;
    margin-bottom: 8px;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
    font-size: 0.82rem;
    color: rgba(255,255,255,0.55);
}
.reply-target-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.reply-target-label { color: rgba(255,255,255,0.4); flex-shrink: 0; }
.reply-target-name { color: #eb07ee; font-weight: 500; flex-shrink: 0; }
.reply-target-preview { color: rgba(255,255,255,0.45); overflow: hidden; text-overflow: ellipsis; }
.reply-target-cancel {
    width: 22px; height: 22px;
    border: none;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.6);
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background .2s;
}
.reply-target-cancel:hover { background: rgba(235,7,238,0.6); color: #fff; }
.xhs-input-bar {
    display: flex;
    align-items: center;
    gap: 10px;
}
.xhs-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
}
.xhs-avatar-fallback {
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.06);
    font-size: 14px;
}
.xhs-input-wrap {
    flex: 1;
    position: relative;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    transition: border-color .25s, background .25s;
    display: flex;
    align-items: center;
    padding-right: 40px;
    min-height: 36px;
}
.xhs-input-bar.is-expanded .xhs-input-wrap {
    background: rgba(255,255,255,0.09);
    border-color: rgba(235, 7, 238, 0.35);
}
.xhs-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: rgba(255,255,255,0.92);
    font-size: 0.9rem;
    line-height: 20px;
    padding: 8px 14px;
    resize: none;
    font-family: inherit;
    max-height: 80px;
    display: block;
}
.xhs-input::placeholder { color: rgba(255,255,255,0.35); }
.xhs-emoji {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px; height: 28px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: background .2s;
}
.xhs-emoji:hover { background: rgba(255,255,255,0.08); }
.xhs-emoji-panel {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    width: 280px;
    max-height: 200px;
    overflow-y: auto;
    background: rgba(30, 30, 50, 0.95);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 8px;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    backdrop-filter: blur(20px);
    z-index: 20;
    animation: fadeIn .2s;
}
.xhs-emoji-item {
    width: 30px; height: 30px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 16px;
    border-radius: 6px;
    transition: background .2s, transform .2s;
}
.xhs-emoji-item:hover { background: rgba(255,255,255,0.1); transform: scale(1.15); }
.xhs-send {
    flex-shrink: 0;
    height: 36px;
    padding: 0 18px;
    border-radius: 18px;
    border: none;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.4);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: not-allowed;
    transition-property: transform, opacity;
  transition-duration: 0.25s;
  transition-timing-function: ease;
    display: flex;
    align-items: center;
    justify-content: center;
}
.xhs-send.active {
    background: linear-gradient(135deg, #eb07ee, #a505de);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(235, 7, 238, 0.3);
}
.xhs-send.active:hover { filter: brightness(1.1); transform: translateY(-1px); }
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

.login-tip {
    text-align: center;
    padding: 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 24px;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-size: 0.9rem;
    border: 1px dashed rgba(255,255,255,0.1);
    transition-property: transform, box-shadow, opacity;
  transition-duration: 0.3s;
  transition-timing-function: ease;
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
.action-btn.like .icon {
    display: inline-block;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1);
    transform-origin: center;
}
.action-btn.like:hover .icon {
    transform: scale(1.2);
}
.action-btn.like:active .icon {
    transform: scale(0.85);
}
.action-btn.like .icon.pop {
    animation: heartPop .45s cubic-bezier(.34,1.56,.64,1);
}
.action-btn.like .like-count {
    display: inline-block;
    min-width: 14px;
    transition: color .2s;
}
.action-btn.like.has-liked .like-count {
    font-weight: 600;
}
@keyframes heartPop {
    0%   { transform: scale(1); }
    30%  { transform: scale(0.7); }
    60%  { transform: scale(1.4); }
    100% { transform: scale(1); }
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

/* 移动端适配：单列垂直流 (作者栏 → 图片 → 正文 → 评论 → 输入栏) */
@media (max-width: 900px) {
    .modal-overlay {
        padding: 0;
    }
    .quote-info-modal {
        width: 100%;
        height: 100%;
        max-height: none;
        border-radius: 0;
        /* 移动端：整体单列可滚动 */
        display: block;
        grid-template-columns: none;
        grid-template-rows: none;
        grid-template-areas: none;
        overflow-y: auto;
        overflow-x: hidden;
    }
    .author-bar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgba(15, 15, 25, 0.95);
        backdrop-filter: blur(20px);
    }
    /* 图片不再固定，作为滚动内容的一部分 */
    .modal-content {
        display: block;
        height: auto;
        overflow: visible;
    }
    .left-section {
        width: 100%;
        height: 50vh;
        min-height: 240px;
        background: #000;
    }
    .right-pane {
        display: block;
        border-left: none;
    }
    .right-pane-scroll {
        overflow: visible;
        min-height: 0;
        border-left: none;
    }
    .comment-footer {
        position: sticky;
        bottom: 0;
        z-index: 10;
    }
    .comment-footer { flex-shrink: 0; }

    .author-bar {
        padding: 10px 14px;
    }
    .author-bar .author-avatar { width: 32px; height: 32px; }
    .quote-header {
        padding: 14px 16px;
    }
    .quote-content {
        font-size: 1rem;
    }
    .comments-header {
        padding: 10px 16px;
    }
    .comments-scroll-area {
        padding: 12px 14px;
    }
    .comment-footer {
        padding: 8px 12px 10px;
    }
    .xhs-avatar { width: 28px; height: 28px; }
    .xhs-input { font-size: 0.85rem; padding: 6px 10px; }
    .xhs-send { height: 30px; padding: 0 12px; font-size: 0.8rem; border-radius: 15px; }

    .comment-card { padding: 10px 0; }
    .comment-main { gap: 10px; }
    .comment-avatar { width: 36px; height: 36px; }
    .replies-wrapper {
        margin-left: 12px;
        padding-left: 12px;
    }

    .carousel-button {
        width: 36px; height: 36px;
    }
    .prev { left: 10px; }
    .next { right: 10px; }
}

@media (max-width: 480px) {
    .left-section { height: 45vh; min-height: 220px; }
    .quote-content { font-size: 0.95rem; }
}
</style>