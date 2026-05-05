import axios from 'axios';

const BASE_URL = 'http://localhost:5031/api';
const API_URL = `${BASE_URL}/geometries`;

axios.interceptors.request.use(
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

axios.interceptors.response.use(
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

export const geometryService = {
    getAll: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },
    getById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await axios.put(`${API_URL}/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        await axios.delete(`${API_URL}/${id}`);
    }
};

