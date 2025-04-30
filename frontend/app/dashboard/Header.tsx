"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { 
  FaSearch, 
  FaBell, 
  FaQuestion, 
  FaChevronDown, 
  FaStar,
  FaPlus
} from "react-icons/fa";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderProps {
  collapsed: boolean;
}

export function Header({ collapsed }: HeaderProps) {
  const [notifications, setNotifications] = useState([
    { id: 1, title: "AI 写作建议", content: "基于你最近的写作风格，我们有新的建议", time: "10分钟前", unread: true },
    { id: 2, title: "每周写作总结", content: "查看上周的写作进度和统计数据", time: "1小时前", unread: true },
    { id: 3, title: "系统更新", content: "我们添加了新的AI创作工具", time: "昨天", unread: false },
  ]);
  
  const pathname = usePathname();
  
  // 标题映射
  const pageTitles: Record<string, { title: string, description: string }> = {
    "/dashboard": { title: "控制台", description: "欢迎回到你的创作空间" },
    "/dashboard/inspiration": { title: "灵感创作", description: "AI 生成灵感，开启你的创作之旅" },
    "/dashboard/writing": { title: "暴走写书", description: "快速完成小说章节与段落" },
    "/dashboard/analyze": { title: "AI 拆书", description: "深入分析小说结构与写作技巧" },
    "/dashboard/analytics": { title: "数据分析", description: "查看你的创作统计与进度" },
    "/dashboard/profile": { title: "个人资料", description: "管理你的账户与个人信息" },
    "/dashboard/settings": { title: "设置", description: "自定义你的创作空间" },
  };
  
  // 获取当前页面标题
  const currentPage = pageTitles[pathname] || { title: "创作空间", description: "AI 驱动的创作平台" };

  // 标记所有通知为已读
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };
  
  // 计算未读通知数量
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "fixed top-0 right-0 z-30 bg-background/70 backdrop-blur-lg border-b border-border h-16",
        "flex items-center justify-between px-4 md:px-6",
        "transition-all duration-300"
      )}
      style={{
        width: `calc(100% - ${collapsed ? "5rem" : "17rem"})`,
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)"
      }}
    >
      {/* 左侧页面标题 */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-semibold text-xl text-foreground flex items-center">
            {currentPage.title}
            {currentPage.title === "控制台" && (
              <Badge variant="outline" className="ml-2 bg-primary/5 text-primary">Beta</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">{currentPage.description}</p>
        </div>
      </div>
      
      {/* 右侧功能区 */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* 搜索框 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50">
              <FaSearch size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input 
                  placeholder="搜索作品、功能、设置..."
                  className="pl-9 border-muted"
                />
              </div>
            </div>
            <div className="py-2">
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">快速访问</p>
              <div className="px-1">
                {[
                  { name: "创建新章节", icon: <FaPlus size={12} /> },
                  { name: "灵感收藏夹", icon: <FaStar size={12} /> },
                  { name: "我的草稿", icon: <FaPlus size={12} /> },
                ].map((item, i) => (
                  <button 
                    key={i}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-muted"
                  >
                    <span className="w-5 h-5 flex items-center justify-center text-primary">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      
        {/* 通知 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50 relative">
              <FaBell size={14} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <h3 className="font-medium">通知</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={markAllAsRead}
                >
                  标记全部已读
                </Button>
              )}
            </div>
            <div className="py-2 max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors",
                      notification.unread ? "bg-primary/5" : ""
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        notification.unread ? "bg-primary" : "bg-muted"
                      )}></div>
                      <div>
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{notification.content}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-6 text-center">
                  <p className="text-muted-foreground text-sm">暂无通知</p>
                </div>
              )}
            </div>
            <div className="p-2 border-t border-border">
              <Button variant="outline" size="sm" className="w-full text-xs">
                查看全部通知
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* 帮助中心 */}
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50">
          <FaQuestion size={14} />
        </Button>
        
        {/* 创建按钮 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="hidden md:flex items-center gap-1.5">
              <span>新建</span>
              <FaChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <FaPlus size={12} className="mr-2 text-primary" />
              <span>新建章节</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FaPlus size={12} className="mr-2 text-primary" />
              <span>新建小说</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <FaPlus size={12} className="mr-2 text-primary" />
              <span>收集灵感</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
} 