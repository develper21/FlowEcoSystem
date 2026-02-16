import { api } from './client';

export interface Attachment {
    id: string;
    url: string;
    publicId: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
    uploadedBy: string;
    createdAt: string;
    uploader?: {
        id: string;
        name: string;
        email: string;
    };
}

export const attachmentsApi = {
    // Product Attachments
    uploadProductAttachment: async (productVersionId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post<any>(`/products/${productVersionId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data?.attachment;
    },
    
    getProductAttachments: async (productVersionId: string): Promise<Attachment[]> => {
        const response = await api.get<any>(`/products/${productVersionId}/attachments`);
        return response.data.data?.attachments || [];
    },
    
    deleteProductAttachment: async (attachmentId: string) => {
        const response = await api.delete<any>(`/products/attachments/${attachmentId}`);
        return response.data;
    },
    
    // ECO Attachments
    uploadECOAttachment: async (ecoId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post<any>(`/ecos/${ecoId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data?.attachment;
    },
    
    getECOAttachments: async (ecoId: string): Promise<Attachment[]> => {
        const response = await api.get<any>(`/ecos/${ecoId}/attachments`);
        return response.data.data?.attachments || [];
    },
    
    deleteECOAttachment: async (attachmentId: string) => {
        const response = await api.delete<any>(`/ecos/attachments/${attachmentId}`);
        return response.data;
    },
};
