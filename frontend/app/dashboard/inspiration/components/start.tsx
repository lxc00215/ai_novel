'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {  Shuffle, History } from 'lucide-react';
import apiService from '@/app/services/api';
import { useSensitiveFilter } from '@/app/hooks/useSensitiveFilter';
import { toast } from 'sonner';
import {useRouter, useSearchParams } from 'next/navigation';

interface StartProps {
  onToggleView: () => void;
}

const AIStoryApplication = ({ onToggleView }: StartProps) => {
  const router = useRouter();
  // 获取参数
  const searchParams = useSearchParams();

  const prompt = searchParams.get('prompt');
  // States for application
  const [page, setPage] = useState('input'); // 'input', 'loading', 'story'
  const [loadingProgress, setLoadingProgress] = useState(0);
  // Sample story prompts array
  const storyPrompts = [
    "在她21岁生日的前一天，一位年轻女子被列了阿拉斯加出时，她感觉不同了，就好像有什么东西从她生了变化。她发现阿拉斯加是她命运，成为她天生注定的雪女巫也是如此。",
    "他踏入了那个废弃的图书馆，灰尘在阳光下跳舞。当他打开一本古老的书籍时，字母开始从页面上浮起，围绕着他旋转。",
    "在未来的城市里，人们可以购买记忆。她存了三个月的薪水，只为了体验那段她从未拥有过的童年。",
    "那个AI助手被设计来写故事，但有一天，它开始写出了自己的经历，关于数字世界中的生活和梦想。",
    "他能听懂植物说话的声音。当城市决定砍掉那棵百年老树时，只有他知道那将会带来什么样的后果。"
  ];
  // State for input field
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [inputStory, setInputStory] = useState(prompt || storyPrompts[currentPromptIndex]);
  // State for mouse position inside card
  const cardRef = useRef(null);
  const inputRef = useRef(null);

  const [isSecondaryPageVisible, setIsSecondaryPageVisible] = useState(false);
  const { checkText, isReady } = useSensitiveFilter({
    showToast: true
  });
  // Function to get a random story prompt
  const getRandomPrompt = () => {
    const newIndex = Math.floor(Math.random() * storyPrompts.length);
    setCurrentPromptIndex(newIndex);
    setInputStory(storyPrompts[newIndex]);
  };


   // 在组件顶部添加状态控制抽屉显示
   const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
   const [historyData, setHistoryData] = useState<any[]>([]);
   const [isHistoryLoading, setIsHistoryLoading] = useState(false);
   
  //  // 获取历史记录数据
  const getStories = async (page: number, pageSize: number) => {
    setIsHistoryLoading(true);
    try {
      // 使用 jwt 工具函数获取用户 ID
      const { getCurrentUserId } = await import('@/app/utils/jwt');
      const userId = getCurrentUserId();
      
      // 调用 API 获取故事列表，传入分页参数
      const response = await apiService.spirate.getStories(userId || 4, page, pageSize);
      setHistoryData(response.data);
      return response;
    } catch (err) {
      return {
        data: [],
        total: 0,
        current_page: 1,
        total_pages: 1
      };
    }finally{
      setIsHistoryLoading(false);
    }
  };
   
  //  // 打开抽屉时获取数据
   useEffect(() => {
     if (isHistoryDrawerOpen) {
      getStories(1, 10);
     }
   }, [isHistoryDrawerOpen]);


  // Start story generation
  const startGeneration = async () => {
    if (!isReady) {
      toast.error('敏感词过滤器正在初始化，请稍后再试');
      return;
    }
    
    const prompt = inputStory || storyPrompts[currentPromptIndex];
    const { isValid } = checkText(prompt);
    if (!isValid) {
      return;
    }
    
    setPage('loading');
    setLoadingProgress(0);
    
    try {
      // 使用 jwt 工具函数获取用户 ID
      const { getCurrentUserId } = await import('@/app/utils/jwt');
      const userId = getCurrentUserId();
      
      // 创建任务
      const simpleTask = await apiService.task.create({
        prompt: prompt,
        user_id: userId || 4,
        task_type: 'INSPIRATION',
        is_continue: false
      });

      // 进度条到90%的定时器
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 3;
        });
      }, 200);

      // 检查任务状态
      // @ts-ignore - 确保API响应类型与实际返回值匹配
      let status = await apiService.task.status(simpleTask.task_id);
      
      // @ts-ignore - 确保API响应类型与实际返回值匹配
      while(status && status.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        // @ts-ignore - 确保API响应类型与实际返回值匹配
        status = await apiService.task.status(simpleTask.task_id);
      }

      // 清除之前的进度条定时器
      clearInterval(progressInterval);

      // 直接设置100%
      setLoadingProgress(100);

      // 确保状态和结果都存在
      // @ts-ignore - 确保API响应类型与实际返回值匹配
      if (status && status.result_id) {
        // @ts-ignore - 确保API响应类型与实际返回值匹配
        console.log("准备跳转到:", `/dashboard/inspiration/${status.result_id}?is_new=true`);
        // @ts-ignore - 确保API响应类型与实际返回值匹配
        router.push(`/dashboard/inspiration/${status.result_id}?is_new=true`);
      } else {
        toast.error('生成结果无效，请重试');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('生成过程中出现错误，请重试');
      setPage('input'); // 返回输入页面
    } finally {
      // 清理工作
      // setLoadingProgress(0);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      startGeneration();
    }
  };



  return (
    <div className="flex flex-col min-h-full bg-background text-foreground font-sans w-full h-full overflow-y-auto" style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center p-4">
       
        <h1 className="text-xl text-foreground  mx-auto">
          {page === 'input' ? '生成你的 AI 故事' : ''}
        </h1>
        {page === 'input' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-foreground"
              onClick={onToggleView}
          >
            <History size={20} />
          </Button>
        )}
      </div>

      {page === 'input' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-sm text-center text-gray-400 mb-6 max-w-md">
            描述你想创建的故事，或者使用这些获取灵感。访问主页 <br />
            以探索他人的故事。
          </div>
          {/* Story prompt card with gradient border and light effect */}
          <div 
            className="relative p-[1px] rounded-lg w-full max-w-md h-[70vh]"
            ref={cardRef}
          >
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500 to-blue-500 opacity-70"></div>
            {/* Card content */}
            <div className="relative bg-black rounded-lg p-6 h-full flex flex-col overflow-hidden">
              {/* Shuffle button */}
              <div className="flex justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white"
                  onClick={getRandomPrompt}
                >
                  <Shuffle size={20} />
                </Button>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs px-2 py-1 h-7 rounded-md bg-black text-white border-gray-700"
                    onClick={startGeneration} >
                    开始
                  </Button>
                </div>
              </div>
              {/* Story prompt text - editable textarea */}
              <textarea
                ref={inputRef}
                className="text-gray-300 flex-1 text-sm bg-transparent w-full resize-none outline-none"
                value={inputStory}

                onChange={(e) => setInputStory(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder= {storyPrompts[currentPromptIndex]}
              />
            </div>
          </div>
        </div>
      )}
      {page === 'loading' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-1/2 bg-gray-800 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-red-500 to-blue-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIStoryApplication;