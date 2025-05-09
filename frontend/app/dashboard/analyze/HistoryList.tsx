"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

// 模拟历史数据 - 实际应用中应从API获取
interface HistoryListProps{
  historyItems:any[]
}

export default function HistoryList({historyItems}:HistoryListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const router = useRouter()

  // 检查是否有历史记录
  const hasHistory = historyItems.length > 0;

  useEffect(() => {
    // 初始化时检查是否可以滚动
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollRight(scrollWidth > clientWidth);
    }
  }, []);



  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setScrollPosition(scrollLeft);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.7; // 滚动70%容器宽度
      
      const targetPosition = direction === 'left'
        ? Math.max(container.scrollLeft - scrollAmount, 0)
        : Math.min(container.scrollLeft + scrollAmount, container.scrollWidth - container.clientWidth);
      
      // 使用弹性动画效果
      const startPosition = container.scrollLeft;
      const distance = targetPosition - startPosition;
      const duration = 500; // 动画持续时间
      let start: number | null = null;
      
      // 自定义缓动函数 - 先快后慢
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      
      function step(timestamp: number) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        
        container.scrollLeft = startPosition + distance * easedProgress;
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          // 滚动结束后，更新按钮状态
          handleScroll();
        }
      }
      
      window.requestAnimationFrame(step);
    }
  };

  // 如果没有历史记录，返回空组件
  if (!hasHistory) {
    // 还没有历史记录
    return (
      <Card className="w-full">
        <CardContent className="p-5">
          <h3 className="font-medium truncate text-lg mb-1">还没有历史记录</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {/* 左侧模糊效果 - 更强的渐变 */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
      
      {/* 左滚动按钮 - 修改为半边在列表外，更小更美观 */}
      <Button 
        variant="outline" 
        size="sm" 
        className={cn(
          "absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-all",
          !canScrollLeft && "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">向左滚动</span>
      </Button>

      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-none py-2"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 添加内联样式隐藏滚动条 */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="flex space-x-4 p-4 pb-2">
          {historyItems.map((item) => (
            <Card 
              key={item.id} 
              
              onClick={
                ()=>router.push(`/dashboard/analyze/${item.id}`)
              }
              className="w-[240px] hover:cursor-pointer flex-shrink-0 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md border border-border/60 group"
            >
              <CardContent className="p-5">
                <h3 className="font-medium truncate text-lg mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* 右滚动按钮 - 修改为半边在列表外，更小更美观 */}
      <Button 
        variant="outline" 
        size="sm" 
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-all",
          !canScrollRight && "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">向右滚动</span>
      </Button>
      {/* 右侧模糊效果 - 更强的渐变 */}
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
    </div>
  );
}