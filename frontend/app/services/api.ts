"use client";

import { get } from 'http';
import { 
  ApiResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  Novel,
  // CreateNovelRequest,
  CreateTaskRequest,
  SimpleTask,
  TaskStatusResponse,
  TaskResponse,
  Character,
  Inspiration,
  ChatSessionRequest,
  Chapter,
  ImageObject,
  ContinueRequest,
  ContinueResponse,
  InspirationDetail
} from './types' ;
import { toast } from "sonner";  // 使用 sonner 来显示错误提示
import { create } from 'domain';
import { title } from 'process';
import { json } from 'stream/consumers';

// API 基础URL

// 定义错误响应的类型
interface ErrorResponse {
  message: string;
  status: number;
}

// 封装错误处理函数
const handleApiError = (error: any) => {
  // 获取错误信息
  const errorMessage = error.response?.data?.message || '请求失败，请稍后重试';
  
  // 显示错误提示
  toast.error(errorMessage, {
    position: 'top-center',
    duration: 3000,
  });

  // 抛出错误，让调用方可以继续处理
  throw error;
};

// 封装请求函数
export const request = async (url: string,  options: RequestInit = {
 
},base_url=process.env.NEXT_PUBLIC_ENDPOINT) => {
  try {
    const response = await fetch(base_url+url, options);
    
    // 检查响应状态
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw {
        response: {
          status: response.status,
          data: errorData
        }
      };
    }
    // / 关键修改: 检查是否是 SSE 请求
    if (options.headers && (options.headers as any)['Accept'] === 'text/event-stream') {
      return response; // 直接返回 response 对象,不要尝试 JSON 解析
    }
    

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
};

// API 服务对象
const apiService = {
  // 

  alipay:{
    creat:async(amount:string)=>{
      return await request('/alipay/create', {
        method: 'POST',
        body: JSON.stringify({
          amount:amount,
          description:"充值"
        }),
        headers:{
          'Content-Type': 'application/json'
        }
      });
    },
    checkOrder:async(orderInfo:any)=>{
      return await request('/alipay/check',{
        method:'post',
        body:JSON.stringify({
          "order_info":orderInfo
        }),
        headers:{
          'Content-Type':'application/json'
        }
      
      })
    }
  
  },
  
  // 认证相关 API
  auth: {
    // 登录
    
    login: async (data: LoginRequest): Promise<AuthResponse> => {
      console.log(JSON.stringify(data)+":登录");
      const response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers:{
          'Content-Type': 'application/json'
        }
      });
      
      // 如果登录成功，保存令牌和用户信息
      if (response.success && response.data) {
        const { token, user } = response.data;
        if (token) localStorage.setItem('authToken', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response;
    },
    
    // 注册
    register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
      const response = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        headers:{
          'Content-Type': 'application/json'
        }
      });
      
      // 如果注册成功，保存令牌和用户信息
      if (response.success && response.data) {
        const { token, user } = response.data;
        if (token) localStorage.setItem('authToken', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response;
    },
    
    // 退出登录
    logout: async (): Promise<ApiResponse<any>> => {
      // 调用后端登出接口（如果需要）
      const response = await request('/auth/logout', {
        method: 'POST',
      });
      
      // 无论成功与否，清除本地存储
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return response;
    },
    
    // 获取当前用户信息
    // getCurrentUser: async (): Promise<ApiResponse<User>> => {
    //   return fetchApi<User>('/auth/me');
    // }
  },

  utils:{
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

      console.log(JSON.stringify(response)+"下载图片并上传");
      return response.image_url;
    },
  },

  spirate: {

    continue: async (inspiration_id:string,choice:string): Promise<ContinueResponse> => {
      return request(`/spirate/continue/${inspiration_id}`, {
        method: 'POST',
        body: JSON.stringify({choice}),
        headers:{
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
    getStories: async (id:number,page:number,pageSize:number) => {
      console.log("getStories1");
      const response = await request(`/spirate/user/${id}?page=${page}&pageSize=${pageSize}`,{
        method:'GET',
        headers:{
          'Content-Type': 'application/json'
        }
      });
      return response;
    },
    update: async (data: Partial<InspirationDetail>): Promise<InspirationDetail> => {
      return request(`/spirate/update`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers:{
          'Content-Type': 'application/json'
        }
      });
    }
  },
  bookGeneration:{
    getAnalysisHistory:async()=>{
      return request(`/bookGeneration/get-analysis-history`,{
        method:'GET',
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },
  },
  // AI 生成相关 API
  ai: {
    
    // 拆解
    analyze:async(file_id:string)=>{
      return request(`/ai/analyze-file`,{
        method:'POST',
        body:JSON.stringify({file_id}),
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },

 
    getAnalysis:async(file_id:string)=>{
      return request(`/ai/get-analysis`,{
        method:'POST',
        body:JSON.stringify({file_id}),
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },
    // 生成小说内容
    generateContent: async (prompt: string): Promise<ApiResponse<string>> => {
      return request('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
    },

    // 流式AI扩写
    expandContent: async (context:string,content: string) => {
      try {
        const response = await request('/ai/expand', {
          method: 'POST',
          body: JSON.stringify({ context,content }),
          headers:{
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        }
      });

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
    }},
    polish:async(context:string,content:string)=>{
      const response = await request('/ai/polish',{
        method:'POST',
        body:JSON.stringify({context,content}),
        headers:{
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

    rewrite:async(context:string,content:string)=>{
      const response = await request('/ai/rewrite',{
        method:'POST',
        body:JSON.stringify({context,content}),
        headers:{
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

  
    generateImage: async (prompt: string): Promise<ImageObject> => {
      const response = await request('/ai/generate_images', {
        method: 'POST',
        body: JSON.stringify({ prompt,user_id:4 ,size:"1280x960"}),
        headers:{
          'Content-Type': 'application/json'
        }
      });

      return response;
    },
    // 获取写作建议
    getSuggestions: async (content: string): Promise<ApiResponse<string[]>> => {
      return request('/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
  },

  chat:{
    // 获取用户最近的会话列表
    getRecentSessions: async (userId: number) => {
      return await request(`/chat/sessions/${userId}`, {
        method: 'GET',
        headers:{
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
        headers:{
          'Content-Type': 'application/json'
        }
      });
    },

    // 创建或获取会话
    getOrCreateSession: async (userId: number, characterId: number) => {
      return await request('/chat/session', {
        method: 'POST',
        body: JSON.stringify({user_id:userId,character_id:characterId}),
        headers:{
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

  novels:{
    create:async(title:string,description:string):Promise<Novel>=>{
        return request(`/novels/create`,{
          method:'POST',
          body:JSON.stringify(
            {
              'title':title,
              'description':description,
              'user_id':'4'
            }
          ),
          headers:{
             'Content-Type': 'application/json'
          }
        })
    },

    delete:async(id:string)=>{
      return request(`/novels/${id}/delete`,{
        method:'POST',
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },
    updateNovel:async(id:string,data:Partial<Novel>):Promise<ApiResponse<Novel>>=>{
      return request(`/novels/${id}/updateNovel`,{
        method:'PUT',
        body:JSON.stringify(data),
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },

    createChapter:async(id:string,data:Partial<Chapter>):Promise<ApiResponse<Chapter>>=>{
      return request(`/novels/${id}/chapters`,{
        method:'POST',
        body:JSON.stringify(data),
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },

    updateChapter:async(id:string,order:number,data:Partial<Chapter>):Promise<ApiResponse<Chapter>>=>{
      console.log("updateChapter",JSON.stringify(data));
      return request(`/novels/${id}/chapters/${order}`,{
        method:'PUT',
        body:JSON.stringify(data),
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },
    getChapters:async(id:string):Promise<Chapter[]>=>{
      return request(`/novels/${id}/chapters`,{
        method:'GET',
        headers:{
          'Content-Type': 'application/json'
        }
      })
    },
    getNovel:async(id:string):Promise<Novel[]>=>{
      return request(`/novels/${id}/novel`,{
        method:'GET',
        headers:{
          'Content-Type': 'application/json'
        }
      })
    }
  },

  character:{
      update:async(id:number,data:Partial<Character>):Promise<Character>=>{
        console.log("update",JSON.stringify(data));
        return request(`/character/${id}`,{
          method:'PUT',
          body:JSON.stringify(data),
          headers:{
            'Content-Type': 'application/json'
          }
        })
      },
      getCharacters:async(user_id:number):Promise<Character[]>=>{
        return request(`/character/${user_id}`,{
          method:'GET',
          headers:{
            'Content-Type': 'application/json'
          }
        })
      }
  },

  task: {
    //创建任务
    create: async (data: CreateTaskRequest): Promise<ApiResponse<SimpleTask>> => {
      
      try {
        const response = await request('/task/new', {
          method: 'POST',
          body: JSON.stringify(data),
          headers:{
            'Content-Type': 'application/json'
          }
        });
        return response;
      } catch (error) {
        // 这里可以添加特定于任务创建的错误处理
        throw error;
      }
    },
    status: async (taskId: string): Promise<ApiResponse<TaskResponse>> => {
      try {
        const response = await request(`/task/status/${taskId}`);
        return response;
      } catch (error) {
        // 这里可以添加特定于状态查询的错误处理
        throw error;
      }
    }
  }
  
};

export default apiService; 