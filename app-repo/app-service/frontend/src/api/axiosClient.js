// src/api/axiosClient.js
import axios from 'axios';

// '/api' 로 시작하는 주소로만 요청을 보내고, nginx가 그 요청들만 backend 컨테이너로
// 프록시합니다. 프론트엔드 페이지 경로(/health, /board, /medical 등)와 절대 겹치지 않도록
// API 요청은 항상 /api 네임스페이스 아래로만 나가게 합니다.
// VITE_API_URL을 명시적으로 지정하면 그 값을 우선 사용합니다.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
