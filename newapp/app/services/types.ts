// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 用户相关类型
export interface User {
  id: string;
  account: string;
  email: string;
  avatar?: string;
}

// 认证相关类型
export interface LoginRequest {
  account: string;
  password: string;
}

export interface Character{
  id:string;
  name:string;
  description:string;
  image_url:string;
  session_id:string;
}

export interface RegisterRequest {
  account: string;
  email: string;
  password: string;
}

export interface CreateTaskRequest{
  prompt:string;
  user_id:number;
  task_type:string;
  is_continue:boolean;
}

export interface TaskStatusRequest{
  task_id:string;
}

export interface TaskStatusResponse{
  task_id:string;
  status:string;
  completion_percentage:number;
}

export interface AuthResponse {
  token?: string;
  user?: User;
}

// 小说相关类型
export interface Novel {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// 任务相关类型
export interface SimpleTask{
  task_id:string;
  message:string;
}

export interface Task {
  id:string;
  prompt:string;
  user_id:string;
  task_type:string;
  status:string;
  result_data:string;
  result_type:string;
  model_id:string;
  completion_percentage:number;
  created_at:string;
  updated_at:string;
}

export interface TaskResponse{
  task_id:string;
  status:string;
  completion_percentage:number;
  result:JSON;
  result_type:string;
  task_type:string;
  user_id:string;
  created_at:string;
  updated_at:string;
  result_id:string;
}


export interface Inspiration{
  id:string;
  title:string;
  prompt:string;
  characters:number[];
  user_id:string;
  story_direction:string[];
  created_at:string;
  updated_at:string;
  cover_image:string;
}

export interface InspirationDetail{
  id:string;
  title:string;
  prompt:string;
  characters:Character[];
  user_id:string;
  story_direction:string[];
  created_at:string;
  updated_at:string;
  user:User;
  cover_image:string;
  content:string;
}

export interface Message {
  session_id:string;
  id: string;
  sender: string;
  sender_type: 'user' | 'character';
  content: string;
  created_at: string;
};

export interface Session{
  id:string;
  character_id:string;
  user_id:string;
  created_at:string;
  updated_at:string;
  character:Character;
  messages:Message[];
  user:User;
}

export interface ChatSessionRequest{
  user_id:string;
  character_id:string;
}

