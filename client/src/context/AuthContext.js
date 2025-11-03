import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { settingsAPI } from '../services/api';

// Define authAPI functions using the imported api instance
const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [appName, setAppName] = useState('NexusCRM');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
    checkLoggedIn();
    loadSettings();
  }, []);

  const checkLoggedIn = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await authAPI.getMe();
        if (response.data?.user) {
          setUser(response.data.user);
        } else {
          throw new Error('Invalid user data');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        // Don't redirect here, let the ProtectedRoute handle it
      }
    } catch (error) {
      console.error('Unexpected error in auth check:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      setLoading(true);
      const response = await authAPI.login({ email, password });
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }
      const { user: userData, token } = response.data;
      
      if (!token) {
        throw new Error('No token received');
      }
      
      localStorage.setItem('token', token);
      
      // Verify the token by fetching user data
      try {
        const meResponse = await authAPI.getMe();
        if (meResponse.data?.user) {
          setUser(meResponse.data.user);
          return { success: true };
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (meError) {
        console.error('Failed to fetch user data:', meError);
        localStorage.removeItem('token');
        throw new Error('Failed to verify user session');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any invalid token
      localStorage.removeItem('token');
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed. Please check your credentials.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    authAPI.logout();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      const s = res.data.settings;
      setSettings(s);
      if (s?.appName) setAppName(s.appName);
      // If no explicit user preference stored, use server default theme
      const saved = localStorage.getItem('theme');
      if (!saved && s?.theme && (s.theme === 'light' || s.theme === 'dark')) {
        setTheme(s.theme);
      }
    } catch (e) {
      // ignore settings load failures for now
    }
  };

  const hasPermission = (resource, action) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.[resource]?.[action] || false;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    theme,
    toggleTheme,
    hasPermission,
    settings,
    appName,
    setTheme,
    setAppName
  };

  useEffect(() => {
    try {
      document.title = appName || 'NexusCRM';
    } catch {}
  }, [appName]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
