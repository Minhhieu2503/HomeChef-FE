import axios from "axios";
import { authUtils } from "../utils/authUtils";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://homechef-be-earg.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    console.error("API Error:", message);

    // Auto logout on 401
    if (error.response?.status === 401) {
      authUtils.removeToken();
      // Use hash for mobile routing compatibility
      window.location.hash = "#/login"; 
    }

    return Promise.reject(error);
  }
);

export default api;
