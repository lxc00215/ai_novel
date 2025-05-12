// app/dashboard/inspiration/[id]/components/StoryContent.tsx
'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Wand2 } from 'lucide-react';

interface StoryContentProps {
  displayedLines: (string)[];
  setDisplayedLines: any;
  currentLineIndex: number;
  isTyping: boolean;
  imageStates: any;
}

export default function StoryContent({ 
  displayedLines, 
  setDisplayedLines, 
  currentLineIndex, 
  isTyping,
  imageStates 
}:  StoryContentProps) {
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  
  const aiRewriteLine = (index: number) => {
    // AI重写实现
    setTimeout(() => {
      const newLines = [...displayedLines];
      newLines[index] = "AI 重写了这一行，雪花在空中轻舞，我感受到了前所未有的力量从我的指尖流过，像是冰雪女神赐予我的礼物。";
      setDisplayedLines(newLines);
      setEditingLineIndex(null);
    }, 1000);
  };

  const editLine = (index: number) => {
    setEditingLineIndex(index);
  };

  const saveEditedLine = (index: number, text: string) => {
    const newLines = [...displayedLines];
    newLines[index] = text;
    setDisplayedLines(newLines);
    setEditingLineIndex(null);
  };

  return (
    <div className="w-full space-y-8">
      {displayedLines.map((line, index) => (
        <div key={index} className="text-gray-300">
          {editingLineIndex === index ? (
            <div className="relative border border-gray-700 rounded-lg p-3">
              <textarea
                className="bg-black text-gray-300 w-full pr-10 resize-none outline-none"
                value={line}
                onChange={(e) => {
                  const newLines = [...displayedLines];
                  newLines[index] = e.target.value;
                  setDisplayedLines(newLines);
                }}
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => aiRewriteLine(index)}
                >
                  <Wand2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => saveEditedLine(index, line)}
                >
                  <Check size={14} />
                </Button>
              </div>
            </div>
          ) : typeof line === 'string' && line.startsWith('_CHOICE_') ? (
            // 用户选择提示
            <div className="border-l-4 border-yellow-500 pl-3 py-2 my-2 text-yellow-400 font-medium">
              {line.replace('_CHOICE_', '')}
            </div>
          ) : typeof line === 'string' && line.includes("https://") ? (
            <img src={line} alt="Story illustration" className="w-full h-64 object-cover rounded-lg" />
          ) : (
            <p
              className={`cursor-pointer hover:bg-gray-900 p-2 rounded transition-opacity duration-300 ${
                index === displayedLines.length - 1 && isTyping ? 'border-l-2 border-blue-500 pl-4' : ''
              }`}
              onClick={() => editLine(index)}
            >
              {line}
            </p>
          )}

          {/* 图片加载状态 */}
          {imageStates[index]?.loading && (
            <div className="mt-4 mb-8">
              <div className="w-full h-64 bg-gray-900 rounded-lg animate-pulse flex items-center justify-center">
                <div className="text-gray-500">生成图片中...</div>
              </div>
            </div>
          )}

          {/* 图片展示 */}
          {imageStates[index]?.url && (
            <div className="mt-4 mb-8">
              <img
                src={imageStates[index].url}
                alt="Story illustration"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}