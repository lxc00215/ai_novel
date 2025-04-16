"use client";

import { useState, useRef } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 模拟上传进度
  const simulateUpload = () => {
    setUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          toast({
            title: "文件上传成功",
            description: `${file?.name} 已成功上传`,
          });
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      simulateUpload();
    } else {
      toast.error("请先上传文件")
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "rounded-xl p-12 transition-all duration-300 ease-in-out border border-dashed bg-background shadow-lg cursor-pointer",
          isDragging ? "scale-[1.02] ring-2 ring-blue-400 dark:ring-blue-500" : "",
          file && !uploading ? "ring-2 ring-green-400 dark:ring-green-500" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className={cn(
            "rounded-full p-6 transition-all duration-300",
            uploading ? "bg-blue-100 dark:bg-blue-900/30" : 
            file ? "bg-green-100 dark:bg-green-900/30" : 
            "bg-blue-50 dark:bg-blue-900/20"
          )}>
            {uploading ? (
              <UploadCloud className="h-12 w-12 text-blue-500 dark:text-blue-400 animate-bounce" />
            ) : file ? (
              <FileText className="h-12 w-12 text-green-500 dark:text-green-400" />
            ) : (
              <UploadCloud className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            )}
          </div>

          {file && !uploading ? (
            <div className="mt-2">
              <p className="text-xl font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-semibold">
                {uploading ? "正在上传..." : "上传您的文件"}
              </h3>
              <p className="text-base text-muted-foreground max-w-sm">
                拖拽文件或点击此处以选择文件，支持 .txt, .docx, .pdf 等文本文件
              </p>
            </>
          )}

          {uploading && (
            <div className="w-full max-w-sm mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-right mt-2">{progress}%</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.docx,.pdf"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {file && !uploading && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            className="px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md">
            开始上传
          </Button>
        </div>
      )}
    </div>
  );
}