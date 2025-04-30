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
  avatar_url?: string;
  phone?: string;
  bio?: string;
  
}

// 认证相关类型
export interface LoginRequest {
  account: string;
  password: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  image_url: string;
  // session_id:string;
  prompt: string;
  is_used: boolean;
  user_id: string;
}

export interface RegisterRequest {
  account: string;
  email: string;
  password: string;
}

export interface CreateInspirationRequest {
  prompt: string;
  user_id: number;
  task_type: string;
  is_continue: boolean;
}

export interface CreateCrazyRequest {
  type: string;
  category: string;
  seeds: string[];
  chapter_count: number;
  task_type: string;
  user_id: number;
}

export interface TaskStatusRequest {
  task_id: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: string;
  completion_percentage: number;
}

export interface AuthResponse {
  access_token?: string;
  user?: User;
  type?: string;
}

// 小说相关类型


// 任务相关类型
export interface SimpleTask {
  task_id: string;
  message: string;
}

export interface Task {
  id: string;
  prompt: string;
  user_id: string;
  task_type: string;
  status: string;
  result_data: string;
  result_type: string;
  model_id: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface TaskResponse {
  task_id: string;
  status: string;
  completion_percentage: number;
  result: JSON;
  result_type: string;
  task_type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  result_id: string;
}


export interface Inspiration {
  id: string;
  title: string;
  prompt: string;
  characters: number[];
  user_id: string;
  content:string;
  story_direction: string[];
  created_at: string;
  updated_at: string;
  cover_image: string;
}

export interface InspirationDetail {
  id: string;
  title: string;
  prompt: string;
  characters: Character[];
  user_id: string;
  story_direction: string[];
  created_at: string;
  updated_at: string;
  user: User;
  cover_image: string;
  content: string;
}


export interface ContinueRequest {
  inspiration_id: string;
  choice: string;
}

export interface ContinueResponse {
  content: string;
  story_direction: string[];
  characters: Character[];
}





export interface Message {
  session_id: number;
  id: string;
  sender: string;
  sender_type: 'user' | 'character';
  content: string;
  created_at: string;
};

export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  character: Character;
  messages: Message[];
  user: User;
  last_message: string;
}

export interface Novel {
  id: string;
  user_id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  is_top: boolean;
  is_archive: boolean;
  updated_at: string;
  created_at: string;
}


export interface Chapter {
  id: string
  book_id: string
  order: number
  summary: string
  title: string
  content: string
  prompt: string
}

export interface ImageObject {
  image: string;
  id: string;
  created_at: string;
  updated_at: string;
  timings: number[];
  seed: number;
}

export interface ChatSessionRequest {
  user_id: string;
  character_id: string;
}

