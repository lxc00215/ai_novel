'use client'
import apiService, { request } from '@/app/services/api';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle, Check, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { InspirationDetail } from '@/app/services/types';
import { toast } from 'sonner';


async function getInspirationData(id: string) {
  try {
    const response = await request(`/spirate/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response) {
      return null;
    }

    return response;
  } catch (error) {
    console.error('Error fetching inspiration:', error);
    return null;
  }
}

export default function SpirateDetail() {

  const searchParams = useSearchParams();
  const isNew = searchParams.get('is_new');

  const params = useParams();

  const inspiration_id = params?.id as string;

  const [inspiration, setInspiration] = useState<InspirationDetail>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // 添加打字机模式控制
  const [typewriterMode] = useState(isNew == 'true'?true:false);

  const [editingLineIndex, setEditingLineIndex] = useState(null);
  const [storyLines, setStoryLines] = useState([]);


  const [characters,setCharacters] = useState([ 
    { id:1,name: "Poppy Abel", description: "Brave and intuitive student. On a trip north in January, Poppy discovers a mysterious force.", image_url: "/api/placeholder/260/320" },
      { id:2,name: "Ava", description: "An energetic and charismatic fire elemental. Strong but sometimes impulsive and hot-headed.", image_url: "/api/placeholder/260/320" },
      { id:3,name: "Luna", description: "Known for her quiet wisdom in the shadows. She is loyal, intuitive, and playful. Luna provides emotional support.", image_url: "/api/placeholder/260/320" },
      { id:4,name: "Mason", description: "A technical genius with a dry sense of humor.", image_url: "/api/placeholder/260/320" },
      { id:5,name: "Ridge", description: "Mountain guide with deep knowledge of local legends.", image_url: "/api/placeholder/260/320" }]);

  const [editingPrompt, setEditingPrompt] = useState(false);
  const [storyTitle, setStoryTitle] = useState('雪女巫');
  const [editingTitle, setEditingTitle] = useState(false);

  // 添加新的状态来控制各个部分的显示
  const [showHeader, setShowHeader] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showStoryContent, setShowStoryContent] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [displayedChoices, setDisplayedChoices] = useState<string[]>([]);

  // 添加新的状态
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // 添加新的状态来存储图片状态
  const [imageStates, setImageStates] = useState<{[key: number]: {
    loading: boolean;
    url?: string;
  }}>({});

  // 添加新的状态来跟踪是否所有图片都已生成完成
  const [allImagesGenerated, setAllImagesGenerated] = useState(false);
  const [updatedStoryLines, setUpdatedStoryLines] = useState([]);

  const router = useRouter();
  // 添加分支打字机效果的状态
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState(0);
  const [currentChoiceText, setCurrentChoiceText] = useState('');




  // Function to get a random story prompt
  // Handle mouse move to create light effec
  // 修改 typewriterEffect 函数

  // ... 其他代码保持不变 ...

// 同时进行打字机效果和角色图片生成
const handleContentAndImages = async (responseData) => {
  // 开始打字机效果
  const typewriterPromise = showContentSequentially(responseData);
 
  // 生成角色图片
  const imagePromises = responseData.characters.map(async (character) => {
    const data = await apiService.ai.generateImage(character.description);
    const image_url = data.image;
    character.image_url = image_url;

    const json_data = {
      id: character.id,
      name: character.name,
      description: character.description,
      image_url: image_url,
      is_used: false,
      user_id: responseData.user.id
    };

    // 更新角色信息
    const updatedCharacter = await apiService.character.update(character.id, json_data);
    console.log("updatedCharacter",updatedCharacter);
    if (updatedCharacter) {
      // 更新UI
      setCharacters((prevCharacters) =>
        prevCharacters.map((char) => {
          if (char.id === character.id) {
            return { ...char, image_url };
          }
          return char;
        })
      );
    }
    // console.log("updatedCharacter",updatedCharacter);
    return character;
  });

  // 等待所有图片生成完成
  await Promise.all(imagePromises);

  // 等待打字机效果完成
  await typewriterPromise;
};

// 在需要的地方调用
  useEffect(() => {
    async function fetchData() {
      try {
        if (!inspiration_id || inspiration_id === 'undefined' || inspiration_id === 'null') {
          throw new Error('Invalid ID');
        }
        const responseData = await getInspirationData(inspiration_id);
        
        if (!responseData) {
          throw new Error('No data found');
        }
        setInspiration(responseData);

        setCharacters(responseData.characters);
        
        setIsLoading(false);
       
        if (typewriterMode) {
          // 新生成的内容使用打字机效果
          try{
            await handleContentAndImages(responseData);
          }catch(err){
            console.error('Error:', err);
            return;
          }
        } else {
          // 已有内容直接全部显示
          showAllContentImmediately(responseData);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params?.id]); // 只在 id 变化时重新获取数据
  
    // 修改图片生成函数
    const generateImage = async (prompt: string, lineIndex: number): Promise<string> => {
      try {
        // 调用后端生成图片
        const data = await apiService.ai.generateImage(prompt.replace('【插图】', ''));
        const imageUrl = data.image;
        console.log("imageUrl1",imageUrl);
        // 更新图片状态
        setImageStates(prev => ({
          ...prev,
          [lineIndex]: { loading: false, url: imageUrl }
        }));
        //下载图片到本地
        return imageUrl;
      } catch (error) {
        console.error('Error generating image:', error);
        setImageStates(prev => ({
          ...prev,
          [lineIndex]: { loading: false }
        }));
        return ''; // 返回空字符串表示生成失败
      }
    };
    // 添加一个 useEffect 来监听所有图片是否生成完成
    useEffect(() => {
      if (allImagesGenerated && updatedStoryLines.length > 0 && typewriterMode) {
        // 所有图片都生成完成，将更新后的内容保存到后端
        const saveContent = async () => {
          try {
            await apiService.spirate.update( {
              id:inspiration?.id,
              content: updatedStoryLines.join('\n')
            });
          } catch (error) {
            console.error('Error saving story content:', error);
          }
        };
        // saveContent();
      }
    }, [allImagesGenerated, updatedStoryLines]);
    
    //解析时间  只保留年月日
    function parseTime(time:string){
        // 2025-03-24T20:00:00 切割
        const timeArray = time.split("-")
        return timeArray[0] + "年" + timeArray[1] + "月"
    }
      // AI rewrite a line
  const aiRewriteLine = (index) => {
    // Simulate AI rewriting
    setTimeout(() => {
      const newLines = [...storyLines];
      newLines[index] = "AI 重写了这一行，雪花在空中轻舞，我感受到了前所未有的力量从我的指尖流过，像是冰雪女神赐予我的礼物。";
      setStoryLines(newLines);
      setEditingLineIndex(null);
    }, 1000);
  };

  const editLine = (index) => {
    setEditingLineIndex(index);
  };

  // Save edited line
  const saveEditedLine = (index:number, newText:string) => {
    const newLines = [...storyLines];
    newLines[index] = newText;
    setStoryLines(newLines);
    setEditingLineIndex(null);
  };

  // 添加直接显示所有内容的函数
  const showAllContentImmediately = (contentData) => {
    setShowHeader(true);
    setShowCharacters(true);
    setShowStoryContent(true);
    setShowChoices(true);
    setShowChat(true);
    
    // 直接设置所有内容
    if (contentData.content) {
      setDisplayedLines(contentData.content.split('\n'));
    }
    console.log("contentData.story_direction",contentData);
    setDisplayedChoices(contentData.story_direction || []);
  };

  // 修改顺序展示函数
  const showContentSequentially = async (contentData) => {
    // 显示标题和作者信息
    setShowHeader(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 显示角色卡片
    setShowCharacters(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 显示故事内容
    setShowStoryContent(true);
    if (contentData.content) {
      setHasStartedTyping(true);
      await typewriterEffect(contentData.content.split('\n'));
    }
    console.log("contentData.story_direction",contentData);
    setDisplayedChoices(contentData.story_direction || []);
  };

  // 修改打字机效果函数，添加模式判断
  const typewriterEffect = async (lines: string[]) => {
    if (!typewriterMode) {
      // 非打字机模式直接显示所有内容
      setDisplayedLines(lines);
      setShowChoices(true);
      setDisplayedChoices(inspiration?.story_direction || []);
      setShowChat(true);
      return;
    }

    setIsTyping(true);
    setDisplayedLines([]);
    setUpdatedStoryLines([]);
    
    // 用于存储最终要保存的完整内容
    let finalStoryContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      setCurrentLineIndex(i);
      const line = lines[i];
      let currentText = '';

      if (line.includes('【插图】')) {
        // 显示文本内容的打字机效果
        for (let j = 0; j < line.length; j++) {
          currentText += line[j];
          setDisplayedLines(prev => {
            const newLines = [...prev];
            newLines[i] = currentText.replace('【插图】', '');
            return newLines;
          });
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 设置图片加载状态
        setImageStates(prev => ({
          ...prev,
          [i]: { loading: true }
        }));

        // 生成图片并获取新的URL
        const new_image_url = await generateImage(line, i);
        
        // 将文本内容和图片URL添加到最终内容中
        finalStoryContent.push(line.replace('【插图】', ''));
        finalStoryContent.push(new_image_url);

        // 更新显示的内容
        setUpdatedStoryLines(prev => {
          const newLines = [...prev];
          newLines[i] = line.replace('【插图】', '');
          newLines.splice(i + 1, 0, new_image_url); // 在文本后插入图片URL
          return newLines;
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // 普通文本行的处理
        for (let j = 0; j < line.length; j++) {
          currentText += line[j];
          setDisplayedLines(prev => {
            const newLines = [...prev];
            newLines[i] = currentText;
            return newLines;
          });
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 将普通文本添加到最终内容中
        finalStoryContent.push(line);
        
        // 更新显示的内容
        setUpdatedStoryLines(prev => {
          const newLines = [...prev];
          newLines[i] = line;
          return newLines;
        });
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 所有内容处理完成后，保存到后端
    try {
      // 将数组转换为字符串，使用换行符连接
      const completeStoryContent = finalStoryContent.join('\n');
      
      // 调用API保存更新后的内容
      await apiService.spirate.update({
        id: inspiration_id,
        content: completeStoryContent,
        // 其他需要更新的字段...
      });

      console.log('Story content updated successfully');
    } catch (error) {
      console.error('Failed to update story content:', error);
      toast.error('保存故事内容失败');
    }

    setIsTyping(false);
    setAllImagesGenerated(true);
    await showChoicesWithEffect(inspiration?.story_direction || []);
  };

  // 修改选择分支显示函数，添加模式判断
  const showChoicesWithEffect = async (choices: string[]) => {
    if (!typewriterMode) {
      setShowChoices(true);
      setDisplayedChoices(choices);
      setShowChat(true);
      return;
    }

    setShowChoices(true);
    
    // 逐个处理每个选项
    for (let i = 0; i < choices.length; i++) {
      setCurrentChoiceIndex(i);
      const choice = choices[i];
      let currentText = '';

      // 逐字显示当前选项
      for (let j = 0; j < choice.length; j++) {
        currentText += choice[j];
        setCurrentChoiceText(currentText);
        await new Promise(resolve => setTimeout(resolve, 50)); // 调整打字速度
      }

      // 当前选项完成后，将其添加到已显示的选项列表中
      setDisplayedChoices(prev => [...prev, choice]);
      setCurrentChoiceText('');
      
      // 每个选项之间的停顿
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    // 所有选项显示完成后
    setCurrentChoiceIndex(-1);
    setShowChat(true);
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return  (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* 标题和作者信息 */}
      {showHeader && (
        <div className={`w-full text-left mb-6 ${typewriterMode ? 'animate-fadeIn' : ''}`}>
          {editingTitle ? (
            <div className="relative inline-block">
              <input
                type="text"
                className="text-xl font-bold mb-2 bg-black border border-gray-700 rounded-md px-2 py-1 text-left outline-none focus:border-blue-500"
                value={inspiration?.title}
                onChange={(e) => setInspiration({...inspiration, title: e.target.value})}
                autoFocus
                onBlur={() => setEditingTitle(false)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setInspiration({...inspiration, title: title});
                    setEditingTitle(false);
                  }
                }}
              />
              <div className="absolute top-1 right-1 flex space-x-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setInspiration({...inspiration, title: title});
                    setEditingTitle(false);
                  }}
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
            <p>作者: {inspiration?.user.account}</p>
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
                  onChange={(e) => setInspiration({...inspiration, prompt: e.target.value})}
                  style={{ height: 'auto', overflow: 'hidden' }}
                  onInput={(e) => {
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
                      // startGeneration();
                      setEditingPrompt(false);
                      //跳转到 inspiration 页面,传一个参数
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
      )}

      {/* 角色卡片 */}
      {showCharacters && (
        <div className={`flex w-full overflow-x-auto gap-4 mb-8 pb-2 ${typewriterMode ? 'animate-fadeIn' : ''}`}>
          {characters.map((char, idx) => (
            //如果image_url为空，则默认显示正在加载动画
           
            <div 
              key={idx} 
              className="relative flex-shrink-0 w-48 h-64 rounded-lg overflow-hidden group"
            >
              {char.image_url ? (
              <img 
                src={char.image_url} 
                alt={char.name} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />):(<div className="relative flex-shrink-0 w-48 h-64 rounded-lg overflow-hidden group">
              <div className="w-full h-full bg-gray-900 rounded-lg animate-pulse"></div>
            </div>)}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 h-1/3">
                <h3 className="text-white text-lg font-bold mb-1">
                  {char.name}
                </h3>
                <p className="text-gray-300 text-sm line-clamp-2 opacity-90">
                  {char.description}
                </p>
              </div>
            </div>
              
          ))}
        </div>
      )}

      {/* 故事内容 */}
      {showStoryContent && (
        <div className="w-full space-y-8">
          { displayedLines.map((line, index) => (
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

              {/* 图片部分 */}
              {imageStates[index]?.loading && (
                <div className="mt-4 mb-8">
                  <div className="w-full h-64 bg-gray-900 rounded-lg animate-pulse flex items-center justify-center">
                    <div className="text-gray-500">生成图片中...</div>
                  </div>
                </div>
              )}

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
      )}

      {/* 选择分支 */}
      {showChoices && (
        <div className="mt-12 animate-fadeIn">
          <h3 className="text-gray-400 mb-4">选择分支</h3>
          <div className="space-y-2">
            {/* 已完成显示的选项 */}
            {displayedChoices.map((choice, idx) => (
              <div 
                key={idx} 
                className="border border-yellow-600 rounded-lg p-3 cursor-pointer hover:bg-gray-900 transition-colors animate-slideIn"
              >
                <span className="text-yellow-500 mr-2">★</span>
                {choice}
              </div>
            ))}
            
            {/* 正在打字的选项 */}
            {currentChoiceText && (
              <div 
                className="border border-yellow-600 rounded-lg p-3 cursor-pointer hover:bg-gray-900 transition-colors animate-slideIn"
              >
                <span className="text-yellow-500 mr-2">★</span>
                {currentChoiceText}
                <span className="animate-pulse">|</span> {/* 添加闪烁的光标 */}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 聊天部分 */}
      {showChat && (
        <div className="mt-12 animate-fadeIn">
          <h3 className="text-gray-400 mb-4">与角色聊天</h3>
          <div className="flex flex-wrap gap-2">
            {characters.map((char, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mb-1">
                  <img src={char.image_url} alt={char.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs">{char.name.split(' ')[0]}</span>
                <Button size="sm" variant="outline" onClick={async () => {
                  // 更新参数
                  const json_data = {
                    id: char.id,
                    name: char.name,
                    description: char.description,
                    image_url: char.image_url,
                    is_used: true,
                    user_id: inspiration?.user.id
                  };
                  const updatedCharacter = await apiService.character.update(char.id, json_data);
                  console.log("updatedCharacter",updatedCharacter);

                  //跳转页面
                  router.push(`/dashboard/messages/${char.id}`);


                }} className="text-xs mt-1 h-6 px-2">
                  聊天
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
    )
}




