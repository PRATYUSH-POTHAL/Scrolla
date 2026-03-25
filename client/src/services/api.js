import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expired. Please log in again.');
        } else if (error.response?.data?.message) {
            toast.error(error.response.data.message);
        } else if (error.response?.data?.errors?.length > 0) {
            toast.error(error.response.data.errors[0].msg || 'Validation error');
        } else {
            toast.error('Something went wrong. Please try again.');
        }
        return Promise.reject(error);
    }
);

export default api;
