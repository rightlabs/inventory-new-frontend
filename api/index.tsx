import { getToken } from "@/utils/getToken";
import axios from "axios";
import { toast } from "react-hot-toast";

export const prefix = "/api/v1";
export const baseurl = "http://localhost:9010";
// export const baseurl = "https://inventory-backend.rightlabs.live";
export const url = baseurl + prefix;

// Helper function to get token from cookies

// Create axios instance with base configuration
const API_INSTANCE = axios.create({
  baseURL: url,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
API_INSTANCE.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Error in request configuration:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
API_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with an error status code
      if (error.response.status === 403) {
        toast.error("Session expired! Please login again.");
        localStorage.removeItem("token"); // Clear token
        window.location.href = "/"; // Redirect to login page
      } else {
        // Handle other error responses
        const errorMessage =
          error.response.data?.message || "An error occurred";
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error("No response from server. Please try again.");
    } else {
      // Error in request configuration
      toast.error("Request failed. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default API_INSTANCE;
