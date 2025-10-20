import axios from 'axios';
import { API_ENDPOINTS } from '../config';

const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with professional error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';
    
    if (error.code === 'ECONNABORTED') {
      message = '⏰ Request timeout - please try again';
    } else if (error.code === 'ERR_NETWORK') {
      message = '🔌 Connection lost - please check your internet';
    } else if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;
      
      if (status === 400) {
        message = detail || '⚠️ Invalid input - please check your data';
      } else if (status === 404) {
        message = '❌ Resource not found';
      } else if (status === 500) {
        message = detail || '❌ AI service temporarily unavailable';
      } else if (status === 503) {
        message = '⚠️ Service unavailable - please try again in a moment';
      } else if (status === 504) {
        message = detail || '⏰ AI service request timeout - please try again';
      } else {
        message = detail || `Error ${status}: ${error.response.statusText}`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    return Promise.reject(new Error(message));
  }
);

export const complaintAPI = {
  submitComplaint: async (data) => {
    const response = await api.post(API_ENDPOINTS.complaints, {
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      text: data.text
    });
    return response.data;
  },

  getComplaints: async (filters = {}) => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    const response = await api.get(API_ENDPOINTS.complaints, { params: cleanFilters });
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get(API_ENDPOINTS.analytics);
    return response.data;
  },

  updateComplaintStatus: async (id, status) => {
    const response = await api.patch(`${API_ENDPOINTS.complaints}/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  deleteComplaint: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.complaints}/${id}`);
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get(API_ENDPOINTS.health);
    return response.data;
  },
};

export default api;