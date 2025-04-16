"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// 模拟历史数据 - 实际应用中应从API获取
const historyItems = [
  { id: 1, title: "小说拆解 1", date: "2023-11-10" },
  { id: 2, title: "科幻小说", date: "2023-11-15" },
  { id: 3, title: "历史故事", date: "2023-11-20" },
  { id: 4, title: "侦探小说", date: "2023-11-25" },
  { id: 5, title: "奇幻冒险", date: "2023-11-30" },
  { id: 6, title: "青春校园", date: "2023-12-05" },
];

export default function HistoryList() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
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
    return null;
  }

  return (
    <div className="relative">
      {/* 左侧模糊效果 - 更强的渐变 */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-background via-background/90 to-transparent pointer-events-none" />
      
      {/* 左滚动按钮 */}
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all",
          !canScrollLeft && "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto hide-scrollbar py-2"
        onScroll={handleScroll}
      >
        <div className="flex space-x-4 p-4 pb-2">
          {historyItems.map((item) => (
            <Card key={item.id} className="w-[240px] flex-shrink-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-md border border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <h3 className="font-medium truncate text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* 右滚动按钮 */}
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all",
          !canScrollRight && "opacity-0 pointer-events-none"
        )}
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      
      {/* 右侧模糊效果 - 更强的渐变 */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-background via-background/90 to-transparent pointer-events-none" />
    </div>
  );
}