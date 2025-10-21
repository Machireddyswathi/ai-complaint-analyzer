import axios from 'axios';
import { API_ENDPOINTS } from '../config';

const api = axios.create({
  timeout: 90000, // Increased from 30000 to 90000 (90 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug: Log API configuration
console.log('🔗 API Configuration:', {
  baseURL: API_ENDPOINTS,
  timeout: '90 seconds'
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better timeout handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    let message = 'An unexpected error occurred';
    
    if (error.code === 'ECONNABORTED') {
      message = '⏰ Server is starting up (this may take 30-60 seconds on first request). Please try again in a moment.';
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      message = '🔌 Cannot connect to server. Please check:\n' +
                '1. Backend is running\n' +
                '2. VITE_API_URL is correct in .env\n' +
                '3. CORS is configured properly';
    } else if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 422) {
        // Parse FastAPI validation errors
        if (data.detail && Array.isArray(data.detail)) {
          const errors = data.detail.map(err => {
            const field = err.loc[err.loc.length - 1];
            return `${field}: ${err.msg}`;
          }).join('\n');
          message = `⚠️ Validation Error:\n${errors}`;
        } else {
          message = data.detail || '⚠️ Invalid input - please check your data';
        }
      } else if (status === 400) {
        message = data.detail || '⚠️ Invalid input - please check your data';
      } else if (status === 404) {
        message = '❌ Resource not found';
      } else if (status === 500) {
        message = data.detail || '❌ AI service temporarily unavailable';
      } else if (status === 503) {
        message = '⚠️ Service unavailable - server may be starting up. Please wait 30 seconds and try again.';
      } else if (status === 504) {
        message = data.detail || '⏰ Gateway timeout - server is waking up. Please try again in 30 seconds.';
      } else {
        message = data.detail || `Error ${status}: ${error.response.statusText}`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    console.error('❌ API Error:', {
      code: error.code,
      message: message,
      url: error.config?.url
    });
    
    return Promise.reject(new Error(message));
  }
);

export const complaintAPI = {
  submitComplaint: async (data) => {
    console.log('📤 Submitting complaint:', {
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      text_length: data.text.length
    });
    
    const response = await api.post(API_ENDPOINTS.complaints, {
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      text: data.text
    });
    
    console.log('✅ Complaint submitted:', response.data.id);
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
    console.log('📊 Fetching analytics...');
    const response = await api.get(API_ENDPOINTS.analytics);
    console.log('✅ Analytics loaded');
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
    console.log('🏥 Checking backend health...');
    const response = await api.get(API_ENDPOINTS.health);
    console.log('✅ Backend is healthy');
    return response.data;
  },
};

export default api;