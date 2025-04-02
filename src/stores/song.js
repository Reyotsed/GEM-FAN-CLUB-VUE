import { defineStore } from 'pinia';
import apiClient from '@/utils/api';

export const useSongStore = defineStore('song', {
  state: () => ({
    cachedSongs: {}, // 用于存储已加载的歌曲
    currentSongId: null, // 当前正在播放的歌曲ID
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
            // 使用正确的字段名
            songId = songData.songId;
            
            // 如果已缓存，直接使用缓存并返回
            if (this.cachedSongs[songId] && this.cachedSongs[songId].loaded) {
              this.currentSongId = songId;
              return this.cachedSongs[songId];
            }
            
            // 初始化新歌曲记录
            this.cachedSongs[songId] = {
              ...songData,
              loaded: false
            };
            
            // 一次性获取所有资源
            await Promise.all([
              this._loadAudio(songId, songData.filePath),
              this._loadCover(songId, songData.coverPath)
            ]);
            
            this.cachedSongs[songId].loaded = true;
            this.currentSongId = songId;
          }
        } 
        // 2. 如果指定了ID，检查缓存
        else if (this.cachedSongs[songId] && this.cachedSongs[songId].loaded) {
          this.currentSongId = songId;
        }
        // 3. 指定ID但无缓存，直接返回null
        else {
          console.error('请求的歌曲ID未缓存');
          return null;
        }
        
        return this.cachedSongs[this.currentSongId];
      } catch (error) {
        console.error('获取歌曲信息失败:', error);
        return null;
      }
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
    
    // 清除缓存方法保持不变
    clearSongCache(songId) {
      if (this.cachedSongs[songId]) {
        if (this.cachedSongs[songId].audioPath) {
          URL.revokeObjectURL(this.cachedSongs[songId].audioPath);
        }
        if (this.cachedSongs[songId].coverUrl) {
          URL.revokeObjectURL(this.cachedSongs[songId].coverUrl);
        }
        
        delete this.cachedSongs[songId];
      }
    },
    
    clearAllCache() {
      Object.keys(this.cachedSongs).forEach(songId => {
        this.clearSongCache(songId);
      });
      this.cachedSongs = {};
      this.currentSongId = null;
    }
  },
  
  getters: {
    currentSong: (state) => state.currentSongId ? state.cachedSongs[state.currentSongId] : null
  }
}); 