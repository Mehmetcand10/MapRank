import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://maprank-production-b0f1.up.railway.app/api/v1',
    timeout: 10000, // 10 seconds timeout
    headers: {},
});

// Add interceptor for JWT token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        console.log("Token from storage:", token); // Debug log
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add interceptor for 401/403 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn("Auth error detected, clearing token...");
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                // Optional: Redirect to login if not already there
                if (!window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
