import { api } from './client';

export interface BOMComponent {
    id: string;
    productId: string;
    quantity: number;
    product?: {
        name: string;
    };
}

export interface BOMOperation {
    id: string;
    name: string;
    time: number;
    workCenter: string;
    sequence: number;
}

export interface BOM {
    id: string;
    productVersionId: string;
    version: string;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    components: BOMComponent[];
    operations: BOMOperation[];
    createdAt: string;
    updatedAt: string;
    _count?: {
        components: number;
        operations: number;
    };
    productVersion?: {
        id: string;
        version: string;
        product: {
            id: string;
            name: string;
        };
    };
}

export const bomsApi = {
    getAll: async () => {
        const response = await api.get<any>('/boms');
        return response.data.data?.boms || [];
    },
    getById: async (id: string) => {
        const response = await api.get<any>(`/boms/${id}`);
        return response.data.data?.bom || null;
    },
    create: async (data: Partial<BOM>) => {
        const response = await api.post<any>('/boms', data);
        return response.data.data?.bom;
    },
    update: async (id: string, data: Partial<BOM>) => {
        const response = await api.put<any>(`/boms/${id}`, data);
        return response.data.data?.bom;
    },
    addComponent: async (bomId: string, data: Partial<BOMComponent>) => {
        const response = await api.post<any>(`/boms/${bomId}/components`, data);
        return response.data.data?.component;
    },
    removeComponent: async (bomId: string, componentId: string) => {
        await api.delete(`/boms/${bomId}/components/${componentId}`);
    },
    addOperation: async (bomId: string, data: Partial<BOMOperation>) => {
        const response = await api.post<any>(`/boms/${bomId}/operations`, data);
        return response.data.data?.operation;
    },
    removeOperation: async (bomId: string, operationId: string) => {
        await api.delete(`/boms/${bomId}/operations/${operationId}`);
    },
    publish: async (bomId: string) => {
        const response = await api.post<any>(`/boms/${bomId}/publish`);
        return response.data.data?.bom;
    }
};
