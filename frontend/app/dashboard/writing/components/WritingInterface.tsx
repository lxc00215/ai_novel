'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/app/dashboard/writing/components/Sidebar';
import Editor from '@/app/dashboard/writing/components/Editor';
import AIPanel from '@/app/dashboard/writing/components/AIPanel';
import Toolbar from '@/app/dashboard/writing/components/Toolbar';
import { cn } from '@/lib/utils';
import { Chapter, Novel } from '@/app/services/types';
import apiService from '@/app/services/api';
import { toast } from 'sonner';



interface WritingInterfaceProps {
  novel: Novel;
  setNovel: (novels: Novel) => void;
}

export default function WritingInterface({ novel, setNovel }: WritingInterfaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchResults, setSearchResults] = useState({
    query: '',
    matches: [],
    currentIndex: -1
  });

  // 确保novel不为空 构建novel对象守卫
  const safeNovel = {
    id: "",
    title: "",
    description: "",
    chapters: [],
    user_id: "",
    is_top: false,
    is_archive: false,
    updated_at: "",
    created_at: ""
  }

  const [localNovel,setLocalNovel] = useState<Novel>(safeNovel);

  const [aiPanelWidth, setAiPanelWidth] = useState(350); // 默认宽度
  const [isDragging, setIsDragging] = useState(false);
  const resizeLineRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };


  const handleNextSearchMatch = () => {
    if (searchResults.currentIndex < searchResults.matches.length - 1) {
      setSearchResults({
        ...searchResults,
        currentIndex: searchResults.currentIndex + 1
      });
    }
  };

  const handlePrevSearchMatch = () => {
    if (searchResults.currentIndex > 0) {
      setSearchResults({
        ...searchResults,
        currentIndex: searchResults.currentIndex - 1
      });
    }
  };

  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fun = ()=>{
      if (!(novel)) {
        return;
      }else if(novel.chapters.length === 0){
        const defaultChapter: Chapter = {
          id: "default",
          title: "新建章节",
          content: "",
          order: 1,
          book_id:  "0",
          summary: "",
          prompt: "",
        };
        setNovel({
          ...novel,
          chapters: [defaultChapter]
        });
        console.log("新建章节" + JSON.stringify(novel.chapters));
        setLocalNovel(
          novel
        );
        setCurrentOrder(novel.chapters[0].order);
      }else if(novel.chapters.length > 0 && currentOrder === 0){
        setLocalNovel(novel);
        setCurrentOrder(novel.chapters[0].order);
      }else{
        setLocalNovel(novel);
      }
     
    }
    fun();
  }, [novel, setNovel]);


  useEffect(() => {
    const handleDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      // 计算窗口右边缘到鼠标的距离
      const windowWidth = window.innerWidth;
      const mouseX = e.clientX;
      const newWidth = windowWidth - mouseX;
      // 设置宽度限制：最小200px，最大50%的屏幕宽度
      const minWidth = 200;
      const maxWidth = windowWidth * 0.5;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setAiPanelWidth(newWidth);
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);


  // 当前选中的章节ID
  const [currentOrder, setCurrentOrder] = useState(0);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchText);
    }
  };

  const getCurrentChapter = (): Chapter => {
    if (!novel) {
      // 返回一个默认章节对象，防止错误
      return {
        id: "default",
        title: "未命名章节",
        content: "",
        order: 1,
        book_id:  "0",
        summary: "",
        prompt: ""
      };
    }
    
    // 查找当前选中的章节
    const chapter = novel.chapters.find(c => c.order === currentOrder);
    // 如果未找到，返回第一个章节
    return chapter || novel.chapters[0];
  };


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleAIPanel = () => setIsAIPanelOpen(!isAIPanelOpen);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Editor functions
  const handleSave = () => {
    // 实际项目中这里会保存到数据库或文件系统
    saveChapters();

    toast.success("保存成功");

  };

  const handleUndo = () => {
    console.log('Undo action');
    // 这里将来会调用实际的撤销功能
    document.execCommand('undo');
  };

  // 添加新章节
  const addNewChapter = async () => {

    console.log("添加新章节" + JSON.stringify(novel.id));
    const newOrder = Math.max(...novel.chapters.map(c => c.order), 0) + 1;
    const newChapter: Chapter = {

      id: Date.now().toString(), // 使用时间戳作为ID
      title: `新建章节`,
      content: '',
      order: newOrder,
      book_id: novel.id || "0",
      summary: '',
      prompt: ""
    };


    // 保存到数据库
    const response = await apiService.novels.createChapter(novel.id, newChapter);
    if (response) {
    }

    setNovel({ ...novel, chapters: [...novel.chapters, newChapter] });
    setCurrentOrder(newOrder); // 自动选中新章节
  };

  // 删除章节
  const deleteChapter = (id: number) => {
    // 确保至少有一个章节
    if (novel.chapters.length <= 1) return;

    // 如果删除的是当前选中章节，则自动选中其他章节
    if (id === currentOrder) {
      const index = novel.chapters.findIndex(c => c.order === id);
      // 如果有前一章节，选中前一章节，否则选中后一章节
      const newIndex = index > 0 ? index - 1 : index + 1;
      setCurrentOrder(novel.chapters[newIndex].order);
    }

    setNovel({ ...novel, chapters: novel.chapters.filter(c => c.order !== id) });
  };

  const handleRedo = () => {
    console.log('Redo action');
    // 这里将来会调用实际的重做功能
    document.execCommand('redo');
  };

  const handleCopy = () => {
    console.log('Copy text');

    // 获取当前章节
    const currentChapter = getCurrentChapter();

    if (currentChapter) {
      // 直接复制当前章节的全部内容
      navigator.clipboard.writeText(currentChapter.content)
        .then(() => {
          console.log('全部内容已复制到剪贴板');
          // 可以添加一个临时提示，告诉用户已复制成功
          alert('已复制全部内容到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
          alert('复制失败，请手动选择并复制');
        });
    } else {
      console.log('没有找到当前章节');
    }
  };

  // 搜索和替换功能
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (window.editorActions?.search) {
      const found = window.editorActions.search(text);
      if (!found) {
        console.log('Text not found:', text);
      }
    }
  };

  const handleReplace = (search: string, replace: string) => {
    setSearchText(search);
    setReplaceText(replace);
    if (window.editorActions?.replace) {
      const replaced = window.editorActions.replace(search, replace);
      if (!replaced) {
        console.log('Text not found for replacement:', search);
      }
    }
  };

  const handleReplaceAll = (search: string, replace: string) => {
    setSearchText(search);
    setReplaceText(replace);
    if (window.editorActions?.replaceAll) {
      const replaced = window.editorActions.replaceAll(search, replace);
      if (!replaced) {
        console.log('Text not found for replacement:', search);
      }
    }
  };

  const openCharacterLibrary = () => {
    console.log('Opening character library');
    // Implementation for opening character library would go here
  };

  const openTermLibrary = () => {
    console.log('Opening term library');
    // Implementation for opening term library would go here
  };

  // 更新章节标题
  const updateChapterTitle = (order: number, newTitle: string) => {
    setNovel({
      ...novel, chapters: novel.chapters.map(chapter =>
        chapter.order === order
          ? { ...chapter, title: newTitle }
          : chapter
      )
    });
  };


  const updateChapterContent = (order: number, newContent: string) => {
    setNovel({
      ...novel, chapters: novel.chapters.map(chapter =>
        chapter.order === order
          ? { ...chapter, content: newContent }
          : chapter
      )
    });
  };

  const saveChapters = async () => {
    // 保留本书的所有章节到数据库，只发送一次网络请求
    const response = await apiService.novels.updateNovel(novel.id, novel);
    if (response) {
      console.log("保存成功");
    }
  }


  useEffect(() => {
    const interval = setInterval(() => {
      saveChapters();

    }, 30000); // 每30秒保存一次

    return () => clearInterval(interval);
  }, [novel]);


  // Handle fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Could not enter fullscreen mode:', err);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Could not exit fullscreen mode:', err);
      });
    }
  }, [isFullscreen]);

  // Expose toolbar functions to editor via ref
  useEffect(() => {
    // 向全局对象暴露搜索和替换方法，供Toolbar组件调用
    if (!window.toolbarActions) {
      window.toolbarActions = {
        search: handleSearch,
        replace: handleReplace,
        replaceAll: handleReplaceAll,
        nextSearchMatch: handleNextSearchMatch,
        prevSearchMatch: handlePrevSearchMatch
      };
    }
    return () => {
      delete window.toolbarActions;
    };
  }, []);
  return (
    <div className={`flex h-screen bg-background text-foreground overflow-x-hidden ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Left Sidebar - novel */}
      <div className={`border-r transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <Sidebar
          chapters={localNovel.chapters}
          currentOrder={currentOrder}
          setCurrentOrder={setCurrentOrder}
          addNewChapter={addNewChapter}
          deleteChapter={deleteChapter}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          book_title={localNovel.title}
          toggleAIPanel={toggleAIPanel}
          toggleFullscreen={toggleFullscreen}
          toggleSidebar={toggleSidebar}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCopy={handleCopy}
          onSearchKeyDown={handleSearchKeyDown}
          openCharacterLibrary={openCharacterLibrary}
          openTermLibrary={openTermLibrary}
          className="z-50"
        />

        {/* Right AI Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div ref={editorRef} className="flex-1 overflow-auto">
            <Editor
              chapter={getCurrentChapter()}
              updateTitle={(newTitle: string) => {
                console.log(newTitle);
                console.log(currentOrder);
                updateChapterTitle(currentOrder, newTitle);
              }}
              updateContent={(newContent: string) => {
                updateChapterContent(currentOrder, newContent);
              }}
            />
          </div>

          {/* 可拖动分隔线 - 仅当AI面板打开时显示 */}
          {isAIPanelOpen && (
            <div
              ref={resizeLineRef}
              className={cn(
                "w-1 cursor-col-resize bg-transparent hover:bg-blue-400 active:bg-blue-600 transition-colors",
                isDragging && "bg-blue-600"
              )}
              onMouseDown={handleDragStart}
            >
              <div className="h-16 w-1 bg-gray-300 absolute top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"></div>
            </div>
          )}

          {/* AI面板 */}
          <div
            className={cn(
              "border-l overflow-hidden transition-all duration-300",
              isAIPanelOpen ? "block" : "w-0"
            )}
            style={{ width: isAIPanelOpen ? `${aiPanelWidth}px` : 0 }}
          >
            <AIPanel
              closeAIPanel={toggleAIPanel}
              onContentGenerated={(content) => {
                // 获取当前章节现有内容
                const currentChapter = getCurrentChapter();
                const existingContent = currentChapter?.content || '';

                // 将新内容追加到现有内容后面
                const newContent = existingContent
                  ? `${existingContent}\n\n${content}` // 如果已有内容，添加两个换行再追加
                  : content; // 如果没有内容，直接使用新内容

                // 更新章节内容
                updateChapterContent(currentOrder, newContent);
                toast.success('内容已追加到当前章节');
              }}
            />
          </div>
        </div>
      </div>
    </div>

  );
}
// 类型扩展 - 为全局window对象添加工具栏方法
declare global {
  interface Window {
    toolbarActions?: {
      search: (text: string) => void;
      replace: (search: string, replace: string) => void;
      replaceAll: (search: string, replace: string) => void;
      nextSearchMatch: () => void;
      prevSearchMatch: () => void;
    };
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