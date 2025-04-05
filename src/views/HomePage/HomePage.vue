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
                <p>爱姐姐是一辈子的事！</p>
                <p>网站还在开发中，作者苦逼读研中，更新较慢，请见谅</p>
            </div>
            
            <!-- 音乐成就部分 -->
            <div class="achievements-section">
                <h2>音乐成就与里程碑</h2>
                <div class="achievements-grid">
                    <div class="achievement-card">
                        <div class="achievement-icon"><i class="fas fa-trophy"></i></div>
                        <h3>多白金唱片</h3>
                        <p>多张专辑在中国大陆、香港、台湾地区获得白金唱片认证，专辑《新的心跳》创下白金唱片销量纪录。</p>
                    </div>
                    <div class="achievement-card">
                        <div class="achievement-icon"><i class="fas fa-award"></i></div>
                        <h3>国际认可</h3>
                        <p>入选美国《时代》杂志"30位30岁以下对世界有影响力人物"，Billboard中国榜单多次占据榜首。</p>
                    </div>
                    <div class="achievement-card">
                        <div class="achievement-icon"><i class="fas fa-globe-asia"></i></div>
                        <h3>全球影响力</h3>
                        <p>成功举办多轮世界巡回演唱会，足迹遍布亚洲、北美洲、大洋洲等地区，影响力不断扩大。</p>
                    </div>
                    <div class="achievement-card">
                        <div class="achievement-icon"><i class="fas fa-music"></i></div>
                        <h3>音乐创作</h3>
                        <p>不仅是出色的歌手，还是优秀的词曲创作人，《光年之外》、《再见》等歌曲广为传唱。</p>
                    </div>
                </div>
            </div>
            
            
            <!-- 社交媒体链接部分 -->
            <div class="social-media-section">
                <h2>官方社交媒体</h2>
                <p class="social-intro">关注邓紫棋的官方社交媒体账号，获取最新动态、音乐发布和演唱会信息！</p>
                <div class="social-links">
                    <a href="https://weibo.com/1705586121?refer_flag=1001030103_" target="_blank" class="social-link">
                        <div class="social-icon weibo"><i class="fab fa-weibo"></i></div>
                        <span>微博</span>
                        <small>@GEM鄧紫棋</small>
                    </a>
                    <a href="https://youtube.com/user/GEMblog" target="_blank" class="social-link">
                        <div class="social-icon youtube"><i class="fab fa-youtube"></i></div>
                        <span>YouTube</span>
                        <small>G.E.M. 鄧紫棋</small>
                    </a>
                    <a href="https://music.163.com/#/artist?id=7763" target="_blank" class="social-link">
                        <div class="social-icon netease"><i class="fas fa-music"></i></div>
                        <span>网易云音乐</span>
                        <small>G.E.M.邓紫棋</small>
                    </a>
                    <a href="https://y.qq.com/n/yqq/singer/001fNHEf1SFEFN.html" target="_blank" class="social-link">
                        <div class="social-icon qqmusic"><i class="fas fa-music"></i></div>
                        <span>QQ音乐</span>
                        <small>G.E.M.邓紫棋</small>
                    </a>
                    <a href="https://space.bilibili.com/1889545341?spm_id_from=333.337.0.0" target="_blank" class="social-link">
                        <div class="social-icon bilibili"><i class="fas fa-play-circle"></i></div>
                        <span>哔哩哔哩</span>
                        <small>邓紫棋</small>
                    </a>
                    <a href="https://www.xiaohongshu.com/user/profile/5b8cc0472611925a1caca48a?xsec_token=ABb3En6PVp9dKhRWeEKnO_AjjGOk3mrS64Enwx15dNLDg%3D&xsec_source=pc_search" target="_blank" class="social-link">
                        <div class="social-icon xiaohongshu"><i class="fas fa-book"></i></div>
                        <span>小红书</span>
                        <small>邓紫棋</small>
                    </a>
                    <a href="https://www.douyin.com/user/MS4wLjABAAAAh7MdVA-UbMYLeO3_zhA_Z-Mrkh8cDwBCU_qQqucnrFE?from_tab_name=main" target="_blank" class="social-link">
                        <div class="social-icon douyin"><i class="fas fa-music"></i></div>
                        <span>抖音</span>
                        <small>邓紫棋</small>
                    </a>
                </div>
            </div>
            
            <!-- 联系方式区域 -->
            <div class="footer-container">
                <div class="footer-content">
                    <h3>关于作者</h3>
                    <div class="contact-info">
                        <div class="contact-item">
                            <i class="fab fa-github"></i>
                            <a href="https://github.com/Reyotsed" target="_blank" rel="noopener noreferrer">GitHub: @Reyotsed</a>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <a href="mailto:zxiaoyao522@gmail.com">Email: zxiaoyao522@gmail.com</a>
                        </div>
                    </div>
                    
                    <div class="disclaimer">
                        <h4>免责声明</h4>
                        <p>本网站为邓紫棋粉丝自行开发的非官方网站，仅用于粉丝交流与分享。所有内容均来源于公开资料，版权归原作者所有。</p>
                        <p>网站使用 Vue.js 构建，采用响应式设计确保在不同设备上的良好体验。如发现任何问题或有改进建议，欢迎通过上述联系方式反馈。</p>
                        <p>© 2025 GEM Fan Club. 保留所有权利。</p>
                    </div>
                </div>
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
    // 确保页面滚动到顶部
    window.scrollTo(0, 0);
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

/* 添加页脚样式 */
.footer-container {
    width: 100%;
    margin-top: 50px;
    padding: 30px 20px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-content {
    max-width: 900px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
}

.footer-content h3 {
    font-size: 28px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #ff69b4, #eb07ee);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
}

.contact-info {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.1);
    padding: 10px 20px;
    border-radius: 30px;
    transition: all 0.3s ease;
}

.contact-item:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.contact-item i {
    font-size: 20px;
    color: #eb07ee;
}

.contact-item a {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.contact-item a:hover {
    color: #fff;
    text-decoration: underline;
}

.disclaimer {
    margin-top: 30px;
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
}

.disclaimer h4 {
    font-size: 20px;
    margin-bottom: 15px;
    color: rgba(255, 255, 255, 0.9);
}

.disclaimer p {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 10px;
}

.disclaimer p:last-child {
    margin-top: 20px;
    font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .contact-info {
        flex-direction: column;
        gap: 10px;
    }
    
    .contact-item {
        width: 100%;
        justify-content: center;
    }
    
    .footer-content h3 {
        font-size: 24px;
    }
    
    .disclaimer h4 {
        font-size: 18px;
    }
    
    .disclaimer p {
        font-size: 12px;
    }
}

/* 成就部分样式 */
.achievements-section {
    max-width: 900px;
    margin: 50px auto;
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

.achievements-section h2 {
    margin-bottom: 30px;
    font-size: 32px;
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

.achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 30px;
}

.achievement-card {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 15px;
    padding: 25px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.achievement-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    background: rgba(0, 0, 0, 0.3);
}

.achievement-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #ff69b4, #eb07ee);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 15px;
}

.achievement-icon i {
    font-size: 28px;
    color: white;
}

.achievement-card h3 {
    font-size: 20px;
    margin-bottom: 15px;
    color: white;
}

.achievement-card p {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.8);
}

/* 社交媒体部分样式 */
.social-media-section {
    max-width: 900px;
    margin: 50px auto;
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

.social-media-section h2 {
    margin-bottom: 15px;
    font-size: 32px;
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

.social-intro {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 25px;
    text-align: center;
}

.social-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
}

.social-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    padding: 15px;
    border-radius: 15px;
    background: rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.social-link:hover {
    transform: translateY(-5px);
    background: rgba(0, 0, 0, 0.3);
}

.social-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
}

.social-icon i {
    font-size: 30px;
    color: white;
}

.social-link span {
    font-size: 16px;
    font-weight: 500;
    color: white;
    margin-bottom: 5px;
}

.social-link small {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
}

/* 社交媒体图标颜色 */
.weibo {
    background: linear-gradient(45deg, #ff3c4a, #ff9eb5);
}

.youtube {
    background: linear-gradient(45deg, #ff0000, #ff5e5e);
}

.netease {
    background: linear-gradient(45deg, #d43c33, #ff7875);
}

.qqmusic {
    background: linear-gradient(45deg, #31c27c, #5cdeae);
}

.bilibili {
    background: linear-gradient(45deg, #fb7299, #fc9ebb);
}

.xiaohongshu {
    background: linear-gradient(45deg, #fe2c55, #ff6b81);
}

.douyin {
    background: linear-gradient(45deg, #000000, #333333);
}

/* 响应式设计扩展 */
@media (max-width: 768px) {
    .achievements-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 15px;
    }
    
    .achievement-card {
        padding: 15px;
    }
    
    .achievement-icon {
        width: 50px;
        height: 50px;
    }
    
    .achievement-icon i {
        font-size: 22px;
    }
    
    .achievement-card h3 {
        font-size: 18px;
        margin-bottom: 10px;
    }
    
    .achievement-card p {
        font-size: 13px;
    }
    
    .social-links {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .contact-info {
        flex-direction: column;
        gap: 10px;
    }
    
    .contact-item {
        width: 100%;
        justify-content: center;
    }
}
</style>