import axios from 'axios';

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

export default apiClient; 