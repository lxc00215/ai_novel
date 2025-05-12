// app/dashboard/inspiration/[id]/components/CharacterChat.tsx
'use client'
import { Button } from '@/components/ui/button';
import apiService from '@/app/services/api';
import { Character, InspirationDetail } from '@/app/services/types';

interface CharacterChatProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  inspiration: InspirationDetail;
  router: any;
}

export default function CharacterChat({ 
  characters, 
  setCharacters, 
  inspiration,
  router 
}:  CharacterChatProps) {
  const handleChatClick = async (char: Character) => {
    try {
      // 标记角色为已使用
      console.log(inspiration?.user?.id+"ccc");
      const updatedData: Character = {
        ...char,
        is_used: true,
        user_id: inspiration?.user?.id,
      };
      
      await apiService.character.update(char.id, updatedData);
      
      // 更新本地状态
      setCharacters(prev => 
        prev.map(c => c.id === char.id ? updatedData : c)
      );
      
      // 跳转到聊天页面
      router.push(`/dashboard/messages?characterId=${char.id}`);
    } catch (error) {
      console.error("启动聊天失败:", error);
    }
  };

  return (
    <div className="mt-12 animate-fadeIn">
      <h3 className="text-gray-400 mb-4">与角色聊天</h3>
      <div className="flex flex-wrap gap-2">
        {characters.map((char, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden mb-1">
              <img 
                src={char.image_url || `https://via.placeholder.com/200?text=${char.name.charAt(0)}`} 
                alt={char.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-xs">{char.name.split(' ')[0]}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleChatClick(char)}
              className="text-xs mt-1 h-6 px-2"
            >
              聊天
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}