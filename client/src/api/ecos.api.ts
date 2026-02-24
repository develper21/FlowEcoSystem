import { api } from './client';

export interface ECOBOMComponentDraft {
    id: string;
    ecoId: string;
    productId: string;
    quantity: number;
    changeType: 'ADDED' | 'MODIFIED' | 'REMOVED';
    originalComponentId?: string;
    product?: {
        id: string;
        name: string;
        status: string;
    };
}

export interface ECOBOMOperationDraft {
    id: string;
    ecoId: string;
    name: string;
    time: number;
    workCenter: string;
    sequence: number;
    changeType: 'ADDED' | 'MODIFIED' | 'REMOVED';
    originalOperationId?: string;
}

export interface ECO {
    id: string;
    title: string;
    type: 'PRODUCT' | 'BOM';
    productId: string;
    bomId?: string;
    createdBy: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'APPLIED';
    currentStage: string;
    versionUpdate: boolean;
    effectiveDate?: string;
    draftData: any;
    createdAt: string;
    updatedAt: string;
    product?: {
        id: string;
        name: string;
        status: string;
    };
    bom?: {
        id: string;
        version: string;
        status: string;
        components?: Array<{
            id: string;
            productId: string;
            quantity: number;
            product: {
                id: string;
                name: string;
                status: string;
            };
        }>;
        operations?: Array<{
            id: string;
            name: string;
            time: number;
            workCenter: string;
            sequence: number;
        }>;
        productVersion?: {
            id: string;
            version: string;
            product: {
                id: string;
                name: string;
            };
        };
    };
    componentDrafts?: ECOBOMComponentDraft[];
    operationDrafts?: ECOBOMOperationDraft[];
}

export const ecosApi = {
    getAll: async () => {
        try {
            const response = await api.get<any>('/ecos');
            return response.data.data?.ecos || [];
        } catch (error) {
            console.error('Failed to fetch ECOs:', error);
            return [];
        }
    },
    getById: async (id: string) => {
        try {
            const response = await api.get<any>(`/ecos/${id}`);
            return response.data.data?.eco || null;
        } catch (error) {
            console.error('Failed to fetch ECO:', error);
            return null;
        }
    },
    create: async (data: Partial<ECO>) => {
        const response = await api.post<any>('/ecos', data);
        return response.data.data?.eco;
    },
    update: async (id: string, data: Partial<ECO>) => {
        const response = await api.put<any>(`/ecos/${id}`, data);
        return response.data.data?.eco;
    },
    submit: async (id: string) => {
        const response = await api.post<any>(`/ecos/${id}/submit`);
        return response.data.data?.eco;
    },
    review: async (id: string, status: 'APPROVED' | 'REJECTED', comments: string, fullApproval: boolean = false) => {
        const response = await api.post<any>(`/ecos/${id}/review`, { 
            approved: status === 'APPROVED', 
            comments,
            fullApproval // When true, approves all remaining stages at once
        });
        return response.data.data;
    },
    apply: async (id: string) => {
        const response = await api.post<any>(`/ecos/${id}/apply`);
        return response.data.data;
    },
    
    // BOM Draft Management
    addComponentDraft: async (ecoId: string, data: { productId: string; quantity: number; changeType?: string; originalComponentId?: string }) => {
        const response = await api.post<any>(`/ecos/${ecoId}/draft/components`, data);
        return response.data.data?.componentDraft;
    },
    updateComponentDraft: async (ecoId: string, draftId: string, data: { quantity?: number; changeType?: string }) => {
        const response = await api.put<any>(`/ecos/${ecoId}/draft/components/${draftId}`, data);
        return response.data.data?.componentDraft;
    },
    removeComponentDraft: async (ecoId: string, draftId: string) => {
        await api.delete(`/ecos/${ecoId}/draft/components/${draftId}`);
    },
    addOperationDraft: async (ecoId: string, data: { name: string; time: number; workCenter: string; sequence: number; changeType?: string; originalOperationId?: string }) => {
        const response = await api.post<any>(`/ecos/${ecoId}/draft/operations`, data);
        return response.data.data?.operationDraft;
    },
    updateOperationDraft: async (ecoId: string, draftId: string, data: { name?: string; time?: number; workCenter?: string; sequence?: number; changeType?: string }) => {
        const response = await api.put<any>(`/ecos/${ecoId}/draft/operations/${draftId}`, data);
        return response.data.data?.operationDraft;
    },
    removeOperationDraft: async (ecoId: string, draftId: string) => {
        await api.delete(`/ecos/${ecoId}/draft/operations/${draftId}`);
    }
};
