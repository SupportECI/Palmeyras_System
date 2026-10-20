import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000/api' // O tu puerto local de backend
    : 'https://syspal.eurocentrodeidiomas.com/api';
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

export default api;