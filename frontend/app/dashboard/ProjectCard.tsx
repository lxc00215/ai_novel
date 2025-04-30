"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaEllipsisH, FaEdit, FaClock } from "react-icons/fa";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    progress: number;
    lastEdited: string;
    words: number;
  };
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(project.title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-card border-border/70 hover:border-primary/30 hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="relative">
          {/* 操作按钮 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background text-foreground"
              >
                <FaEllipsisH size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <FaEdit size={12} className="mr-2" />
                <span>编辑项目信息</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FaEdit size={12} className="mr-2" />
                <span>复制项目</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                删除项目
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* 内容区 */}
        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          
          <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FaClock size={12} />
              <span>{project.lastEdited}</span>
            </div>
            <div>{project.words.toLocaleString()} 字</div>
          </div>
          
          <div className="mt-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">完成进度</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-3 pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full group-hover:bg-primary/5 group-hover:text-primary transition-colors"
          >
            继续创作
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 