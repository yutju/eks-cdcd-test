// src/hooks/useAdminAuth.js
import { useState } from 'react';

export function useAdminAuth() {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('adminUser')); } catch { return null; }
  });

  const login = (token, name) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify({ name }));
    setAdmin({ name });
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  return { admin, login, logout, isAdminLoggedIn: !!admin };
}
