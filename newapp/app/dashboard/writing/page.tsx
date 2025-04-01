// src/app/page.tsx
"use client";

import { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Download, 
  Edit,
  Sparkles
} from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [wordCount, setWordCount] = useState([5000]);
  const [chapters, setChapters] = useState("3");
  const [style, setStyle] = useState("");
  const [extraOption1, setExtraOption1] = useState(false);
  const [extraOption2, setExtraOption2] = useState(false);
  const [result, setResult] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalPages, setTotalPages] = useState(5);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation with timeout
    setTimeout(() => {
      setResult(`第一章：新的开始\n\n这是AI生成的小说内容示例。这里将显示根据您的要求生成的文本。您可以通过调整参数来控制生成的内容风格和长度。\n\n当前设置：\n- 字数：${wordCount[0]}\n- 章节数：${chapters}\n- 风格：${style || "未选择"}\n\n您的提示：${prompt}`);
      setIsGenerating(false);
    }, 2000);
  };
  
  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-[#e7000b] to-[#155dfc] text-transparent bg-clip-text">AI小说创作系统 - 暴走</h1>
        
        {/* Central Creation Area */}
        <div className="mb-8">
          <div className="relative">
            <Textarea
              placeholder="在这里输入任何创作要求，AI将为您实现"
              className="min-h-[200px] bg-[#222222] border-0 rounded-md focus:ring-0 focus:border-0 before:content-[''] before:absolute before:inset-0 before:rounded-md before:p-[1px] before:bg-gradient-to-r before:from-[#e7000b] before:to-[#155dfc] before:-z-10 focus-within:before:opacity-100 before:opacity-80"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="text-[#155dfc] text-sm text-right mt-1">
              字数：{prompt.length}
            </div>
          </div>
        </div>
        
        {/* Parameters Panel */}
        <div className="mb-8 bg-black/80 p-4 rounded-md border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-[#e7000b]">创作参数</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="word-count" className="block mb-2">字数控制 ({wordCount[0]}字)</Label>
                <Slider
                  id="word-count"
                  min={0}
                  max={20000}
                  step={100}
                  value={wordCount}
                  onValueChange={setWordCount}
                  className="[&>.slider-thumb]:bg-[#155dfc]"
                />
              </div>
              
              <div>
                <Label htmlFor="style" className="block mb-2">风格选择</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="border-[#e7000b] border bg-black">
                    <SelectValue placeholder="选择创作风格" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#222222] border-gray-700">
                    <SelectItem value="realistic">现实主义</SelectItem>
                    <SelectItem value="scifi">科幻</SelectItem>
                    <SelectItem value="fantasy">奇幻</SelectItem>
                    <SelectItem value="horror">恐怖</SelectItem>
                    <SelectItem value="romance">浪漫</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="chapters" className="block mb-2">章节数</Label>
                <Select value={chapters} onValueChange={setChapters}>
                  <SelectTrigger className="border-[#155dfc] border bg-black">
                    <SelectValue placeholder="选择章节数" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#222222] border-gray-700">
                    {[...Array(20)].map((_, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{i + 1}章</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="extra1">情节曲折</Label>
                  <Switch 
                    id="extra1" 
                    checked={extraOption1}
                    onCheckedChange={setExtraOption1}
                    className="data-[state=checked]:bg-[#e7000b]"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="extra2">角色丰富</Label>
                  <Switch 
                    id="extra2" 
                    checked={extraOption2}
                    onCheckedChange={setExtraOption2}
                    className="data-[state=checked]:bg-[#155dfc]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="flex justify-center mb-8">
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-white px-8 py-6 text-lg rounded-md transition-all hover:scale-105 bg-gradient-to-r from-[#e7000b] to-[#155dfc] hover:shadow-[0_0_15px_rgba(231,0,11,0.6)]"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="animate-pulse">生成中</div>
                <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-white rounded-full"></div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>开始创作</span>
                <Sparkles size={18} />
              </div>
            )}
          </Button>
        </div>
        
        {/* Results Area */}
        {result && (
          <div className="mb-8">
            <div className="bg-[#333333] p-6 rounded-md border border-[#e7000b] min-h-[300px]">
              <h3 className="text-xl font-semibold mb-4 text-[#155dfc]">生成结果</h3>
              <div className="whitespace-pre-line mb-4">{result}</div>
              
              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="border-[#155dfc] text-[#155dfc] hover:text-white hover:bg-[#155dfc]/20"
                >
                  <ChevronLeft size={18} />
                </Button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <Button 
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={currentPage === i + 1 
                      ? "bg-[#e7000b] text-white border-[#e7000b]" 
                      : "border-[#155dfc] text-[#155dfc] hover:text-white hover:bg-[#155dfc]/20"
                    }
                  >
                    {i + 1}
                  </Button>
                ))}
                
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="border-[#155dfc] text-[#155dfc] hover:text-white hover:bg-[#155dfc]/20"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Button variant="outline" className="border-[#e7000b] text-[#e7000b] hover:bg-[#e7000b]/10">
                <Copy size={18} className="mr-2" /> 复制内容
              </Button>
              <Button variant="outline" className="border-[#155dfc] text-[#155dfc] hover:bg-[#155dfc]/10">
                <Download size={18} className="mr-2" /> 导出文件
              </Button>
              <Button variant="outline" className="border-[#e7000b] text-[#e7000b] hover:bg-[#e7000b]/10">
                <Edit size={18} className="mr-2" /> 修改参数
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}