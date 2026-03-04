import axios from 'axios';
import { getCachedImage, cacheImage } from './imageCache';
import { showToast } from './toast';

// 创建axios实例，使用环境变量中的配置
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASEURL + import.meta.env.VITE_API_PREFIX,
  timeout: 120000 // 120s to accommodate RAG service (2 LLM calls)
});

// 请求拦截器，可以在这里添加token等通用信息
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle 401 Unauthorized: auto logout
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('nickName');
      localStorage.removeItem('avatar');
      showToast('登录已过期，请重新登录', 'warning');
    } else if (!error.response) {
      showToast('网络连接失败，请检查网络', 'error');
    }
    return Promise.reject(error);
  }
);

/**
 * 获取图片URL，优先从缓存中获取
 * @param {string} path - 图片路径
 * @returns {Promise<string>} - 图片URL
 */
apiClient.getImageUrl = async function (path) {
  // 检查缓存中是否已有该图片
  const cachedUrl = getCachedImage(path);
  if (cachedUrl) {
    return cachedUrl;
  }

  // 缓存中没有，则请求图片
  try {
    const response = await this.get("/image/getImageByPath", {
      params: { path },
      responseType: 'blob'
    });
    // Create URL and cache
    const imageUrl = URL.createObjectURL(response.data);
    cacheImage(path, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
};

export default apiClient; 