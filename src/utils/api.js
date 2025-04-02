import axios from 'axios';
import { getCachedImage, cacheImage } from './imageCache';

// 创建axios实例，使用环境变量中的配置
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASEURL + import.meta.env.VITE_API_PREFIX,
  timeout: 30000
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

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 处理错误情况
    return Promise.reject(error);
  }
);

/**
 * 获取图片URL，优先从缓存中获取
 * @param {string} path - 图片路径
 * @returns {Promise<string>} - 图片URL
 */
apiClient.getImageUrl = async function(path) {
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
    console.log(path);
    // 创建URL并缓存
    const imageUrl = URL.createObjectURL(response.data);
    cacheImage(path, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
};

export default apiClient; 