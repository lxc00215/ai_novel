// components/ChatInterface.tsx
'use client'
import React, { useState, useEffect, useRef, use } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SendHorizontal, Info, Smile, Loader2, BookOpen, RefreshCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Message, Character, Session, User } from '@/app/services/types';
import apiService from '@/app/services/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './chatInterface.module.css';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChatInterface = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const characterIdFromUrl = searchParams.get('characterId'); // 从 URL 获取角色 ID
  const [message, setMessage] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [CurrentSessionID, setCurrentSessionID] = useState<number | null>(null);

  const [sessionsResponse, setSessionsResponse] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 获取与特定角色的聊天历史
  const [updateFlag, setUpdateFlag] = useState(false);
  // 添加图片懒加载状态
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});
  // 处理图片加载完成事件
  const handleImageLoaded = (imageId: string) => {
    setLoadedImages(prev => ({ ...prev, [imageId]: true }));
  };




  const handleRefresh = async () => {

    // 清空对话记录
    setMessages([]);
    const res = await apiService.chat.clearSession(Number(CurrentSessionID));

    if (res.message) {
      alert("清空对话记录成功");
    }
  }

  useEffect(() => {
    // 重新获取会话列表
    const getSessions = async () => {
      const sessionsResponse = await apiService.chat.getRecentSessions();
      setSessionsResponse(sessionsResponse);
      setCharacters(sessionsResponse.map((session: any) => session.character));
    }
    getSessions();
  }, [updateFlag]);

  //初始化
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log("初始化聊天界面，URL参数：", characterIdFromUrl);

        // 2. 获取最近的会话列表
        const sessionsResponse = await apiService.chat.getRecentSessions();
        setSessionsResponse(sessionsResponse);

        // 将session中的Character填充到Characters
        characters.push(...sessionsResponse.map((session: any) => session.character));


        // 3. 如果 URL 中有指定角色 ID
        if (characterIdFromUrl) {
          // 
          let flag = false;
          characters.map((character: Character) => {
            if (character.id == characterIdFromUrl) {
              setCurrentCharacter(character);
              flag = true;
            }
          })

          if (flag) {
            const existingSession = sessionsResponse.find(
              (session: any) => session.character_id == characterIdFromUrl
            );
            console.log("是否存在会话:", existingSession ? "是" : "否");

            setCurrentSessionID(Number(existingSession?.id));
            setMessages(existingSession.messages);
          } else {
            console.log("没有现有会话，创建新会话");
            const newSession = await apiService.chat.getOrCreateSession(Number(characterIdFromUrl));
            setCurrentSessionID(newSession['id']);
            // 设置初始消息
            setMessages([{
              session_id: newSession['id'],
              id: '1',
              sender: newSession['character']['name'],
              sender_type: 'character',
              content: `你好，我是 ${newSession['character']['name']}。`,
              created_at: new Date().toISOString()
            }]);
            // 设置当前角色
            setCurrentCharacter(newSession['character']);
            setCurrentSessionID(newSession['id']);
            setUpdateFlag(true);
          }
        } else {
          // 如果没有指定角色 ID，显示最近的一个会话（如果有的话）
          if (sessionsResponse.length > 0) {
            const lastSession = sessionsResponse[0];
            setCurrentSessionID(Number(lastSession.id));
            const character = characters.find(
              char => char.id == lastSession.character_id
            );
            if (character) {
              setCurrentCharacter(character);
              let newMessages: Message[] = [];
              sessionsResponse[0].messages.map((msg: Message) => {
                newMessages.push(msg as Message)
              })
              setMessages(newMessages);
              console.log("newMessages", newMessages);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        // 这里可以添加错误处理，比如显示错误提示
      }
    };
    initializeChat();
  }, [characterIdFromUrl]); // 依赖项添加 characterIdFromUrl

  const switchCharacter = async (character: Character, characterID: string) => {
    setCurrentCharacter(character);

    // 查找是否已有与该角色的会话
    const existingSession = sessionsResponse.find(
      (session: any) => session.character_id == characterID
    );

    if (existingSession) {
      // 如果存在会话，设置会话ID和消息
      setCurrentSessionID(Number(existingSession.id));

      if (existingSession.messages && existingSession.messages.length > 0) {
        setMessages(existingSession.messages);
      } else {
        // 如果没有消息，设置初始消息
        setMessages([{
          session_id: Number(existingSession.id),
          id: '1',
          sender: character.name,
          sender_type: 'character',
          content: `你好，我是 ${character.name}。`,
          created_at: new Date().toISOString()
        }]);
      }
    }
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const myLoader = ({ src }: { src: string }) => {
    return src;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to render avatar or fallback with first letter of name
  // 渲染用户头像
  const renderAvatar = (name: string, avatar?: string, description?: string) => {
    const imageId = `${name}-${avatar}`;
    return (
      <Avatar className="h-10 w-10 border z-1 border-background shadow-md transition-all duration-300 hover:scale-105">
        {avatar ? (
          <div className={styles.avatarContainer}>
            {!loadedImages[imageId] && (
              <div className={styles.avatarPlaceholder}>
                {name?.charAt(0) || 'U'}
              </div>
            )}
            <Image
              src={avatar}
              alt={description ?? ""}
              width={40}
              height={40}
              className={`${styles.avatarImage} ${loadedImages[imageId] ? styles.loaded : ''}`}
              onLoad={() => handleImageLoaded(imageId)}
              loader={myLoader}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background to-background text-foreground font-medium rounded-full">
            {name?.charAt(0) || 'U'}
          </div>
        )}
      </Avatar>
    );
  };

  const handleSendMessage = async () => {
    if (message.trim() && CurrentSessionID && !isNaN(Number(CurrentSessionID))) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: 'User',
        sender_type: 'user',
        content: message,
        created_at: new Date().toISOString(),
        session_id: CurrentSessionID
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessage('');
      setIsLoading(true);
      setStreamingMessage('');

      try {
        const stream = await apiService.chat.sendMessage(CurrentSessionID, message);

        let content = "";
        for await (const chunk of stream.getMessages()) {
          setStreamingMessage(prev => prev + chunk);
          content += chunk;
        }

        const aiMessage: Message = {
          id: `msg-${Date.now()}`,
          content: content,
          sender: currentCharacter?.name || 'character',
          sender_type: 'character',
          created_at: new Date().toISOString(),
          session_id: CurrentSessionID
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("发送消息失败:", error);
        alert("发送消息失败，请重试");
      } finally {
        setIsLoading(false);
        setStreamingMessage('');
      }
    } else if (!CurrentSessionID || isNaN(Number(CurrentSessionID))) {
      alert("请先选择一个角色开始聊天");
    }
  };

  // 即使没有会话也显示界面，不再依赖sessionsResponse.length
  return sessionsResponse.length > 0 ? (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-[350px] border-r border-border pb-15 flex flex-col bg-background overflow-hidden">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl text-foreground font-bold">聊天</h1>
        </div>
        <ScrollArea className="flex-1 p-4 border-b border-border h-full">
          <h2 className="text-lg font-semibold text-foreground mb-4">历史</h2>
          <div className="space-y-4">
            {characters.map((character, index) => (
              <div
                key={`character-${character.id}-${index}`}
                className={`flex items-center space-x-3 cursor-pointer hover:bg-background p-2 rounded-lg transition-all duration-200 ${currentCharacter?.id === character.id ? 'bg-zinc-300' : ''}`}
                onClick={() => switchCharacter(character, character.id)}
              >
                {renderAvatar(character.name, character.image_url, character.description)}
                <div>
                  <p className="font-medium">{character.name}</p>
                  {/* 仅显示一行，多余的用省略号代替 */}
                  <p className="text-foreground/80   text-sm truncate">{sessionsResponse.find((session: any) => session.character_id == character.id)?.last_message ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {/* History */}
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen bg-background">
        {/* Chat Header */}
        <div className="p-3 border-b border-border flex items-center justify-end bg-background bg-opacity-60 backdrop-blur-sm">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-background"
              onClick={() => handleRefresh()}
            >
              <RefreshCcw className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-background"
              onMouseEnter={() => document.getElementById('character-info-card')?.classList.remove('hidden')}
              onMouseLeave={() => setTimeout(() => {
                if (!document.getElementById('character-info-card')?.matches(':hover')) {
                  document.getElementById('character-info-card')?.classList.add('hidden')
                }
              }, 100)}
            >
              <Info className="h-5 w-5" />
            </Button>

            {/* Character info card */}
            <div
              id="character-info-card"
              className="hidden absolute right-0 top-full mt-2 w-96 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ transform: "translateY(10px)" }}
              onMouseEnter={() => document.getElementById('character-info-card')?.classList.remove('hidden')}
              onMouseLeave={() => document.getElementById('character-info-card')?.classList.add('hidden')}
            >
              {currentCharacter && (
                <div className="relative h-[500px]">
                  {/* 背景图片 */}
                  {currentCharacter.image_url ? (
                    <div
                      className="absolute inset-0 w-full h-full"
                      style={{
                        backgroundImage: `url(${currentCharacter.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-background to-background flex items-center justify-center">
                      <span className="text-6xl font-bold">{currentCharacter.name.charAt(0)}</span>
                    </div>
                  )}

                  {/* 文字信息覆盖在底部 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-6">
                    <h3 className="font-bold text-2xl text-white mb-3">{currentCharacter.name}</h3>
                    <p className="text-sm text-gray-200 line-clamp-2 mb-3">{currentCharacter.description}</p>
                    <div className="text-xs text-gray-400 border-t border-gray-700/50 pt-3 flex justify-between">
                      <p>ID: {currentCharacter.id}</p>
                      <p>Session: {sessionsResponse.find((session: any) => session.character_id == currentCharacter.id)?.id ?? ""}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8 max-w-4xl mx-auto">
              {messages && messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_type == 'user' ? 'justify-end' : 'items-start'} gap-3`}>
                  {msg.sender_type !== 'user' && renderAvatar(msg.sender, currentCharacter?.image_url)}
                  <div className={`max-w-[70%] rounded-2xl p-4 shadow-md ${msg.sender_type === 'user'
                    ? 'bg-gradient-to-r from-background to-background border border-border'
                    : 'bg-gradient-to-r from-background to-background border border-border'
                    }`}>
                    {msg.content}
                  </div>
                  {msg.sender_type == 'user' && renderAvatar("Lxc", "")}
                </div>
              ))}
              {/* Streaming Message */}
              {isLoading && streamingMessage.length > 0 ? (
                <div className={`flex items-start gap-3`}>
                  {renderAvatar("Character", currentCharacter?.image_url)}
                  <div className="max-w-[70%] rounded-2xl p-4 shadow-md bg-gradient-to-r from-background to-background border border-border">
                    {streamingMessage}
                  </div>
                </div>
              ) : (
                isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )
              )
              }
              <div ref={messagesEndRef} />
            </div>
          </div>

        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-border bg-background">
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center border border-border rounded-2xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-border hover:border-border transition-all duration-300 shadow-lg">
              <Button
                className="ml-2 bg-background  text-foreground/80 hover:text-foreground/60"
                variant="ghost"
                size="icon"
              >
                <Smile className="h-5 w-5" />
              </Button>

              <input
                type="text"
                className="w-full bg-transparent py-4 px-4 focus:outline-none placeholder-gray-500 text-foreground"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />

              <Button
                className="mr-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-2 transition-all duration-200"
                size="icon"
                onClick={handleSendMessage}
              >
                <SendHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    // 中间加一个按钮，点击按钮跳转到灵感页面
    <div className="flex h-screen bg-black">
      <div className="flex-1 flex flex-col h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black bg-opacity-60 backdrop-blur-sm">
          <h1 className="text-xl font-bold">当前没有角色，您可以前往灵感页面创建</h1>
          <Button
            className="ml-2 bg-transparent hover:bg-transparent text-gray-400 hover:text-gray-300"
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/inspiration')}
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};



export default ChatInterface;