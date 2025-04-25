<template>
  <div class="song-list-modal">
    <div class="modal-content">
      <!-- 热门歌曲榜单 -->
      <section class="song-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="icon hot"></i>
            热门歌曲榜单
          </h2>
          <div class="update-time" v-if="lastUpdated">
            更新时间：{{ lastUpdated }}
          </div>
        </div>
        <div class="song-list">
          <a 
            v-for="(song, index) in hotSongs" 
            :key="song.songId" 
            class="song-item"
            :href="'https://music.163.com/#/song?id=' + song.songId"
            target="_blank"
          >
            <div class="song-rank">{{ index + 1 }}</div>
            <div class="song-cover">
              <img :src="song.coverUrl" :alt="song.title">
            </div>
            <div class="song-title">{{ song.title }}</div>
          </a>
        </div>
      </section>

      <!-- 冷门歌曲推荐 -->
      <section class="song-section">
        <h2 class="section-title">
          <i class="icon hidden"></i>
          冷门歌曲推荐
        </h2>
        <div class="song-list">
          <a 
            v-for="song in coldSongs" 
            :key="song.songId"
            class="song-item"
            :href="'https://music.163.com/#/song?id=' + song.songId"
            target="_blank"
          >
            <div class="song-rank" v-html="song.rank"></div>
            <div class="song-cover">
              <img :src="song.coverUrl" :alt="song.title">
            </div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-desc">{{ song.comment }}</div>
            </div>
          </a>
        </div>
        <a>
          本来想分个一二三星的，但是我发现每首我都很喜欢
        </a>
      </section>

      <!-- 专辑列表 -->
      <section class="album-section">
        <h2 class="section-title">
          <i class="icon album"></i>
          专辑列表
        </h2>
        <div class="album-list">
          <div 
            v-for="album in albums" 
            :key="album.albumId" 
            class="album-item"
            @click="viewAlbum(album)"
          >
            <div class="album-cover">
              <img 
                :src="album.coverUrl" 
                :alt="album.title"
                loading="lazy"
                :data-src="album.coverUrl"
                class="lazy-image"
              >
              <div class="album-overlay">
                <i class="icon view"></i>
              </div>
            </div>
            <div class="album-info">
              <div class="album-title">{{ album.title }}</div>
              <div class="album-date">{{ formatDate(album.releaseDate) }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSongStore } from '@/stores/song';
import apiClient from '@/utils/api';

const songStore = useSongStore();

// 数据定义
const hotSongs = ref([]);
const coldSongs = ref([]);
const lastUpdated = ref('');

// 邓紫棋专辑数据
const albums = ref([
  {
    albumId: '8',
    title: '启示录',
    coverUrl: '/img/albumCover/8.jpg',
    releaseDate: '2022-09-23',
    neteaseUrl: 'https://music.163.com/#/album?id=149367827'
  },
  {
    albumId: '7',
    title: '摩天动物园',
    coverUrl: '/img/albumCover/7.jpg',
    releaseDate: '2019-12-27',
    neteaseUrl: 'https://music.163.com/#/album?id=84391762'
  },
  {
    albumId: '6',
    title: '童话三部曲',
    coverUrl: '/img/albumCover/6.jpg',
    releaseDate: '2018-08-16',
    neteaseUrl: 'https://music.163.com/#/album?id=72709830'
  },
  {
    albumId: '5',
    title: '新的心跳',
    coverUrl: '/img/albumCover/5.jpg',
    releaseDate: '2015-11-06',
    neteaseUrl: 'https://music.163.com/#/album?id=3189002'
  },
  {
    albumId: '4',
    title: 'Xposed',
    coverUrl: '/img/albumCover/4.jpg',
    releaseDate: '2012-07-05',
    neteaseUrl: 'https://music.163.com/#/album?id=23497'
  },
  {
    albumId: '3',
    title: 'My Secret',
    coverUrl: '/img/albumCover/3.jpg',
    releaseDate: '2010-10-29',
    neteaseUrl: 'https://music.163.com/#/album?id=2391062'
  },
  {
    albumId: '2',
    title: '18',
    coverUrl: '/img/albumCover/2.jpg',
    releaseDate: '2009-10-27',
    neteaseUrl: 'https://music.163.com/#/album?id=2400479'
  },
  {
    albumId: '1',
    title: 'G.E.M.',
    coverUrl: '/img/albumCover/1.jpg',
    releaseDate: '2008-10-15',
    neteaseUrl: 'https://music.163.com/#/album?id=23509'
  },
]);

// 加载热门歌曲数据
const loadHotSongs = async () => {
  try {
    const response = await fetch('/data/gem_hot_songs.json');
    const data = await response.json();
    hotSongs.value = data.songs;
    lastUpdated.value = data.lastUpdated;
  } catch (error) {
    console.error('加载热门歌曲失败:', error);
  }
};

// 加载冷门歌曲数据
const loadColdSongs = async () => {
  try {
    const response = await fetch('/data/gem_cold_songs.json');
    const data = await response.json();
    coldSongs.value = data.songs;
  } catch (error) {
    console.error('加载冷门歌曲失败:', error);
  }
};

// 格式化播放次数
const formatPlayCount = (count) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  }
  return count;
};

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 播放歌曲
const playSong = async (song) => {
  try {
    await songStore.setCurrentSong(song);
  } catch (error) {
    console.error('播放歌曲失败:', error);
  }
};

// 查看专辑
const viewAlbum = (album) => {
  window.open(album.neteaseUrl, '_blank');
};

// 加载数据
const loadData = async () => {
  try {
    await Promise.all([
      loadHotSongs(),
      loadColdSongs()
    ]);
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

// 优化图片懒加载逻辑
const initLazyLoading = () => {
  const lazyImages = document.querySelectorAll('.lazy-image');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        // 添加加载状态类
        img.classList.add('loading');
        
        // 创建新的 Image 对象预加载
        const preloadImg = new Image();
        preloadImg.src = img.dataset.src;
        
        preloadImg.onload = () => {
          img.src = img.dataset.src;
          img.classList.remove('lazy-image', 'loading');
          img.classList.add('loaded');
          observer.unobserve(img);
        };
        
        preloadImg.onerror = () => {
          console.error('图片加载失败:', img.dataset.src);
          img.classList.remove('loading');
          img.classList.add('error');
        };
      }
    });
  }, {
    rootMargin: '50px 0px', // 提前 50px 开始加载
    threshold: 0.1 // 当 10% 的图片可见时开始加载
  });

  lazyImages.forEach(img => {
    imageObserver.observe(img);
  });
};

// 添加图片懒加载逻辑
onMounted(() => {
  loadData();
  initLazyLoading();
});
</script>

<style scoped>
.song-list-modal {
  width: 100%;
  padding: 2rem;
  background: rgba(15, 15, 30, 0.3);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
}

.section-title {
  font-size: 1.8rem;
  color: #fff;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.section-title .icon {
  width: 24px;
  height: 24px;
  background-size: contain;
  background-repeat: no-repeat;
}

.section-title .icon.hot {
  background-image: url('/icons/hot.svg');
}

.section-title .icon.hidden {
  background-image: url('/icons/hidden.svg');
}

.section-title .icon.album {
  background-image: url('/icons/album.svg');
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.update-time {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.song-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 3rem;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.song-rank {
  min-width: 80px;
  font-size: 0.9rem;
  color: #B980FF;
  text-shadow: 0 0 5px rgba(185, 128, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: rgba(185, 128, 255, 0.1);
  border-radius: 12px;
  margin-right: 12px;
  letter-spacing: 1px;
  animation: starShine 2s ease-in-out infinite;
}

@keyframes starShine {
  0%, 100% {
    text-shadow: 0 0 5px rgba(185, 128, 255, 0.5);
  }
  50% {
    text-shadow: 0 0 15px rgba(185, 128, 255, 0.8);
  }
}

.song-item:hover .song-rank {
  background: rgba(185, 128, 255, 0.2);
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 1rem;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-title {
  flex: 1;
  font-size: 1.1rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.song-stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.play-count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.icon.play {
  width: 20px;
  height: 20px;
  background-image: url('/icons/play.svg');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.song-item:hover .icon.play {
  opacity: 1;
}

.album-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

.album-item {
  cursor: pointer;
  transition: transform 0.3s ease;
  width: 100%;
  max-width: 180px;
  margin: 0 auto;
}

.album-item:hover {
  transform: translateY(-5px);
}

.album-cover {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.8rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.album-item:hover .album-overlay {
  opacity: 1;
}

.icon.view {
  width: 30px;
  height: 30px;
  background-image: url('/icons/view.svg');
  background-size: contain;
  background-repeat: no-repeat;
}

.album-info {
  text-align: center;
}

.album-title {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 0.3rem;
}

.album-date {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 768px) {
  .song-list {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .album-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .album-item {
    max-width: 150px;
  }

  .song-item {
    padding: 0.8rem;
  }

  .song-cover {
    width: 40px;
    height: 40px;
  }
}

.song-title a {
  color: #fff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.song-title a:hover {
  color: #ff69b4;
  text-decoration: underline;
}

.song-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.3rem;
}

.song-info {
  flex: 1;
  padding-right: 1rem;
}

.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease;
  background: #f0f0f0;
}

.lazy-image.loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.lazy-image.loaded {
  opacity: 1;
}

.lazy-image.error {
  opacity: 1;
  background: #ffebee;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.song-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    table-layout: fixed;
}

.song-table th,
.song-table td {
    padding: 0.8rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.song-table th {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    position: sticky;
    top: 0;
    background: rgba(15, 15, 30, 0.95);
    z-index: 1;
}

.song-table tr:hover {
    background: rgba(255, 255, 255, 0.05);
}

.song-table td:first-child {
    width: 10%;
    text-align: center;
}

.song-table td:nth-child(2) {
    width: 40%;
}

.song-table td:nth-child(3) {
    width: 30%;
}

.song-table td:nth-child(4) {
    width: 20%;
    text-align: right;
}

@media (max-width: 768px) {
    .song-table {
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .song-table thead,
    .song-table tbody,
    .song-table tr,
    .song-table th,
    .song-table td {
        display: block;
    }
    
    .song-table thead tr {
        position: absolute;
        top: -9999px;
        left: -9999px;
    }
    
    .song-table tr {
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 0.5rem;
        padding: 0.5rem;
    }
    
    .song-table td {
        border: none;
        position: relative;
        padding-left: 50%;
        width: 100%;
        text-align: left;
        white-space: normal;
    }
    
    .song-table td:before {
        position: absolute;
        left: 0.5rem;
        width: 45%;
        padding-right: 0.5rem;
        white-space: nowrap;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .song-table td:nth-of-type(1):before { content: "序号"; }
    .song-table td:nth-of-type(2):before { content: "歌曲名称"; }
    .song-table td:nth-of-type(3):before { content: "歌手"; }
    .song-table td:nth-of-type(4):before { content: "播放次数"; }
    
    .song-table td:first-child,
    .song-table td:nth-child(2),
    .song-table td:nth-child(3),
    .song-table td:nth-child(4) {
        width: 100%;
        text-align: left;
    }
}

@media (max-width: 480px) {
    .song-table td {
        padding: 0.6rem;
        font-size: 0.9rem;
    }
    
    .song-table td:before {
        font-size: 0.8rem;
    }
}

@media (max-width: 360px) {
    .song-table td {
        padding: 0.5rem;
        font-size: 0.85rem;
    }
    
    .song-table td:before {
        font-size: 0.75rem;
    }
}
</style>
