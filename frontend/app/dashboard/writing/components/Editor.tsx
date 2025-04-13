'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Paintbrush, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chapter } from '@/app/services/types';



interface EditorProps {
  chapter: Chapter;
  updateTitle: (title: string) => void;
  updateContent: (content: string) => void;
}

export default function Editor({ chapter, updateTitle, updateContent }: EditorProps) {
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState({ text: '', start: 0, end: 0 });
  const [showAIToolbar, setShowAIToolbar] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState('calc(100vh - 220px)');

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const aiToolbarRef = useRef<HTMLDivElement>(null);

  const safeChapter = chapter || {
    id: 'default',
    title: '加载中',
    content: '',
    order: 0,
    book_id: '',
    summary: ''
  };


  const [localTitle, setLocalTitle] = useState(safeChapter.title);
  const [localContent, setLocalContent] = useState(safeChapter.content);
  



    // 更新本地状态 - 当chapter改变时
    useEffect(() => {
        if (safeChapter) {
          setLocalTitle(safeChapter.title);
          setLocalContent(safeChapter.content || "");
        }
      }, [safeChapter.id, safeChapter.title, safeChapter.content]);
    

  // Textarea auto-resize
  useEffect(() => {


    const adjustHeight = () => {
      if (editorRef.current) {
        setTextareaHeight(`calc(100vh - ${220 + (showAIToolbar ? 50 : 0)}px)`);
      }
    };
    
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [showAIToolbar]);


//   useEffect(() => {
//     setLocalTitle(chapter.title);
//     setLocalContent(chapter.content);
//   }, [chapter.id, chapter.title, chapter.content]);


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
    setLocalTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (localTitle !== safeChapter.title) {
    console.log(localTitle);
      updateTitle(localTitle);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    // 实时更新内容
    updateContent(e.target.value);
  };
  
  // Handle selection changes to show AI toolbar
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current) {
        const selectedText = editorRef.current?.value.substring(
          editorRef.current.selectionStart,
          editorRef.current.selectionEnd
        );
        
        if (selectedText && selectedText.trim().length >= 5) {
          setSelection({
            text: selectedText,
            start: editorRef.current?.selectionStart || 0,
            end: editorRef.current?.selectionEnd || 0
          });
          setShowAIToolbar(true);
        } else {
          setShowAIToolbar(false);
        }
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);
  
  // AI操作处理函数
  const handleAIAction = (action: 'expand' | 'rewrite' | 'polish') => {
    // 这里将来会连接到实际的AI API
    console.log(`AI ${action} action on: "${selection.text}"`);
    
    // 模拟AI操作
    let result = selection.text;
    switch (action) {
      case 'expand':
        result = `${selection.text}（这段描写得到了扩展，增加了更多环境描写和人物细节，使场景更加生动。）`;
        break;
      case 'rewrite':
        result = `（改写后的内容：${selection.text}）`;
        break;
      case 'polish':
        result = `${selection.text}（这段文字已经过润色，语言更加流畅优美，用词更加准确生动。）`;
        break;
    }
    
    // 替换编辑器中的文本
    const beforeSelection = content.substring(0, selection.start);
    const afterSelection = content.substring(selection.end);
    setContent(beforeSelection + result + afterSelection);
    
    // 隐藏AI工具栏
    setShowAIToolbar(false);
  };
  
  // 添加以下状态在 Editor 组件中
  const [searchResults, setSearchResults] = useState<{
    query: string;
    matches: number[];
    currentIndex: number;
  }>({ query: '', matches: [], currentIndex: -1 });
  
  // 替换现有的 search 方法
  const handleSearch = (text: string) => {
    if (editorRef.current && text) {
      const content = editorRef.current.value;
      
      // 查找所有匹配项
      const matches: number[] = [];
      let position = -1;
      
      // 不区分大小写查找
      const lowerContent = content.toLowerCase();
      const lowerText = text.toLowerCase();
      
      position = lowerContent.indexOf(lowerText);
      while (position !== -1) {
        matches.push(position);
        position = lowerContent.indexOf(lowerText, position + 1);
      }
      
      // 更新搜索结果状态
      setSearchResults({
        query: text,
        matches,
        currentIndex: matches.length > 0 ? 0 : -1
      });
      
      // 如果有匹配项，高亮第一个
      if (matches.length > 0) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(matches[0], matches[0] + text.length);
        
        // 确保选中的文本可见
        editorRef.current.scrollTop = Math.max(0, matches[0] - 100);
        
        // 添加自定义高亮样式
        applyCustomHighlight(matches[0], text.length);
        
        return true;
      }
    }
    
    // 重置搜索结果
    setSearchResults({ query: '', matches: [], currentIndex: -1 });
    return false;
  };
  
  // 添加方法用于下一个/上一个匹配
  const handleNextSearchMatch = () => {
    if (searchResults.matches.length === 0) return false;
    
    const nextIndex = (searchResults.currentIndex + 1) % searchResults.matches.length;
    const position = searchResults.matches[nextIndex];
    
    editorRef.current?.focus();
    editorRef.current?.setSelectionRange(position, position + searchResults.query.length);
    editorRef.current!.scrollTop = Math.max(0, position - 100);
    
    // 更新当前索引
    setSearchResults({
      ...searchResults,
      currentIndex: nextIndex
    });
    
    // 应用自定义高亮
    applyCustomHighlight(position, searchResults.query.length);
    return true;
  };
  
  const handlePrevSearchMatch = () => {
    if (searchResults.matches.length === 0) return false;
    
    const prevIndex = (searchResults.currentIndex - 1 + searchResults.matches.length) % searchResults.matches.length;
    const position = searchResults.matches[prevIndex];
    
    editorRef.current?.focus();
    editorRef.current?.setSelectionRange(position, position + searchResults.query.length);
    editorRef.current!.scrollTop = Math.max(0, position - 100);
    
    // 更新当前索引
    setSearchResults({
      ...searchResults,
      currentIndex: prevIndex
    });
    
    // 应用自定义高亮
    applyCustomHighlight(position, searchResults.query.length);
    return true;
  };
  
  // 添加自定义高亮功能
  const applyCustomHighlight = (start: number, length: number) => {
    // 使用CSS自定义高亮样式
    document.documentElement.style.setProperty('--highlight-bg', '#FFEB3B'); // 明亮的黄色
    document.documentElement.style.setProperty('--highlight-text', '#000000'); // 黑色文本
    
    // 添加全局样式
    if (!document.querySelector('#custom-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'custom-highlight-style';
      style.textContent = `
        ::selection {
          background-color: var(--highlight-bg) !important;
          color: var(--highlight-text) !important;
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  // 提供公共方法供父组件或Toolbar调用
  useEffect(() => {
    // 初始化编辑器操作对象
    const editorActionsImpl = {
      copy: () => {
        if (editorRef.current) {
          const selectedText = editorRef.current.value.substring(
            editorRef.current.selectionStart,
            editorRef.current.selectionEnd
          );
          
          if (selectedText) {
            navigator.clipboard.writeText(selectedText);
            return true;
          }
        }
        return false;
      },
      
      search: handleSearch,
      nextSearchMatch: handleNextSearchMatch,
      prevSearchMatch: handlePrevSearchMatch,
      
      replace: (search: string, replace: string) => {
        if (editorRef.current && search) {
          // 使用当前文本内容，而不是可能过时的 content 状态
          const currentContent = editorRef.current.value;
          
          // 如果有搜索结果且当前有选中位置，则替换当前选中的匹配项
          if (searchResults.matches.length > 0 && searchResults.currentIndex >= 0) {
            const position = searchResults.matches[searchResults.currentIndex];
            
            // 确保选中位置确实匹配搜索文本
            const selectedText = currentContent.substring(position, position + searchResults.query.length);
            if (selectedText.toLowerCase() === search.toLowerCase()) {
              const newContent = 
                currentContent.substring(0, position) + 
                replace + 
                currentContent.substring(position + search.length);
              
              // 更新本地内容
              setLocalContent(newContent);
              // 通知父组件更新
              updateContent(newContent);
              
              // 更新所有匹配项位置
              handleSearch(search);
              
              return true;
            }
          }

            // 如果没有当前选中或选中不匹配，尝试找到第一个匹配项并替换
        const position = currentContent.toLowerCase().indexOf(search.toLowerCase());
        if (position !== -1) {
          const newContent = 
            currentContent.substring(0, position) + 
            replace + 
            currentContent.substring(position + search.length);
          
          // 更新本地内容
          setLocalContent(newContent);
          // 通知父组件更新
          updateContent(newContent);
          
          // 重新搜索更新匹配项
          handleSearch(search);
          
          return true;
        }
      }
      return false;
    },
      
    replaceAll: (search: string, replace: string) => {
        if (editorRef.current && search && search.trim() !== '') {
          const currentContent = editorRef.current.value;
          
          // 创建正则表达式，使用 'gi' 标志进行全局和不区分大小写匹配
          const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const newContent = currentContent.replace(regex, replace);
          
          // 更新本地内容
          setLocalContent(newContent);
          // 通知父组件更新
          updateContent(newContent);
          
          // 清除搜索结果
          setSearchResults({ query: '', matches: [], currentIndex: -1 });
          
          return true;
        }
        return false;
      }
    };
    
    // 赋值给全局对象
    window.editorActions = editorActionsImpl;
    
    return () => {
      // 清理全局方法 - 避免使用delete
      window.editorActions = {
        copy: () => false,
        search: () => false,
        replace: () => false,
        replaceAll: () => false,
        nextSearchMatch: () => false,
        prevSearchMatch: () => false
      };
    };
  }, [localContent,searchResults]);
  
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={localTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          className="text-2xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 w-full"
        />
     
      </div>
      
      {/* 编辑器区域 */}
      <div className="relative flex-1">
        <Textarea
          ref={editorRef}
          value={localContent}
          onChange={(e) => handleContentChange(e)}
          className="resize-none text-lg border-none focus:outline-none focus:ring-0 w-full h-full"
          placeholder="开始写作吧..."
          style={{ minHeight: textareaHeight }}
        />
        
        {/* AI操作工具栏 - 选中文本时显示 */}
        {showAIToolbar && (
          <div 
            ref={aiToolbarRef}
            className={cn(
              "absolute bottom-4 left-1/2 transform -translate-x-1/2",
              "flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-2 border z-10"
            )}
          >
            <Button
              size="sm"
              variant="outline"
              className="bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
              onClick={() => handleAIAction('expand')}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI扩写
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
              onClick={() => handleAIAction('rewrite')}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              AI改写
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              onClick={() => handleAIAction('polish')}
            >
              <Paintbrush className="h-4 w-4 mr-1" />
              AI润色
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// 类型扩展 - 为全局window对象添加编辑器方法
declare global {
  interface Window {
    editorActions: {
      copy: () => boolean;
      search: (text: string) => boolean;
      replace: (search: string, replace: string) => boolean;
      replaceAll: (search: string, replace: string) => boolean;
      nextSearchMatch: () => boolean;
      prevSearchMatch: () => boolean;
    };
  }
}