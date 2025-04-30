import { Button } from "@/components/ui/button";
import Upload from "./upload";
import HistoryList from "@/app/dashboard/analyze/HistoryList";
import { BookAIcon, BookImageIcon, BookOpen, History } from "lucide-react";
import { useEffect, useState } from "react";
import apiService from "@/app/services/api";

interface StartProps {
  onToggleView: () => void;
}

export default function Home({ onToggleView }: StartProps) {
  // 模拟检查是否有历史记录 - 实际应用中应从API获取
  const hasHistory = true; // 从后端获取历史数据的状态


  const [historyItems,setHistoryItems] = useState<any[]>([])
  
  // 用于处理上传结果
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [file_id, setFileId] = useState<string | null>(null);
  // 处理上传文件后的回调
  const handleUploadComplete = (result: any) => {
    // 确保不直接渲染对象
    setUploadResult(result);
    if(result.file_id){
      setFileId(result.file_id)
    }
    console.log(file_id+"aaa")
    console.log("Upload complete:", result);
  };


  useEffect(()=> {
    // 获取历史记录
    const getHistory = async ()=>{
      const response = await apiService.bookGeneration.getAnalysisHistory()
      console.log(response+"历史记录")
      setHistoryItems(response)
    }
    getHistory()
  },[file_id])


  const handleAnalyze = async () => {
    if(file_id){
     const response = await apiService.ai.analyze(file_id)
     const analysis = response.analysis

     console.log(analysis+"分析结果")

    }
  }
  
  return (
    <main className=" bg-background p-6 relative">
      <div className="flex items-center p">
       
       <h1 className="mx-auto">
       </h1>
       
         <Button 
           variant="ghost" 
           size="icon" 
           className="text-foreground"
             onClick={onToggleView}
         >
           <BookOpen size={20} />
         </Button>
      
     </div>
      
      <div className="max-w-4xl mx-auto space-y-12 pt-10">
        {/* 上传文件组件 */}
        <div className="mb-12">
          <Upload onUploadComplete={handleUploadComplete} />
        </div>
        
        {/* 显示上传结果 - 确保正确处理对象 */}
        {uploadResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-medium text-green-700">上传成功</h3>
            {uploadResult.title && <p className="mt-2">标题: {uploadResult.title}</p>}
            {uploadResult.description && <p>描述: {uploadResult.description}</p>}
          </div>
        )}
        
        {/* 拆解历史 - 只在有历史记录时显示 */}
        {hasHistory && (
          <div className="mb-12">
            <h2 className="text-xl font-medium mb-6">拆解历史</h2>
            <HistoryList historyItems={historyItems} />
          </div>
        )}
        
        {/* 开始拆解按钮 */}
        <div className="flex justify-center">
          <Button 
            onClick={handleAnalyze}
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

