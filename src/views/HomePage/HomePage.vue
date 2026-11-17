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
                                :loading="index === 0 ? 'eager' : 'lazy'"
                                :fetchpriority="index === 0 ? 'high' : 'auto'"
                                decoding="async"
                            >
                        </div>
                        <!-- 前景完整层：用于展示完整图片 -->
                        <div class="image-wrapper">
                            <img 
                                :src="image" 
                                :alt="`G.E.M. Slide ${index + 1}`"
                                class="slide-image"
                                :loading="index === 0 ? 'eager' : 'lazy'"
                                :fetchpriority="index === 0 ? 'high' : 'auto'"
                                decoding="async"
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
                    <button class="cta-button primary app-btn app-btn-ghost" @click="scrollToContent">
                        <span>探索音乐宇宙</span>
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            <!-- 歌词金句：嵌入 Hero 底部 -->
            <div class="hero-lyric">
                <Transition name="lyric-fade" mode="out-in">
                    <div class="hero-lyric-inner" :key="currentLyricIndex">
                        <span class="hero-lyric-text">「{{ currentLyric.lyric }}」</span>
                        <span class="hero-lyric-song">—— 《{{ currentLyric.song }}》</span>
                    </div>
                </Transition>
                <button class="hero-lyric-refresh" @click="switchLyric" title="换一句">
                    <i class="fas fa-sync-alt"></i>
                </button>
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

            <!-- 演唱会通知横幅 -->
            <div class="concert-banner" v-if="nextConcert" :class="{ 'banner-live': concertStatus === 'today' }">
                <div class="banner-inner">
                    <template v-if="concertStatus === 'today'">
                        <span class="banner-live-dot"></span>
                        <span class="banner-text">
                            <strong>🔥 演唱会进行中</strong>
                            <span class="banner-sep">·</span>
                            {{ nextConcert.city }} {{ nextConcert.venue }}
                            <template v-if="tomorrowConcert">
                                <span class="banner-sep">·</span>
                                <span class="banner-tomorrow">明天继续 📅</span>
                            </template>
                        </span>
                    </template>
                    <template v-else>
                        <span class="banner-text">
                            <strong>🎵 下一场演唱会</strong>
                            <span class="banner-sep">·</span>
                            {{ nextConcert.city }} {{ nextConcert.venue }}
                            <span class="banner-sep">·</span>
                            {{ nextConcert.concert_date }}
                            <span class="banner-sep">·</span>
                            <span class="banner-countdown">
                                {{ countdownValues.days }}天{{ countdownValues.hours }}时{{ countdownValues.minutes }}分{{ countdownValues.seconds }}秒
                            </span>
                        </span>
                    </template>
                    <router-link to="/info" class="banner-link" @click="trackEvent(EVENTS.homeClick('concert_banner'))">
                        详情 <i class="fas fa-arrow-right"></i>
                    </router-link>
                </div>
            </div>

            <!-- 每日猜歌入口 -->
            <router-link to="/games/daily" class="daily-entry" @click="trackEvent(EVENTS.homeClick('daily_guess'))">
                <span class="daily-entry-icon">🎧</span>
                <span class="daily-entry-text">
                    <strong>
                        每日猜歌
                        <em v-if="dailyStreak > 0" class="daily-streak">🔥 {{ dailyStreak }} 天连胜</em>
                    </strong>
                    <span>{{ dailyHint }}</span>
                </span>
                <span class="daily-entry-cta">{{ dailyDone ? '看榜单' : '去挑战' }} <i class="fas fa-arrow-right"></i></span>
            </router-link>

            <!-- 出道时长 -->
            <div class="debut-bar">
                <span class="debut-tag">🎤 邓紫棋出道时长</span>
                <div class="debut-counter">
                    <span class="debut-number">{{ debutDuration.years }}</span><span class="debut-unit">年</span>
                    <span class="debut-sep">·</span>
                    <span class="debut-number">{{ debutDuration.months }}</span><span class="debut-unit">月</span>
                    <span class="debut-sep">·</span>
                    <span class="debut-number">{{ debutDuration.days }}</span><span class="debut-unit">天</span>
                </div>
            </div>

            <!-- 全球棋士地图：社区氛围区 -->
            <section class="section fan-map-section">
                <FanMapCard />
            </section>

            <!-- 社交媒体：霓虹风格 -->            <section class="section social-section">
                <div class="section-header">
                    <span class="section-tag">CONNECT</span>
                    <h2 class="app-section-title">关注 <span class="highlight">动态</span></h2>
                </div>
                
                <div class="social-grid" @click="onSocialClick">
                    <a href="https://weibo.com/1705586121" target="_blank" class="social-card app-card weibo">
                        <div class="icon-box"><i class="fab fa-weibo"></i></div>
                        <div class="social-info">
                            <span class="platform">Weibo</span>
                            <span class="handle">@GEM鄧紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://youtube.com/user/GEMblog" target="_blank" class="social-card app-card youtube">
                        <div class="icon-box"><i class="fab fa-youtube"></i></div>
                        <div class="social-info">
                            <span class="platform">YouTube</span>
                            <span class="handle">G.E.M. 鄧紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://music.163.com/#/artist?id=7763" target="_blank" class="social-card app-card netease">
                        <div class="icon-box"><i class="fas fa-music"></i></div>
                        <div class="social-info">
                            <span class="platform">NetEase</span>
                            <span class="handle">G.E.M.邓紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://space.bilibili.com/1889545341" target="_blank" class="social-card app-card bilibili">
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
                    <a href="https://www.xiaohongshu.com/user/profile/5b8cc0472611925a1caca48a" target="_blank" class="social-card app-card xiaohongshu">
                        <div class="icon-box"><i class="fas fa-book"></i></div>
                        <div class="social-info">
                            <span class="platform">RED</span>
                            <span class="handle">邓紫棋</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://www.instagram.com/gem0816" target="_blank" class="social-card app-card instagram">
                        <div class="icon-box"><i class="fab fa-instagram"></i></div>
                        <div class="social-info">
                            <span class="platform">Instagram</span>
                            <span class="handle">@gem0816</span>
                        </div>
                        <div class="hover-glow"></div>
                    </a>
                    <a href="https://www.douyin.com/user/MS4wLjABAAAAh7MdVA-UbMYLeO3_zhA_Z-Mrkh8cDwBCU_qQqucnrFE" target="_blank" class="social-card app-card douyin">
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
                        &copy; 2025 GEM Fan Club · 粉丝个人兴趣项目，非官方、无商业用途。<br>
                        歌词 / 图片 / 视频 / 快拍等素材均来自网络，版权归原作者及版权方所有，如有侵权请联系作者删除。<br>
                        站内 AI 对话由大语言模型生成，仅为模仿语气的娱乐内容，不代表邓紫棋本人观点或立场。
                    </p>
                </div>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import apiClient from '@/utils/api';
import FanMapCard from '@/components/FanMapCard.vue';
import { trackEvent, EVENTS } from '@/utils/stats';
import { isDailyGuessDoneToday, getCachedStreak } from '@/utils/dailyGuess';

const dailyDone = ref(isDailyGuessDoneToday());
const dailyStreak = ref(getCachedStreak());
const dailyHint = computed(() => {
    if (dailyDone.value) return '今日已完成，看看排行榜你排第几';
    if (dailyStreak.value > 0) return `再猜中今天这首，连胜 +1，别让它断了`;
    return '听一小段前奏，你能猜中吗？每天一首';
});

const SOCIAL_PLATFORMS = ['weibo', 'youtube', 'netease', 'bilibili', 'xiaohongshu', 'instagram', 'douyin'];
const onSocialClick = (e) => {
    const card = e.target.closest?.('.social-card');
    if (!card) return;
    const p = SOCIAL_PLATFORMS.find(name => card.classList.contains(name));
    if (p) trackEvent(EVENTS.homeClick(`social_${p}`));
};

// ========== 歌词金句 ==========
const lyricsData = ref([]);
const currentLyricIndex = ref(0);
const currentLyric = ref({ lyric: '', song: '' });
let lyricTimer = null;

const loadLyrics = async () => {
    try {
        const res = await fetch('/data/lyrics.json');
        const json = await res.json();
        // 过滤掉 song 为空的条目
        lyricsData.value = json.lyrics.filter(item => item.song);
        pickRandomLyric();
    } catch (e) {
        console.error('Failed to load lyrics:', e);
    }
};

const pickRandomLyric = () => {
    if (!lyricsData.value.length) return;
    let idx;
    do {
        idx = Math.floor(Math.random() * lyricsData.value.length);
    } while (idx === currentLyricIndex.value && lyricsData.value.length > 1);
    currentLyricIndex.value = idx;
    currentLyric.value = lyricsData.value[idx];
};

const switchLyric = () => {
    pickRandomLyric();
    resetLyricTimer();
};

const resetLyricTimer = () => {
    if (lyricTimer) clearInterval(lyricTimer);
    lyricTimer = setInterval(pickRandomLyric, 10000);
};

// ========== 出道时长 ==========
const debutDate = new Date(2008, 6, 10); // 2008年7月10日
const debutDuration = ref({ years: 0, months: 0, days: 0 });
let debutTimer = null;

const updateDebutDuration = () => {
    const now = new Date();
    let years = now.getFullYear() - debutDate.getFullYear();
    let months = now.getMonth() - debutDate.getMonth();
    let days = now.getDate() - debutDate.getDate();
    if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    debutDuration.value = { years, months, days };
};

// ========== 演唱会倒计时 ==========
const concerts = ref([]);
const nextConcert = ref(null);
const tomorrowConcert = ref(null);
const concertStatus = ref('countdown'); // 'today' | 'countdown'
const countdownValues = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 });
let countdownTimer = null;

const parseIsoDate = (value) => {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const normalizePerformanceDates = (concert) => {
    const raw = concert.performance_dates;
    if (Array.isArray(raw)) return raw.map(parseIsoDate).filter(Boolean);
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.map(parseIsoDate).filter(Boolean);
        } catch (e) {
            return [];
        }
    }
    return [];
};

const expandConcertPerformances = (concert) => {
    return normalizePerformanceDates(concert).map(date => ({ ...concert, _date: date }));
};

const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const concertCoversDate = (concert, targetDate) => {
    return isSameDay(concert._date, targetDate);
};

const loadConcerts = async () => {
    try {
        const res = await apiClient.get('/concert/list');
        if (res.data.code === 200) {
            const allConcerts = res.data.data || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const validConcerts = allConcerts
                .filter(c => c.status !== '未官宣')
                .flatMap(expandConcertPerformances)
                .filter(c => c._date);

            // 检查今天是否有演唱会
            const todayConcert = validConcerts.find(c => concertCoversDate(c, today));

            if (todayConcert) {
                // 今天有演唱会 → 进行中状态
                nextConcert.value = todayConcert;
                concertStatus.value = 'today';
                // 检查明天是否还有
                const tmrConcert = validConcerts.find(c => concertCoversDate(c, tomorrow) && c !== todayConcert)
                    || (concertCoversDate(todayConcert, tomorrow) ? todayConcert : null);
                tomorrowConcert.value = tmrConcert;
            } else {
                // 今天没有 → 正常倒计时到最近的未来场次
                const futureConcerts = validConcerts
                    .filter(c => c._date >= today)
                    .sort((a, b) => a._date - b._date);
                if (futureConcerts.length > 0) {
                    nextConcert.value = futureConcerts[0];
                    concertStatus.value = 'countdown';
                    startCountdown(futureConcerts[0]._date);
                }
            }
        }
    } catch (e) {
        console.error('Failed to load concerts:', e);
    }
};

const startCountdown = (targetDate) => {
    const update = () => {
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();
        if (diff <= 0) {
            // 倒计时结束，切换为进行中状态
            concertStatus.value = 'today';
            countdownValues.value = { days: 0, hours: 0, minutes: 0, seconds: 0 };
            if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
            return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        countdownValues.value = { days, hours, minutes, seconds };
    };
    update();
    countdownTimer = setInterval(update, 1000);
};

// Image paths with WebP support (fallback to JPEG for older browsers)
const supportsWebP = ref(true);

// Check WebP support
if (typeof document !== 'undefined') {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  supportsWebP.value = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

const imageBase = [
  '/img/homepage/001',
  '/img/homepage/002',
  '/img/homepage/003',
  '/img/homepage/004'
];

const images = imageBase.map(base => 
  supportsWebP.value ? `${base}.webp` : `${base}.jpg`
);

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
    loadLyrics();
    resetLyricTimer();
    loadConcerts();
    updateDebutDuration();
    debutTimer = setInterval(updateDebutDuration, 60000); // 每分钟更新
    window.addEventListener('keydown', handleKeydown);
    window.scrollTo(0, 0);
});

onUnmounted(() => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    if (lyricTimer) clearInterval(lyricTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    if (debutTimer) clearInterval(debutTimer);
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
    background-color: transparent;
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
    padding: 0 var(--space-10);
    font-size: var(--text-lg);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    backdrop-filter: blur(10px);
    gap: 10px;
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
    width: var(--touch-target);
    height: var(--touch-target);
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

/* ========== 主要内容区域 - 统一背景流 ========== */
.main-content {
    position: relative;
    z-index: 5;
    background: linear-gradient(
        180deg,
        var(--bg-dark) 0%,
        #0d0d1a 15%,
        #111125 35%,
        #1a1a2e 50%,
        #111125 65%,
        #0d0d1a 85%,
        var(--bg-dark) 100%
    );
    padding-bottom: 50px;
}

.section {
    padding: var(--section-gap) var(--page-padding-x);
    max-width: var(--container-max);
    margin: 0 auto;
    position: relative;
}

/* ========== 模块连接线 ========== */
.section-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    height: 50px;
}

.connector-line {
    width: 1px;
    flex: 1;
    background: linear-gradient(180deg, transparent, rgba(235, 7, 238, 0.3), transparent);
}

.connector-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(235, 7, 238, 0.5);
    box-shadow: 0 0 10px rgba(235, 7, 238, 0.3);
    flex-shrink: 0;
}

.section-header {
    margin-bottom: var(--space-16);
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
    font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
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
    gap: var(--space-8);
}

.glass-card {
    background: var(--surface-bg);
    border: 1px solid var(--surface-border);
    backdrop-filter: blur(10px);
    padding: var(--card-padding);
    border-radius: var(--card-radius);
    transition: all 0.3s var(--ease-out);
    position: relative;
    overflow: hidden;
}

.glass-card:hover {
    transform: translateY(-6px);
    background: var(--surface-bg-hover);
    border-color: var(--surface-border-hover);
    box-shadow: var(--shadow-primary);
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



/* 社交媒体 */
.social-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-5);
}

.social-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    padding: var(--space-8) var(--space-5);
    text-decoration: none;
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

/* 出道时长 - 紧凑横栏 */
.debut-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-8);
    margin: var(--space-8) auto 0;
    max-width: 500px;
    background: var(--surface-bg);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-pill);
}

.debut-tag {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 1px;
    white-space: nowrap;
}

.debut-counter {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.debut-number {
    font-size: 1.4rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary), var(--accent-pink));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-variant-numeric: tabular-nums;
}

.debut-unit {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.35);
    margin-right: 2px;
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

.social-card.instagram { --glow-color: rgba(225, 48, 108, 0.2); }
.social-card.instagram:hover .icon-box { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); box-shadow: 0 0 20px rgba(225, 48, 108, 0.4); }

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

/* ========== Hero 底部歌词 ========== */
.hero-lyric {
    position: absolute;
    bottom: 100px;
    left: 0;
    width: 100%;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 80px;
}

.hero-lyric-inner {
    text-align: center;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.6);
}

.hero-lyric-text {
    font-size: 1.2rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 2px;
    font-style: italic;
}

.hero-lyric-song {
    display: inline-block;
    margin-left: 16px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 2px;
}

.hero-lyric-refresh {
    width: var(--touch-target);
    height: var(--touch-target);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.hero-lyric-refresh:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    transform: rotate(180deg);
}

/* 歌词切换动画 */
.lyric-fade-enter-active,
.lyric-fade-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyric-fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.lyric-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* ========== 每日猜歌入口 ========== */
.daily-entry {
    position: relative;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 14px;
    max-width: 1200px;
    margin: 20px auto 0;
    padding: 14px 18px;
    width: calc(100% - 40px);
    box-sizing: border-box;
    border-radius: 18px;
    text-decoration: none;
    color: #fff;
    background:
        radial-gradient(circle at 12% 50%, rgba(167, 139, 250, 0.22), transparent 45%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
    border: 1px solid rgba(167, 139, 250, 0.3);
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: transform 0.2s var(--ease-out, ease), border-color 0.2s, box-shadow 0.2s;
}
.daily-entry:hover {
    transform: translateY(-2px);
    border-color: rgba(167, 139, 250, 0.6);
    box-shadow: 0 16px 40px rgba(124, 58, 237, 0.25);
}
.daily-entry:active { transform: scale(0.98); }
.daily-entry-icon {
    flex: 0 0 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    background: linear-gradient(135deg, #a78bfa, #7c3aed);
    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35);
}
.daily-entry-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.daily-entry-text strong { font-size: 1rem; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.daily-streak {
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 99px;
    color: #c4b5fd;
    background: rgba(167, 139, 250, 0.16);
    border: 1px solid rgba(167, 139, 250, 0.4);
    white-space: nowrap;
}
.daily-entry-text span {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.62);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.daily-entry-cta {
    flex: 0 0 auto;
    font-size: 0.82rem;
    font-weight: 700;
    color: #c4b5fd;
    white-space: nowrap;
}

/* ========== 演唱会通知横幅 ========== */
.concert-banner {
    position: relative;
    z-index: 5;
    background: linear-gradient(90deg, rgba(235, 7, 238, 0.08), rgba(165, 5, 222, 0.06), rgba(235, 7, 238, 0.08));
    border-bottom: 1px solid rgba(235, 7, 238, 0.12);
    padding: 14px 20px;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.8);
    overflow: hidden;
}

.concert-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(235, 7, 238, 0.06), transparent);
    animation: banner-shimmer 6s ease-in-out infinite;
}

@keyframes banner-shimmer {
    0% { transform: translateX(-30%); }
    100% { transform: translateX(30%); }
}

.banner-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    position: relative;
    flex-wrap: wrap;
}

.banner-live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff5252;
    flex-shrink: 0;
    animation: live-dot-blink 1.2s ease-in-out infinite;
}

.banner-live {
    background: linear-gradient(90deg, rgba(255, 50, 50, 0.1), rgba(235, 7, 238, 0.08), rgba(255, 50, 50, 0.1)) !important;
    border-bottom-color: rgba(255, 50, 50, 0.2) !important;
}

.banner-text {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
}

.banner-sep {
    color: rgba(255, 255, 255, 0.2);
    margin: 0 2px;
}

.banner-countdown {
    font-variant-numeric: tabular-nums;
    color: var(--primary-light, #f3caff);
    font-weight: 600;
}

.banner-tomorrow {
    color: rgba(255, 255, 255, 0.5);
}

.banner-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--primary-light, #f3caff);
    text-decoration: none;
    font-size: 0.85rem;
    white-space: nowrap;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.banner-link:hover {
    color: #fff;
}

.banner-link i {
    font-size: 0.7rem;
    transition: transform 0.3s ease;
}

.banner-link:hover i {
    transform: translateX(3px);
}

/* 响应式适配 */
@media (max-width: 768px) {
    .hero-section { height: 92svh; min-height: 620px; }
    .hero-content { margin-top: -90px; padding: 0 var(--space-4); }
    .glitch { font-size: clamp(3.2rem, 16vw, 4rem); letter-spacing: 4px; }
    .chinese-name { font-size: var(--text-3xl); letter-spacing: 0.35rem; }
    .main-title { margin-bottom: var(--space-2); }
    .sub-title { font-size: 0.82rem; letter-spacing: 0.16rem; margin-bottom: var(--space-6); }
    .cta-button { padding: 0 var(--space-8); font-size: var(--text-base); }
    
    .main-content { padding-bottom: var(--page-padding-bottom); }
    .section { padding: var(--section-gap) var(--page-padding-x); }
    .section-header { margin-bottom: var(--space-8); }
    .section-header h2 { font-size: var(--text-3xl); }
    
    .social-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-2); }
    .social-card { padding: var(--space-3) var(--space-2); border-radius: var(--radius-sm); }
    .icon-box { width: 36px; height: 36px; font-size: 1.05rem; margin-bottom: 8px; }
    .platform { font-size: 0.7rem; margin-bottom: 2px; }
    .handle { font-size: 0.72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .social-info { width: 100%; }
    .debut-bar { flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-5); margin: var(--space-5) var(--space-4) 0; }
    .debut-number { font-size: 1.2rem; }
    
    .scroll-hint { display: none; }
    .nav-btn { display: none; }

    /* Hero 歌词 */
    .hero-lyric { bottom: 70px; padding: 0 var(--space-5); flex-direction: column; gap: var(--space-2); }
    .hero-lyric-text { font-size: 0.9rem; letter-spacing: 0.5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .hero-lyric-song { margin-left: 0; font-size: 0.72rem; }
    .hero-lyric-refresh { width: var(--button-height); height: var(--button-height); font-size: 0.8rem; }

    /* 演唱会横幅 */
    .concert-banner { padding: var(--space-2) var(--space-4); font-size: 0.8rem; }
    .banner-inner { gap: var(--space-2); }
    .banner-text { gap: 4px; line-height: 1.5; }

    .section-connector { height: 30px; }
}

@media (max-width: 380px) {
    .social-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>