import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? ''
  : 'http://localhost:8000';  // ← Tem que ser localhost:8000

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {  // ← ADICIONA ISSO
    'Content-Type': 'application/json'
  }
});

// // ========== INTERCEPTOR DE DEBUG (TEMPORÁRIO) ==========
// api.interceptors.request.use((config) => {
//   console.log('====== AXIOS REQUEST ======');
//   console.log('URL:', config.url);
//   console.log('Method:', config.method);
//   console.log('Headers:', config.headers);
//   console.log('Data ANTES:', config.data);
//   console.log('Data tipo:', typeof config.data);
//   console.log('===========================');
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

export default api;