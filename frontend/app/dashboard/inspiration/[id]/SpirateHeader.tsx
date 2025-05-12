// app/dashboard/inspiration/[id]/components/SpirateHeader.tsx
'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Wand2 } from 'lucide-react';
import { InspirationDetail } from '@/app/services/types';

interface SpirateHeaderProps{ 
  inspiration: InspirationDetail; 
  setInspiration: (inspiration: InspirationDetail) => void; 
  router: any; 
};

export default function SpirateHeader({ 
  inspiration, 
  setInspiration, 
  router 
}:SpirateHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);

  function parseTime(time: string) {
    const timeArray = time.split("-");
    return timeArray[0] + "年" + timeArray[1] + "月";
  }

  return (
    <div className="w-full text-left mb-6 animate-fadeIn">
      {editingTitle ? (
        <div className="relative inline-block">
          <input
            type="text"
            className="text-xl font-bold mb-2 bg-black border border-gray-700 rounded-md px-2 py-1 text-left outline-none focus:border-blue-500"
            value={inspiration?.title}
            onChange={(e) => setInspiration({ ...inspiration, title: e.target.value })}
            autoFocus
            onBlur={() => setEditingTitle(false)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setEditingTitle(false);
              }
            }}
          />
          <div className="absolute top-1 right-1 flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setEditingTitle(false)}
            >
              <Check size={14} />
            </Button>
          </div>
        </div>
      ) : (
        <h2
          className="text-xl font-bold mb-2 cursor-pointer hover:bg-gray-900 p-1 rounded inline-block"
          onClick={() => setEditingTitle(true)}
        >
          {inspiration?.title}
        </h2>
      )}

      <div className="flex flex-col text-sm text-gray-400">
        <p>作者: {inspiration?.user?.account}</p>
        <p>最后更新: {parseTime(inspiration?.updated_at)}</p>
      </div>
      
      <div className="text-sm text-gray-300 mt-4 border border-gray-800 rounded-lg p-3">
        {!editingPrompt ? (
          <div className="flex items-center justify-between">
            <p className="truncate flex-1">
              {inspiration?.prompt}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="ml-2 h-6 text-xs border-gray-700 text-white"
              onClick={() => setEditingPrompt(true)}
            >
              <Wand2 size={14} className="mr-1" />
              重新开始
            </Button>
          </div>
        ) : (
          <div className="relative">
            <textarea
              className="bg-black text-gray-300 w-full resize-none outline-none min-h-[15px] mb-8"
              value={inspiration?.prompt}
              onChange={(e) => setInspiration({ ...inspiration, prompt: e.target.value })}
              style={{ height: 'auto', overflow: 'hidden' }}
              onInput={(e: any) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-gray-700 text-white"
                onClick={() => {
                  setEditingPrompt(false);
                  router.push(`/dashboard/inspiration?prompt=${inspiration?.prompt}`);
                }}
              >
                <Wand2 size={14} className="mr-1" />
                重新开始
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-white text-black hover:bg-gray-200"
                onClick={() => setEditingPrompt(false)}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}