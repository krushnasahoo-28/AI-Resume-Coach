import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Fetch authenticated user on load if token exists
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await apiClient.get('/auth/me');
          setUser(response.data);
          setError(null);
        } catch (err) {
          console.error('Failed to load authenticated user:', err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    loadUser();
  }, [token, logout]);

  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', {
        username_or_email: usernameOrEmail,
        password: password,
      });

      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      setUser(userData);
      setToken(access_token);
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (fullName, email, username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        full_name: fullName,
        email: email,
        username: username,
        password: password,
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

