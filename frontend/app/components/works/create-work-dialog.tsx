"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, description: string) => void;
  // 新增的属性，用于编辑模式
  initialTitle?: string;
  initialDescription?: string;
  dialogTitle?: string;
  submitButtonText?: string;
}

export default function CreateWorkDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  initialTitle = "新建作品",
  initialDescription = "",
  dialogTitle = "创建作品后可使用AI功能",
  submitButtonText = "提交"
}: CreateWorkDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [titleCount, setTitleCount] = useState(initialTitle.length);
  const [descriptionCount, setDescriptionCount] = useState(initialDescription.length);
  
  // 最大字符限制
  const MAX_TITLE_LENGTH = 30;
  const MAX_DESCRIPTION_LENGTH = 500;
  
  // 重置表单或设置初始值
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setTitleCount(initialTitle.length);
      setDescriptionCount(initialDescription.length);
    }
  }, [open, initialTitle, initialDescription]);
  
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
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-lg">{dialogTitle}</DialogTitle>
          <DialogClose className="h-6 w-6 hover:cursor-pointer opacity-70" />
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
        
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 