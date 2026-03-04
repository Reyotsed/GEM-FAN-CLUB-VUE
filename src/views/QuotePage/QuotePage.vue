<template>
    <div class="quote-page">
        <div class="quote-list">
            <div class="quote-item" v-for="(quote, index) in quoteList" :key="index">
                <div class="quote-item-content-picture" @click="goToQuoteDetail(quote.quoteInfo.quoteId)">
                    <div class="quote-item-content-picture-item" v-for="(picture, pictureIndex) in quote.pictureList" :key="pictureIndex">
                        <img :src="picture" alt="quote-picture">
                    </div>
                </div>  
                <div class="quote-item-content" @click="goToQuoteDetail(quote.quoteInfo.quoteId)">
                    <div class="quote-item-content-text">
                        <div class="quote-item-content-text-content">   
                            {{ quote.quoteInfo.content }}
                        </div>
                    </div>
                </div>
                <div class="quote-item-content-user">
                    <div class="quote-item-content-user-avatar" @click="goToUserPage(quote.quoteInfo.userId)">
                        <img :src="quote.userAvatar" alt="user-avatar">
                    </div>
                    <div class="quote-item-content-user-nickname">
                        {{ quote.userNickName }}
                    </div>
                    <div class="quote-item-content-like" @click.stop="addlike(quote)">
                        <span :class="['like-icon', { 'liked': quote.isliked }]">
                            <span v-if="quote.isliked">❤️</span>
                            <span v-else>🤍</span>
                        </span>
                        <div class="quote-item-content-like-count">
                            {{ quote.quoteInfo.likesCount }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        

        <!-- Quote 详情弹窗 -->
        <QuoteInfoPage
            v-model:visible="showQuoteModal"
            :quote-id="selectedQuoteId"
        />
    </div>
    <!-- 添加加载更多按钮 -->
    <div class="load-more-container" v-if="!noMoreQuotes">
            <button 
                class="load-more-btn" 
                @click="loadMoreQuotes"
                :disabled="loading"
            >
                <span v-if="loading" class="loading-spinner"></span>
                {{ loading ? '加载中...' : '加载更多' }}
            </button>
        </div>
        <div class="no-more-container" v-else>
            <div class="no-more">
                <span class="no-more-icon">✨</span>
                没有更多内容了~
            </div>
        </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import QuoteInfoPage from './QuoteInfoPage.vue';

const router = useRouter();
const userStore = useUserStore();
const isMounted = ref(true);

interface QuoteInfo{
    quoteId: number;
    commentsCount: number;
    likesCount: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

interface Quote {
    quoteInfo: QuoteInfo;
    userNickName: string;
    userAvatar: string;
    pictureList: string[]; // 假设这是一个图片 URL 数组
    isliked: boolean;
}

const quoteList = ref<Quote[]>([]);
const showQuoteModal = ref(false);
const selectedQuoteId = ref('');
const loading = ref(false);
const noMoreQuotes = ref(false);
const batchSize = 6; // 每次加载的数量

// 获取已显示的 Quote IDs
const getDisplayedQuoteIds = () => {
    return quoteList.value.map(quote => quote.quoteInfo.quoteId);
};

// 加载 Quote 数据的通用函数
const loadQuoteData = async (quote: Quote) => {
    try {
        // 并行请求图片、用户信息、点赞状态
        const [pictureRes, userRes, likeRes] = await Promise.all([
            apiClient.get('/quote/quotePicture', { params: { quoteId: quote.quoteInfo.quoteId } }),
            apiClient.get('/user/getUserInfo', { params: { userId: quote.quoteInfo.userId } }),
            userStore.isLoggedIn ? apiClient.get('/quote/isLiked', { params: { quoteId: quote.quoteInfo.quoteId, userId: userStore.userId } }) : Promise.resolve(null)
        ]);

        if (!isMounted.value) return;

        // 处理图片
        if (pictureRes.data.data.length > 0) {
            const imageUrl = await apiClient.getImageUrl(pictureRes.data.data[0].filePath);
            quote.pictureList = [imageUrl];
        }

        // 处理用户信息
        quote.userNickName = userRes.data.data.nickName;
        quote.userAvatar = await apiClient.getImageUrl(userRes.data.data.avatar);

        // 处理点赞
        if (likeRes) {
            quote.isliked = likeRes.data.data;
        }
    } catch (error) {
        console.error('加载 Quote 数据失败:', error);
    }
};

// 加载更多 Quotes
const loadMoreQuotes = async () => {
    if (loading.value || noMoreQuotes.value) return;
    
    loading.value = true;
    try {
        const displayedIds = getDisplayedQuoteIds();
        const response = await apiClient.post('/quote/getMoreQuotes', {
            displayedIds: displayedIds,
            count: batchSize
        });

        if (!isMounted.value) return;

        const newQuotes = response.data.data;
        
        // 如果返回的数量小于请求的数量，说明没有更多了
        if (newQuotes.length < batchSize) {
            noMoreQuotes.value = true;
        }

        // 并行处理所有新 quote 的数据加载
        const quotePromises = newQuotes.map(async (quoteInfo) => {
            const quote: Quote = {
                quoteInfo: quoteInfo,
                userNickName: '',
                userAvatar: '',
                pictureList: [],
                isliked: false
            };
            await loadQuoteData(quote);
            return quote;
        });

        const processedQuotes = await Promise.all(quotePromises);
        
        if (!isMounted.value) return;

        quoteList.value.push(...processedQuotes);
    } catch (error) {
        console.error('加载更多 Quotes 失败:', error);
    } finally {
        if (isMounted.value) {
            loading.value = false;
        }
    }
};

// 初始加载
onMounted(async () => {
    isMounted.value = true;
    window.scrollTo(0, 0);
    await loadMoreQuotes();
});

onUnmounted(() => {
    isMounted.value = false;
});

// 添加点赞功能
const addlike = (quote) => {
    if (userStore.isLoggedIn == false){
        return;
    }
    quote.isliked = !quote.isliked; // 切换点赞状态
    if(quote.isliked){      
        // 这里可以添加其他逻辑，例如更新后端的点赞状态
        apiClient.get('/quote/addLike', {
            params: {
                quoteId: quote.quoteInfo.quoteId,
                userId: quote.quoteInfo.userId
            }
        });
        quote.quoteInfo.likesCount++;
    }else{
        apiClient.get('/quote/eraseLike', {
            params: {
                quoteId: quote.quoteInfo.quoteId,
                userId: quote.quoteInfo.userId
            }
        });
        quote.quoteInfo.likesCount--;
    }
};

// 跳转到用户页面
const goToUserPage = (userId) => {
    router.push({ path: `/user`, query: { id: userId } });
};

// 添加跳转到详情页的方法
const goToQuoteDetail = (quoteId) => {
    selectedQuoteId.value = String(quoteId);
    showQuoteModal.value = true;
};

</script>

<style scoped>
.quote-page {
    min-height: 100vh;
    padding: calc(var(--nav-height, 70px) + 2rem) 1rem 2rem;
    background: var(--bg-dark);
    background-image: 
        radial-gradient(circle at 20% 20%, rgba(235, 7, 238, 0.1), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(0, 242, 255, 0.1), transparent 40%);
    position: relative;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    color: #fff;
}

.quote-list {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
    box-sizing: border-box;
    padding: 1rem;
}

.quote-item {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    padding: 1.5rem;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.quote-item:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 50px rgba(235, 7, 238, 0.15);
    border-color: rgba(235, 7, 238, 0.3);
    background: rgba(255, 255, 255, 0.05);
}

.quote-item-content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.quote-item-content-text {
    margin: 1.2rem 0;
}

.quote-item-content-text-content {   
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    font-weight: 400;
    letter-spacing: 0.5px;
}

.quote-item-content-picture {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.8rem;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 1rem;
}

.quote-item-content-picture-item {
    width: 100%;
    aspect-ratio: 1; /* 保持正方形 */
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.quote-item-content-picture-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.quote-item:hover .quote-item-content-picture-item img {
    transform: scale(1.1);
}

/* 用户信息部分样式 */
.quote-item-content-user {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50px;
    padding: 0.5rem 0.8rem 0.5rem 0.5rem;
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
}

.quote-item:hover .quote-item-content-user {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.1);
}

.quote-item-content-user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 0.8rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
}

.quote-item-content-user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.quote-item-content-user:hover .quote-item-content-user-avatar {
    border-color: #eb07ee;
    transform: scale(1.1);
}

.quote-item-content-user-nickname {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    margin-right: auto;
}

/* 点赞量样式 */
.quote-item-content-like {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.quote-item-content-like:hover {
    background: rgba(235, 7, 238, 0.2);
}

.like-icon {
    font-size: 1rem;
    transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.like-icon.liked {
    transform: scale(1.2);
    animation: heartBeat 0.3s ease-in-out;
}

@keyframes heartBeat {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1.2); }
}

.quote-item-content-like-count {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
}

/* 加载更多按钮 */
.load-more-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin: 3rem 0;
    padding: 1rem;
}

.load-more-btn {
    background: linear-gradient(135deg, #eb07ee, #a505de);
    color: white;
    border: none;
    padding: 0.8rem 3rem;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 10px 20px rgba(235, 7, 238, 0.3);
    position: relative;
    overflow: hidden;
}

.load-more-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(235, 7, 238, 0.5);
}

.load-more-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    box-shadow: none;
}

.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
    vertical-align: middle;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.no-more-container {
    width: 100%;
    display: flex;
    justify-content: center;
    margin: 3rem 0;
}

.no-more {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 响应式布局 */
@media (max-width: 1024px) {
    .quote-list {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }
}

@media (max-width: 768px) {
    .quote-page {
        padding: calc(var(--nav-height, 70px) + 1rem) 1rem 1rem;
    }

    .quote-list {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .quote-item {
        padding: 1.2rem;
    }
}
</style>
