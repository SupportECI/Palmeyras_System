import axios from 'axios';

const api = axios.create({
    baseURL: 'http://syspal.eurocentrodeidiomas.com/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;