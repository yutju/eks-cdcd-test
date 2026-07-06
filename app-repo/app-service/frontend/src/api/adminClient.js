// src/api/adminClient.js
// 환자용 axiosClient와 별개로, 관리자 전용 토큰(adminToken)을 사용하는 클라이언트입니다.
import axios from 'axios';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/staff/login';
    }
    return Promise.reject(err);
  }
);

export default adminApi;
