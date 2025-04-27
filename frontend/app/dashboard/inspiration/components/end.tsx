// File: page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Plus, PlusCircle, PlusCircleIcon, Share2, X, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { Inspiration } from "@/app/services/types";
import { useRouter } from "next/navigation";
import apiService from "@/app/services/api";
import {QRCodeSVG } from 'qrcode.react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "sonner";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

// 修改获取故事列表函数，添加分页参数
const getStories = async (page: number, pageSize: number) => {
  try {
    // 调用 API 获取故事列表，传入分页参数
    const response = await apiService.spirate.getStories(4, page, pageSize);
    console.log("response", response);
    return response;
  } catch (err) {
    return {
      data: [],
      total: 0,
      current_page: 1,
      total_pages: 1
    };
  }
};

// 接收一个切换函数作为props
export default function End({ onToggleView }: { onToggleView: () => void }) {
  const [stories, setStories] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(6); // 每页显示数量

  const [shareUrl, setShareUrl] = useState<string>("");
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
 
 // 处理分享功能


  // 修改获取数据的函数，添加分页参数
  const fetchStories = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await getStories(page, pageSize);
      console.log("response", response);
      if (response || response.data) {
        setStories(response.data);
        setTotalPages(response.total_pages);
        setCurrentPage(response.current_page);
      }
    } catch (error) {
      console.error("Error in fetchStories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件挂载和页码变化时获取数据
  useEffect(() => {
    fetchStories(currentPage);
  }, [currentPage]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  const handleShare = (storyId: string) => (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击事件
    
    // 创建分享URL (根据您的实际URL结构调整)
    const shareableUrl = `${window.location.origin}/dashboard/inspiration/${storyId}`;
    setShareUrl(shareableUrl);
    setIsQRCodeOpen(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("链接已复制到剪贴板");
    } catch (err) {
      toast.error("复制失败，请手动复制链接");
      console.error("复制失败:", err);
    }
  };

  function handleMouseEnter(id: string) {
    const card = document.querySelector(`#card-${id}`);
    if (card) {
      // 设置背景色为稍微亮一点的黑色
      card.classList.remove('bg-[#0c0a09]'); // 移除默认背景色
      card.classList.add('bg-[#191919]'); // 添加hover时的背景色
      // 添加可点击的视觉提示
      card.classList.add('cursor-pointer');
  
    }
  }

  function handleMouseLeave(id: string) {
    const card = document.querySelector(`#card-${id}`);
    if (card) {
      // 恢复默认背景色
      card.classList.remove('bg-[#191919]');
      card.classList.add('bg-[#0c0a09]');
      // 移除缩放效果
      card.classList.remove('scale-[1.02]');
    }
  }

  // 添加加载状态的显示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="min-h-screen overflow-y-auto p-6 flex-1 bg-black text-white pr-20 pl-30 pt-10 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">

        {/* My Stories Section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">
            我的故事 ({stories.length})
          </h2>
          
          {/* Stories Grid */}
          <div className="grid grid-cols-1 grid-cols-2 gap-4">
            {stories.map((story) => (
              <Card 
                id={`card-${story.id}`} 
                key={story.id} 
                className="bg-[#0c0a09] rounded-none border-none overflow-hidden pt-0 h-40 pb-0 mr-10 border-zinc-800 hover:bg-[#1a1a1a] transition-all duration-200 ease-in-out cursor-pointer" 
                // onClick={()=>handleClick(story.id)} 
                onMouseEnter={()=>handleMouseEnter(story.id)} 
                onMouseLeave={()=>handleMouseLeave(story.id)}>
                <div className="flex flex-row h-full">
                  {/* 左侧图片区域 - 在小屏幕时缩小宽度 */}
                  <div className="relative w-1/3 sm:w-1/4 md:w-1/5 h-full">
                    <Image
                      src={story.cover_image ?? ""}
                      alt={story.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                  </div>
                  {/* 右侧内容区域 - 自适应剩余空间 */}
                  <CardContent className="px-2 sm:px-3 md:px-5 py-2 w-2/3 sm:w-3/4 md:w-4/5 flex flex-col justify-between">
                    {/* 上部文字区域 - 响应式字体大小和间距 */}
                    <div className="flex flex-col space-y-1 sm:space-y-2">
                      <h3 className="text-xs sm:text-sm md:text-base font-medium font-sans line-clamp-1">{story.title}</h3>
                      <div className="text-[10px] sm:text-xs text-zinc-400 pb-1 sm:pb-2 text-color-gray font-inter">
                        最后更新: {story.updated_at}
                      </div>
                      <div className="text-[10px] sm:text-xs text-zinc-400 font-roboto line-clamp-2">
                        <span className="font-medium">设定:</span> {story.prompt}
                      </div>
                    </div>
                    
                    {/* 底部按钮区域 - 响应式按钮大小和间距 */}
                    <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-0">
                      <Button 
                        className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-7 sm:h-9 rounded-md bg-zinc-800 hover:bg-zinc-700 border-zinc-700 transition-colors"
                      >
                        继续
                      </Button>

                      <Drawer open={isQRCodeOpen && shareUrl.includes(story.id)} onOpenChange={(open) => !open && setIsQRCodeOpen(false)}>
                        <DrawerTrigger asChild>
                          <Button
                            onClick={handleShare(story.id)}
                             className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-7 sm:h-9 rounded-md bg-zinc-800 hover:bg-zinc-700 border-zinc-700 transition-colors"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            分享
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="bg-zinc-900 border-t border-zinc-800 p-6 rounded-t-xl">
                          <div className="flex flex-col items-center max-w-md mx-auto">
                            <div className="flex justify-between w-full mb-6">
                              <h3 className="text-xl font-medium text-white">分享故事</h3>
                              <DrawerClose asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800">
                                  <X className="h-5 w-5" />
                                </Button>
                              </DrawerClose>
                            </div>
                            
                            {/* QR Code */}
                            <div className="bg-white p-4 rounded-lg mb-6">
                              <QRCodeSVG value={shareUrl} size={200} />
                            </div>

                             {/* 链接区域 */}
                             <div className="w-full flex items-center gap-2 bg-zinc-800 p-3 rounded-lg mb-6">
                              <input 
                                type="text" 
                                value={shareUrl} 
                                readOnly 
                                className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                              />
                              <Button
                                onClick={copyShareLink}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-zinc-700"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <p className="text-sm text-zinc-400 text-center">
                              扫描二维码或复制链接分享给好友
                            </p>
                          </div>
                        </DrawerContent>
                      </Drawer>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 优化后的分页组件 */}
        <div className="mt-8 flex pt-10 justify-center">
          <Pagination>
            <PaginationContent>
              {/* 上一页按钮 */}
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={`
                    transition-all duration-200 ease-in-out
                    ${currentPage === 1 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-zinc-800 hover:text-white cursor-pointer'
                    }
                    border border-zinc-700
                    rounded-md
                    px-4 py-2
                    flex items-center gap-2
                  `}
                />
              </PaginationItem>

              {/* 页码按钮 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    className={`
                      min-w-[40px] h-[40px]
                      flex items-center justify-center
                      rounded-md
                      transition-all duration-200 ease-in-out
                      cursor-pointer
                      border border-zinc-700
                      ${currentPage === page 
                        ? 'bg-zinc-800 text-white border-zinc-600' 
                        : 'hover:bg-zinc-800 hover:text-white hover:border-zinc-600'
                      }
                    `}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {/* 下一页按钮 */}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={`
                    transition-all duration-200 ease-in-out
                    ${currentPage === totalPages 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-zinc-800 hover:text-white cursor-pointer'
                    }
                    border border-zinc-700
                    rounded-md
                    px-4 py-2
                    flex items-center gap-2
                  `}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* 可选：添加页码信息显示 */}
        <div className="mt-4 mb-4 text-center text-sm text-zinc-500">
          第 {currentPage} 页，共 {totalPages} 页
        </div>
      </div>

      {/* 切换按钮 */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onToggleView}
        className="absolute top-4 left-4 z-10"
      >
        <ChevronLeft />
      </Button>
    </div>
  );
}

