import { defineStore } from 'pinia';
import apiClient from '@/utils/api';

// 缓存配置
const CACHE_CONFIG = {
  maxSize: 50, // 最大缓存歌曲数量
  expireTime: 24 * 60 * 60 * 1000, // 缓存过期时间（24小时）
};

export const useSongStore = defineStore('song', {
  state: () => ({
    cachedSongs: {}, // 用于存储已加载的歌曲
    currentSongId: null, // 当前正在播放的歌曲ID
    cacheTimestamps: {}, // 记录缓存时间戳
  }),
  
  actions: {
    // 修改获取歌曲方法以适配数据格式
    async fetchSong(songId = null) {
      try {
        // 1. 如果没有指定ID，获取随机歌曲
        if (!songId) {
          const response = await apiClient.get("/song/sampleOneSong");
          
          if (response.data.code === 200) {
            const songData = response.data.data;
            songId = songData.songId;
            
            // 检查缓存是否过期
            if (this._isCacheValid(songId)) {
              this.currentSongId = songId;
              return this.cachedSongs[songId];
            }
            
            // 初始化新歌曲记录
            this.cachedSongs[songId] = {
              ...songData,
              loaded: false
            };
            
            // 更新缓存时间戳
            this.cacheTimestamps[songId] = Date.now();
            
            // 一次性获取所有资源
            await Promise.all([
              this._loadCover(songId, songData.coverPath)
            ]);
            
            this.cachedSongs[songId].loaded = true;
            this.currentSongId = songId;
            
            // 清理过期缓存
            this._cleanupCache();
          }
        } 
        // 2. 如果指定了ID，检查缓存
        else if (this._isCacheValid(songId)) {
          this.currentSongId = songId;
        }
        // 3. 指定ID但无缓存或缓存过期，直接返回null
        else {
          console.error('请求的歌曲ID未缓存或已过期');
          return null;
        }
        
        return this.cachedSongs[this.currentSongId];
      } catch (error) {
        console.error('获取歌曲信息失败:', error);
        return null;
      }
    },
    
    // 检查缓存是否有效
    _isCacheValid(songId) {
      return this.cachedSongs[songId] && 
             this.cachedSongs[songId].loaded && 
             Date.now() - (this.cacheTimestamps[songId] || 0) < CACHE_CONFIG.expireTime;
    },
    
    // 清理过期缓存
    _cleanupCache() {
      const now = Date.now();
      const songIds = Object.keys(this.cachedSongs);
      
      // 如果超过最大缓存数量，清理最旧的缓存
      if (songIds.length > CACHE_CONFIG.maxSize) {
        const sortedIds = songIds.sort((a, b) => 
          (this.cacheTimestamps[a] || 0) - (this.cacheTimestamps[b] || 0)
        );
        
        // 删除最旧的缓存，直到数量符合要求
        while (sortedIds.length > CACHE_CONFIG.maxSize) {
          const oldestId = sortedIds.shift();
          this.clearSongCache(oldestId);
        }
      }
      
      // 清理过期缓存
      songIds.forEach(id => {
        if (now - (this.cacheTimestamps[id] || 0) > CACHE_CONFIG.expireTime) {
          this.clearSongCache(id);
        }
      });
    },
    
    // 私有方法，加载音频 - 确保音频 URL 是有效的
    async _loadAudio(songId, filePath) {
      // 如果已有音频 URL，但尝试播放时发现无效，可以在此重新加载
      const shouldReload = 
        this.cachedSongs[songId] && 
        this.cachedSongs[songId].audioPath && 
        !this.isUrlValid(this.cachedSongs[songId].audioPath);
        
      if (!this.cachedSongs[songId] || (!this.cachedSongs[songId].audioPath) || shouldReload) {
        try {
          const response = await apiClient.get("/song/getAudioByPath", {
            params: { path: filePath },
            responseType: 'blob'
          });
          
          // 如果之前有 URL，先释放它
          if (this.cachedSongs[songId].audioPath) {
            URL.revokeObjectURL(this.cachedSongs[songId].audioPath);
          }
          
          const audioUrl = URL.createObjectURL(response.data);
          this.cachedSongs[songId].audioPath = audioUrl;
          console.log('音频 URL 已创建:', audioUrl);
          
          // 保存 Blob 对象以便可能的重用
          this.cachedSongs[songId].audioBlob = response.data;
        } catch (error) {
          console.error('获取音频文件失败:', error);
        }
      }
    },
    
    // 辅助方法：检查 URL 是否有效
    isUrlValid(url) {
      // 对于 Blob URL，无法简单地检查其有效性
      // 只能验证格式是否正确
      return url && url.startsWith('blob:');
    },
    
    // 私有方法，加载封面
    async _loadCover(songId, coverPath) {
      if (!this.cachedSongs[songId] || this.cachedSongs[songId].coverUrl) return;
      
      try {
        const imageUrl = await apiClient.getImageUrl(coverPath);
        this.cachedSongs[songId].coverUrl = imageUrl;
      } catch (error) {
        console.error('获取封面图片失败:', error);
      }
    },
    
    // 清除缓存方法
    clearSongCache(songId) {
      if (this.cachedSongs[songId]) {
        if (this.cachedSongs[songId].coverUrl) {
          URL.revokeObjectURL(this.cachedSongs[songId].coverUrl);
        }
        
        delete this.cachedSongs[songId];
        delete this.cacheTimestamps[songId];
      }
    },
    
    clearAllCache() {
      Object.keys(this.cachedSongs).forEach(songId => {
        this.clearSongCache(songId);
      });
      this.cachedSongs = {};
      this.cacheTimestamps = {};
      this.currentSongId = null;
    }
  },
  
  getters: {
    currentSong: (state) => state.currentSongId ? state.cachedSongs[state.currentSongId] : null
  }
}); 