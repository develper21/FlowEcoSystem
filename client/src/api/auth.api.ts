import { api } from './client';

export const authApi = {
    signup: async (data: any) => {
        const response = await api.post<any>('/auth/signup', data);
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await api.post<any>('/auth/change-password', data);
        return response.data;
    },
    updateProfile: async (data: any) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        if (data.avatar) {
            formData.append('avatar', data.avatar);
        }

        const response = await api.put<any>('/auth/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    }
};
