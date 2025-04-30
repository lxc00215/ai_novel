"use client";

import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Novel,
  // CreateNovelRequest,
  SimpleTask,
  TaskResponse,
  Character,
  Inspiration,
  Chapter,
  ImageObject,
  ContinueResponse,
  CreateCrazyRequest,
  CreateInspirationRequest,
  User
} from './types';
import { toast } from "sonner";  // 使用 sonner 来显示错误提示


// API 基础URL

// 定义错误响应的类型
interface ErrorResponse {
  message: string;
  status: number;
}

// 修改请求基地址配置
const BASE_URL = process.env.NEXT_PUBLIC_ENDPOINT || 'http://localhost:8000'; // 确保这里配置正确

// JWT工具函数 - 从token中解析用户ID
export const getUserIdFromToken = (): string | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // JWT token由三部分组成，用点分隔：header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // 解码payload部分（第二部分）
    const payload = JSON.parse(atob(parts[1]));

    // 从payload中提取用户ID (sub字段)
    return payload.sub || null;
  } catch (error) {
    console.error('解析token失败:', error);
    return null;
  }
};

// 封装错误处理函数
const handleApiError = (error: any) => {
  // 获取错误信息
  let errorMessage = '请求失败，请稍后重试';

  // 处理敏感词错误
  if (error.response?.data) {
    if (error.response.data.error === "内容包含敏感词" && error.response.data.found_words) {
      const sensitiveWords = error.response.data.found_words.join('、');
      errorMessage = `存在敏感词: ${sensitiveWords}，请修改`;
    } else if (error.response.data.message) {
      errorMessage = error.response.data.message;
    }
  }

  // 显示错误提示
  toast.error(errorMessage, {
    position: 'top-center',
    duration: 3000,
  });

  // 抛出错误，让调用方可以继续处理
  throw error;
};

// 封装请求函数
export const request = async (url: string, options: RequestInit = {}) => {
  try {
    // 获取认证令牌并添加到请求头
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // 创建一个新的options对象，合并现有headers
    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        // 如果有token，添加Authorization header
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const response = await fetch(`${BASE_URL}${url}`, newOptions);
    // 检查响应状态
    if (!response.ok) {
      // 处理401错误(token无效或过期)
      if (response.status === 401) {
        // 清除token并重定向到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
      }
      const errorData: ErrorResponse = await response.json();
      throw {
        response: {
          status: response.status,
          data: errorData
        }
      };
    }
    else if (response.status === 400) {
      console.log("400错误")
    }
    // 检查是否是 SSE 请求
    const headers = newOptions.headers as Record<string, string>;
    if (headers && headers['Accept'] === 'text/event-stream') {
      return response; // 直接返回 response 对象,不要尝试 JSON 解析
    }

    return await response.json();
  } catch (error) {
    console.log("自动保存error" + error)
    return handleApiError(error);
  }
};

// API 服务对象
const apiService = {

  alipay: {
    creat: async (amount: string) => {
      const response = await request('/alipay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          description: "订阅会员服务"
        })
      });
      return response;
    },
    checkOrder: async (orderInfo: string) => {
      const response = await request('/alipay/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_info: orderInfo
        })
      });
      return response;
    }
  },

  // 认证相关 API
  auth: {
    // 检查用户名是否可用 
    checkUsernameAvailability: async (username: string ): Promise<{ success: boolean }> => {
      const response = await request(`/auth/check_username_available/${username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },

    // 检查邮箱是否可用
    checkEmailAvailability: async (email: string): Promise<{ success: boolean }> => {
      const response = await request(`/auth/check_email_available/${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },


    
    // 登录
    login: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('登录响应', JSON.stringify(response));


      return response;
    },

    // 注册
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 如果注册成功，保存令牌和用户信息
      if (response.success && response.data) {
        const { token, user } = response.data;
        if (token) localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
      }

      return response;
    },

    // 退出登录
    logout: async (): Promise<any> => {
      // 调用后端登出接口（如果需要）
      const response = await request('/auth/logout', {
        method: 'POST',
      });

      // 无论成功与否，清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return response;
    },

    // 获取当前用户ID
    getCurrentUserId: (): string | null => {
      return getUserIdFromToken();
    },

    // 获取当前用户信息
    // getCurrentUser: async (): Promise<ApiResponse<User>> => {
    //   return fetchApi<User>('/auth/me');
    // }
  },

  utils: {
    /**
     * 上传图片到服务器
     * @param data FormData对象，包含要上传的文件
     * @param authCode 可选的授权码
     * @returns 上传成功后返回的图片URL
     */
    downloadImageAndUpload: async (image_url: string): Promise<string> => {
      const response = await request(`/utils/download_image_and_upload?image_url=${image_url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });



      console.log(JSON.stringify(response) + "下载图片并上传");
      return response.image_url;
    },

    uploadImage: async (file: File): Promise<{success: boolean, data: {url: string}}> => {
      // 创建FormData对象，用于文件上传
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await request(`/utils/upload-image`, {
        method: 'POST',
        body: formData,
        // 不要手动设置Content-Type，让浏览器自动设置，包含boundary信息
      });
      
      if (response.success) {
        return response.data.url;
      } else {
        throw new Error(response.message || '上传图片失败');
      }
    }
  },

  spirate: {
    continue: async (inspiration_id: string, choice: string): Promise<ContinueResponse> => {
      return request(`/spirate/continue/${inspiration_id}`, {
        method: 'POST',
        body: JSON.stringify({ choice }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    get: async (id: string) => {
      console.log('Calling API with ID:', id); // 添加日志
      try {
        const response = await request(`/spirate/${id}`);
        return response;
      } catch (error) {
        console.error('API error:', error);
        return { success: false, data: null };
      }
    },
    getStories: async (id: number, page: number, pageSize: number) => {
      console.log("getStories1");
      const response = await request(`/spirate/user/${id}?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    update: async (data: Partial<Inspiration>): Promise<Inspiration> => {
      return request(`/spirate/update`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  },
  bookGeneration: {
    getAnalysisHistory: async () => {
      return request(`/bookGeneration/get-analysis-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
  },
  // AI 生成相关 API
  ai: {
    // 拆解
    analyze: async (file_id: string) => {
      return request(`/ai/analyze-file`, {
        method: 'POST',
        body: JSON.stringify({ file_id }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },


    getAnalysis: async (file_id: string) => {
      return request(`/ai/get-analysis`, {
        method: 'POST',
        body: JSON.stringify({ file_id }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    // 生成小说内容
    generateContent: async (prompt: string, writingStyle: string = "", requirements: string = ""): Promise<any> => {
      return request('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          writing_style: writingStyle,
          requirements
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },

    // 流式AI扩写
    expandContent: async (context: string, content: string) => {
      try {
        const response = await request('/ai/expand', {
          method: 'POST',
          body: JSON.stringify({ context, content, is_stream: true }),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          }
        });
        console.log(response)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        // 返回一个异步生成器
        return {
          async *getStream() {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const messages = chunk
                .split('\n')
                .filter(line => line.startsWith('data: '))
                .map(line => line.slice(6)); // 移除 'data: ' 前缀

              for (const message of messages) {
                if (message.trim()) {
                  yield message;
                }
              }

            }
          }
        };
      } catch (error) {
        console.error('Error in sendMessage:', error);
        throw error;
      }
    },
    polish: async (context: string, content: string) => {
      const response = await request('/ai/polish', {
        method: 'POST',
        body: JSON.stringify({ context, content, is_stream: true }),
        headers: {
          'Content-Type': 'application/json',
          "Accept": "text/event-stream"
        }
      })
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      return {
        async *getStream() {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const messages = chunk
              .split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.slice(6)); // 移除 'data: ' 前缀

            for (const message of messages) {
              if (message.trim()) {
                yield message;
              }
            }

          }
        }
      }
    },

    rewrite: async (context: string, content: string) => {
      const response = await request('/ai/rewrite', {
        method: 'POST',
        body: JSON.stringify({ context, content, is_stream: true }),
        headers: {
          'Content-Type': 'application/json',
          "Accept": "text/event-stream"
        }
      })
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      return {
        async *getStream() {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const messages = chunk
              .split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.slice(6)); // 移除 'data: ' 前缀

            for (const message of messages) {
              if (message.trim()) {
                yield message;
              }
            }

          }
        }
      }
    },
    generateImageFromSpirate: async (prompt: string,name:string, spirate_id: string,user_id:string): Promise< ImageObject> => {  
      return request('/ai/generate_image_from_spirate', {
        method: 'POST',
        body: JSON.stringify({ prompt, name,spirate_id ,user_id}),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },

    generateImage: async (prompt: string): Promise< ImageObject> => {
      // 导入工具函数获取用户 ID
      
      const user = localStorage.getItem('user')
      const userId = JSON.parse(user || '{}').id;

      const response = await request('/ai/generate_images', {
        method: 'POST',
        body: JSON.stringify({ prompt, user_id: userId, size: "1280x960" }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response;
    },
    // 获取写作建议
    getSuggestions: async (content: string): Promise<string[]> => {
      return request('/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
  },

  chat: {
    // 获取用户最近的会话列表
    getRecentSessions: async (userId: number) => {
      return await request(`/chat/sessions/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    // 获取特定角色的聊天历史
    getChatHistory: async (sessionId: number) => {
      return await request(`/chat/history/${sessionId}`, {
        method: 'GET'
      });
    },

    // 清空特定角色的对话记录
    clearSession: async (sessionId: number) => {
      return await request(`/chat/session/${sessionId}/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },

    // 创建或获取会话
    getOrCreateSession: async (userId: number, characterId: number) => {
      return await request('/chat/session', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, character_id: characterId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },

    // 发送消息
    sendMessage: async (sessionId: number, message: string) => {
      try {
        const response = await request(`/chat/session/${sessionId}/message`, {
          method: 'POST',
          body: JSON.stringify({ content: message }),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          }
        });

        // 处理 SSE 数据流
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        // 返回一个异步生成器
        return {
          async *getMessages() {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const messages = chunk
                .split('\n')
                .filter(line => line.startsWith('data: '))
                .map(line => line.slice(6)); // 移除 'data: ' 前缀

              for (const message of messages) {
                if (message.trim()) {
                  yield message;
                }
              }

            }
          }
        };
      } catch (error) {
        console.error('Error in sendMessage:', error);
        throw error;
      }
    }
  },

  crazy: {
    get: async (id: string) => {
      return request(`/crazy/${id}`, {
        method: 'GET'
      })
    }
  },

  novels: {
    create: async (title: string, description: string): Promise<Novel> => {
      // 从localStorage获取用户信息
      const user = localStorage.getItem('user')
      const userId = JSON.parse(user || '{}').id;

      // 确保userId是字符串类型
      const userIdStr = userId ? userId.toString() : "";

      // 如果没有找到用户ID，抛出错误
      if (!userId) {
        throw new Error('创建小说User not authenticated');
      }

      // 打印确认发送的数据
      console.log("创建小说 - 发送数据:", {
        'title': title,
        'description': description,
        'user_id': userIdStr // 使用字符串类型
      });

      return request(`/novels/create`, {
        method: 'POST',
        body: JSON.stringify(
          {
            'title': title,
            'description': description,
            'user_id': userIdStr // 使用字符串类型
          }
        ),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },

    

    delete: async (id: string) => {
      return request(`/novels/${id}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    updateNovel: async (id: string, data: Partial<Novel>): Promise<Novel> => {
      return request(`/novels/${id}/updateNovel`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },

    createChapter: async (id: string, data: Partial<Chapter>): Promise<Chapter> => {
      return request(`/novels/${id}/chapters`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },

    updateChapter: async (id: string, order: number, data: Partial<Chapter>): Promise<Chapter> => {
      console.log("updateChapter", JSON.stringify(data));
      return request(`/novels/${id}/chapters/${order}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    getChapters: async (id: string): Promise<Chapter[]> => {
      return request(`/novels/${id}/chapters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    getNovel: async (id: string): Promise<Novel[]> => {
      return request(`/novels/${id}/novel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  },

  character: {
    update: async (id: string, data: Partial<Character>): Promise<Character> => {
      console.log("update", JSON.stringify(data));
      return request(`/character/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    getCharacters: async (user_id: number): Promise<Character[]> => {
      return request(`/character/${user_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  },

  task: {
    //创建任务
    create: async (data: CreateCrazyRequest | CreateInspirationRequest): Promise<SimpleTask> => {

      try {
        const response = await request('/task/new', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return response;
      } catch (error) {
        // 这里可以添加特定于任务创建的错误处理
        throw error;
      }
    },
    status: async (taskId: string): Promise<TaskResponse> => {
      try {
        const response = await request(`/task/status/${taskId}`);
        return response;
      } catch (error) {
        // 这里可以添加特定于状态查询的错误处理
        throw error;
      }
    },
    getByType: async (taskType: string, userId: number) => {
      try {
        const response = await request(`/task/get-by-type?task_type=${taskType}&user_id=${userId}`, {
          method: 'GET'
        });
      
        return response;
      } catch (error) {
        console.error('获取任务列表失败:', error);
        throw error;
      }
    }
  },

  // 设置认证相关函数
  setupAuth: () => {
    // 检查token是否存在
    const checkAuthToken = (): boolean => {
      const token = localStorage.getItem('token');
      return !!token;
    };

    // 检查token是否有效
    const isAuthenticated = (): boolean => {
      return checkAuthToken();
    };

    // 获取当前用户ID
    const getCurrentUserId = (): string | null => {
      return getUserIdFromToken();
    };

    return {
      checkAuthToken,
      isAuthenticated,
      getCurrentUserId
    };
  },

  // 用户相关API
  user: {
    updateVip: async (subscriptionType: string, durationMonths: number) => {
      const response = await request('/users/update_vip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription_type: subscriptionType,
          duration_months: durationMonths
        })
      });
      return response;
    },
    updateUser: async (profile: Partial<User>) => {
      return request('/users/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    }
  },

};
export default apiService; 