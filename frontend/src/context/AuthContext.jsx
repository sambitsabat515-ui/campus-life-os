import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  STUDENT: { email: 'student@campus.edu', roll: '220101045', pass: 'student123', label: 'Student (Aarav Sharma)' },
  STAFF: { email: 'warden@campus.edu', roll: '', pass: 'warden123', label: 'Warden (Dr. K. C. Pradhan)' },
  ADMIN: { email: 'admin@campus.edu', roll: '', pass: 'admin123', label: 'Dean Admin (Dr. B. K. Mishra)' },
  MESS: { email: 'mess@campus.edu', roll: '', pass: 'mess123', label: 'Mess Manager (Ramesh Nayak)' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('campus_os_token'));
  const [currentPortal, setCurrentPortal] = useState(localStorage.getItem('campus_os_portal') || 'STUDENT');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          // Sync currentPortal with user role if needed
          if (profile.role === 'ADMIN') setCurrentPortal('ADMIN');
          else if (profile.role === 'STAFF') setCurrentPortal('STAFF');
          else if (profile.role === 'MESS') setCurrentPortal('MESS');
          else setCurrentPortal('STUDENT');
        } catch (e) {
          console.error("Auth check failed:", e);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email_or_roll, password, portal) => {
    const res = await api.login(email_or_roll, password, portal);
    localStorage.setItem('campus_os_token', res.access_token);
    localStorage.setItem('campus_os_portal', portal || res.user.role);
    setToken(res.access_token);
    setUser(res.user);
    setCurrentPortal(portal || res.user.role);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('campus_os_token', res.access_token);
    localStorage.setItem('campus_os_portal', res.user.role);
    setToken(res.access_token);
    setUser(res.user);
    setCurrentPortal(res.user.role);
    return res.user;
  };

  const switchPortal = (portal) => {
    setCurrentPortal(portal);
    localStorage.setItem('campus_os_portal', portal);
  };

  const logout = () => {
    localStorage.removeItem('campus_os_token');
    localStorage.removeItem('campus_os_portal');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      currentPortal,
      loading,
      login,
      register,
      logout,
      switchPortal,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
