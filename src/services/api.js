import axios from "axios";
import { authUtils } from "../utils/authUtils";
import { Capacitor } from "@capacitor/core";

let baseURL = import.meta.env.VITE_API_URL || "https://homechef-be.onrender.com/api";

// Auto-detect and fix local/emulator API routing if pointing to the dead Render URL
if (baseURL.includes("homechef-be.onrender.com")) {
  if (Capacitor.isNativePlatform()) {
    // Android emulator alias to host machine's localhost
    baseURL = "http://10.0.2.2:5000/api";
  } else if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    baseURL = "http://localhost:5000/api";
  }
}

const api = axios.create({
  baseURL,
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
