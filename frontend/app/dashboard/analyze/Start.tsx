import { Button } from "@/components/ui/button";
import Upload from "./upload";
import HistoryList from "@/app/dashboard/analyze/HistoryList";
import { History } from "lucide-react";

interface StartProps {
  onToggleView: () => void;
}

export default function Home({ onToggleView }: StartProps) {
  // 模拟检查是否有历史记录 - 实际应用中应从API获取
  const hasHistory = true; // 从后端获取历史数据的状态
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 relative">
      {/* 右上角历史按钮 */}
      <div className="absolute top-4 right-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleView}
          className="rounded-full hover:bg-white/20 transition-colors"
        >
          <History className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-12 pt-10">
        {/* 上传文件组件 */}
        <div className="mb-12">
          <Upload />
        </div>
        
        {/* 拆解历史 - 只在有历史记录时显示 */}
        {hasHistory && (
          <div className="mb-12">
            <h2 className="text-xl font-medium mb-6">拆解历史</h2>
            <HistoryList />
          </div>
        )}
        
        {/* 开始拆解按钮 */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="px-10 py-6 text-lg font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg transition-all duration-300"
          >
            开始拆解
          </Button>
        </div>
      </div>
    </main>
  );
}