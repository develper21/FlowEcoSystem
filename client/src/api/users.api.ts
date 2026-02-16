/**
 * Users API Service
 */
import { api } from './client';

export interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    status: 'ACTIVE' | 'DISABLED' | 'PENDING';
    createdAt: string;
    updatedAt: string;
}

export interface UserListResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const usersApi = {
    getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
        try {
            const response = await api.get<any>('/users', { params });
            return response.data.data || { users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
        } catch (error) {
            console.error('Failed to fetch users:', error);
            return { users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
        }
    },
    updateStatus: async (id: string, status: 'ACTIVE' | 'DISABLED' | 'PENDING') => {
        try {
            const response = await api.patch<any>(`/users/${id}/status`, { status });
            return response.data.data?.user;
        } catch (error) {
            console.error('Failed to update user status:', error);
            throw error;
        }
    },
    update: async (id: string, data: Partial<User> & { role?: string }) => {
        try {
            const response = await api.put<any>(`/users/${id}`, data);
            return response.data.data?.user;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }
};
