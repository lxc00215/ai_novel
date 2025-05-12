"use client";

import { useState, useRef } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadProps {
  onUploadComplete?: (result: any) => void;
}

export default function Upload({ onUploadComplete }: UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 实际上传文件到后端
  const uploadFile = async () => {
    if (!file) {
      toast.error("请先选择文件");
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadError(null);
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // 使用XMLHttpRequest来监控上传进度
      const xhr = new XMLHttpRequest();
      
      // 设置进度监听
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      // 设置完成回调
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 上传成功
          const response = JSON.parse(xhr.responseText);
          toast.success("文件上传成功");
          
          // 如果提供了回调函数，调用它并传递服务器响应
          if (onUploadComplete) {
            // 确保不直接返回整个对象，而是返回一个字符串或正确的React元素
            // 这里假设response中含有我们需要的数据
            onUploadComplete({
              fileName: file.name,
              fileSize: file.size,
              ...response
            });
          }
        } else {
          // 上传失败
          setUploadError("上传失败: " + xhr.statusText);
          toast.error("文件上传失败");
        }
        setUploading(false);
      });
      
      // 设置错误回调
      xhr.addEventListener('error', () => {
        setUploadError("网络错误，上传失败");
        toast.error("网络错误，上传失败");
        setUploading(false);
      });
      
      // 设置取消回调
      xhr.addEventListener('abort', () => {
        setUploadError("上传已取消");
        toast.error("上传已取消");
        setUploading(false);
      });
      
      // 打开连接并发送请求
    xhr.open('POST', process.env.NEXT_PUBLIC_ENDPOINT+'/ai/upload-file', true);
    // xhr.setRequestHeader('Content-Type', 'multipart/form-data');
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'))

    //  if(response.file_id){
    
    //   setFileId(response.file_id)
    //  }
     const response = xhr.send(formData);

      // 上传成功后，调用onUploadComplete回调函数
      if (onUploadComplete) {
        onUploadComplete({
          fileName: file.name,
          fileSize: file.size,
        });
      }

      
    } catch (error) {
      console.error("上传过程中发生错误:", error);
      setUploadError("上传过程中发生错误");
      toast.error("上传过程中发生错误");
      setUploading(false);
    }
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

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (file) {
      uploadFile(); // 使用实际的上传函数，而不是模拟
    } else {
      toast.error("请先选择文件");
    }
  };

  // 重置上传状态
  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "rounded-xl p-12 transition-all duration-300 ease-in-out border border-dashed bg-background shadow-lg cursor-pointer",
          isDragging ? "scale-[1.02] ring-2 ring-blue-400 dark:ring-blue-500" : "",
          file && !uploading ? "ring-2 ring-green-400 dark:ring-green-500" : "",
          uploadError ? "ring-2 ring-red-400 dark:ring-red-500" : ""
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
            uploadError ? "bg-red-100 dark:bg-red-900/30" :
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
                {uploading ? "正在上传..." : uploadError ? "上传失败" : "上传您的文件"}
              </h3>
              <p className="text-base text-muted-foreground max-w-sm">
                {uploadError ? uploadError : "拖拽文件或点击此处以选择文件，支持 .txt, .docx, .pdf 等文本文件"}
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
        <div className="mt-6 flex justify-center gap-4">
          <Button
            onClick={handleUpload}
            className="px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md">
            开始上传
          </Button>
          <Button
            variant="outline"
            onClick={resetUpload}>
            取消
          </Button>
        </div>
      )}

      {uploadError && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={resetUpload}>
            重新上传
          </Button>
        </div>
      )}
    </div>
  );
}