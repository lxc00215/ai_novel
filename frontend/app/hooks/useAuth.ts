"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export  function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  const router = useRouter();

  useEffect(() => {
    // 从localStorage读取保存的用户信息
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          localStorage.removeItem('user');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    // 实际应用中这里会调用API
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟成功登录
      const user: User = {
        id: '123456',
        username,
        email: `${username}@example.com`,
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      };
      
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      
      return { success: true, user };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: '登录失败，请检查用户名和密码' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟成功注册
      const user: User = {
        id: '123456',
        username,
        email,
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      };
      
      // 自动登录
      localStorage.setItem('user', JSON.stringify(user));
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      
      return { success: true, user };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: '注册失败，请稍后再试' };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    router.push('/auth');
  };

  const guestAccess = () => {
    const guestUser: User = {
      id: 'guest',
      username: '游客用户',
      email: 'guest@example.com'
    };
    
    setAuthState({
      user: guestUser,
      isAuthenticated: false, // 游客不算真正的认证
      isLoading: false
    });
    
    return { success: true, user: guestUser };
  };

  return {
    ...authState,
    login,
    register,
    logout,
    guestAccess
  };
}