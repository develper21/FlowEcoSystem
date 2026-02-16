import { api } from './client';

export interface RoleRequest {
  id: string;
  userId: string;
  requestedRoles: string[];
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    status: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export const roleRequestApi = {
  // User endpoints
  create: async (data: { requestedRoles: string[]; reason?: string }) => {
    const response = await api.post<any>('/role-requests', data);
    return response.data.data;
  },

  getMyRequests: async () => {
    const response = await api.get<any>('/role-requests/me');
    return response.data.data.roleRequests as RoleRequest[];
  },

  // Admin endpoints
  getAllRequests: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get<any>('/role-requests/admin/all', { params });
    return response.data.data.roleRequests as RoleRequest[];
  },

  approve: async (id: string) => {
    const response = await api.patch<any>(`/role-requests/admin/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string) => {
    const response = await api.patch<any>(`/role-requests/admin/${id}/reject`);
    return response.data.data;
  },
};
