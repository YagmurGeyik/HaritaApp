import api from './api';

const API_URL = '/auth';

export const authService = {
    login: async (username, password) => {
        const response = await api.post(`${API_URL}/login`, { username, password });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },
    register: async (username, email, password) => {
        const response = await api.post(`${API_URL}/register`, { username, email, password });
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('user');
    },
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    }
};
