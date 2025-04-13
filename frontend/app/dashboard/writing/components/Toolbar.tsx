// File: src/components/Toolbar.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Maximize2,
  BookOpen,
  Save,
  Clock,
  Settings,
  Undo,
  Redo,
  Copy,
  Replace,
  Search,
  AlignLeft,
  Users,
  Tag,
  Sparkles,
  Paintbrush,
  PenTool,
  BookOpen as BookAnalyze,
  Tag as NameTag,
  X,
  Menu
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { createPortal } from 'react-dom';

interface ToolbarProps {
  toggleAIPanel: () => void;
  toggleFullscreen: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  book_title: string;
  openCharacterLibrary: () => void;
  openTermLibrary: () => void;
  className?:string
  toggleSidebar: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

}

export default function Toolbar({ 
  toggleAIPanel, 
  toggleFullscreen,
  toggleSidebar,
  onSave,
  onUndo,
  onRedo,
  onCopy,
  openCharacterLibrary,
  openTermLibrary,
  className='',
  onSearchKeyDown,
  book_title
}: ToolbarProps) {
  const [isReplaceActive, setIsReplaceActive] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchOption, setSearchOption] = useState<'chapter' | 'book'>('chapter');
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const MenuButtonRef = useRef<HTMLDivElement>(null);
  const MaximizeButtonRef = useRef<HTMLDivElement>(null);
  const BookOpenButtonRef = useRef<HTMLDivElement>(null);
  const [MenuTooltipPosition, setMenuTooltipPosition] = useState({ top: 0, left: 0 });
  const [MaximizeTooltipPosition, setMaximizeTooltipPosition] = useState({ top: 0, left: 0 });
  const [BookOpenTooltipPosition, setBookOpenTooltipPosition] = useState({ top: 0, left: 0 });
  const [isSearchActive, setIsSearchActive] = useState(false);
  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  // When replace is activated, focus the search input
  useEffect(() => {
    if (isReplaceActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isReplaceActive]);

  // Handle document formatting
  const handleFormat = () => {
    // Simple implementation - would interact with editor in a real application
    console.log('Formatting document');
    // Code to apply formatting to text would go here
  };


  // Handle notes
  const openNotes = () => {
    console.log('Opening notes');
    // Code to open notes dialog/panel would go here
  };

  // Open history
  const openHistory = () => {
    console.log('Opening history');
    // Code to open version history would go here
  };

  const taggleSearch = () => {
    console.log('taggleSearch');
    setIsSearchActive(true);
    setIsReplaceActive(false);
    // Code to open search dialog would go here
  };

  const taggleReplace = () => {
    console.log('taggleReplace');
    setIsSearchActive(false);
    setIsReplaceActive(true);
    // Code to open search dialog would go here
  };

  // Open settings
  const openSettings = () => {
    console.log('Opening settings');
    // Code to open settings dialog would go here
  };

  // Handle search
  const handleSearch = () => {
    console.log(`Searching for: ${searchText} in ${searchOption}`);
    // Llamar a la función de búsqueda global si está disponible
    if (window.toolbarActions?.search) {
      window.toolbarActions.search(searchText);
    }
  };

  // Handle replace
  const handleReplace = () => {
    console.log(`Replacing "${searchText}" with "${replaceText}"`);
    // Llamar a la función de reemplazo global si está disponible
    if (window.toolbarActions?.replace) {
      window.toolbarActions.replace(searchText, replaceText);
    }
  };

  // Handle replace all
  const handleReplaceAll = () => {
    console.log(`Replacing all "${searchText}" with "${replaceText}"`);
    // Llamar a la función de reemplazo global si está disponible
    if (window.toolbarActions?.replaceAll) {
      window.toolbarActions.replaceAll(searchText, replaceText);
    }
  };

  const firstRowButtons = [
    {icon: <Menu className="h-4 w-4" />,position: MenuTooltipPosition,ref: MenuButtonRef, tooltip: "菜单", onClick: toggleSidebar, },
    {icon: <Maximize2 className="h-4 w-4" />,position: MaximizeTooltipPosition,ref: MaximizeButtonRef, tooltip: "沉浸模式", onClick: toggleFullscreen},
    {icon: <BookOpen className="h-4 w-4" />,position: BookOpenTooltipPosition,ref: BookOpenButtonRef, tooltip: "备忘录", onClick: openNotes},
    
  ]

  const firstRow = ()=>{
    return firstRowButtons.map((button)=>{
      return (
        <div 
        key={button.tooltip}
  className="relative hover:cursor-pointer"
  onMouseEnter={() => {setHoveredButton(button.tooltip);
    const rect = button.ref.current?.getBoundingClientRect();
    if (rect) {
        if(button.tooltip === "菜单"){
            setMenuTooltipPosition({
                top: rect.bottom + window.scrollY + 10,
                left: rect.left + rect.width / 2 + window.scrollX
            });
        }
        if(button.tooltip === "沉浸模式"){
            setMaximizeTooltipPosition({
                top: rect.bottom + window.scrollY + 10,
                left: rect.left + rect.width / 2 + window.scrollX
            });
        }
        if(button.tooltip === "备忘录"){
            setBookOpenTooltipPosition({
                top: rect.bottom + window.scrollY + 10,
                left: rect.left + rect.width / 2 + window.scrollX
            });
        }
  }}}
  onMouseLeave={() => setHoveredButton(null)}
  ref={button.ref}
>
  <Button 
    variant="ghost" 
    size="icon" 
    className={`h-8 w-8 transition-colors ${
      hoveredButton === button.tooltip ? 'border-blue-500 text-blue-500' : ''
    }`}
    onClick={button.onClick}
  >
    {button.icon}
  </Button>
  
  {hoveredButton === button.tooltip && portalEl && createPortal(
    <div 
      className="fixed bg-gray-600 text-white rounded px-2 py-1 z-[9999] text-xs font-normal"
      style={{
        top: `${button.position.top}px`,
        left: `${button.position.left}px`,
        transform: 'translateX(-50%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap'
      }}
    >
      {button.tooltip}
    </div>,
    portalEl
  )}
</div>
    )})
  }


  const buttons = [
    //撤回 撤销撤回 复制 替换 排版 角色库 词条库 沉浸模式 备忘录 保存 历史记录 设置 返回上一页 使用AI生成内容 AI扩写润色 AI续写 AI拆书 AI起名
    {icon: <Undo className="h-4 w-4" />, tooltip: "撤回", onClick: onUndo, },
    {icon: <Redo className="h-4 w-4" />, tooltip: "撤销撤回", onClick: onRedo},
    {icon: <Copy className="h-4 w-4" />, tooltip: "复制", onClick: onCopy},
    {icon: <Replace className="h-4 w-4" />, tooltip: "替换", onClick: taggleReplace},
    {icon: <Search className="h-4 w-4" />, tooltip: "搜索", actions: [{label: "本章搜索", onClick: taggleSearch}, {label: "全书搜索", onClick: handleSearch}]},

    {icon: <AlignLeft className="h-4 w-4" />, tooltip: "排版", onClick: handleFormat},
    {icon: <Users className="h-4 w-4" />, tooltip: "角色库", onClick: openCharacterLibrary},
    {icon: <Tag className="h-4 w-4" />, tooltip: "词条库", onClick: openTermLibrary},
  ]

  const aiButtons = [
    {icon: <Sparkles className="h-4 w-4" />,title:"AI写作", tooltip: "使用AI生成内容", onClick: toggleAIPanel},
    {icon: <PenTool className="h-4 w-4" />,title:"AI续写", tooltip: "在文本末尾使用AI续写内容", onClick: toggleAIPanel},
    {icon: <BookAnalyze className="h-4 w-4" />,title:"AI拆书", tooltip: "跳转至AI拆书功能", onClick: toggleAIPanel},
    {icon: <NameTag className="h-4 w-4" />,title:"AI起名", tooltip: "使用AI生成名称", onClick: toggleAIPanel},
  ]

  const aiButton = () => {
    return aiButtons.map((button) => {
      const isAiHovered = hoveredButton === button.tooltip;
      const buttonRef = useRef<HTMLDivElement>(null);
      const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
      
      // 当按钮被悬浮时计算提示框位置
      useEffect(() => {
        if (isAiHovered && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setTooltipPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + rect.width / 2 + window.scrollX
          });
        }
      }, [isAiHovered]);
      
      return (
        <div 
          ref={buttonRef}
          key={button.tooltip} 
          className="relative hover:cursor-pointer"
          onMouseEnter={() => setHoveredButton(button.tooltip)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Button 
            variant="outline" 
            size="sm" 
            className={`bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 ${
              isAiHovered ? 'border-blue-500' : ''
            }`}
            onClick={button.onClick}
          >
            {button.icon}
            {button.title}
          </Button>
          
          {/* 使用portal将提示框渲染到body */}
          {isAiHovered && portalEl && createPortal(
            <div 
              className="fixed bg-gray-100 text-black border border-gray-200 rounded-md shadow-md z-[9999] py-1"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translateX(-50%)',
                width: 'auto',
                minWidth: '120px',
                maxWidth: '250px'
              }}
            >
              <div className="px-3 py-1.5 text-sm whitespace-nowrap">
                {button.tooltip}
              </div>
            </div>,
            portalEl
          )}
        </div>
      );
    });
  };

  const tooltipButtons = () => {
    const tooltipButtons = buttons.map((button) => {
      const isHovered = hoveredButton === button.tooltip;
      const buttonRef = useRef<HTMLDivElement>(null);
      const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
      
      useEffect(() => {
        if (isHovered && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setTooltipPosition({
            top: rect.bottom + window.scrollY + 2, // 只需要很小的间距
            left: rect.left + rect.width / 2 + window.scrollX
          });
        }
      }, [isHovered]);
      
      return (
        <div 
          ref={buttonRef}
          key={button.tooltip} 
          className="relative hover:cursor-pointer"
          onMouseEnter={() => setHoveredButton(button.tooltip)}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 transition-colors ${
              isHovered ? 'border-blue-500 text-blue-500' : ''
            }`} 
            onClick={button.onClick}
          >
            {button.icon}
          </Button>
          
          {/* 简化的灰色提示框 */}
          {isHovered && portalEl && createPortal(
            <div 
              className="fixed bg-gray-600 text-white rounded px-2 py-1 z-[9999] text-xs font-normal"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translateX(-50%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap'
              }}
            >
              {button.actions ? (
                <div className="flex flex-col">
                  {button.actions.map((action, index) => (
                    <button 
                      key={index}
                      className="text-left hover:bg-gray-700 px-2 py-1 rounded w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                        setHoveredButton(null);
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : (
                button.tooltip
              )}
            </div>,
            portalEl
          )}
        </div>
      );
    });
     
    return tooltipButtons;
  };
  
  return (
    <div className={`border-b bg-white  sticky top-0 ${className}`}>
      {/* First Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
       
        
          
         {firstRow()}
        </div>
        
        <div className="text-lg font-medium">{book_title}</div>
        
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSave}>
                  <Save className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>保存</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openHistory}>
                  <Clock className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>历史记录</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openSettings}>
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>设置</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Second Row */}
      <div className="flex items-center p-2 gap-2 overflow-x-auto">
        {/* Regular Editing Icons */}
       {tooltipButtons()}
        
        {/* AI Feature Buttons */}
        <div className="flex items-center gap-2 ml-2 overflow-x-auto">
          
        {aiButton()}
        </div>
      </div>

      {/* Search Input */}
      {isSearchActive && (
        <div className="flex items-center px-3 py-2 gap-2 border-t bg-gray-50">
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1">
              <Input 
                type="text" 
                className="w-full"
                placeholder="查找..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={onSearchKeyDown}
              />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleSearch}>
          搜索
        </Button>
        <Button size="sm"  onClick={() => setIsSearchActive(false)}>
          <X className="h-4 w-4" />
        </Button>
        </div>
      )}
      {/* If replace mode is active, show the replace input */}
      {isReplaceActive && (
        <div className="flex items-center px-3 py-2 gap-2 border-t bg-gray-50">
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1">
              <Input 
                type="text" 
                className="w-full"
                placeholder="查找..." 
                value={searchText}
                onKeyDown={onSearchKeyDown}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input 
                type="text" 
                className="w-full"
                placeholder="替换为..." 
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={handleReplace}>
              替换
            </Button>
            <Button size="sm" variant="outline" onClick={handleReplaceAll}>
              全部替换
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="p-1 h-7 w-7"
              onClick={() => setIsReplaceActive(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
