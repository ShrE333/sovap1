'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Load from localStorage
        const savedToken = localStorage.getItem('sovap_token');
        const savedUser = localStorage.getItem('sovap_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();

            setToken(data.token);
            setUser(data.user);

            localStorage.setItem('sovap_token', data.token);
            localStorage.setItem('sovap_user', JSON.stringify(data.user));

            // Role-based routing
            switch (data.user.role) {
                case 'admin':
                    router.push('/admin');
                    break;
                case 'college':
                    router.push('/college');
                    break;
                case 'teacher':
                    router.push('/teacher');
                    break;
                default:
                    router.push('/student');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('sovap_token');
        localStorage.removeItem('sovap_user');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// API helper with authentication
export async function apiCall(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = localStorage.getItem('sovap_token');

    const headers: Record<string, string> = {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...((options.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type to JSON if it's not FormData and not already set
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('sovap_token');
        localStorage.removeItem('sovap_user');
        window.location.href = '/login';
    }

    return response;
}
