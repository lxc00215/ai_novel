// app/page.tsx
"use client";

import React, { useState } from "react";


import { FiUploadCloud, FiX, FiInfo, FiSettings, FiHelpCircle, FiChevronDown, FiCheck, FiArrowUp } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';


// Define types for analysis dimensions and depth
type AnalysisDimension = {
  id: string;
  name: string;
  description: string;
};

type AnalysisDepth = "low" | "medium" | "high";

type OutputFormat = "structured" | "summary" | "inspiration" | "template";



export default function BookAnalysisPage() {
  // State for selected dimensions
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  
  // State for file
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // State for analysis depth
  const [depth, setDepth] = useState<AnalysisDepth>("medium");
  
  // State for output format
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("structured");
  
  // State for custom dimension
  const [customDimension, setCustomDimension] = useState<string>("");
  
  // State for analysis progress
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  
  // Available dimensions
  const dimensions: AnalysisDimension[] = [
    { id: "plot", name: "情节结构", description: "故事起承转合、节奏安排" },
    { id: "character", name: "角色塑造", description: "人物设计、性格特点、成长轨迹" },
    { id: "worldbuilding", name: "世界观设定", description: "背景世界规则、环境特征" },
    { id: "narrative", name: "叙事技巧", description: "视角选择、伏笔安排、冲突设计" },
    { id: "highlights", name: "爆点分析", description: "读者热点、情绪波动触发点" },
    { id: "language", name: "语言风格", description: "用词特点、修辞手法、表达方式" },
  ];
  

  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.size > 50 * 1024) { // 50KB limit
      setFileError("文件超过50KB限制");
      setFile(null);
      return;
    }
    
    setFileError(null);
    setFile(selectedFile);
    
    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    if (droppedFile.size > 50 * 1024) { // 50KB limit
      setFileError("文件超过50KB限制");
      setFile(null);
      return;
    }
    
    setFileError(null);
    setFile(droppedFile);
    
    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  
  // Toggle dimension selection
  const toggleDimension = (id: string) => {
    if (selectedDimensions.includes(id)) {
      setSelectedDimensions(selectedDimensions.filter(dimId => dimId !== id));
    } else {
      setSelectedDimensions([...selectedDimensions, id]);
    }
  };
  
  // Add custom dimension
  const addCustomDimension = () => {
    if (customDimension.trim() !== "") {
      const newId = `custom-${Date.now()}`;
      setSelectedDimensions([...selectedDimensions, newId]);
      setCustomDimension("");
    }
  };
  
  // Handle analysis start
  const startAnalysis = () => {
    if (!file) {
      setFileError("请先上传文件");
      return;
    }
    
    if (selectedDimensions.length === 0) {
      return; // Should show error or alert
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        return prev + 1;
      });
    }, 50);
  };
  
  // Get depth description
  const getDepthDescription = (depth: AnalysisDepth) => {
    switch (depth) {
      case "low":
        return "简要分析小说的基本结构和主要情节";
      case "medium":
        return "详细解构小说的核心元素、情节发展和角色关系";
      case "high":
        return "全面剖析小说的叙事技巧、写作手法、伏笔设计等方面，并提供具体段落示例";
    }
  };
  
  // Get depth processing time estimate
  const getDepthTimeEstimate = (depth: AnalysisDepth) => {
    switch (depth) {
      case "low":
        return "预计处理时间: 30秒";
      case "medium":
        return "预计处理时间: 1-2分钟";
      case "high":
        return "预计处理时间: 3-5分钟";
    }
  };
  
  // Get dimension name by id
  const getDimensionName = (id: string) => {
    const dimension = dimensions.find(dim => dim.id === id);
    if (dimension) return dimension.name;
    if (id.startsWith("custom-")) return "自定义维度";
    return id;
  };
  
  
  return (
    <div className="min-h-screen bg-black text-white">

      
      <main className="container mx-auto py-8 px-4 flex">
        {/* Main content area - left 3/4 居中 */ }
        <div className="w-4/5 pr-6 mx-auto">
          {/* File size limit notice */}
          <div className="text-xs text-[#e7000b] mb-2">文件大小限制：50KB</div>
          
          {/* Upload area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center 
            ${fileError ? 'border-red-600' : 'border-gradient-to-r from-[#e7000b] to-[#155dfc]'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <FiUploadCloud className="mx-auto text-gray-400 h-12 w-12 mb-4" />
                <p className="text-lg mb-4">拖拽文件或点击上传</p>
                <p className="text-sm text-gray-500 mb-4">支持格式: TXT, PDF, EPUB</p>
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  accept=".txt,.pdf,.epub"
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => document.getElementById('fileUpload')?.click()}
                  className="px-4 py-2 bg-gradient-to-r from-[#e7000b] to-[#155dfc] rounded-md"
                >
                  选择文件
                </button>
              </>
            ) : (
              <>
                {isUploading ? (
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg">{uploadProgress}%</span>
                    </div>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-800 stroke-current"
                        strokeWidth="6"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-[#e7000b] progress-ring stroke-current"
                        strokeWidth="6"
                        strokeLinecap="round"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 45}`,
                          strokeDashoffset: `${2 * Math.PI * 45 * (1 - uploadProgress / 100)}`,
                        }}
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiCheck className="text-green-500 mr-2" size={20} />
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-gray-500 hover:text-white"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
            {fileError && <p className="text-red-500 mt-2">{fileError}</p>}
          </div>
          
          {/* Analysis Settings */}
          <div className="mb-8 grid grid-cols-12 gap-6">
            {/* Dimensions Selection - Left side */}
            <div className="col-span-6">
              <h3 className="text-[#155dfc] text-lg font-medium mb-4">拆解维度</h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between border-gray-700 bg-gray-900 text-left"
                  >
                    <span>{selectedDimensions.length > 0 
                      ? `已选择 ${selectedDimensions.length} 个维度` 
                      : '选择拆解维度'}
                    </span>
                    <FiChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[340px] bg-gray-900 border-gray-700">
                  <div className="p-2 max-h-60 overflow-y-auto">
                    {dimensions.map((dimension) => (
                      <div 
                        key={dimension.id} 
                        className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded-md cursor-pointer"
                        onClick={() => toggleDimension(dimension.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDimensions.includes(dimension.id)}
                          onChange={() => {}}
                          className="rounded text-[#155dfc] focus:ring-[#155dfc]"
                        />
                        <div>
                          <div className="flex items-center">
                            <span>{dimension.name}</span>
                            <div className="relative ml-2 group">
                              <FiInfo size={14} className="text-gray-500" />
                              <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 p-2 rounded text-xs w-52">
                                {dimension.description}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">{dimension.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-700">
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="添加自定义维度" 
                        value={customDimension}
                        onChange={(e) => setCustomDimension(e.target.value)}
                        className="bg-gray-800 border-gray-700"
                      />
                      <Button 
                        size="sm" 
                        onClick={addCustomDimension}
                        className="bg-[#155dfc] hover:bg-[#2f6ffd]"
                      >
                        添加
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Selected dimensions */}
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedDimensions.map((dimId) => (
                  <Badge 
                    key={dimId}
                    className="bg-gray-800 hover:bg-gray-700 px-3 py-1"
                  >
                    {getDimensionName(dimId)}
                    <button 
                      className="ml-2" 
                      onClick={() => toggleDimension(dimId)}
                    >
                      <FiX size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Analysis Depth - Right side */}
            <div className="col-span-6">
              <h3 className="text-[#e7000b] text-lg font-medium mb-4">拆解深度</h3>
              
              <RadioGroup>

              <div className="space-y-4">
                <div 
                  className={`p-4 border rounded-md cursor-pointer ${
                    depth === "low" ? "border-[#e7000b] bg-gray-900" : "border-gray-700 bg-gray-800"
                  }`}
                  onClick={() => setDepth("low")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RadioGroupItem 
                        value="low" 
                        id="depth-low" 
                        checked={depth === "low"}
                        className="text-[#e7000b]"
                      />
                      <Label htmlFor="depth-low" className="ml-2">轮廓分析 (低)</Label>
                    </div>
                    <div className="relative group">
                      <FiInfo size={16} className="text-gray-500" />
                      <div className="absolute right-0 hidden group-hover:block bg-gray-800 p-2 rounded text-xs w-60 z-10">
                        {getDepthDescription("low")}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getDepthTimeEstimate("low")}</p>
                </div>
                
                <div 
                  className={`p-4 border rounded-md cursor-pointer ${
                    depth === "medium" ? "border-[#e7000b] bg-gray-900" : "border-gray-700 bg-gray-800"
                  }`}
                  onClick={() => setDepth("medium")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RadioGroupItem 
                        value="medium" 
                        id="depth-medium" 
                        checked={depth === "medium"}
                        className="text-[#e7000b]"
                      />
                      <Label htmlFor="depth-medium" className="ml-2">要素解构 (中)</Label>
                    </div>
                    <div className="relative group">
                      <FiInfo size={16} className="text-gray-500" />
                      <div className="absolute right-0 hidden group-hover:block bg-gray-800 p-2 rounded text-xs w-60 z-10">
                        {getDepthDescription("medium")}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getDepthTimeEstimate("medium")}</p>
                </div>
                
                <div 
                  className={`p-4 border rounded-md cursor-pointer ${
                    depth === "high" ? "border-[#e7000b] bg-gray-900" : "border-gray-700 bg-gray-800"
                  }`}
                  onClick={() => setDepth("high")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <RadioGroupItem 
                        value="high" 
                        id="depth-high" 
                        checked={depth === "high"}
                        className="text-[#e7000b]"
                      />
                      <Label htmlFor="depth-high" className="ml-2">全面剖析 (高)</Label>
                    </div>
                    <div className="relative group">
                      <FiInfo size={16} className="text-gray-500" />
                      <div className="absolute right-0 hidden group-hover:block bg-gray-800 p-2 rounded text-xs w-60 z-10">
                        {getDepthDescription("high")}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getDepthTimeEstimate("high")}</p>
                </div>

              </div>
                
              </RadioGroup>
             
            </div>
          </div>
          
          {/* Output Format */}
          <div className="mb-8">
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-[#e7000b] to-[#155dfc] text-lg font-medium mb-4">输出格式</h3>
            
            <RadioGroup 
              value={outputFormat} 
              onValueChange={(value) => setOutputFormat(value as OutputFormat)}
              className="grid grid-cols-4 gap-4"
            >
              <div className={`border rounded-md p-4 cursor-pointer ${outputFormat === "structured" ? "border-[#e7000b] bg-gray-900" : "border-gray-700 bg-gray-800"}`}>
                <RadioGroupItem value="structured" id="format-structured" className="sr-only" />
                <Label htmlFor="format-structured" className="flex flex-col items-center cursor-pointer">
                  <div className="w-8 h-8 mb-2 flex items-center justify-center text-[#155dfc]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  </div>
                  <span className="text-center">结构化报告</span>
                </Label>
              </div>
              
              <div className={`border rounded-md p-4 cursor-pointer ${outputFormat === "summary" ? "border-[#e7000b] bg-gray-900" : "border-gray-700 bg-gray-800"}`}>
                <RadioGroupItem value="summary" id="format-summary" className="sr-only" />
                <Label htmlFor="format-summary" className="flex flex-col items-center cursor-pointer">
                  <div className="w-8 h-8 mb-2 flex items-center justify-center text-[#155dfc]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>
                  </div>
                  <span className="text-center">要点摘要</span>
                </Label>
              </div>
              
              <div className={`border rounded-md p-4 cursor-pointer ${outputFormat === "inspiration" ? "border-[#e7000b] bg-gray-900" : "border-gray-700 bg-gray-800"}`}>
                <RadioGroupItem value="inspiration" id="format-inspiration" className="sr-only" />
                <Label htmlFor="format-inspiration" className="flex flex-col items-center cursor-pointer">
                  <div className="w-8 h-8 mb-2 flex items-center justify-center text-[#155dfc]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>
                  </div>
                  <span className="text-center">创作灵感</span>
                </Label>
              </div>
              
              <div className={`border rounded-md p-4 cursor-pointer ${outputFormat === "template" ? "border-[#e7000b] bg-gray-900" : "border-gray-700 bg-gray-800"}`}>
                <RadioGroupItem value="template" id="format-template" className="sr-only" />
                <Label htmlFor="format-template" className="flex flex-col items-center cursor-pointer">
                  <div className="w-8 h-8 mb-2 flex items-center justify-center text-[#155dfc]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" x2="21" y1="9" y2="9"></line><line x1="9" x2="9" y1="21" y2="9"></line></svg>
                  </div>
                  <span className="text-center">创作模板</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Start Analysis Button */}
          <div className="flex justify-center mt-8">
            {!isAnalyzing ? (
              <Button 
                className="px-8 py-6 text-lg bg-gradient-to-r from-[#e7000b] to-[#155dfc] hover:opacity-90 transform transition hover:scale-105"
                onClick={startAnalysis}
                disabled={!file || selectedDimensions.length === 0}
              >
                开始拆解
              </Button>
            ) : (
              <div className="w-full max-w-md">
                <div className="flex justify-between mb-2">
                  <span>拆解进行中...</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress 
                  value={analysisProgress} 
                  className="h-3 bg-gray-800"
                />
              </div>
            )}
          </div>
        </div>
        
        
      </main>
      
      {/* Back to top button */}
      <button 
        className="fixed bottom-6 right-6 p-3 bg-gray-900 text-[#155dfc] rounded-full shadow-lg hover:bg-gray-800 transition-all"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <FiArrowUp size={20} />
      </button>
    </div>
  );
}