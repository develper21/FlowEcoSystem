import { api } from './client';
export const operationsApi = {
    getActiveProducts: async () => {
        try {
            const response = await api.get<any>('/operations/products');
            return response.data.data?.products || [];
        } catch (error) {
            console.error('Failed to fetch active products:', error);
            return [];
        }
    },
    getActiveBOMs: async () => {
        try {
            const response = await api.get<any>('/operations/boms');
            return response.data.data?.boms || [];
        } catch (error) {
            console.error('Failed to fetch active BOMs:', error);
            return [];
        }
    },
    getActiveMatrix: async () => {
        try {
            const response = await api.get('/operations/active-matrix');
            return response.data.data || null;
        } catch (error) {
            console.error('Failed to fetch active matrix:', error);
            return null;
        }
    }
};
