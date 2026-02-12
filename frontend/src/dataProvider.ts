import type { DataProvider } from '@refinedev/core';
import { axiosInstance } from './authProvider';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters }) => {
    const params: Record<string, string | number> = {};

    if (pagination) {
      params.page = pagination.current || 1;
      params.limit = pagination.pageSize || 10;
    }

    if (filters) {
      filters.forEach((filter: Record<string, unknown>) => {
        if ('field' in filter && filter.value !== undefined && filter.value !== '') {
          params[filter.field as string] = filter.value as string | number;
        }
      });
    }

    const { data: response } = await axiosInstance.get(`${API_URL}/${resource}`, {
      params,
    });

    const result = response.data;

    return {
      data: result.data,
      total: result.total,
    };
  },

  getOne: async ({ resource, id }) => {
    const { data: response } = await axiosInstance.get(`${API_URL}/${resource}/${id}`);
    return { data: response.data };
  },

  create: async ({ resource, variables }) => {
    const { data: response } = await axiosInstance.post(`${API_URL}/${resource}`, variables);
    return { data: response.data };
  },

  update: async ({ resource, id, variables }) => {
    const { data: response } = await axiosInstance.patch(`${API_URL}/${resource}/${id}`, variables);
    return { data: response.data };
  },

  deleteOne: async ({ resource, id }) => {
    const { data: response } = await axiosInstance.delete(`${API_URL}/${resource}/${id}`);
    return { data: response.data };
  },

  getApiUrl: () => API_URL,
};
