"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Plus, Settings, Info, Trash, FileText, ArrowUp, ArrowDown, FileOutput, HelpCircle } from "lucide-react";
import { Novel } from "@/app/services/types";
import apiService from "@/app/services/api";
import { useRouter } from "next/navigation";

// 作品接口

interface WorkCardProps {
  work: Novel;
  handleArchive: (id: string, isArchive: boolean) => void;
}

export default function WorkCard({ work, handleArchive }: WorkCardProps) {
  // 控制下拉菜单状态
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [isTop, setIsTop] = useState(work.is_top);
  const [isArchive, setIsArchive] = useState(work.is_archive);

  // 处理卡片点击
  const handleCardClick = () => {
    console.log(`打开作品: ${work.title}`);
    router.push(`/dashboard/writing/${work.id}`);
  };

  // 阻止按钮点击事件冒泡到卡片
  const handleButtonClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    console.log(`执行${action}操作`);
  };

//   作品信息弹窗

const [showInfoDialog, setShowInfoDialog] = useState(false);

  const handleInfoDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDialog(true);
    setMenuOpen(false);
  }

  //   删除作品弹窗

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
    setMenuOpen(false);
  }

  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 跳转到拆书页面
    console.log("跳转到拆书页面");
    setMenuOpen(false);
  }

  const toggleTop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 发请求
    const res = await apiService.novels.updateNovel(work.id, {is_top: !isTop});
    console.log(JSON.stringify(res));
    if(res ) {
      console.log("置顶成功");
      setIsTop(!isTop);
    } else {
      alert("置顶失败");
    }
    setMenuOpen(false);
  }

  const toggleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 发请求
    await handleArchive(work.id,!isArchive);
 
    setMenuOpen(false);
    setIsArchive(!isArchive);
  }

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 将作品导出为txt文件
    console.log("导出作品");
    setMenuOpen(false);
  }

  const handleTutorial = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 跳转到新手教程页面
    console.log("跳转到新手教程页面");
    setMenuOpen(false);
  }

  // 鼠标悬浮在按钮上时显示菜单
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMenuOpen(true);
  };

  // 鼠标离开按钮和菜单时隐藏菜单
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 300); // 添加延迟，使用户有时间将鼠标移到菜单上
  };

  // 鼠标进入菜单时保持菜单打开
  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Card 
      className="hover:shadow-md transition-all duration-300 relative cursor-pointer hover:-translate-y-1"
      onClick={handleCardClick}
    >
      {/* 置顶标识 */}
      {isTop && (
        <div className="absolute top-0 right-0 bg-amber-400 text-white rounded-bl-md rounded-tr-md px-2 py-1 text-xs font-medium z-10 flex items-center gap-1">
          <ArrowUp size={14} />
          <span>TOP</span>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex gap-4">
          {/* 左侧绿色方块 */}
          <div className="w-16 h-16 bg-emerald-400 rounded-md flex items-center justify-center text-white font-medium">
            新建
          </div>
          
          <div className="flex-1">
            <CardTitle className="text-lg truncate">{work.title}</CardTitle>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                小说
              </span>
              <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                诗
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
          {work.description || "暂无描述"}
        </p>
        
        {/* 底部按钮区域 */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gray-100 hover:bg-gray-200 gap-1 px-4 transition-transform hover:-translate-y-1"
            onClick={(e) => handleButtonClick(e, "新建章节")}
          >
            <Plus size={14} />
            <span>新建章节</span>
          </Button>
          
          <div 
            className="relative" 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Button 
              ref={buttonRef}
              variant="outline" 
              size="sm" 
              className="text-emerald-600 border-emerald-200 bg-white hover:bg-emerald-50 gap-1 px-4 transition-transform hover:-translate-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings size={14} className="text-emerald-600" />
              <span>作品管理</span>
            </Button>
            
            {/* 悬浮式下拉菜单 */}
            {menuOpen && (
              <div 
                className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 border overflow-hidden"
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="py-1">
                  <button onClick={handleInfoDialog} className="w-full text-left text-black px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                    <Info size={14} /> 作品信息
                  </button>
                  <button onClick={handleDeleteDialog} className="w-full text-left text-black px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-500">
                    <Trash size={14} /> 删除作品
                  </button>
                  <button onClick={handleSplit} className="w-full text-left text-black px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                    <FileText size={14} /> 拆书
                  </button>
                  <button onClick={toggleTop} className="w-full text-left text-black px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                    <ArrowUp size={14} />  {isTop ? "取消置顶" : "置顶"}
                  </button>
                  <button onClick={toggleArchive} className="w-full text-left text-black px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                    <ArrowDown size={14} />  {isArchive ? "取消归档" : "归档"}
                  </button>
                  <button onClick={handleExport} className="w-full text-left text-black px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                    <FileOutput size={14} /> 作品导出
                  </button>
                  <button onClick={handleTutorial} className="w-full text-left text-black px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                    <HelpCircle size={14} /> 新手教程
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 