// 'use client'

// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useRouter } from 'next/navigation';
// import { LoginRequest, RegisterRequest, User } from '../services/types';
// import apiService from '../services/api';

// // 创建Context类型
// interface AuthContextType {
//   user: User;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (loginData: LoginRequest, rememberMe?: boolean) => Promise<any>;
//   register: (registerData: RegisterRequest) => Promise<any>;
//   logout: () => void;
//   guestAccess: () => any;
// }

// // 安全的默认用户
// const safeUser: User = {
//   id: '',
//   account: '',
//   email: '',
//   avatar_url: '',
//   phone: '',
//   bio: ''
// };

// // 创建Context
// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Context Provider组件
// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [authState, setAuthState] = useState({
//     user: safeUser,
//     isAuthenticated: false,
//     isLoading: true
//   });
  
//   const router = useRouter();

//   useEffect(() => {
//     // 检查认证状态的逻辑（从localStorage读取等）
//     const checkAuth = () => {
//       const savedUser = localStorage.getItem('user');
//       const savedExpiresAt = localStorage.getItem('expiresAt');
      
//       if (savedUser) {
//         try {
//           const user = JSON.parse(savedUser);
//           if (savedExpiresAt) {
//             const expiresAt = new Date(savedExpiresAt);
//             if (expiresAt > new Date()) {
//               setAuthState({
//                 user,
//                 isAuthenticated: true,
//                 isLoading: false
//               });
//             } else {
//               localStorage.removeItem('user');
//               localStorage.removeItem('expiresAt');
//               setAuthState({
//                 user: safeUser,
//                 isAuthenticated: false,
//                 isLoading: false
//               });
//             }
//           } else {
//             setAuthState({
//               user,
//               isAuthenticated: true,
//               isLoading: false
//             });
//           }
//         } catch (error) {
//           localStorage.removeItem('user');
//           setAuthState({
//             user: safeUser,
//             isAuthenticated: false,
//             isLoading: false
//           });
//         }
//       } else {
//         setAuthState({
//           user: safeUser,
//           isAuthenticated: false,
//           isLoading: false
//         });
//       }
//     };

//     checkAuth();
//   }, []);

//   // 登录方法
//   const login = async (loginData: LoginRequest, rememberMe: boolean = false) => {
//     setAuthState(prev => ({ ...prev, isLoading: true }));
    
//     try {
//       const response = await apiService.auth.login(loginData);
      
//       if (rememberMe) {
//         localStorage.setItem('user', JSON.stringify(response.user));
//       } else {
//         const expiresAt = new Date();
//         expiresAt.setHours(expiresAt.getHours() + 1);
//         localStorage.setItem('user', JSON.stringify(response.user));
//         localStorage.setItem('expiresAt', expiresAt.toISOString());
//       }
      
//       // 更新状态
//       setAuthState({
//         user: response.user || safeUser,
//         isAuthenticated: true,
//         isLoading: false
//       });
      
//       return { success: true, user: response.user || safeUser };
//     } catch (error) {
//       setAuthState(prev => ({ ...prev, isLoading: false }));
//       return { success: false, error: '登录失败，请检查用户名和密码' };
//     }
//   };

//   // 注册方法
//   const register = async (registerData: RegisterRequest) => {
//     // 注册逻辑
//     setAuthState(prev => ({ ...prev, isLoading: true }));
    
//     try {
//       const response = await apiService.auth.register(registerData);
//       localStorage.setItem('user', JSON.stringify(response.user));
//       setAuthState({
//         user: response.user || safeUser,
//         isAuthenticated: true,
//         isLoading: false
//       });
//       return { success: true, user: response.user || safeUser };
//     } catch (error) {
//       setAuthState(prev => ({ ...prev, isLoading: false }));
//       return { success: false, error: '注册失败，请稍后再试' };
//     }
//   };

//   // 登出方法
//   const logout = () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('expiresAt');
//     setAuthState({
//       user: safeUser,
//       isAuthenticated: false,
//       isLoading: false
//     });
//     router.push('/auth');
//   };

//   // 游客访问
//   const guestAccess = () => {
//     const guestUser: User = {
//       id: 'guest',
//       account: '游客用户',
//       email: 'guest@example.com',
//       avatar_url: '',
//       phone: '',
//       bio: ''
//     };
    
//     setAuthState({
//       user: guestUser,
//       isAuthenticated: false,
//       isLoading: false
//     });
    
//     return { success: true, user: guestUser };
//   };

//   const value = {
//     ...authState,
//     login,
//     register,
//     logout,
//     guestAccess
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// // 自定义钩子用于获取Context
// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// } 