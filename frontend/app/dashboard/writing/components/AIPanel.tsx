'use client';

import { useState, useEffect } from 'react';
import { X, Search, HelpCircle, ChevronDown, Info, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import apiService from '@/app/services/api';

interface AIPanelProps {
  closeAIPanel: () => void;
  onContentGenerated?: (content: string) => void;
  expansionMode?: boolean;
  initialContent?: string;
}

export default function AIPanel({ closeAIPanel, onContentGenerated, expansionMode = false, initialContent = "" }: AIPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiModel, setAiModel] = useState("平衡版");
  const [storyBackground, setStoryBackground] = useState(initialContent || "");
  const [writingStyleMode, setWritingStyleMode] = useState<"preset" | "custom">("preset");
  const [customWritingStyle, setCustomWritingStyle] = useState("");
  const [requirementsMode, setRequirementsMode] = useState<"preset" | "custom">("preset");
  const [customRequirements, setCustomRequirements] = useState("");
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showRequirementsDropdown, setShowRequirementsDropdown] = useState(false);
  const [autoLinkRecent, setAutoLinkRecent] = useState(true);
  const [recentChaptersCount, setRecentChaptersCount] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedStylePreset, setSelectedStylePreset] = useState("【西瓜出品】黄金文风1.3，开启新人入神时代！香茄起点爆款!");
  const [selectedRequirementsPreset, setSelectedRequirementsPreset] = useState("");

  const stylePresets = [
    { id: 1, name: "【优化文笔2.0】剧情以对话推动，强冲突（推荐灵光版）", detail: "详情文字..." },
    { id: 2, name: "【金灵巧】知乎体", detail: "详情文字..." },
    { id: 3, name: "【乐子文风】模各适合对话推剧情（十三月）", detail: "详情文字..." },
    { id: 4, name: "【西瓜出品】黄金文风1.3，开启新人入神时代！香茄起点爆款!", detail: "搭配【西瓜出品】黄金写作，给一句话简单描述故事；细纲生成正文；润色、扩写、缩写；写清楚需求即可。" },
    { id: 5, name: "【L】【爽文的写作风格减少AI味】2", detail: "详情文字..." },
    { id: 6, name: "（小熊出品）美乐子文 写作风格 推荐搭配同名使用", detail: "详情文字..." },
    { id: 7, name: "完全参考之前的章节内容的风格", detail: "详情文字..." },
    { id: 8, name: "故事多层次递进，突出人物特性", detail: "详情文字..." },
  ];

  const requirementsPresets = [
    { id: 1, name: "详细描写", detail: "注重场景和人物细节描写" },
    { id: 2, name: "紧凑情节", detail: "剧情紧凑，节奏明快" },
    { id: 3, name: "增加对话", detail: "更多角色对话，推动情节发展" },
    { id: 4, name: "增加悬疑", detail: "添加悬疑元素，引发读者好奇" },
    { id: 5, name: "续写文章", detail: "保持原文风格继续续写" },
  ];

  useEffect(() => {
    if (expansionMode) {
      setWritingStyleMode("preset");
      setSelectedStylePreset("完全参考之前的章节内容的风格");
      setRequirementsMode("preset");
      setSelectedRequirementsPreset("续写文章");
    }
  }, [expansionMode]);

  const handleGenerate = async () => {
    if (!storyBackground || storyBackground.trim() === '') {
      toast.error('请输入本章剧情');
      return;
    }

    try {
      setIsLoading(true);
      console.log("生成内容");

      const writingStyle = writingStyleMode === 'preset'
        ? selectedStylePreset
        : customWritingStyle;

      const requirements = requirementsMode === 'preset'
        ? selectedRequirementsPreset
        : customRequirements;

      const response = await apiService.ai.generateContent(storyBackground, writingStyle, requirements);

      if (response ) {
        toast.success('内容生成成功');
        if (onContentGenerated) {
          onContentGenerated(response);
        }
        closeAIPanel();
      } else {
        toast.error('生成失败，请重试');
      }
    } catch (error: any) {
      console.error('AI生成错误:', error);
      // 错误消息会在api服务中被处理和显示，这里不需要重复显示
      // 如果需要特殊处理，可以在这里添加
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="font-medium flex items-center gap-1">
          {expansionMode ? "AI续写" : "AI写作(一般用于章节正文写作)"}
          <span className="text-xs text-green-500 bg-green-50 px-1 rounded">新手教程</span>
        </h2>
        <Button variant="ghost" size="icon" onClick={closeAIPanel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="advanced-mode" className="font-medium">高级功能</Label>
            <Switch
              id="advanced-mode"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
              className={showAdvanced ? "bg-green-500" : ""}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600">
          通过提供角色、词条、关联知识库等元数据，能够有效提高 AI 创作内容的质量和相关性。
        </p>

        <div className="space-y-2">
          <Label htmlFor="ai-model">AI模型</Label>
          <Select defaultValue={aiModel} onValueChange={setAiModel}>
            <SelectTrigger id="ai-model" className="w-full bg-black">
              <SelectValue placeholder="选择AI模型" />
            </SelectTrigger>
            <SelectContent className="bg-black text-white border-gray-700">
              <SelectItem value="察图版" className="hover:bg-gray-800">察图版</SelectItem>
              <SelectItem value="文章版" className="hover:bg-gray-800">文章版</SelectItem>
              <SelectItem value="专业版" className="hover:bg-gray-800">专业版</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showAdvanced && (
          <>
            <div className="space-y-2">
              <Label htmlFor="story-background">故事背景 (可以写小说类型如都市/脑洞/修仙，也可以简单交代前文剧情，也可以填"无")</Label>
              <Textarea
                id="story-background"
                className="resize-none h-24"
                placeholder="请输入故事背景"
                value={storyBackground}
                onChange={(e) => setStoryBackground(e.target.value)}
              />
              <div className="text-right text-xs text-gray-500">
                {storyBackground.length} / 500
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter-characters">本章角色卡 (创建角色卡提升100%生成效果，本章不出场角色不要选择)</Label>
              <div className="relative">
                <Input id="chapter-characters" placeholder="请选择角色" />
                <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="character-relationship">角色关系: (可写临时/非核心角色，或者补充人物关系)</Label>
              <Textarea
                id="character-relationship"
                className="resize-none h-20"
                placeholder=""
              />
              <div className="text-right text-xs text-gray-500">
                0 / 500
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter-terms">本章词条卡 (本章未使用词条不要选择，词条太多可能会严重降低AI生成量)</Label>
              <div className="relative">
                <Input id="chapter-terms" placeholder="请选择" />
                <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="story-plot" className="flex items-center">
            本章剧情 <span className="text-red-500 ml-1">*</span>
            <span className="text-xs text-gray-500 ml-2">(按 Alt+K/Command+K 或 <span className="text-blue-500 cursor-pointer">点这里</span> 打开快捷输入)</span>
            <Info className="h-4 w-4 text-gray-400 ml-1" />
          </Label>
          <Textarea
            id="story-plot"
            className="resize-none h-24 border-red-100"
            placeholder="在这里输入你的剧情片段或者细纲"
            value={storyBackground}
            onChange={(e) => setStoryBackground(e.target.value)}
          />
          <div className="text-right text-xs text-gray-500">
            {storyBackground.length} / 3000
          </div>
          {storyBackground.length === 0 && <div className="text-sm text-red-500">
            请输入本章剧情
          </div>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="writing-style">写作风格 (AI只认出名的大神，如果不出名可以具体描写风格)</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "border-green-200",
                writingStyleMode === "preset" ? "bg-green-50 text-green-600" : ""
              )}
              onClick={() => setWritingStyleMode("preset")}
            >
              快捷选项
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={writingStyleMode === "custom" ? "bg-green-50 text-green-600 border-green-200" : ""}
              onClick={() => setWritingStyleMode("custom")}
            >
              自定义
            </Button>
            <Button size="sm" variant="outline">更多</Button>
          </div>

          {writingStyleMode === "preset" ? (
            <>
              <div className="relative">
                <div
                  className="border rounded-md p-3 bg-black text-white flex items-center justify-between cursor-pointer"
                  onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                >
                  <span>{selectedStylePreset}</span>
                  <ChevronDown className="h-4 w-4 text-white" />
                </div>

                {showStyleDropdown && (
                  <div className="absolute left-0 right-0 mt-1 border border-gray-700 rounded-md shadow-lg bg-black text-white z-10">
                    {stylePresets.map(style => (
                      <div
                        key={style.id}
                        className="p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0"
                        onClick={() => {
                          setSelectedStylePreset(style.name);
                          setShowStyleDropdown(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`${selectedStylePreset === style.name ? "font-medium" : ""}`}>
                            {style.name}
                          </span>
                          {selectedStylePreset === style.name && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        {selectedStylePreset === style.name && (
                          <div className="text-sm text-gray-300 mt-1">
                            使用方法：搭配【西瓜出品】黄金写作，给一句话简单描述故事；细纲生成正文；润色、扩写、缩写；写清楚需求即可。
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-black text-white p-3 rounded-md border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedStylePreset}</span>
                  <ChevronDown className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  使用方法：搭配【西瓜出品】黄金写作，给一句话简单描述故事；细纲生成正文；润色、扩写、缩写；写清楚需求即可。
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="请输入自定义写作风格"
                className="resize-none h-24"
                value={customWritingStyle}
                onChange={(e) => setCustomWritingStyle(e.target.value)}
              />
              <div className="text-right text-xs text-gray-500">
                {customWritingStyle.length} / 1200
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="writing-requirements">写作要求</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "border-green-200",
                requirementsMode === "preset" ? "bg-green-50 text-green-600" : ""
              )}
              onClick={() => setRequirementsMode("preset")}
            >
              快捷选项
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={requirementsMode === "custom" ? "bg-green-50 text-green-600 border-green-200" : ""}
              onClick={() => setRequirementsMode("custom")}
            >
              自定义
            </Button>
            <Button size="sm" variant="outline">更多</Button>
          </div>

          {requirementsMode === "preset" ? (
            <Select onValueChange={setSelectedRequirementsPreset}>
              <SelectTrigger className="bg-black">
                <SelectValue placeholder="请选择写作要求" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white border-gray-700">
                {requirementsPresets.map(req => (
                  <SelectItem key={req.id} value={req.name} className="hover:bg-gray-800">{req.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="请输入自定义写作要求"
                className="resize-none h-24"
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
              />
              <div className="text-right text-xs text-gray-500">
                {customRequirements.length} / 1200
              </div>
            </div>
          )}
        </div>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="font-medium text-lg">关联知识库</div>

            <div className="space-y-2">
              <Label htmlFor="related-chapters">关联章节(可选)</Label>
              <div className="text-sm text-gray-500">
                可以选择关联章节以提供上下文参考，不选择也可以直接生成内容。
              </div>
              <div className="bg-gray-50 rounded-md p-4 flex flex-col items-center justify-center">
                <div className="text-gray-400 text-sm mb-2">未选择任何章节</div>
                <Button variant="outline" size="sm" className="bg-green-50 text-green-600 border-green-200">
                  选择章节
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-link-recent" className="flex items-center gap-1">
                  自动关联最近
                  <Info className="h-4 w-4 text-gray-400" />
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={recentChaptersCount}
                    onChange={(e) => setRecentChaptersCount(Number(e.target.value))}
                    className="w-16 h-8 text-sm"
                  />
                  <span className="text-sm">字</span>
                  <Switch
                    id="auto-link-recent"
                    checked={autoLinkRecent}
                    onCheckedChange={setAutoLinkRecent}
                    className={autoLinkRecent ? "bg-green-500" : ""}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                可以选择关联章节以提供上下文参考，不选择也可以直接生成内容。
              </div>
              <div className="bg-gray-50 rounded-md p-4 flex flex-col items-center justify-center">
                <div className="text-gray-400 flex items-center justify-center mb-2">
                  <X className="h-4 w-4 text-gray-300 mr-1" />
                  <span className="text-sm">未选择任何章节</span>
                </div>
                <Button variant="outline" size="sm" className="rounded-full bg-green-50 text-green-600 border-green-200 hover:bg-green-100">
                  选择章节
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="related-notes" className="flex items-center gap-1">
                关联备忘录(可选)
              </Label>
              <div className="text-sm text-gray-500">
                可以选择关联备忘录的内容以提供上下文参考，不选择也可以直接生成内容。
              </div>
              <div className="bg-gray-50 rounded-md p-4 flex flex-col items-center justify-center">
                <div className="text-gray-400 flex items-center justify-center mb-2">
                  <X className="h-4 w-4 text-gray-300 mr-1" />
                  <span className="text-sm">未选择任何备忘录</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                    本书备忘录
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full bg-green-50 text-green-600 border-green-200 hover:bg-green-100">
                    选择备忘录
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center mt-4">
          内容由AI生成，仅供参考，请遵循《AI写作工具使用协议》
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            '生成'
          )}
        </Button>
      </div>
    </div>
  );
}