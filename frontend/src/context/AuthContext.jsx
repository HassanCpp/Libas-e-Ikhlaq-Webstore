import React, { createContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        if (!localStorage.getItem('token')) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/user/profile');
            if (res.success) {
                setUser(res.data);
            } else {
                logout();
            }
        } catch (err) {
            console.error('Failed to load user profile:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.success && res.token) {
                localStorage.setItem('token', res.token);
                setUser(res.user);
                setToken(res.token);
                return res;
            } else {
                throw new Error(res.message || 'Login failed');
            }
        } catch (err) {
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
