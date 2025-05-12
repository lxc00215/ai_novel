import { cookies } from 'next/dist/server/request/cookies';
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


// API 基础URL

// 定义错误响应的类型
interface ErrorResponse {
  message: string;
  status: number;
}

// 修改请求基地址配置
const BASE_URL = process.env.NEXT_PUBLIC_ENDPOINT || 'http://localhost:8000'; // 确保这里配置正确

// JWT工具函数 - 从token中解析用户ID
export const getToken = async (): Promise<string | null> => {
  if (typeof window !== 'undefined') {
    // 客户端环境
    const cookieString = document.cookie;
    return cookieString
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1] || null;
  } else {
    // 服务端环境
    try {
      const cookieStore = await cookies();
      return cookieStore.has('token') ? cookieStore.get('token')?.value ?? null : null;
    } catch (e) {
      console.warn('无法读取 cookie，可能是 SSR 上下文缺失');
      return null;
    }
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


  // 抛出错误，让调用方可以继续处理
  throw error;
};

// 封装请求函数
export const request = async (url: string, is_auth: boolean, options: RequestInit = {}) => {
  try {
    // 获取认证令牌并添加到请求头

    // 是否需要添加token
    const token = await getToken();

    // 创建一个新的options对象，合并现有headers
    const newOptions = {
      ...options,
      headers: {
        ...options.headers,
        // 如果有token，添加Authorization header
      }
    };

    if (is_auth) {
      // 如果需要认证，添加token
      newOptions.headers = {
        ...newOptions.headers,
        'Authorization': 'Bearer ' + token
      };
    }
    const response = await fetch(`${BASE_URL}${url}`, newOptions);
    // 检查响应状态
    console.log(JSON.stringify(response))
    if (!response.ok) {
      // 处理401错误(token无效或过期)
      if (response.status === 401) {
        // 清除token并重定向到登录页
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
      const response = await request('/alipay/create', true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: "订阅会员服务"
        })
      });
      return response;
    },
    checkOrder: async (orderInfo: string) => {
      const response = await request('/alipay/check', true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    checkUsernameAvailability: async (username: string): Promise<{ success: boolean }> => {
      const response = await request(`/auth/check_username_available/${username}`, false, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },

    // 检查邮箱是否可用
    checkEmailAvailability: async (email: string): Promise<{ success: boolean }> => {
      const response = await request(`/auth/check_email_available/${email}`, false, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    },



    // 登录
    login: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await request('/auth/login', false, {
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
      const response = await request('/auth/register', false, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });


      return response;
    },

    // 退出登录
    logout: async (): Promise<any> => {
      // 调用后端登出接口（如果需要）
      const response = await request('/auth/logout', true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      // 清除cookie


      return response;
    },
  },

  utils: {
    /**
     * 上传图片到服务器
     * @param data FormData对象，包含要上传的文件
     * @param authCode 可选的授权码
     * @returns 上传成功后返回的图片URL
     */
    downloadImageAndUpload: async (image_url: string): Promise<string> => {
      const response = await request(`/utils/download_image_and_upload?image_url=${image_url}`, true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });



      console.log(JSON.stringify(response) + "下载图片并上传");
      return response.image_url;
    },

    uploadImage: async (file: File): Promise<{ success: boolean, data: { url: string } }> => {
      // 创建FormData对象，用于文件上传
      const formData = new FormData();
      formData.append('file', file);

      const response = await request(`/utils/upload-image`, true, {
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
      return request(`/spirate/continue/${inspiration_id}`, true, {
        method: 'POST',
        body: JSON.stringify({ choice }),
        headers: {
          'Content-Type': 'application/json',

        }
      });
    },
    get: async (id: string) => {
      console.log('Calling API with ID:', id); // 添加日志
      try {
        const response = await request(`/spirate/getOne/${id}`, true, {

        });
        return response;
      } catch (error) {
        console.error('API error:', error);
        return { success: false, data: null };
      }
    },
    getStories: async (page: number, pageSize: number) => {
      console.log("getStories1");
      const response = await request(`/spirate/getMy?page=${page}&pageSize=${pageSize}`, true, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',

        }
      });
      return response;
    },
    update: async (data: Partial<Inspiration>): Promise<Inspiration> => {
      return request(`/spirate/update`, true, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',

        }
      });
    }
  },


  analysis: {
    // 拆书相关api

    // 获取该角色的全部拆书历史
    get_history: async () => {
      return request(`/analysis/get-analysis-history`, true, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',

        }
      })
    },
    get_detail: async (breakdown_id: number) => {
      return request(`/analysis/` + breakdown_id, true, {
        method: 'GET'
      })
    },
  },
  // AI 生成相关 API
  ai: {
    // 拆解
    analyze: async (file_id: string) => {
      return request(`/ai/analyze-file`, true, {
        method: 'POST',
        body: JSON.stringify({ file_id }),
        headers: {
          'Content-Type': 'application/json',

        }
      })
    },
    getAnalysis: async (file_id: string) => {
      return request(`/ai/get-analysis`, true, {
        method: 'POST',
        body: JSON.stringify({ file_id }),
        headers: {
          'Content-Type': 'application/json',

        }
      })
    },
    // 生成小说内容
    generateContent: async (
      storyBackground: string,
      writingStyle: string,
      requirements: string,
      options = {}
    ) => {
      const response = await request(`/ai/generate_content`, true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyBackground,
          writingStyle,
          requirements,
          ...options // 包含所有额外选项
        })
      });


      return response
    },

    // 流式AI扩写
    expandContent: async (context: string, content: string) => {
      try {
        const response = await request('/ai/expand', true, {
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
              console.log(chunk);

              const messages = chunk
                .split('\n\n')
                .map(line => line.startsWith('data: ') ? line.slice(6) : line);


              // 移除 'data: ' 前缀

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
      const response = await request('/ai/polish', true, {
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
              .split('\n\n')
              .map(line => line.startsWith('data: ') ? line.slice(6) : line);

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
      const response = await request('/ai/rewrite', true, {
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
              .split('\n\n')
              .map(line => line.startsWith('data: ') ? line.slice(6) : line);

            for (const message of messages) {
              if (message.trim()) {
                yield message;
              }
            }
          }
        }
      }
    },
    generateImageFromSpirate: async (prompt: string, name: string, book_id: string, user_id: string): Promise<ImageObject> => {
      return request('/ai/generate_image_from_spirate', true, {
        method: 'POST',
        body: JSON.stringify({ prompt, name, book_id, user_id }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },

    generateImage: async (prompt: string): Promise<ImageObject> => {
      // 导入工具函数获取用户 ID


      const response = await request('/ai/generate_images', true, {
        method: 'POST',
        body: JSON.stringify({ prompt, size: "1280x960" }),
        headers: {
          'Content-Type': 'application/json',

        }
      });

      return response;
    },
    // 获取写作建议
    getSuggestions: async (content: string): Promise<string[]> => {
      return request('/ai/suggestions', true, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
  },

  chat: {
    // 获取用户最近的会话列表
    getRecentSessions: async () => {
      return await request(`/chat/sessions`, true, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',

        }
      });
    },
    // 获取特定角色的聊天历史
    getChatHistory: async (sessionId: number) => {
      return await request(`/chat/history/${sessionId}`, true, {
        method: 'GET'
      });
    },

    // 清空特定角色的对话记录
    clearSession: async (sessionId: number) => {
      return await request(`/chat/session/${sessionId}/clear`, true, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },

    // 创建或获取会话
    // getOrCreateSession: async (userId: number, characterId: number) => {
    //   return await request('/chat/session', {
    //     method: 'POST',
    //     body: JSON.stringify({ user_id: userId, character_id: characterId }),
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   });
    // },

    getOrCreateSession: async (userId: number, characterId: number) => {
      try {
        return await request('/chat/session', true, {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, character_id: characterId }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error in getOrCreateSession:', error);
        throw error;
      }
    },

    // 发送消息
    sendMessage: async (sessionId: number, message: string) => {
      try {
        const response = await request(`/chat/session/${sessionId}/message`, false, {
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
    get: async (task_id: string) => {
      const response = await request(`/crazy/${task_id}`, false, {
        method: 'GET'
      })
      return response;
    }
  },

  novels: {
    create: async (title: string, description: string): Promise<Novel> => {


      return request(`/novels/create`, false, {
        method: 'POST',
        body: JSON.stringify(
          {
            'title': title,
            'description': description,
          }
        ),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    delete: async (id: string) => {
      return request(`/novels/${id}/delete`, false, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    updateNovel: async (id: string, data: Partial<Novel>): Promise<Novel> => {
      return request(`/novels/${id}/updateNovel`, false, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },

    createChapter: async (id: string, data: Partial<Chapter>): Promise<Chapter> => {
      return request(`/novels/${id}/chapters`, false, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },

    updateChapter: async (id: string, order: number, data: Partial<Chapter>): Promise<Chapter> => {
      console.log("updateChapter", JSON.stringify(data));
      return request(`/novels/${id}/chapters/${order}`, false, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    getChapters: async (id: string): Promise<Chapter[]> => {
      return request(`/novels/${id}/chapters`, false, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    getNovel: async (): Promise<Novel[]> => {
      return request(`/novels/getMy`, true, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }
  },

  character: {
    update: async (id: string, data: Partial<Character>): Promise<Character> => {
      console.log("update", JSON.stringify(data));
      return request(`/character/${id}`, false, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    },
    getCharacters: async (): Promise<Character[]> => {
      return request(`/character/getMy`, true, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }
  },

  task: {
    //创建任务
    create: async (data: CreateCrazyRequest | CreateInspirationRequest): Promise<SimpleTask> => {

      try {
        const response = await request('/task/new', false, {
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
        const response = await request(`/task/status/${taskId}`, false);
        return response;
      } catch (error) {
        // 这里可以添加特定于状态查询的错误处理
        throw error;
      }
    },
    getByType: async (taskType: string, userId: number) => {
      try {
        const response = await request(`/task/get-by-type?task_type=${taskType}&user_id=${userId}`, false, {
          method: 'GET'
        });

        return response;
      } catch (error) {
        console.error('获取任务列表失败:', error);
        throw error;
      }
    }
  },


  // 用户相关API
  user: {
    updateVip: async (subscriptionType: string, durationMonths: number) => {
      const response = await request('/users/update_vip', false, {
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
      return request('/users/profile', true, {
        method: 'POST',
        body: JSON.stringify(profile),
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }
  },

};
export default apiService; 