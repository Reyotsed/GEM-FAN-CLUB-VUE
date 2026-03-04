<template>
    <div class="home-container">
        <!-- Hero Section: 全屏轮播与大标题 -->
        <section class="hero-section">
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
                        <!-- 背景模糊层：用于填充氛围 -->
                        <div class="slide-bg">
                            <img 
                                :src="image" 
                                :alt="`G.E.M. Slide Background ${index + 1}`"
                                class="bg-image"
                            >
                        </div>
                        <!-- 前景完整层：用于展示完整图片 -->
                        <div class="image-wrapper">
                            <img 
                                :src="image" 
                                :alt="`G.E.M. Slide ${index + 1}`"
                                class="slide-image"
                            >
                        </div>
                    </div>
                </div>
                <div class="hero-overlay"></div>
            </div>

            <!-- Hero 内容悬浮层 -->
            <div class="hero-content">
                <h1 class="main-title">
                    <span class="glitch" data-text="G.E.M.">G.E.M.</span>
                    <span class="chinese-name">邓紫棋</span>
                </h1>
                <p class="sub-title">Get Everybody Moving</p>
                <div class="hero-actions">
                    <button class="cta-button primary" @click="scrollToContent">
                        <span>探索音乐宇宙</span>
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <!-- 轮播控制 -->
            <div class="slider-controls">
                <button class="nav-btn prev" @click="prevSlide">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="indicators">
                    <span 
                        v-for="(_, index) in images" 
                        :key="index"
                        class="dot"
                        :class="{ active: currentIndex === index }"
                        @click="goToSlide(index)"
                    ></span>
                </div>
                <button class="nav-btn next" @click="nextSlide">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- 滚动提示 -->
            <div class="scroll-hint" @click="scrollToContent">
                <div class="mouse">
                    <div class="wheel"></div>
                </div>
                <span>SCROLL</span>
            </div>
        </section>

        <!-- 主要内容区域 -->
        <div class="main-content" id="main-content">
            
            <!-- 个人简介：交错布局 -->
            <section class="section intro-section">
                <div class="section-header">
                    <span class="section-tag">PROFILE</span>
                    <h2>关于 <span class="highlight">G.E.M.</span></h2>
                </div>
                
                <div class="intro-grid">
                    <div class="intro-card glass-card" data-aos="fade-up">
                        <div class="card-icon"><i class="fas fa-microphone-alt"></i></div>
                        <h3>音乐起点</h3>
                        <p>邓紫棋（G.E.M.），本名邓诗颖，1991年8月16日出生于上海。2008年出道，凭借首张EP《G.E.M.》一鸣惊人。她以广阔的音域和极具爆发力的嗓音，迅速成为华语乐坛的焦点。</p>
                    </div>
                    <div class="intro-card glass-card" data-aos="fade-up" data-aos-delay="100">
                        <div class="card-icon"><i class="fas fa-music"></i></div>
                        <h3>创作才华</h3>
                        <p>作为全能型创作歌手，她融合流行、摇滚、R&B、电子等多种风格。《泡沫》、《光年之外》、《句号》等无数金曲皆出自她手，用音乐书写着属于她的传奇。</p>
                    </div>
                    <div class="intro-card glass-card" data-aos="fade-up" data-aos-delay="200">
                        <div class="card-icon"><i class="fas fa-heart"></i></div>
                        <h3>爱与力量</h3>
                        <p>除了音乐，她热衷公益，关注环保与教育。G.E.M. 意为 "Get Everybody Moving"，她始终致力于用音乐和行动传递爱与正能量，激励着无数粉丝。</p>
                    </div>
                </div>
            </section>
            
            <!-- 音乐成就：数据可视化风格 -->
            <section class="section achievements-section">
                <div class="section-bg-glow"></div>
                <div class="section-header center">
                    <span class="section-tag">MILESTONES</span>
                    <h2>荣耀 <span class="highlight">时刻</span></h2>
                </div>

                <div class="achievements-grid">
                    <div class="achievement-item">
                        <div class="stat-number">30+</div>
                        <div class="stat-label">白金唱片认证</div>
                        <p class="stat-desc">专辑《新的心跳》创下销量纪录</p>
                    </div>
                    <div class="achievement-item">
                        <div class="stat-number">TOP 1</div>
                        <div class="stat-label">Billboard 中国</div>
                        <p class="stat-desc">多首单曲霸榜，国际影响力非凡</p>
                    </div>
                    <div class="achievement-item">
                        <div class="stat-number">100+</div>
                        <div class="stat-label">世界巡回演唱会</div>
                        <p class="stat-desc">足迹遍布亚洲、北美、大洋洲</p>
                    </div>
                    <div class="achievement-item">
                        <div class="stat-number">30 Under 30</div>
                        <div class="stat-label">福布斯精英榜</div>
                        <p class="stat-desc">入选全球最具影响力年轻领袖</p>
                    </div>
                </div>
            </section>
            
            <!-- 社交媒体：霓虹风格 -->
            <section class="section social-section">
                <div class="section-header">
                    <span class="section-tag">CONNECT</span>
                    <h2>关注 <span class="highlight">动态</span></h2>
                </div>
                
                <div class="social-grid">
                    <a href="https://weibo.com/1705586121" target="_blank" class="social-card weibo">
                        <div class="icon-box"><i class="fab fa-weibo"></i></div>
                        <div class="social-info">
                            <span class="platform">Weibo</span>
                            <span class="handle">@GEM鄧紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://youtube.com/user/GEMblog" target="_blank" class="social-card youtube">
                        <div class="icon-box"><i class="fab fa-youtube"></i></div>
                        <div class="social-info">
                            <span class="platform">YouTube</span>
                            <span class="handle">G.E.M. 鄧紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://music.163.com/#/artist?id=7763" target="_blank" class="social-card netease">
                        <div class="icon-box"><i class="fas fa-music"></i></div>
                        <div class="social-info">
                            <span class="platform">NetEase</span>
                            <span class="handle">G.E.M.邓紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://space.bilibili.com/1889545341" target="_blank" class="social-card bilibili">
                        <div class="icon-box">
                            <!-- 使用 SVG 替换 Font Awesome 图标 -->
                            <svg viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor">
                                <path d="M488.6 104.1c16.7 18.1 24.4 39.7 23.3 65.7v202.4c-.4 26.4-9.2 48.1-26.5 65.1-17.2 17-39.1 25.9-65.5 26.7H92.02c-26.45-.8-48.21-9.8-65.28-27.2C9.682 419.4.767 396.5 0 368.2V169.8c.767-26 9.682-47.6 26.74-65.7C43.81 87.75 65.57 78.77 92.02 78h29.38L96.05 52.19c-5.75-5.73-8.63-13-8.63-21.79 0-8.8 2.88-16.06 8.63-21.797C101.8 2.868 109.1 0 117.9 0s16.1 2.868 21.9 8.603L213.1 78h88l74.5-69.397C381.7 2.868 389.2 0 398 0c8.8 0 16.1 2.868 21.9 8.603 5.7 5.737 8.6 12.997 8.6 21.797 0 8.79-2.9 16.06-8.6 21.79L394.6 78h29.3c26.4.77 48 9.75 64.7 26.1zm-38.8 69.7c-.4-9.6-3.7-17.4-10.7-23.5-5.2-6.1-14-9.4-22.7-9.8H96.05c-9.59.4-17.45 3.7-23.58 9.8-6.14 6.1-9.4 13.9-9.78 23.5v194.3c0 9.2 3.26 17 9.78 23.5s14.38 9.8 23.58 9.8H416.4c9.2 0 17-3.3 23.3-9.8 6.3-6.5 9.7-14.3 10.1-23.5V173.8zm-264.3 42.7c6.3 6.3 9.7 14.1 10.1 23.2V273c-.4 9.2-3.7 16.9-9.8 23.2-6.2 6.3-13.8 9.5-23 9.8-9.2-.3-17.1-3.5-23.3-9.8-6.3-6.3-9.7-14-10.1-23.2v-33.3c.4-9.2 3.8-16.9 10.1-23.2 6.2-6.3 14.1-9.5 23.3-9.8 9.2.3 16.8 3.5 23 9.8zm178.1 0c6.3 6.3 9.7 14.1 10.1 23.2V273c-.4 9.2-3.7 16.9-9.8 23.2-6.2 6.3-13.8 9.5-23 9.8-9.2-.3-17.1-3.5-23.3-9.8-6.3-6.3-9.7-14-10.1-23.2v-33.3c.4-9.2 3.8-16.9 10.1-23.2 6.2-6.3 14.1-9.5 23.3-9.8 9.2.3 16.8 3.5 23 9.8z"/>
                            </svg>
                        </div>
                        <div class="social-info">
                            <span class="platform">Bilibili</span>
                            <span class="handle">邓紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://www.xiaohongshu.com/user/profile/5b8cc0472611925a1caca48a" target="_blank" class="social-card xiaohongshu">
                        <div class="icon-box"><i class="fas fa-book"></i></div>
                        <div class="social-info">
                            <span class="platform">RED</span>
                            <span class="handle">邓紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://www.douyin.com/user/MS4wLjABAAAAh7MdVA-UbMYLeO3_zhA_Z-Mrkh8cDwBCU_qQqucnrFE" target="_blank" class="social-card douyin">
                        <div class="icon-box"><i class="fab fa-tiktok"></i></div>
                        <div class="social-info">
                            <span class="platform">Douyin</span>
                            <span class="handle">邓紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                </div>
            </section>
            
            <!-- 页脚 -->
            <footer class="main-footer">
                <div class="footer-content">
                    <div class="footer-logo">
                        <span>G.E.M.</span> FAN CLUB
                    </div>
                    <div class="footer-links">
                        <div class="author-info">
                            <span>Developed by Reyotsed</span>
                            <div class="author-socials">
                                <a href="https://github.com/Reyotsed" target="_blank"><i class="fab fa-github"></i></a>
                                <a href="https://weibo.com/u/6374535201" target="_blank"><i class="fab fa-weibo"></i></a>
                            </div>
                        </div>
                    </div>
                    <p class="copyright">
                        &copy; 2025 GEM Fan Club. 非官方粉丝网站，仅供交流学习。<br>
                        所有素材版权归原作者所有。
                    </p>
                </div>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 图片路径
const images = [
  '/img/homepage/001.jpg',
  '/img/homepage/002.jpg',
  '/img/homepage/003.jpg',
  '/img/homepage/004.jpg'
];

const currentIndex = ref(0);
let isAnimating = false;
let autoPlayTimer = null;

// 滚动到内容区域
const scrollToContent = () => {
    const content = document.getElementById('main-content');
    if (content) {
        content.scrollIntoView({ behavior: 'smooth' });
    }
};

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
    }, 6000); // 延长轮播时间
};

// 切换到下一张
const nextSlide = () => {
    if (isAnimating) return;
    
    isAnimating = true;
    if (currentIndex.value >= images.length - 1) {
        currentIndex.value = 0;
    } else {
        currentIndex.value++;
    }
    resetAutoPlay();
    
    setTimeout(() => {
        isAnimating = false;
    }, 800);
};

// 切换到上一张
const prevSlide = () => {
    if (isAnimating) return;
    
    isAnimating = true;
    if (currentIndex.value <= 0) {
        currentIndex.value = images.length - 1;
    } else {
        currentIndex.value--;
    }
    resetAutoPlay();
    
    setTimeout(() => {
        isAnimating = false;
    }, 800);
};

// 直接跳转到指定幻灯片
const goToSlide = (index) => {
    if (isAnimating || currentIndex.value === index) return;
    
    isAnimating = true;
    currentIndex.value = index;
    resetAutoPlay();
    
    setTimeout(() => {
        isAnimating = false;
    }, 800);
};

onMounted(() => {
    resetAutoPlay();
    window.addEventListener('keydown', handleKeydown);
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
/* ========== 基础布局 ========== */
.home-container {
    width: 100%;
    min-height: 100vh;
    background-color: var(--bg-dark);
    overflow-x: hidden;
    position: relative;
}

/* ========== Hero Section ========== */
.hero-section {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slider-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.slider-track {
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 0.8s cubic-bezier(0.65, 0, 0.35, 1);
}

.slide {
    flex: 0 0 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}

/* 背景模糊层 */
.slide-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    overflow: hidden;
}

.bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(30px) brightness(0.5);
    transform: scale(1.1); /* 防止模糊边缘露白 */
}

/* 前景完整层 */
.image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0; /* 移除内边距，让图片尽可能大 */
}

.slide-image {
    width: 100%;
    height: 100%;
    object-fit: contain; /* 确保图片完整显示 */
    transition: transform 6s ease-out;
    filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5)); /* 给主体图片加阴影，增加层次感 */
}

.slide.active .slide-image {
    transform: scale(1.05); /* 轻微缩放，增加动态感但不至于裁剪太多 */
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        to bottom,
        rgba(10, 10, 18, 0.2) 0%,
        rgba(10, 10, 18, 0.1) 50%,
        var(--bg-dark) 100%
    );
    z-index: 3; /* 确保遮罩在图片之上 */
    pointer-events: none;
}

/* Hero 内容 */
.hero-content {
    position: relative;
    z-index: 10;
    text-align: center;
    color: #fff;
    padding: 0 20px;
    margin-top: -60px;
}

.main-title {
    font-size: 6rem;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 1rem;
    letter-spacing: -2px;
    text-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.glitch {
    position: relative;
    color: #fff;
    font-size: 8rem;
    letter-spacing: 10px;
    animation: glitch-skew 3s infinite linear alternate-reverse;
}

.glitch::before,
.glitch::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.glitch::before {
    left: 2px;
    text-shadow: -2px 0 #ff00c1;
    clip: rect(44px, 450px, 56px, 0);
    animation: glitch-anim 5s infinite linear alternate-reverse;
}

.glitch::after {
    left: -2px;
    text-shadow: -2px 0 #00fff9;
    clip: rect(44px, 450px, 56px, 0);
    animation: glitch-anim2 5s infinite linear alternate-reverse;
}

.chinese-name {
    font-size: 3rem;
    font-weight: 300;
    letter-spacing: 1rem;
    background: linear-gradient(to right, #fff, var(--primary-light));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    opacity: 0;
    animation: fadeInUp 1s ease 0.5s forwards;
}

.sub-title {
    font-size: 1.2rem;
    letter-spacing: 0.5rem;
    text-transform: uppercase;
    margin-bottom: 3rem;
    opacity: 0;
    animation: fadeInUp 1s ease 0.8s forwards;
    color: rgba(255, 255, 255, 0.8);
}

.cta-button {
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    border-radius: 50px;
    backdrop-filter: blur(10px);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    opacity: 0;
    animation: fadeInUp 1s ease 1.1s forwards;
}

.cta-button:hover {
    background: #fff;
    color: #000;
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.2);
}

/* 轮播控制 */
.slider-controls {
    position: absolute;
    bottom: 50px;
    left: 0;
    width: 100%;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
}

.nav-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.nav-btn:hover {
    background: #fff;
    color: #000;
    border-color: #fff;
}

.indicators {
    display: flex;
    gap: 12px;
}

.dot {
    width: 40px;
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
}

.dot.active {
    background: #fff;
    width: 60px;
}

/* 滚动提示 */
.scroll-hint {
    position: absolute;
    bottom: 30px;
    right: 40px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.scroll-hint:hover {
    opacity: 1;
}

.mouse {
    width: 26px;
    height: 40px;
    border: 2px solid #fff;
    border-radius: 13px;
    position: relative;
}

.wheel {
    width: 4px;
    height: 8px;
    background: #fff;
    border-radius: 2px;
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    animation: scrollWheel 1.5s infinite;
}

.scroll-hint span {
    font-size: 0.7rem;
    letter-spacing: 2px;
    writing-mode: vertical-rl;
    text-orientation: mixed;
}

/* ========== 主要内容区域 ========== */
.main-content {
    position: relative;
    z-index: 5;
    background: var(--bg-dark);
    padding-bottom: 50px;
}

.section {
    padding: 100px 20px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
}

.section-header {
    margin-bottom: 60px;
    position: relative;
}

.section-header.center {
    text-align: center;
}

.section-tag {
    display: block;
    font-size: 0.9rem;
    color: var(--primary);
    letter-spacing: 3px;
    margin-bottom: 10px;
    font-weight: 700;
}

.section-header h2 {
    font-size: 3rem;
    color: #fff;
    margin: 0;
}

.highlight {
    color: var(--accent-pink);
    position: relative;
    display: inline-block;
}

/* 简介卡片 */
.intro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

.glass-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    padding: 40px 30px;
    border-radius: 20px;
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
}

.glass-card:hover {
    transform: translateY(-10px);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-icon {
    font-size: 2.5rem;
    color: var(--primary-light);
    margin-bottom: 20px;
    background: linear-gradient(135deg, var(--primary), var(--accent-pink));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.glass-card h3 {
    font-size: 1.5rem;
    color: #fff;
    margin-bottom: 15px;
}

.glass-card p {
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.8;
    font-size: 1rem;
}

/* 成就部分 */
.achievements-section {
    background: linear-gradient(180deg, var(--bg-dark) 0%, #1a1a2e 50%, var(--bg-dark) 100%);
    padding: 120px 20px;
    max-width: 100%;
}

.achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 40px;
    max-width: 1200px;
    margin: 0 auto;
}

.achievement-item {
    text-align: center;
    padding: 30px;
    position: relative;
}

.stat-number {
    font-size: 3.5rem;
    font-weight: 900;
    background: linear-gradient(135deg, #fff 30%, var(--primary-light) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 10px;
    font-family: 'Impact', sans-serif;
}

.stat-label {
    font-size: 1.2rem;
    color: #fff;
    font-weight: 600;
    margin-bottom: 10px;
}

.stat-desc {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
}

/* 社交媒体 */
.social-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
}

.social-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 30px 20px;
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.icon-box {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    color: #fff;
    margin-bottom: 15px;
    transition: all 0.3s ease;
}

.social-info {
    text-align: center;
}

.platform {
    display: block;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 5px;
}

.handle {
    display: block;
    font-size: 1rem;
    color: #fff;
    font-weight: 600;
}

.hover-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, var(--glow-color, rgba(255,255,255,0.1)) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

/* 社交卡片悬停效果 */
.social-card:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 255, 255, 0.2);
}

.social-card:hover .hover-glow {
    opacity: 1;
}

.social-card.weibo { --glow-color: rgba(255, 60, 74, 0.2); }
.social-card.weibo:hover .icon-box { background: #ff3c4a; box-shadow: 0 0 20px rgba(255, 60, 74, 0.4); }

.social-card.youtube { --glow-color: rgba(255, 0, 0, 0.2); }
.social-card.youtube:hover .icon-box { background: #ff0000; box-shadow: 0 0 20px rgba(255, 0, 0, 0.4); }

.social-card.netease { --glow-color: rgba(212, 60, 51, 0.2); }
.social-card.netease:hover .icon-box { background: #d43c33; box-shadow: 0 0 20px rgba(212, 60, 51, 0.4); }

.social-card.bilibili { --glow-color: rgba(251, 114, 153, 0.2); }
.social-card.bilibili:hover .icon-box { background: #fb7299; box-shadow: 0 0 20px rgba(251, 114, 153, 0.4); }

.social-card.xiaohongshu { --glow-color: rgba(254, 44, 85, 0.2); }
.social-card.xiaohongshu:hover .icon-box { background: #fe2c55; box-shadow: 0 0 20px rgba(254, 44, 85, 0.4); }

.social-card.douyin { --glow-color: rgba(0, 0, 0, 0.2); }
.social-card.douyin:hover .icon-box { background: #000; box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }

/* 页脚 */
.main-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding: 60px 20px 30px;
    background: #050508;
}

.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
}

.footer-logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 30px;
    letter-spacing: 5px;
}

.footer-logo span {
    color: #fff;
}

.author-info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
    color: rgba(255, 255, 255, 0.6);
}

.author-socials a {
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.2rem;
    margin-left: 15px;
    transition: color 0.3s ease;
}

.author-socials a:hover {
    color: var(--primary);
}

.copyright {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.3);
    line-height: 1.6;
}

/* 动画关键帧 */
@keyframes glitch-anim {
    0% { clip: rect(30px, 9999px, 10px, 0); }
    20% { clip: rect(85px, 9999px, 90px, 0); }
    40% { clip: rect(10px, 9999px, 60px, 0); }
    60% { clip: rect(60px, 9999px, 20px, 0); }
    80% { clip: rect(20px, 9999px, 80px, 0); }
    100% { clip: rect(50px, 9999px, 40px, 0); }
}

@keyframes glitch-anim2 {
    0% { clip: rect(60px, 9999px, 20px, 0); }
    20% { clip: rect(10px, 9999px, 50px, 0); }
    40% { clip: rect(90px, 9999px, 10px, 0); }
    60% { clip: rect(30px, 9999px, 70px, 0); }
    80% { clip: rect(50px, 9999px, 90px, 0); }
    100% { clip: rect(20px, 9999px, 30px, 0); }
}

@keyframes glitch-skew {
    0% { transform: skew(2deg); }
    20% { transform: skew(-2deg); }
    40% { transform: skew(0deg); }
    60% { transform: skew(1deg); }
    80% { transform: skew(-1deg); }
    100% { transform: skew(0deg); }
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

@keyframes scrollWheel {
    0% { top: 6px; opacity: 1; }
    100% { top: 20px; opacity: 0; }
}

/* 响应式适配 */
@media (max-width: 768px) {
    .glitch { font-size: 4rem; letter-spacing: 5px; }
    .chinese-name { font-size: 2rem; letter-spacing: 0.5rem; }
    .main-title { margin-bottom: 0.5rem; }
    .sub-title { font-size: 0.9rem; letter-spacing: 0.2rem; margin-bottom: 2rem; }
    
    .section { padding: 60px 20px; }
    .section-header h2 { font-size: 2rem; }
    
    .intro-grid { grid-template-columns: 1fr; }
    .achievements-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
    .social-grid { grid-template-columns: repeat(2, 1fr); }
    
    .scroll-hint { display: none; }
    .nav-btn { display: none; } /* 移动端隐藏左右箭头，靠滑动或自动播放 */
}
</style>