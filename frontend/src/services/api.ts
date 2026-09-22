import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

const getNormalizedApiUrl = (): string => {
  let url =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development"
      ? "http://localhost:5001/api/v1"
      : "/api/v1");

  // Remove trailing slashes
  url = url.trim().replace(/\/+$/, "");

  // If the URL is absolute (http/https) and missing /api/v1 or /api prefix, auto-append /api/v1
  if (
    (url.startsWith("http://") || url.startsWith("https://")) &&
    !url.endsWith("/api/v1") &&
    !url.endsWith("/api")
  ) {
    url = `${url}/api/v1`;
  }

  return url;
};

export const API_BASE_URL = getNormalizedApiUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Attach Bearer JWT Access Token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Auto Refresh Token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry on auth endpoints
    if (
      !originalRequest ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/signin") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/signup") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken =
          res.data?.data?.accessToken || res.data?.accessToken;

        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().clearState();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
