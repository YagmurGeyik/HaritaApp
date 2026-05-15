import api from './api';

const API_URL = '/routes';

export const routeService = {
    getAll: async () => {
        const response = await api.get(API_URL);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post(API_URL, data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`${API_URL}/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`${API_URL}/${id}`);
    },
    simulate: async (id) => {
        const response = await api.post(`${API_URL}/${id}/simulate`);
        return response.data;
    },
    stopSimulation: async (id) => {
        const response = await api.post(`${API_URL}/${id}/stop-simulation`);
        return response.data;
    },
    togglePauseSimulation: async (id) => {
        const response = await api.post(`${API_URL}/${id}/toggle-pause-simulation`);
        return response.data;
    }
};
