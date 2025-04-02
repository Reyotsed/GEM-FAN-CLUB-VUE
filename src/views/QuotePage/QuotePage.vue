<template>
    <div class="quote-page">
        <div class="quote-list">
            <div class="quote-item" v-for="(quote, index) in quoteList" :key="index" @click="goToQuoteDetail(quote.quoteInfo.quoteId)">
                <div class="quote-item-content-picture">
                    <div class="quote-item-content-picture-item" v-for="(picture, pictureIndex) in quote.pictureList" :key="pictureIndex">
                        <img :src="picture" alt="quote-picture">
                    </div>
                </div>  
                <div class="quote-item-content">
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
                    <div class="quote-item-content-like" @click="addlike(quote)">
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
</template>

<script setup lang="ts">
import { ref,onMounted } from 'vue';
import apiClient from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import QuoteInfoPage from './QuoteInfoPage.vue';

const router = useRouter();
const userStore = useUserStore();

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

onMounted(() => {
    // 先获取quoteList
    apiClient.get('/quote/quoteList').then(res => {
        // 循环每个quote
        for (let i = 0; i < res.data.data.length; i++) {
            quoteList.value.push({
                quoteInfo: res.data.data[i],
                userNickName: '',
                userAvatar: '',
                pictureList: [],
                isliked: false
            });
            
            // 先获取这个quote的pictureList(path)
            apiClient.get('/quote/quotePicture', {
                params: {
                    quoteId: res.data.data[i].quoteId
                }
            }).then(res => {
                // 这里拿到的是一个数组，数组中是对象，对象中是filePath
                for (let j = 0; j < 1; j++) {
                    // 根据filePath获取图片
                    apiClient.getImageUrl(res.data.data[j].filePath).then(imageUrl => {
                        quoteList.value[i].pictureList.push(imageUrl);
                    });
                }
            });
            
            // 再获取userNickName和userAvatar
            apiClient.get('/user/getUserInfo', {
                params: {
                    userId: quoteList.value[i].quoteInfo.userId
                }
            }).then(res => {
                quoteList.value[i].userNickName = res.data.data.nickName;
                // 再获取userAvatar
                apiClient.getImageUrl(res.data.data.avatar).then(avatarUrl => {
                    quoteList.value[i].userAvatar = avatarUrl;
                });
            });

            // 如果用户已经登录，获取是否已经点赞：
            if (userStore.isLoggedIn){
                apiClient.get('/quote/isLiked', {
                    params: {
                        quoteId: quoteList.value[i].quoteInfo.quoteId,
                        userId: userStore.userId    
                    }
                }).then(res => {
                    quoteList.value[i].isliked = res.data.data;
                });
            }
        };

        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
        quoteList.value.push(quoteList.value[0]);
    });
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
    background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
    padding: 2rem 1rem;
    min-height: 40vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    box-sizing: border-box;
}

.quote-list {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    box-sizing: border-box;
}

.quote-item {
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    transition: transform 0.2s;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
}

.quote-item:hover {
    transform: translateY(-5px); /* 悬停效果 */
}

.quote-item-content {
    display: flex;
    flex-direction: column;
}

.quote-item-content-text {
    font-size: 1.2rem;
    color: #333;
    margin-bottom: 1rem; /* 增加文本与图片之间的间距 */
    white-space: nowrap; /* 不换行 */
    overflow: hidden; /* 隐藏溢出部分 */
    text-overflow: ellipsis; /* 溢出时显示省略号 */
}

.quote-item-content-picture {
    display: flex;
    flex-wrap: wrap; /* 允许换行 */
    gap: 0.5rem; /* 图片之间的间距 */
    justify-content: center;
}

.quote-item-content-picture-item {
    flex: 1 1 150px; /* 设置图片的基础宽度 */
    max-width: 300px; /* 限制最大宽度 */
    height: 350px; /* 设置固定高度 */
    overflow: hidden; /* 隐藏溢出部分 */
    border-radius: 8px; /* 圆角效果 */
}

.quote-item-content-picture-item img {
    width: 100%;
    height: 100%; /* 使图片填满容器 */
    object-fit: cover; /* 保持比例并填满容器 */
    transition: transform 0.2s; /* 添加过渡效果 */
}

.quote-item-content-picture-item:hover img {
    transform: scale(1.1); /* 悬停时放大图片 */
}

/* 用户信息部分样式 */
.quote-item-content-user {
    display: flex;
    align-items: center; /* 垂直居中 */
    margin-top: 1rem; /* 增加顶部间距 */
    justify-content: space-between; /* 使内容分布在两边 */
}

.quote-item-content-user-avatar {
    width: 40px; /* 头像宽度 */
    height: 40px; /* 头像高度 */
    border-radius: 50%; /* 圆形头像 */
    overflow: hidden; /* 隐藏溢出部分 */
    margin-right: 0.5rem; /* 头像与昵称之间的间距 */
    transition: transform 0.2s; /* 添加过渡效果 */
}

.quote-item-content-user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 保持图片比例 */
}

.quote-item-content-user-nickname {
    font-size: 1rem;
    color: #555;
    transition: color 0.2s; /* 添加过渡效果 */
    margin-right: 0.5rem; /* 昵称与点赞数量之间的间距 */
}

/* 点赞量样式 */
.quote-item-content-like {
    font-size: 1rem;
    color: #FF3366; /* 点赞量颜色 */
    font-weight: bold;
    display: flex;
    align-items: center; /* 垂直居中 */
}

.like-icon {
    margin-right: 0.2rem; /* 红心图标与数量之间的间距 */
    cursor: pointer; /* 鼠标悬停时显示为可点击 */
    transition: transform 0.2s; /* 添加过渡效果 */
}

.like-icon.liked {
    transform: scale(1.2); /* 点赞时放大 */
}

/* 悬停效果 */
.quote-item-content-user:hover .quote-item-content-user-avatar {
    transform: scale(1.1); /* 放大头像 */
}

.quote-item-content-user:hover .quote-item-content-user-nickname {
    color: #FF3366; /* 悬停时改变昵称颜色 */
}

/* 修改响应式布局 */
@media (max-width: 768px) {
    .quote-page {
        padding: 1rem 0.5rem;
    }

    .quote-list {
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 1rem;
    }
}

@media (min-width: 769px) and (max-width: 1200px) {
    .quote-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (min-width: 1201px) {
    .quote-list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
</style>
