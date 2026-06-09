import { api } from './client';

export interface Product {
    id: string;
    name: string;
    status: 'ACTIVE' | 'ARCHIVED';
    currentVersionId?: string;
    createdAt: string;
    updatedAt: string;
    currentVersion?: ProductVersion;
    versions?: ProductVersion[];
    salePrice?: number;
    costPrice?: number;
}

export interface ProductVersion {
    id: string;
    productId: string;
    version: string;
    salePrice: number;
    costPrice: number;
    status: 'ACTIVE' | 'ARCHIVED';
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse<T> {
    data: {
        data: T;
    };
}

interface ProductsResponse {
    data: {
        products: Product[];
    };
}

interface ProductResponse {
    data: {
        product: Product;
    };
}

interface ProductVersionResponse {
    data: {
        version: ProductVersion;
    };
}

export const productsApi = {
    getAll: async () => {
        try {
            const response = await api.get<ProductsResponse>('/products');
            return response.data.data?.products || [];
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }
    },
    getById: async (id: string) => {
        try {
            const response = await api.get<ProductResponse>(`/products/${id}`);
            return response.data.data?.product || null;
        } catch (error) {
            console.error('Failed to fetch product:', error);
            return null;
        }
    },
    create: async (data: Partial<Product>) => {
        const response = await api.post<ProductResponse>('/products', data);
        return response.data.data?.product;
    },
    update: async (id: string, data: Partial<Product>) => {
        const response = await api.put<ProductResponse>(`/products/${id}`, data);
        return response.data.data?.product;
    },
    archive: async (id: string) => {
        await api.patch(`/products/${id}/archive`);
    },
    createVersion: async (productId: string, data: Partial<ProductVersion>) => {
        const response = await api.post<ProductVersionResponse>(`/products/${productId}/versions`, data);
        return response.data.data?.version;
    },
    getVersionHistory: async (productId: string) => {
        try {
            const response = await api.get<ApiResponse<unknown>>(`/reports/products/${productId}/version-history`);
            return response.data.data || null;
        } catch (error) {
            console.error('Failed to fetch version history:', error);
            return null;
        }
    }
};
