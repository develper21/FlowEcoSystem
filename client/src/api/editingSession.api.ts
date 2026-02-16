import { api } from './client';

export interface EditorInfo {
    userId: string;
    userName: string;
    startedAt: string;
}

export const editingSessionApi = {
    startSession: async (entityType: 'ECO' | 'PRODUCT' | 'BOM', entityId: string) => {
        try {
            const response = await api.post<any>('/editing-sessions/start', {
                entityType,
                entityId,
            });
            return response.data;
        } catch (error) {
            console.error('Failed to start editing session:', error);
            throw error;
        }
    },
    endSession: async (entityType: 'ECO' | 'PRODUCT' | 'BOM', entityId: string) => {
        try {
            const response = await api.post<any>('/editing-sessions/end', {
                entityType,
                entityId,
            });
            return response.data;
        } catch (error) {
            console.error('Failed to end editing session:', error);
            throw error;
        }
    },
    getActiveEditors: async (entityType: 'ECO' | 'PRODUCT' | 'BOM', entityId: string) => {
        try {
            const response = await api.get<any>(
                `/editing-sessions/${entityType}/${entityId}/editors`
            );
            return response.data.data?.editors || [];
        } catch (error) {
            console.error('Failed to get active editors:', error);
            return [];
        }
    },
};
