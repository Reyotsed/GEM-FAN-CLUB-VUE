<template>
    <div class="home-container">
        <div class="slider-container">
            <div 
                class="slider-track"
                :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
            >
                <div 
                    v-for="(image, index) in images" 
                    :key="index"
                    class="slide"
                    :class="{ active: currentIndex === index }"
                >
                    <div class="image-container">
                        <img 
                            :src="image" 
                            :alt="`Slide ${index + 1}`"
                            class="slide-image"
                        >
                    </div>
                </div>
            </div>

            <!-- 左右导航按钮 -->
            <button class="nav-button prev" @click="prevSlide" v-show="currentIndex > 0">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button 
                class="nav-button next" 
                @click="nextSlide" 
                v-show="currentIndex < images.length - 1"
            >
                <i class="fas fa-chevron-right"></i>
            </button>

            <!-- 底部指示器 -->
            <div class="slider-indicators">
                <button 
                    v-for="(_, index) in images" 
                    :key="index"
                    class="indicator"
                    :class="{ active: currentIndex === index }"
                    @click="goToSlide(index)"
                ></button>
            </div>
        </div>

        <!-- 内容部分 -->
        <div class="content-container">
            <div class="content-item">
                <h2>邓紫棋</h2>
                <p>邓紫棋（G.E.M.），本名邓诗颖，1991年8月16日出生于上海市，中国香港流行乐女歌手、词曲作者、音乐制作人。2008年，邓紫棋因参加香港TVB举办的全球华人新秀歌唱大赛而获得关注。2009年，发行首张EP《G.E.M.》，从而正式出道。此后，她凭借独特的嗓音和出色的创作才华，迅速成为华语乐坛的顶级歌手之一。</p>
                <p>邓紫棋的音乐风格多样，融合了流行、摇滚、电子等多种元素，创作了众多广受欢迎的歌曲，如《泡沫》《光年之外》《手心的蔷薇》等。她的音乐不仅在华语地区广受欢迎，也在国际上具有一定的影响力。</p>
                <p>除了音乐事业，邓紫棋还积极参与公益活动，关注环保、教育、健康等多个领域，用自己的影响力传递正能量。</p>
                <p>邓紫棋用音乐传递爱与力量，一路与粉丝共同成长。欢迎加入GEM Fan Club，一起支持邓紫棋，分享音乐带来的快乐！</p>
                <p>网站还在开发中，作者苦逼读研中，更新较慢，请见谅</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 不需要导入，直接定义图片路径
const images = [
  '/img/homepage/001.jpg',
  '/img/homepage/002.jpg',
  '/img/homepage/003.jpg',
  '/img/homepage/004.jpg'
];

const currentIndex = ref(0);
let isAnimating = false;
let autoPlayTimer = null;

// 重置自动播放
const resetAutoPlay = () => {
    if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
    }
    autoPlayTimer = setInterval(() => {
        if (currentIndex.value < images.length - 1) {
            currentIndex.value++;
        } else {
            currentIndex.value = 0;
        }
    }, 5000);
};

// 切换到下一张
const nextSlide = () => {
    if (isAnimating || currentIndex.value >= images.length - 1) return;
    
    isAnimating = true;
    currentIndex.value++;
    resetAutoPlay(); // 重置计时器
    
    setTimeout(() => {
        isAnimating = false;
    }, 1000);
};

// 切换到上一张
const prevSlide = () => {
    if (isAnimating || currentIndex.value <= 0) return;
    
    isAnimating = true;
    currentIndex.value--;
    resetAutoPlay(); // 重置计时器
    
    setTimeout(() => {
        isAnimating = false;
    }, 1000);
};

// 直接跳转到指定幻灯片
const goToSlide = (index) => {
    if (isAnimating) return;
    
    isAnimating = true;
    currentIndex.value = index;
    resetAutoPlay(); // 重置计时器
    
    setTimeout(() => {
        isAnimating = false;
    }, 1000);
};

onMounted(() => {
    resetAutoPlay(); // 初始启动自动播放
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
    }
    window.removeEventListener('keydown', handleKeydown);
});

// 键盘导航
const handleKeydown = (event) => {
    if (event.key === 'ArrowLeft') {
        prevSlide();
    } else if (event.key === 'ArrowRight') {
        nextSlide();
    }
};
</script>

<style scoped>
.home-container {
    width: 100vw; /* 使用视口宽度 */
    min-height: 100vh;
    overflow-x: hidden;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    margin: 0; /* 移除所有外边距 */
    padding: 0; /* 移除所有内边距 */
    display: flex;
    flex-direction: column;
    position: absolute; /* 使用绝对定位填满整个视口 */
    top: 50px; /* 导航栏高度 */
    left: 0;
    right: 0;
}

.slider-container {
    position: relative;
    width: 100vw; /* 使用视口宽度 */
    height: calc(100vh - 50px); /* 减去导航栏高度 */
    overflow: hidden;
    margin: 0 -10px; /* 负边距，确保拉伸到边缘 */
}

.slider-track {
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide {
    flex: 0 0 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin: 0; /* 移除边距 */
    padding: 0; /* 移除内边距 */
}

.slide-image {
    width: 100%;
    height: 100%;
    object-fit: contain; /* 保持原有的图片显示方式 */
    max-height: 100%;
    transition: transform 0.8s ease;
}

.slide.active .slide-image {
    transform: scale(1.03);
}

/* 导航按钮样式 */
.nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(4px);
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-button:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-50%) scale(1.1);
}

.prev {
    left: 30px;
}

.next {
    right: 30px;
}

/* 指示器样式 */
.slider-indicators {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.15);
    padding: 10px 20px;
    border-radius: 30px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.8);
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
}

.indicator.active {
    background: white;
    transform: scale(1.2);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

/* 内容区域样式 */
.content-container {
    position: relative;
    width: 100%;
    padding: 50px 20px;
    color: white;
    text-align: center;
    z-index: 5;
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.3));
}

.content-item {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    animation: fadeInUp 1s ease;
    position: relative;
    overflow: hidden;
}

.content-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
    );
    transform: skewX(-15deg);
    transition: 0.5s;
    pointer-events: none;
}

.content-item:hover::before {
    left: 100%;
    transition: 0.8s;
}

.content-item h2 {
    margin-bottom: 30px;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 2px;
    background: linear-gradient(135deg, #ff69b4, #eb07ee);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;
    display: inline-block;
}

.content-item h2::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ff69b4, transparent);
}

.content-item p {
    font-size: 18px;
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 20px;
    text-align: justify;
    padding: 0 10px;
    position: relative;
    transition: all 0.3s ease;
}

.content-item p:hover {
    color: white;
    transform: translateX(5px);
}

.content-item p:last-child {
    margin-bottom: 0;
    padding-bottom: 10px;
}

/* 添加响应式设计 */
@media (max-width: 768px) {
    .home-container,
    .slider-container {
        width: 100vw;
        margin: 0;
        padding: 0;
    }

    .nav-button {
        width: 40px;
        height: 40px;
        font-size: 20px;
    }

    .indicator {
        width: 10px;
        height: 10px;
    }
    
    .content-container {
        padding: 30px 15px;
    }
    
    .content-item {
        padding: 25px;
    }
    
    .content-item h2 {
        font-size: 28px;
        margin-bottom: 20px;
    }
    
    .content-item p {
        font-size: 16px;
        line-height: 1.6;
        padding: 0 5px;
    }
}

/* 修改渐变效果 */
.slide::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.15) 0%,
        rgba(0, 0, 0, 0) 30%,
        rgba(0, 0, 0, 0) 70%,
        rgba(0, 0, 0, 0.15) 100%
    );
    pointer-events: none;
}

/* 添加加载和内容动画 */
.slide-image {
    opacity: 0;
    animation: fadeIn 0.8s ease forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 添加新的动画效果 */
@keyframes gradientBG {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

@keyframes shimmer {
    0% {
        opacity: 0.5;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0.5;
    }
}
</style>