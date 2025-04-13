"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateWorkCard() {
  return (
    <Card 
      className="border border-dashed bg-gray-50 hover:bg-gray-100 
      transition-all duration-300 cursor-pointer hover:-translate-y-1"
    >
      {/* 上半部分 - 新建作品图标与文字 */}
      <CardContent className="flex flex-col items-center justify-center pt-8 pb-4">
        <div className="w-16 h-16 rounded-full border-2 border-gray-400 flex items-center justify-center mb-3">
          <Plus className="h-8 w-8 text-gray-500" />
        </div>
        <p className="text-gray-600 font-medium">新建作品</p>
      </CardContent>
      
      {/* 下半部分 - 按钮区域 */}
      <div className="border-t border-dashed py-4 px-6 flex flex-wrap gap-3 justify-center bg-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          className="bg-white hover:bg-gray-200 gap-1 px-4 shadow-sm"
          onClick={(e) => e.stopPropagation()} // 防止冒泡，但父组件会处理实际创建
        >
          <Plus size={14} />
          <span>新建作品</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="bg-white hover:bg-gray-200 gap-1 px-4 shadow-sm"
          onClick={(e) => e.stopPropagation()} // 防止冒泡
        >
          <Upload size={14} />
          <span>导入作品</span>
        </Button>
      </div>
    </Card>
  );
} 