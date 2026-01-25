import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? ''
  : 'http://localhost:8000';  // ← Tem que ser localhost:8000

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;