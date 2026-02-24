import axios from 'axios';

// Create API instance with default config
export const api = axios.create({
    baseURL: '/api', // Proxied by Vite
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors (e.g., 401 Unauthorized, 403 Forbidden)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Auto logout on 401
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        if (error.response?.status === 403) {
            // Permission denied - log and show user-friendly message
            console.warn('Access denied:', error.response?.data?.message);
        }
        return Promise.reject(error.response?.data || error.message);
    }
);
