'use client';

import { Button } from "@/components/ui/button";
import { Trash2, FileText } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface SidebarProps {
  chapters: Chapter[];
  currentOrder: number;
  setCurrentOrder: (order: number) => void;
  addNewChapter: () => void;
  deleteChapter: (order: number) => void;
}

export default function Sidebar({ 
  chapters, 
  currentOrder, 
  setCurrentOrder,
  addNewChapter,
  deleteChapter,
}: SidebarProps) {
  // 设置章节概要的函数
  const handleSetSummary = (chapterId: string) => {
    console.log(`设置章节 ${chapterId} 的概要`);
    // 这里可以打开一个编辑概要的对话框
  };

   // 排序章节，确保按order顺序显示
   const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

   //章节标题前添加序号

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-medium">目录</h2>
        <Button size="sm" variant="outline" onClick={addNewChapter}>
          新建章节
        </Button>
      </div>
      
      {/* 使用固定高度和滚动来解决列表过长的问题 */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {sortedChapters.map((chapter) => (
            <li 
              key={chapter.id}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                currentOrder === chapter.order ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                // console.log("我执行了");
                setCurrentOrder(chapter.order);
                console.log("我执行了"+ currentOrder);
              }}
            >
              <span className="truncate flex-1">第{chapter.order + 1}章 {chapter.title}</span>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetSummary(chapter.id);
                  }}
                  title="设置概要"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                {chapters.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChapter(chapter.order);
                    }}
                    title="删除章节"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}