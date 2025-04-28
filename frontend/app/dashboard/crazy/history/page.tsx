'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import apiService from '@/app/services/api';
import { Task } from '@/app/services/types';

// 添加API方法获取暴走模式任务列表
// 这个方法需要在 app/services/api.ts 中添加



export default function CrazyHistoryPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // 处理任务状态的颜色和标签
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500', label: '等待中' };
      case 'processing':
        return { color: 'bg-blue-500', label: '处理中' };
      case 'completed':
        return { color: 'bg-green-500', label: '已完成' };
      case 'failed':
        return { color: 'bg-red-500', label: '失败' };
      default:
        return { color: 'bg-gray-500', label: '未知' };
    }
  };
  
  // 加载任务列表
  const loadTasks = async () => {
    try {
      const response = await apiService.task.getByType('CRAZY_WALK', 7);
      if (response) {
        setTasks(response);
      }
    } catch (error) {
      toast.error('获取任务列表失败，请稍后重试')

    } finally {
      setIsLoading(false);
    }
  };
  
  // 刷新单个任务状态
  const refreshTaskStatus = async (taskId: string) => {
    try {
      const response = await apiService.task.status(taskId);
      if (response) {
        // 更新任务状态
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === taskId 
            ? {
                ...task, 
                status: response.status,
                completion_percentage: response.completion_percentage
              } 
            : task
        ));
        // 如果任务已完成，显示提示
        if (response.status === 'completed' && !tasks.find(t => t.id === taskId)?.status?.includes('completed')) {
          toast.success(`任务 ${taskId.slice(0, 8)}... 已完成！`);
        }
      }
    } catch (error) {
      console.error(`更新任务 ${taskId} 状态失败:`, error);
    }
  };
  
  // 定期刷新所有进行中的任务
  const startAutoRefresh = () => {
    // 清除之前的定时器
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // 设置10秒刷新一次的定时器
    const interval = setInterval(() => {
      const processingTasks = tasks.filter(task => 
        task.status === 'pending' || task.status === 'processing'
      );
      
      if (processingTasks.length > 0) {
        processingTasks.forEach(task => refreshTaskStatus(task.id));
      } else {
        // 如果没有进行中的任务，停止自动刷新
        clearInterval(interval);
        setRefreshInterval(null);
      }
    }, 10000); // 10秒刷新一次
    
    setRefreshInterval(interval);
  };
  
  // 手动刷新所有任务
  const handleRefresh = async () => {
    setIsLoading(true);
    await loadTasks();
    toast.success('已刷新任务列表');
    
    // 重新启动自动刷新
    startAutoRefresh();
  };
  
  // 查看任务结果
  const viewTaskResult = (task: Task) => {
    if (task.status !== 'completed') {
      toast.warning('任务尚未完成，无法查看结果');
      return;
    }
    
    // 跳转到结果页面，根据实际情况调整路径
    router.push(`/dashboard/crazy/history/${task.id}`);
  };
  
  // 初始加载和自动刷新设置
  useEffect(() => {
    loadTasks();
    
    return () => {
      // 组件卸载时清除定时器
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);
  
  // 在任务列表更新后，如果有进行中的任务，启动自动刷新
  useEffect(() => {
    if (tasks.some(task => task.status === 'pending' || task.status === 'processing')) {
      startAutoRefresh();
    }
  }, [tasks]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container   mx-auto p-4">
        <div className="flex justify-between hover:cursor-pointer items-center mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2"
            onClick={() => router.push('/dashboard/crazy')}
          >
            <ArrowLeft size={16} />
            返回暴走模式
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            刷新
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#e7000b] to-[#155dfc] text-transparent bg-clip-text">
          暴走模式历史记录
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg border-gray-700">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无历史记录</h3>
            <p className="text-muted-foreground mb-4">
              您还没有创建过暴走模式的任务
            </p>
            <Button onClick={() => router.push('/dashboard/crazy')}>
              开始创作
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const { color, label } = getStatusInfo(task.status);
              return (
                <div 
                  key={task.id}
                  className="border border-gray-700 rounded-lg p-4 hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        任务 ID: {task.id}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        创建时间: {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${color} text-white`}>
                      {label}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">进度</span>
                      <span className="text-xs font-medium">
                        {task.completion_percentage}%
                      </span>
                    </div>
                    <Progress value={task.completion_percentage} className="h-2" />
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshTaskStatus(task.id)}
                      disabled={task.status === 'completed'}
                    >
                      更新状态
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => viewTaskResult(task)}
                      disabled={task.status !== 'completed'}
                    >
                      查看结果
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
