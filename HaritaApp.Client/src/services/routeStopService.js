import api from './api';

export const routeStopService = {
    getRouteStops: async (routeId) => {
        const response = await api.get(`/routes/${routeId}/stops`);
        return response.data;
    },
    addStopToRoute: async (routeId, stopId) => {
        const response = await api.post(`/routes/${routeId}/stops`, { stopId });
        return response.data;
    },
    removeStopFromRoute: async (routeId, stopId) => {
        await api.delete(`/routes/${routeId}/stops/${stopId}`);
    },
    reorderStops: async (routeId, reorderData) => {
        await api.put(`/routes/${routeId}/stops/reorder`, reorderData);
    }
};
