import axios from 'axios';

export const BASE_URL = 'http://localhost:5031/api';

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url?.toLowerCase() || '';
        const isAuthRequest = url.includes('/auth/');

        if (error.response && error.response.status === 401 && !isAuthRequest) {
            localStorage.removeItem('user');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;
