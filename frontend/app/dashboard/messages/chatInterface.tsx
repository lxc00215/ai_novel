// components/ChatInterface.tsx
'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizontal, Info, Smile, Loader2, BookOpen, RefreshCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Message, Character, Session } from '@/app/services/types';
import apiService from '@/app/services/api';
import { useRouter } from 'next/navigation';


const ChatInterface = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const characterIdFromUrl = searchParams.get('characterId'); // 从 URL 获取角色 ID
  const [message, setMessage] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  // const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [CurrentSessionID, setCurrentSessionID] = useState<number | null>(null);
  //   const [sessions, setSessions] = useState<Session[]>([]);

  const [sessionsResponse, setSessionsResponse] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 获取与特定角色的聊天历史


  const handleRefresh = async () => {

    console.log("CurrentSessionID", CurrentSessionID);
    // 清空对话记录
    setMessages([]);
    const res = await apiService.chat.clearSession(Number(CurrentSessionID));

    if (res.message) {
      alert("清空对话记录成功");
    }
  }

  //初始化
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // 1. 获取所有角色列表
        const charactersResponse = await apiService.character.getCharacters(4);
        setCharacters(charactersResponse);

        // 2. 获取最近的会话列表
        const sessionsResponse = await apiService.chat.getRecentSessions(4);
        setSessionsResponse(sessionsResponse);
        // 3. 如果 URL 中有指定角色 ID
        if (characterIdFromUrl) {
          // 在角色列表中找到对应角色
          const targetCharacter = charactersResponse.find(
            char => char.id == characterIdFromUrl
          );
          console.log("targetCharacter", JSON.stringify(targetCharacter));
          if (targetCharacter) {
            // 检查是否已有与该角色的会话
            const existingSession = sessionsResponse.find(
              session => session.character_id == characterIdFromUrl
            );


            if (existingSession) {
              setCurrentSessionID(existingSession?.id);
              setMessages(existingSession.messages);
            } else {
              // 如果没有现有会话，创建新会话
              const { getCurrentUserId } = await import('@/app/utils/jwt')
              const userId = getCurrentUserId();
              const newSession = await apiService.chat.getOrCreateSession(userId, Number(characterIdFromUrl));
              setCurrentSessionID(newSession.id);
              // 设置初始消息
              setMessages([{
                session_id: newSession.id,
                id: '1',
                sender: targetCharacter.name,
                sender_type: 'character',
                content: `你好，我是 ${targetCharacter.name}。`,
                created_at: new Date().toISOString()
              }]);
            }
            // 设置当前角色
            setCurrentCharacter(targetCharacter);
          }
        } else {
          // 如果没有指定角色 ID，显示最近的一个会话（如果有的话）
          if (sessionsResponse.length > 0) {
            const lastSession = sessionsResponse[0].session;
            console.log("lastSession", lastSession);
            setCurrentSessionID(lastSession.id);
            const character = charactersResponse.find(
              char => char.id == lastSession.character_id
            );
            console.log("character", character);
            if (character) {
              setCurrentCharacter(character);
              //   const historyResponse = await apiService.chat.getChatHistory(lastSession.id);
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
    // setUserAvatar('/avatars/user.jpg');
  }, [characterIdFromUrl]); // 依赖项添加 characterIdFromUrl


  const switchCharacter = async (character: Character, characterID: string) => {
    setCurrentCharacter(character);
    console.log("sessionID", sessionsResponse[0].session);
    const existingSession = sessionsResponse.find(
      session => session.session.character_id == characterID
    );
    console.log(JSON.stringify(existingSession) + "existingSession");
    if (existingSession?.messages.length == 0) {
      // 设置初始消息
      setMessages([{
        session_id: existingSession?.id,
        id: '1',
        sender: character.name,
        sender_type: 'character',
        content: `你好，我是 ${character.name}。`,
        created_at: new Date().toISOString()
      }]);
    }
    console.log(JSON.stringify(existingSession) + "existingSession");

    if (existingSession) {
      console.log("existingSession", existingSession.session.id);
      setCurrentSessionID(existingSession.session.id);
      console.log("currentSessionID", CurrentSessionID);
      setMessages(existingSession.messages);
    }
    setCurrentSessionID(existingSession?.session.id);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to render avatar or fallback with first letter of name
  const renderAvatar = (name: string, avatar?: string) => {
    return (
      <Avatar className="h-10 w-10 border z-1 border-gray-300 shadow-md transition-all duration-300 hover:scale-105">
        {avatar ? (
          <img src={avatar ?? ''} alt={name} className="h-full w-full object-cover rounded-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-100 font-medium rounded-full">
            {name ?? 'L'.charAt(0)}
          </div>
        )}
      </Avatar>
    );
  };



  // Format message content to handle action text (italics)
  //   const formatMessageContent = (message: Message) => {
  //     if (!message.action) return <p className="text-base">{message.content}</p>;

  //     return (
  //       <div>
  //         {message.action && <p className="text-gray-400 italic mb-1 text-sm">*{message.action}*</p>}
  //         <p className="text-base">{message.content}</p>
  //       </div>
  //     );
  //   };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: 'User',
        sender_type: 'user',
        content: message,
        created_at: new Date().toISOString(),
        session_id: CurrentSessionID || 0
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessage('');
      setIsLoading(true);

      // 创建一个空的 assistant 消息用于流式显示
      setStreamingMessage('');

      const stream = await apiService.chat.sendMessage(Number(CurrentSessionID), message);

      let content = "";
      for await (const chunk of stream.getMessages()) {
        setStreamingMessage(prev => prev + chunk);

        content += chunk;
      }

      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        content: content,
        sender: 'character',
        sender_type: 'character',
        created_at: new Date().toISOString(),
        session_id: CurrentSessionID || 0
      }
      console.log(JSON.stringify(aiMessage) + "aiMessage");
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      setStreamingMessage('');
    };
  }
  //   const handleQuickResponse = (text: string) => {
  //     setMessage(text);
  //     // Optional: automatically send the message after selecting a quick response
  //     setTimeout(() => handleSendMessage(), 100);
  //   };

  //   const switchCharacter = (character: Character) => {
  //     setCurrentCharacter(character);
  //     // In a real app, you would fetch the conversation history with this character
  //   };
  return sessionsResponse.length > 0 ? (
    <div className="flex h-screen bg-black">
      {/* Left Sidebar */}
      <div className="w-[350px] border-r border-gray-800 flex flex-col bg-black overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">聊天</h1>
        </div>
        {/* Recommended Characters */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold mb-4">历史</h2>
          <div className="space-y-4">
            {characters.map(character => (
              <div
                key={character.id}
                className={`flex items-center space-x-3 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-all duration-200 ${currentCharacter?.id === character.id ? 'bg-gray-800' : ''
                  }`}
                onClick={() => switchCharacter(character, character.id)}
              >
                {renderAvatar(character.name, character.image_url)}
                <div>
                  <p className="font-medium">{character.name}</p>
                  <p className="text-gray-400 text-sm truncate">{sessionsResponse.find(session => session.session.id == character.session_id)?.session.last_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}

      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen bg-gradient-to-b from-gray-900 to-black">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            {currentCharacter && renderAvatar(currentCharacter.name, currentCharacter.image_url)}
            <div>
              <span className="font-medium text-lg">{currentCharacter?.name || 'Lily Moore'}</span>
              <div className="text-gray-400 text-sm">Mar 3</div>
            </div>
          </div>
          <div className="relative">

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-800"
              onClick={() => handleRefresh()}
            >
              <RefreshCcw className="h-5 w-5" />
            </Button>
            {/* Info button with hover/click functionality */}


            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-800"
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
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center">
                      <span className="text-6xl font-bold">{currentCharacter.name.charAt(0)}</span>
                    </div>
                  )}

                  {/* 文字信息覆盖在底部 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-6">
                    <h3 className="font-bold text-2xl text-white mb-3">{currentCharacter.name}</h3>
                    <p className="text-sm text-gray-200 line-clamp-2 mb-3">{currentCharacter.description}</p>
                    <div className="text-xs text-gray-400 border-t border-gray-700/50 pt-3 flex justify-between">
                      <p>ID: {currentCharacter.id}</p>
                      <p>Session: {currentCharacter.session_id}</p>
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
                      ? 'bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-700'
                      : 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-800'
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
                  <div className="max-w-[70%] rounded-2xl p-4 shadow-md bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-800">
                    {streamingMessage}
                  </div>
                </div>
              ) : (
                isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

        </div>



        {/* Message Input */}
        <div className="p-6 border-t border-gray-800 bg-black">
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center border border-gray-700 rounded-2xl overflow-hidden bg-gray-900 focus-within:ring-2 focus-within:ring-gray-600 hover:border-gray-600 transition-all duration-300 shadow-lg">
              <Button
                className="ml-2 bg-transparent hover:bg-transparent text-gray-400 hover:text-gray-300"
                variant="ghost"
                size="icon"
              >
                <Smile className="h-5 w-5" />
              </Button>

              <input
                type="text"
                className="w-full bg-transparent py-4 px-4 focus:outline-none text-gray-100 placeholder-gray-500"
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