import client from './client';

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post<{ imageUrl: string }>('/Upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
