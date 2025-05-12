"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { EnhancedSidebar } from "./EnhanceSidebar";
import { SidebarProvider } from "./sidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // 检测屏幕大小并自动调整侧边栏
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 1280);
    };

    handleResize(); // 初始检测
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        {/* 侧边栏 */}
        <SidebarProvider>
            <div className="flex h-screen">
                <EnhancedSidebar />
                <main className="flex-1 overflow-auto">
                    
                </main>
            </div>
            <Toaster />
        </SidebarProvider>
        
        {/* 主内容区 - 可滚动区域 */}
        <div className="flex-1 overflow-auto h-screen">
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full min-h-screen bg-background"
          >
            {children}
          </motion.main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
} 