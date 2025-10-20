// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  complaints: `${API_BASE_URL}/api/complaints`,
  analytics: `${API_BASE_URL}/api/analytics`,
  health: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;