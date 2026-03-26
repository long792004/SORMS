import { api } from "@/api/axios";

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/Upload/image", formData);
  }
};
