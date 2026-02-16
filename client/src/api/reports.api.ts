import { api } from './client';

export interface ECOStats {
    total: number;
    active: number;
    completed: number;
    avgApprovalTime: number; // in hours
    byStatus: Record<string, number>;
}

export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    comments: string;
    createdAt: string;
}

export const reportsApi = {
    getECOStats: async () => {
        try {
            const response = await api.get<any>('/reports/eco-stats');
            return response.data.data || null;
        } catch (error) {
            console.error('Failed to fetch ECO stats:', error);
            return null;
        }
    },
    getAuditLogs: async () => {
        try {
            const response = await api.get<any>('/reports/audit-logs');
            return response.data.data?.logs || [];
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            return [];
        }
    },
    getArchivedProducts: async () => {
        try {
            const response = await api.get<any>('/reports/archived-products');
            return response.data.data?.products || [];
        } catch (error) {
            console.error('Failed to fetch archived products:', error);
            return [];
        }
    },
    getActiveProductMatrix: async () => {
        try {
            const response = await api.get<any>('/reports/active-matrix');
            return response.data.data || null;
        } catch (error) {
            console.error('Failed to fetch active matrix:', error);
            return null;
        }
    }
};
