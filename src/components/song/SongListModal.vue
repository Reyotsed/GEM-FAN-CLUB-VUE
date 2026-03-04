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
          站长推荐
        </h2>
        <div class="recommend-list">
          <a 
            v-for="song in coldSongs" 
            :key="song.songId"
            class="recommend-item"
            :href="'https://music.163.com/#/song?id=' + song.songId"
            target="_blank"
          >
            <div class="recommend-header">
              <div class="song-cover">
                <img :src="song.coverUrl" :alt="song.title">
              </div>
              <div class="recommend-info">
                <div class="song-title">{{ song.title }}</div>
                <div class="recommend-tag" v-if="song.rank" v-html="song.rank"></div>
              </div>
            </div>
            <div class="recommend-body">
              <div class="song-desc">{{ song.comment }}</div>
            </div>
          </a>
        </div>
        <div class="curator-note">
          本来想分个一二三星的，但是我发现每首我都很喜欢
        </div>
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
  padding: 2.5rem;
  background: rgba(20, 20, 35, 0.6);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

.section-title .icon {
  width: 28px;
  height: 28px;
  background-size: contain;
  background-repeat: no-repeat;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.section-title .icon.hot { background-image: url('/icons/hot.svg'); }
.section-title .icon.hidden { background-image: url('/icons/hidden.svg'); }
.section-title .icon.album { background-image: url('/icons/album.svg'); }

.update-time {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  font-family: monospace;
}

/* 歌曲列表通用样式 */
.song-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.2rem;
  margin-bottom: 4rem;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 排名样式 */
.song-rank {
  width: 32px;
  height: 32px;
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-family: 'Impact', sans-serif;
}

/* 前三名特殊样式 */
.song-item:nth-child(1) .song-rank { color: #FFD700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); font-size: 1.4rem; }
.song-item:nth-child(2) .song-rank { color: #C0C0C0; text-shadow: 0 0 10px rgba(192, 192, 192, 0.5); font-size: 1.3rem; }
.song-item:nth-child(3) .song-rank { color: #CD7F32; text-shadow: 0 0 10px rgba(205, 127, 50, 0.5); font-size: 1.2rem; }

.song-cover {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  margin-right: 1.2rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.song-item:hover .song-cover img {
  transform: scale(1.1);
}

.song-info {
  flex: 1;
  min-width: 0; /* 防止文本溢出 */
}

.song-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.3rem;
}

.song-desc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 站长推荐引言 */
.curator-note {
  display: block;
  margin-top: 2rem;
  margin-bottom: 4rem;
  padding: 1.5rem;
  background: rgba(185, 128, 255, 0.05);
  border-left: 4px solid #B980FF;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  border-radius: 0 12px 12px 0;
  line-height: 1.6;
  font-size: 1.1rem;
}

/* 站长推荐列表样式 */
.recommend-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.recommend-item {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
}

.recommend-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  border-color: rgba(185, 128, 255, 0.3);
}

.recommend-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.recommend-header .song-cover {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  margin-right: 1rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.recommend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.recommend-info .song-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.3rem;
}

.recommend-tag {
  display: inline-block;
  font-size: 0.8rem;
  color: #B980FF;
  background: rgba(185, 128, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  align-self: flex-start;
}

.recommend-body {
  position: relative;
  padding-left: 1rem;
}

.recommend-body::before {
  content: '❝';
  position: absolute;
  left: -5px;
  top: -10px;
  font-size: 2rem;
  color: rgba(185, 128, 255, 0.2);
  font-family: serif;
}

.recommend-body .song-desc {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  white-space: normal; /* 允许换行 */
  overflow: visible;   /* 显示全部内容 */
  text-overflow: clip;
  font-style: italic;
}

/* 专辑列表 */
.album-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 2.5rem;
  padding: 1rem 0;
}

.album-item {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 100%;
  position: relative;
}

.album-item:hover {
  transform: translateY(-10px);
}

.album-cover {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 1.2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.3s ease;
}

.album-item:hover .album-cover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.album-item:hover .album-cover img {
  transform: scale(1.05);
}

.album-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
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
  width: 48px;
  height: 48px;
  background-image: url('/icons/view.svg');
  background-size: 50%;
  background-position: center;
  background-repeat: no-repeat;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(4px);
  transform: scale(0.8);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.album-item:hover .icon.view {
  transform: scale(1);
}

.album-info {
  text-align: center;
}

.album-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.4rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.album-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
}

/* 懒加载动画 */
.lazy-image {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.lazy-image.loaded {
  opacity: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .song-list-modal {
    padding: 1.5rem;
  }

  .song-list {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .recommend-list {
    grid-template-columns: 1fr; /* 移动端单列 */
  }

  .recommend-item {
    padding: 1rem;
  }

  .album-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .album-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .song-cover {
    width: 48px;
    height: 48px;
  }
}
</style>
