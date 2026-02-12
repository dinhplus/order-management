import type { AccessControlProvider } from '@refinedev/core';

export const accessControlProvider: AccessControlProvider = {
  can: async ({ action }) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return { can: false };

    const user = JSON.parse(userStr);
    const role = user.role;

    if (role === 'manager') {
      return { can: true };
    }

    if (role === 'warehouse_staff') {
      const allowedActions = ['list', 'show'];
      if (allowedActions.includes(action)) {
        return { can: true };
      }

      return { can: false };
    }

    return { can: false };
  },
};
