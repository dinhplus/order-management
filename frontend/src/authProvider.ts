import axios from 'axios';
import type { AuthProvider, HttpError } from '@refinedev/core';
import type { ILoginResponse } from './interfaces';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError: HttpError = {
      statusCode: error.response?.status || 500,
      message: Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error.response?.data?.message || error.message,
    };
    return Promise.reject(customError);
  },
);

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      const { data } = await axios.post<{ data: ILoginResponse }>(`${API_URL}/auth/login`, {
        username,
        password,
      });

      const response = data.data;
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      return { success: true, redirectTo: '/' };
    } catch {
      return {
        success: false,
        error: { name: 'Login Error', message: 'Invalid credentials' },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { authenticated: false, redirectTo: '/login' };
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return { authenticated: false, redirectTo: '/login' };
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      return { authenticated: false, redirectTo: '/login' };
    }

    return { authenticated: true };
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return { id: user.id, name: user.username, role: user.role };
  },

  getPermissions: async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr).role;
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      return { logout: true, redirectTo: '/login' };
    }
    return { error };
  },
};
