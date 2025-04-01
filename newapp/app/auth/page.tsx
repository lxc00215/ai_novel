"use client";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { FaBook, FaLock, FaUser, FaEnvelope } from 'react-icons/fa';
import { FaWeixin, FaQq } from 'react-icons/fa';
import { SiSinaweibo } from 'react-icons/si';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import apiService from '../services/api';

interface PasswordStrength {
  value: number;
  label: string;
}

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ value: 0, label: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const router = useRouter();
  const [error, setError] = useState("");

  // 密码强度检查函数
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ value: 0, label: "" });
      return;
    }

    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) strength += 25;
    
    // 包含数字
    if (/\d/.test(password)) strength += 25;
    
    // 包含小写字母
    if (/[a-z]/.test(password)) strength += 25;
    
    // 包含大写字母或特殊字符
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    
    let label = "";
    if (strength <= 25) label = "弱";
    else if (strength <= 75) label = "中";
    else label = "强";
    
    setPasswordStrength({ value: strength, label });
  };

  // 用户名可用性检查（模拟）
  const checkUsernameAvailability = (username: string) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }
    
    // 这里应该是一个API调用，现在只是模拟
    setTimeout(() => {
      setUsernameAvailable(!['admin', 'test', 'user'].includes(username));
    }, 500);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    checkPasswordStrength(e.target.value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    checkUsernameAvailability(e.target.value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await apiService.auth.login({
        account:username,
        password
      });
      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message || '登录失败，请检查您的用户名和密码');
      }
    } catch (error) {
      setError('登录时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await apiService.auth.register({
        account: username,
        email,
        password
      });
      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message || '注册失败，请检查您的信息');
      }
    } catch (error) {
      setError('注册时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    // 弹窗提示
    alert('暂未开放');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* 左侧创意展示区 */}
      <div className="w-full md:w-3/5 bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8 flex flex-col justify-center relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-bold mb-6">开启你的AI创作之旅</h1>
          <p className="text-xl mb-4">用AI释放你的创作潜能</p>
          <p className="text-lg mb-8">加入10,000+作家的智能创作社区</p>
          
          {/* 创意元素：AI生成的小说片段 */}
          <div className="backdrop-blur-sm bg-white/10 rounded-lg p-6 mb-8 max-w-md">
            <h3 className="text-lg font-semibold mb-2">AI创作样例:</h3>
            <p className="italic text-sm">
              "山雨欲来风满楼，她凝视着窗外翻涌的乌云，指尖在键盘上轻轻敲击。人工智能提供的情节建议在屏幕上流淌，她微笑着接受了其中一个转折点。这个由算法与人类灵感共同孕育的故事，正在以前所未有的方式展开..."
            </p>
          </div>
          
          {/* 用户评价 */}
          <div className="mt-auto">
            <div className="flex items-center space-x-4">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="用户头像" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">"AI助手帮我突破了创作瓶颈，三个月内完成了我的第一部长篇小说！"</p>
                <p className="text-sm opacity-75">- 陈晓，科幻小说作家</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <img src="https://images.unsplash.com/photo-1519682577862-22b62b24e493?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="背景" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-5 right-5 text-sm opacity-70">
          <p>已有12,463位创作者加入</p>
        </div>
      </div>
      
      {/* 右侧表单区 */}
      <div className="w-full md:w-2/5 bg-gray-50 p-8 flex flex-col justify-center items-center">
        <Link href="/">
          <div className="mb-6 flex items-center">
            <img src="https://via.placeholder.com/40x40" alt="Logo" className="h-10 w-10 mr-2" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">创作空间</span>
          </div>
        </Link>
        
        <Card className="w-full max-w-md p-6 shadow-lg border-t-4 border-purple-700 bg-white bg-opacity-60 backdrop-filter backdrop-blur-sm">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>
            
            {/* 登录表单 */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">欢迎回到创作空间</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="flex items-center">
                    <FaUser className="mr-2 text-purple-700" size={14} />
                    用户名/邮箱
                  </Label>
                  <Input 
                    id="login-username" 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入您的用户名或邮箱" 
                    className="focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center">
                    <FaLock className="mr-2 text-purple-700" size={14} />
                    密码
                  </Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入您的密码" 
                    className="focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe} 
                      onCheckedChange={(value) => setRememberMe(!!value)} 
                    />
                    <Label htmlFor="remember-me" className="ml-2 text-sm">记住我</Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-purple-700 hover:underline">
                    忘记密码?
                  </Link>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-800 to-purple-800 hover:shadow-lg transition-all"
                >
                  登录
                </Button>
                
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute border-t border-gray-300 w-full"></div>
                  <span className="relative px-2 bg-white text-sm text-gray-500">或使用社交媒体账号</span>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button type="button" className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                   onClick={handleGuestAccess}>
                    <FaWeixin size={20} />
                  </button>
                  <button type="button" className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600" onClick={handleGuestAccess}>
                    <FaQq size={20} />
                  </button>
                  <button type="button" className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600" onClick={handleGuestAccess}>
                    <SiSinaweibo size={20} />
                  </button>
                </div>
              </form>
              
              
            </TabsContent>
            
            {/* 注册表单 */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">加入AI创作新时代</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="flex items-center">
                    <FaUser className="mr-2 text-purple-700" size={14} />
                    用户名
                  </Label>
                  <div className="relative">
                    <Input 
                      id="register-username" 
                      type="text" 
                      placeholder="创建一个独特的作家身份" 
                      value={username}
                      onChange={handleUsernameChange}
                      className="focus:ring-2 focus:ring-purple-500 transition-all pr-10"
                      required
                    />
                    {usernameAvailable !== null && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {usernameAvailable ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </div>
                    )}
                  </div>
                  {username && usernameAvailable === false && (
                    <p className="text-xs text-red-500 mt-1">该用户名已被使用</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center">
                    <FaEnvelope className="mr-2 text-purple-700" size={14} />
                    邮箱
                  </Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="用于账号激活和密码找回" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="flex items-center">
                    <FaLock className="mr-2 text-purple-700" size={14} />
                    密码
                  </Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="至少8个字符，包含字母和数字" 
                    value={password}
                    onChange={handlePasswordChange}
                    className="focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                  />
                  {password && (
                    <>
                      <Progress value={passwordStrength.value} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span>密码强度:</span>
                        <span className={
                          passwordStrength.label === "弱" ? "text-red-500" : 
                          passwordStrength.label === "中" ? "text-yellow-500" : 
                          "text-green-500"
                        }>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="flex items-center">
                    <FaLock className="mr-2 text-purple-700" size={14} />
                    确认密码
                  </Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="再次输入您的密码" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">两次输入的密码不一致</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-xs">
                    注册即表示您同意我们的
                    <Link href="/terms" className="text-purple-700 hover:underline">服务条款</Link>
                    和
                    <Link href="/privacy" className="text-purple-700 hover:underline">隐私政策</Link>
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-800 to-purple-800 hover:shadow-lg transition-all"
                  disabled={!username || !email || !password || password !== confirmPassword || !usernameAvailable}
                >
                  开始创作
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  已有账号? 
                  <button 
                    onClick={() => setActiveTab("login")}
                    className="ml-1 text-purple-700 hover:underline font-medium"
                  >
                    立即登录
                  </button>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        
        {/* 额外选项 */}
        <div className="mt-6 flex flex-col items-center space-y-4">
          
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>您的数据安全受到保护</span>
          </div>
          
          <Button 
            variant="link" 
            className="text-xs text-gray-500"
            onClick={() => document.getElementById('why-register')?.classList.toggle('hidden')}
          >
            为什么需要注册?
          </Button>
          
          <div id="why-register" className="hidden bg-gray-100 p-3 rounded-lg text-xs text-gray-700 max-w-xs">
            <ul className="list-disc list-inside space-y-1">
              <li>保存您的所有创作内容</li>
              <li>使用高级AI创作功能</li>
              <li>加入创作者社区</li>
              <li>接收个性化写作建议</li>
              <li>参与专属创作活动</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AuthPage;