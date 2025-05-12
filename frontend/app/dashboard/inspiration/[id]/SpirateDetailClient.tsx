// app/dashboard/inspiration/[id]/SpirateDetailClient.tsx (客户端组件)
'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/app/services/api';
import { Character, InspirationDetail } from '@/app/services/types';
import { toast } from 'sonner';
import SpirateHeader from './SpirateHeader';
import CharactersList from './CharactersList';
import StoryContent from './StoryContent';
import ChoicesSection from './ChoicesSection';
import CharacterChat from './CharacterChat';
import { Loader2 } from 'lucide-react';

interface SpirateDetailClientProps {
  initialData: InspirationDetail;
  inspirationId: string ;
  isNew: boolean;
}

export default function SpirateDetailClient({ 
  initialData, 
  inspirationId,
  isNew 
}: SpirateDetailClientProps) {
  // 基本状态
  const [inspiration, setInspiration] = useState<InspirationDetail>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>(initialData.characters || []);
  
  // UI状态控制
  const [showHeader, setShowHeader] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showStoryContent, setShowStoryContent] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // 打字机效果状态
  const [typewriterMode] = useState(isNew);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [displayedChoices, setDisplayedChoices] = useState<string[]>(initialData.story_direction || []);
  const [isTyping, setIsTyping] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  
  // 加载和选择状态
  const [isLoadingNextContent, setIsLoadingNextContent] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  
  // 图片相关状态
  const [imageStates, setImageStates] = useState<Record<number, { loading: boolean; url?: string }>>({});
  const [imageGenerationInProgress, setImageGenerationInProgress] = useState<Record<string, boolean>>({});
  
  // 添加滚动参考点
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();

  // 滚动函数 - 更可靠的版本
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };
  
  // 监听displayedLines变化并滚动
  useEffect(() => {
    if (displayedLines.length > 0) {
      // 使用setTimeout确保DOM已更新
      setTimeout(scrollToBottom, 100);
    }
  }, [displayedLines]);

  // 初始化界面
  useEffect(() => {
    if (typewriterMode) {
      // 新内容使用打字机效果
      handleInitialContentWithTypewriter();
    } else {
      // 已有内容直接显示
      showAllContentImmediately();
    }
    
    // 检查角色是否需要生成图片
    if (characters.length > 0) {
      generateMissingCharacterImages(characters);
    }
  }, []);

  // 生成缺少图片的角色图像
  const generateMissingCharacterImages = (charactersToCheck: Character[]) => {
    // 筛选出没有图片的角色
    const charactersToProcess = charactersToCheck.filter(char => 
      !char.image_url || char.image_url.trim() === ''
    );
    
    if (charactersToProcess.length === 0) return;
    
    console.log("需要生成图片的角色:", charactersToProcess.length);
    
    // 顺序处理角色图片生成，避免并发请求
    const processNextCharacter = async () => {
      if (charactersToProcess.length === 0) return;
      
      const character = charactersToProcess.shift();
      if (!character) return;
      
      // 防止重复处理同一角色
      if (imageGenerationInProgress[character.id]) {
        processNextCharacter();
        return;
      }
      
      setImageGenerationInProgress(prev => ({...prev, [character.id]: true}));
      
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const data = await apiService.ai.generateImageFromSpirate(
          character.description,
          character.name,
          inspirationId,
          user.id
        );
        
        if (data?.image) {
          const updatedData = {
            ...character,
            image_url: data.image
          };
          
          await apiService.character.update(character.id, updatedData);
          
          setCharacters(prev => prev.map(char => 
            char.id === character.id ? {...char, image_url: data.image} : char
          ));
        }
      } catch (error) {
        console.error("生成角色图片失败:", character.name, error);
        // 使用默认图片
        setCharacters(prev => prev.map(char => 
          char.id === character.id ? 
            {...char, image_url: `https://via.placeholder.com/400x600?text=${encodeURIComponent(character.name)}`} 
            : char
        ));
      } finally {
        setImageGenerationInProgress(prev => ({...prev, [character.id]: false}));
        await new Promise(resolve => setTimeout(resolve, 1000));
        processNextCharacter(); // 处理下一个角色
      }
    };
    
    // 开始处理第一个角色
    processNextCharacter();
  };

  // 直接显示所有内容
  const showAllContentImmediately = () => {
    setShowHeader(true);
    setShowCharacters(true);
    setShowStoryContent(true);
    setShowChoices(true);
    setShowChat(true);
    
    if (inspiration.content) {
      const contentLines = inspiration.content.split('\n\n').map(line => {
        // 转换选择标记格式
        if (line.includes('您已选择了：') && !line.startsWith('_CHOICE_')) {
          return `_CHOICE_ ${line}`;
        }
        return line;
      });
      
      setDisplayedLines(contentLines);
    }
    
    setDisplayedChoices(inspiration.story_direction || []);
  };

  // 使用打字机效果处理初始内容
  const handleInitialContentWithTypewriter = async () => {
    // 按顺序显示内容部分
    setShowHeader(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setShowCharacters(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setShowStoryContent(true);
    
    if (inspiration.content) {
      const contentLines = inspiration.content.split('\n\n').map(line => {
        if (line.includes('您已选择了：') && !line.startsWith('_CHOICE_')) {
          return `_CHOICE_ ${line}`;
        }
        return line;
      });
      
      await typewriterEffect(contentLines);
    }
    
    // 显示选择和聊天部分
    setShowChoices(true);
    setShowChat(true);
  };

  // 打字机效果
  const typewriterEffect = async (lines: string[]) => {
    if (!typewriterMode) {
      setDisplayedLines(lines);
      setTimeout(scrollToBottom, 100);
      return;
    }
    
    setIsTyping(true);
    
    const isImageUrl = (text: string) => 
      text && text.startsWith('http') && 
      (text.includes('.jpg') || text.includes('.png') || 
       text.includes('.jpeg') || text.includes('.gif'));
    
    for (let i = 0; i < lines.length; i++) {
      setCurrentLineIndex(i);
      const line = lines[i];
      
      if (isImageUrl(line)) {
        // 直接显示图片URL
        setDisplayedLines(prev => {
          const newLines = [...prev];
          newLines[i] = line;
          return newLines;
        });
      } else if (line.includes('【插图】')) {
        // 处理插图标记
        let currentText = '';
        for (let j = 0; j < line.length; j++) {
          currentText += line[j];
          setDisplayedLines(prev => {
            const newLines = [...prev];
            newLines[i] = currentText.replace('【插图】', '');
            return newLines;
          });
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        // 设置图片加载状态并生成图片
        setImageStates(prev => ({...prev, [i]: { loading: true }}));
        generateImage(line, i);
      } else {
        // 处理普通文本
        let currentText = '';
        for (let j = 0; j < line.length; j++) {
          currentText += line[j];
          setDisplayedLines(prev => {
            const newLines = [...prev];
            newLines[i] = currentText;
            return newLines;
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // 每行处理完成后强制滚动
      setTimeout(scrollToBottom, 50);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsTyping(false);
    setTimeout(scrollToBottom, 100);
  };

  // 生成图片
  const generateImage = async (prompt: string, lineIndex: number) => {
    try {
      const data = await apiService.ai.generateImage(prompt.replace('【插图】', ''));
      
      if (data?.image) {
        setImageStates(prev => ({
          ...prev,
          [lineIndex]: { loading: false, url: data.image }
        }));
        
        // 在显示内容中插入图片URL
        setDisplayedLines(prev => {
          const newLines = [...prev];
          if (lineIndex < newLines.length) {
            newLines.splice(lineIndex + 1, 0, data.image);
          }
          return newLines;
        });
        
        return data.image;
      }
    } catch (error) {
      console.error('生成图片失败:', error);
      setImageStates(prev => ({...prev, [lineIndex]: { loading: false }}));
    }
    
    return '';
  };

  // 处理分支选择
  const handleChoiceSelect = async (choice: string) => {
    setSelectedChoice(choice);
    setIsLoadingNextContent(true);
    setShowChoices(false);
    setShowChat(false);
    
    try {
      // 创建用户选择提示
      const choiceNotification = `_CHOICE_ 您已选择了：${choice}`;
      const updatedDisplayedLines = [...displayedLines, choiceNotification];
      setDisplayedLines(updatedDisplayedLines);
      
      // 保存用户选择
      if (inspiration.id) {
        try {
          await apiService.spirate.update({
            id: inspiration.id,
            content: updatedDisplayedLines.join('\n\n'),
            story_direction: inspiration.story_direction
          });
        } catch (error) {
          console.error('保存用户选择失败:', error);
        }
      }
      
      // 获取后续内容
      const response = await apiService.spirate.continue(inspirationId, choice);
      const newContent = response.content || '';
      const newChoices = response.story_direction || [];
      
      // 处理新内容
      if (newContent) {
        const newContentLines = newContent.split('\n\n');
        const startIndex = updatedDisplayedLines.length;
        await typewriterEffectForContinuation(newContentLines, startIndex);
      }
      
      // 更新选项
      setDisplayedChoices(newChoices);
      
      // 更新灵感对象
      setInspiration(prev => ({
        ...prev,
        content: displayedLines.join('\n\n'),
        story_direction: newChoices
      }));
    } catch (error) {
      console.error('获取后续内容失败:', error);
      toast.error('获取后续内容失败，请重试');
    } finally {
      setIsLoadingNextContent(false);
      setSelectedChoice(null);
      setShowChoices(true);
      setShowChat(true);
    }
  };

  // 为继续内容专门的打字机效果
  const typewriterEffectForContinuation = async (lines: string[], startIndex: number) => {
    // 实现类似于typewriterEffect的功能，但针对后续内容
    setIsTyping(true);
    
    const isImageUrl = (text: string) => 
      text && text.startsWith('http') && 
      (text.includes('.jpg') || text.includes('.png') || 
       text.includes('.jpeg') || text.includes('.gif'));
    
    for (let i = 0; i < lines.length; i++) {
      const lineIndex = startIndex + i;
      setCurrentLineIndex(lineIndex);
      const line = lines[i];
      
      if (isImageUrl(line)) {
        // 处理图片URL
        setDisplayedLines(prev => {
          const newLines = [...prev];
          newLines[lineIndex] = line;
          return newLines;
        });
      } else if (line.includes('【插图】')) {
        // 处理插图标记
        let currentText = '';
        for (let j = 0; j < line.length; j++) {
          currentText += line[j];
          setDisplayedLines(prev => {
            const newLines = [...prev];
            newLines[lineIndex] = currentText.replace('【插图】', '');
            return newLines;
          });
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        // 设置图片加载状态并生成图片
        setImageStates(prev => ({...prev, [lineIndex]: { loading: true }}));
        generateImage(line, lineIndex);
      } else {
        // 处理普通文本
        let currentText = '';
        for (let j = 0; j < line.length; j++) {
          currentText += line[j];
          setDisplayedLines(prev => {
            const newLines = [...prev];
            newLines[lineIndex] = currentText;
            return newLines;
          });
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
      
      // 每行处理完成后强制滚动
      setTimeout(scrollToBottom, 50);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsTyping(false);
    setTimeout(scrollToBottom, 100);
  };

  // 如果出错显示错误页面
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl mb-4">出错了</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => router.push('/dashboard/inspiration')}
            className="mt-4 px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* 标题和作者信息 */}
      {showHeader && (
        <SpirateHeader 
          inspiration={inspiration} 
          setInspiration={setInspiration}
          router={router}
        />
      )}

      {/* 角色卡片 */}
      {showCharacters && (
        <CharactersList characters={characters} />
      )}

      {/* 故事内容 */}
      {showStoryContent && (
        <div className="w-full space-y-8">
          <StoryContent 
            displayedLines={displayedLines}
            setDisplayedLines={setDisplayedLines}
            currentLineIndex={currentLineIndex}
            isTyping={isTyping}
            imageStates={imageStates}
          />
          
          {/* 添加滚动参考元素 */}
          <div ref={scrollRef} className="h-px w-full"></div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoadingNextContent && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {/* 选择分支 */}
      {showChoices && (
        <ChoicesSection 
          displayedChoices={displayedChoices}
          handleChoiceSelect={handleChoiceSelect}
          isLoadingNextContent={isLoadingNextContent}
        />
      )}

      {/* 聊天部分 */}
      {showChat && (
        <CharacterChat 
          characters={characters}
          setCharacters={setCharacters}
          inspiration={inspiration}
          router={router}
        />
      )}
    </div>
  );
}