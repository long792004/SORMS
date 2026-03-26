import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "@/utils/constants";
import { useAuthStore } from "@/store/authStore";

const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

const handleError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    useAuthStore.getState().clearAuth();
  }

  return Promise.reject(error);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(attachToken, handleError);
api.interceptors.response.use((response) => response, handleError);
