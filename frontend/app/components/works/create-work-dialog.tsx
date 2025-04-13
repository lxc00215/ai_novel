"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import apiService from "@/app/services/api";

interface CreateWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, description: string) => void;
}

export default function CreateWorkDialog({ open, onOpenChange, onSubmit }: CreateWorkDialogProps) {
  const [title, setTitle] = useState("新建作品");
  const [description, setDescription] = useState("");
  const [titleCount, setTitleCount] = useState(4);
  const [descriptionCount, setDescriptionCount] = useState(0);
  
  // 最大字符限制
  const MAX_TITLE_LENGTH = 30;
  const MAX_DESCRIPTION_LENGTH = 500;
  
  // 重置表单
  useEffect(() => {
    if (open) {
      setTitle("新建作品");
      setDescription("");
      setTitleCount(4);
      setDescriptionCount(0);
    }
  }, [open]);
  
  // 处理标题变化，更新字符计数
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle.length <= MAX_TITLE_LENGTH) {
      setTitle(newTitle);
      setTitleCount(newTitle.length);
    }
  };
  
  // 处理描述变化，更新字符计数
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    if (newDescription.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(newDescription);
      setDescriptionCount(newDescription.length);
    }
  };
  
  // 处理表单提交
  const handleSubmit = async () => {
    if (title.trim()) {
        onSubmit(title, description);
        onOpenChange(false);
      
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-lg">创建作品后可使用AI功能</DialogTitle>
          <DialogClose className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100">
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 作品名称 */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="workTitle" className="text-sm font-medium">
                作品名称 <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="relative">
              <Input
                id="workTitle"
                value={title}
                onChange={handleTitleChange}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {titleCount} / {MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>
          
          {/* 作品简介 */}
          <div className="space-y-2">
            <div className="flex items-center">
              <label htmlFor="workDescription" className="text-sm font-medium">
                作品简介（选填，不影响AI生成内容）
              </label>
            </div>
            <div className="relative">
              <Textarea
                id="workDescription"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="请输入作品简介"
                className="resize-none min-h-[120px]"
              />
              <span className="absolute right-3 bottom-3 text-xs text-gray-500">
                {descriptionCount} / {MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            提交
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 