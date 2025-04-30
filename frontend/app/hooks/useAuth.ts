// "use client";

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { LoginRequest, RegisterRequest, User } from '../services/types';
// import apiService from '../services/api';


// interface AuthState {
//   user: User ;
//   isAuthenticated: boolean;
//   isLoading: boolean;
// }

// const safeUser: User = {
//   id: '',
//   account: '',
//   email: '',
//   avatar_url: '',
//   phone: '',
//   bio: ''
// }
// export  function useAuth() {
//   const [authState, setAuthState] = useState<AuthState>({
//     user: safeUser,
//     isAuthenticated: false,
//     isLoading: true
//   });
//   const router = useRouter();

//   useEffect(() => {
//     // 从localStorage读取保存的用户信息
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

//   const login = async (loginData: LoginRequest, rememberMe: boolean = false) => {
//     setAuthState(prev => ({ ...prev, isLoading: true }));
    
//     try {
//       const response = await apiService.auth.login(loginData);
      
//       if (rememberMe) {
//         // 永不过期
//         localStorage.setItem('user', JSON.stringify(response.user));
//       } else {
//         // 1天过期
//         const expiresAt = new Date();
//         expiresAt.setHours(expiresAt.getHours() + 1);
//         localStorage.setItem('user', JSON.stringify(response.user));
//         localStorage.setItem('expiresAt', expiresAt.toISOString());
//       }

//       console.log('登录成功，设置状态');
      
//       setAuthState({
//         user: response.user || safeUser,
//         isAuthenticated: true,
//         isLoading: false
//       });

//       console.log('登录成功，返回结果'+JSON.stringify(authState));
      
//       return { success: true, user: response.user || safeUser };
//     } catch (error) {
//       setAuthState(prev => ({ ...prev, isLoading: false }));
//       return { success: false, error: '登录失败，请检查用户名和密码' };
//     }
//   };

//   const register = async (registerData: RegisterRequest) => {
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

//   const logout = () => {
//     localStorage.removeItem('user');
//     setAuthState({
//       user: safeUser,
//       isAuthenticated: false,
//       isLoading: false
//     });
//     router.push('/auth');
//   };

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
//       isAuthenticated: false, // 游客不算真正的认证
//       isLoading: false
//     });
    
//     return { success: true, user: guestUser };
//   };

//   return {
//     ...authState,
//     login,
//     register,
//     logout,
//     guestAccess
//   };
// }