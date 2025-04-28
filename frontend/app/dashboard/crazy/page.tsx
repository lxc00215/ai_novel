'use client'

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Zap, BookOpen, Heart, History, Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import apiService from '@/app/services/api';
import { CreateCrazyRequest } from '@/app/services/types';

// Types
type Category = {
  id: string;
  name: string;
  icon: string;
  subcategories: {
    id: string;
    name: string;
  }[];
};

export default function CrazyStartPage() {
  const router = useRouter();
  // State
  const [selectedGender, setSelectedGender] = useState<string>("male");
  const [selectedCategory, setSelectedCategory] = useState<string>("fantasy");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [useSeed, setUseSeed] = useState(false);
  const [selectedSeeds, setSelectedSeeds] = useState<string[]>([]);
  const [chapterCount, setChapterCount] = useState(5);
  
  // 任务状态
  const [isLoading, setIsLoading] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  // Sample data
  const maleCategories: Category[] = [
    {
      id: 'fantasy',
      name: '玄幻',
      icon: '🔮',
      subcategories: [
        { id: 'eastern', name: '东方玄幻' },
        { id: 'western', name: '西方玄幻' },
        { id: 'hybrid', name: '混合玄幻' }
      ]
    },
    {
      id: 'wuxia',
      name: '武侠',
      icon: '⚔️',
      subcategories: [
        { id: 'ancient', name: '古代武侠' },
        { id: 'modern', name: '现代武侠' }
      ]
    },
    {
      id: 'scifi',
      name: '科幻',
      icon: '🚀',
      subcategories: [
        { id: 'space', name: '太空科幻' },
        { id: 'cyber', name: '赛博朋克' }
      ]
    }
  ];

  const femaleCategories: Category[] = [
    {
      id: 'romance',
      name: '言情',
      icon: '❤️',
      subcategories: [
        { id: 'modern', name: '现代言情' },
        { id: 'historical', name: '古代言情' }
      ]
    },
    {
      id: 'urban',
      name: '都市',
      icon: '🏙️',
      subcategories: [
        { id: 'career', name: '职场都市' },
        { id: 'mystery', name: '悬疑都市' }
      ]
    },
    {
      id: 'fantasy',
      name: '仙侠',
      icon: '✨',
      subcategories: [
        { id: 'immortal', name: '修仙' },
        { id: 'fairy', name: '灵异' }
      ]
    }
  ];

  const seedCategories = [
    { id: 'character', name: '角色', seeds: ['天才少年', '落魄千金', '双面总裁', '绝世高手'] },
    { id: 'setting', name: '背景', seeds: ['学院', '企业', '古代王朝', '修真门派'] },
    { id: 'plot', name: '剧情', seeds: ['逆袭', '复仇', '冒险', '成长'] },
    { id: 'conflict', name: '冲突', seeds: ['情感纠葛', '权力斗争', '生死劫难', '世界危机'] }
  ];

  const handleStart = async () => {
    setIsLoading(true);
    
    try {
      const request: CreateCrazyRequest = {
        type: selectedGender,
        category: selectedCategory,
        seeds: selectedSeeds,
        chapter_count: chapterCount,
        task_type: "CRAZY_WALK",
        user_id: 4,
      };
      
      // 发送创建任务请求
      const response = await apiService.task.create(request);

      console.log(JSON.stringify(response))
      
      // 如果成功创建任务
      if (response ) {
        // 显示成功提示
        toast.success("任务已成功创建！");
        // 显示任务进行中的弹窗
        setShowTaskDialog(true);
      }
    } catch (error) {
      console.error("创建任务失败:", error);
      toast.error("创建任务失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  const toggleSeed = (seedId: string) => {
    if (selectedSeeds.includes(seedId)) {
      setSelectedSeeds(selectedSeeds.filter(id => id !== seedId));
    } else {
      setSelectedSeeds([...selectedSeeds, seedId]);
    }
  };

  const toggleSubcategory = (subcatId: string) => {
    if (selectedSubcategories.includes(subcatId)) {
      setSelectedSubcategories(selectedSubcategories.filter(id => id !== subcatId));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcatId]);
    }
  };

  const getSelectedOptions = () => {
    const options = [];
    if (selectedGender) {
      options.push({
        type: 'gender',
        label: selectedGender === 'male' ? '男频' : '女频',
        id: selectedGender
      });
    }
    if (selectedCategory) {
      const categories = selectedGender === 'male' ? maleCategories : femaleCategories;
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        options.push({
          type: 'category',
          label: category.name,
          id: category.id
        });
      }
    }
    selectedSubcategories.forEach(subId => {
      const categories = selectedGender === 'male' ? maleCategories : femaleCategories;
      for (const cat of categories) {
        const subcat = cat.subcategories.find(s => s.id === subId);
        if (subcat) {
          options.push({
            type: 'subcategory',
            label: subcat.name,
            id: subcat.id
          });
          break;
        }
      }
    });
    selectedSeeds.forEach(seedId => {
      options.push({
        type: 'seed',
        label: seedId,
        id: seedId
      });
    });
    return options;
  };
  const removeOption = (option: { type: string, id: string }) => {
    if (option.type === 'gender') {
      setSelectedGender("");
      setSelectedCategory("");
      setSelectedSubcategories([]);
    } else if (option.type === 'category') {
      setSelectedCategory("");
      setSelectedSubcategories([]);
    } else if (option.type === 'subcategory') {
      setSelectedSubcategories(selectedSubcategories.filter(id => id !== option.id));
    } else if (option.type === 'seed') {
      setSelectedSeeds(selectedSeeds.filter(id => id !== option.id));
    }
  };

  const navigateToHistory = () => {
    router.push('/dashboard/crazy/history');
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 页面顶部添加历史记录按钮 */}
      <div className="container hover:cursor-pointer mx-auto p-4 flex justify-end"
        onClick={()=>navigateToHistory()}
      >
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
        >
          <History size={16} />
          历史记录
        </Button>
      </div>
      
      <main className="flex-1 container mx-auto p-4">
        {/* Gender Selection */}
        <section className="py-6">
          <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-[#e7000b] to-[#155dfc] text-transparent bg-clip-text">选择创作类型</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => setSelectedGender("male")}
              className={`hover:cursor-pointer transition-all duration-300 
                ${selectedGender === "male" 
                  ? "scale-[1.02] shadow-[0_0_15px_rgba(21,93,252,0.6)]" 
                  : "hover:scale-[1.01] hover:shadow-[0_0_8px_rgba(21,93,252,0.4)]"
                }
                border-2 rounded-lg overflow-hidden relative
                ${selectedGender === "male" ? "border-[#155dfc]" : "border-gray-700"}
              `}
            >
              <div className="bg-[#111]/80 p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="text-[#155dfc]" size={24} />
                  <h3 className="text-xl font-semibold text-[#155dfc]">男频小说</h3>
                </div>
                <p className="text-gray-300 mb-2">热血、奇幻、战斗、修真、冒险</p>
                <p className="text-xs text-gray-400">适合男性读者的小说类型，情节紧凑，世界观宏大</p>
              </div>
            </div>
            <div 
              onClick={() => setSelectedGender("female")}
              className={`cursor-pointer transition-all duration-300 
                ${selectedGender === "female" 
                  ? "scale-[1.02] shadow-[0_0_15px_rgba(231,0,11,0.6)]" 
                  : "hover:scale-[1.01] hover:shadow-[0_0_8px_rgba(231,0,11,0.4)]"
                }
                border-2 rounded-lg overflow-hidden relative
                ${selectedGender === "female" ? "border-[#e7000b]" : "border-gray-700"}
              `}
            >
              <div className="bg-[#111]/80 p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="text-[#e7000b]" size={24} />
                  <h3 className="text-xl font-semibold text-[#e7000b]">女频小说</h3>
                </div>
                <p className="text-gray-300 mb-2">言情、宫斗、悬疑、青春、浪漫</p>
                <p className="text-xs text-gray-400">适合女性读者的小说类型，感情描写细腻，人物情感丰富</p>
              </div>
            </div>
          </div>
        </section>

        {/* Category Selection */}
        {selectedGender && (
          <div className="mb-8 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#e7000b] to-[#155dfc] bg-clip-text text-transparent">
              选择分类
            </h2>
            
            <div className="space-y-6">
              {/* Primary Categories */}
              <div className="flex gap-4 overflow-x-auto pb-2">
                {(selectedGender === 'male' ? maleCategories : femaleCategories).map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={`flex gap-2 min-w-max ${
                      selectedCategory === category.id 
                        ? selectedGender === 'male' 
                          ? 'bg-[#155dfc] hover:bg-[#155dfc]/80' 
                          : 'bg-[#e7000b] hover:bg-[#e7000b]/80'
                        : 'bg-black border-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </Button>
                ))}
              </div>
              {/* Subcategories */}
              {selectedCategory && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-fadeIn">
                  {(selectedGender === 'male' ? maleCategories : femaleCategories)
                    .find(c => c.id === selectedCategory)
                    ?.subcategories.map((subcat) => (
                      <Button
                        key={subcat.id}
                        variant={selectedSubcategories.includes(subcat.id) ? "default" : "outline"}
                        className={`justify-start ${
                          selectedSubcategories.includes(subcat.id)
                            ? selectedGender === 'male'
                              ? 'bg-[#155dfc]/20 text-[#155dfc] border-[#155dfc] hover:bg-[#155dfc]/30'
                              : 'bg-[#e7000b]/20 text-[#e7000b] border-[#e7000b] hover:bg-[#e7000b]/30'
                            : 'bg-black border-gray-700'
                        }`}
                        onClick={() => toggleSubcategory(subcat.id)}
                      >
                        {subcat.name}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seed Selection */}
        {selectedCategory && (
          <div className="mb-8 animate-fadeIn border-t border-gray-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#e7000b] to-[#155dfc] bg-clip-text text-transparent">
                故事种子
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">不使用</span>
                <Switch 
                  checked={useSeed} 
                  onCheckedChange={setUseSeed}
                  className={useSeed 
                    ? selectedGender === 'male' 
                      ? 'bg-[#155dfc]' 
                      : 'bg-[#e7000b]' 
                    : 'bg-gray-700'
                  }
                />
                <span className="text-sm text-gray-400">使用</span>
              </div>
            </div>

            {useSeed && (
              <div className="space-y-6 animate-fadeIn">
                {seedCategories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <h3 className="text-md font-semibold text-gray-300">{category.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {category.seeds.map((seed) => (
                        <Badge
                          key={seed}
                          variant={selectedSeeds.includes(seed) ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            selectedSeeds.includes(seed)
                              ? selectedGender === 'male'
                                ? 'bg-[#155dfc]/20 text-[#155dfc] border-[#155dfc] hover:bg-[#155dfc]/30'
                                : 'bg-[#e7000b]/20 text-[#e7000b] border-[#e7000b] hover:bg-[#e7000b]/30'
                              : 'bg-black border-gray-700 hover:bg-black hover:border-gray-500'
                          }`}
                          onClick={() => toggleSeed(seed)}
                        >
                          {seed}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Options Summary */}
        {selectedGender && (
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-300 mb-2">已选选项</h3>
            <div className="flex flex-wrap gap-2">
              {getSelectedOptions().map((option, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`
                    flex items-center gap-1 px-2 py-1 
                    ${option.type === 'gender' || option.type === 'category' || option.type === 'subcategory' 
                      ? selectedGender === 'male' 
                        ? 'border-[#155dfc]/70 text-[#155dfc]' 
                        : 'border-[#e7000b]/70 text-[#e7000b]'
                      : 'border-purple-500/70 text-purple-400'
                    }
                  `}
                >
                  {option.label}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 p-0 ml-1 text-gray-400 hover:text-white hover:bg-transparent"
                    onClick={() => removeOption(option)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Parameters Section */}
      <div className="bg-black/80 backdrop-blur-sm border-t border-gray-800 p-4 sticky bottom-0 animate-fadeIn">
        <div className="container mx-auto">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#e7000b] to-[#155dfc] bg-clip-text text-transparent">
            创作参数
          </h2>
          
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium text-white flex items-center">
                <Heart className="h-4 w-4 mr-2 opacity-70" />
                章节数量
              </h3>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-gray-800">
                {chapterCount}章
              </span>
            </div>
            
            <Slider 
              value={[chapterCount]} 
              min={1} 
              max={20} 
              step={1}
              onValueChange={(value) => setChapterCount(value[0])}
              className={`h-2.5 mb-2 ${
                selectedGender === 'male' 
                  ? "bg-gray-800 [&>span]:bg-[#155dfc] [&>span]:shadow-[0_0_10px_rgba(21,93,252,0.5)]" 
                  : "bg-gray-800 [&>span]:bg-[#e7000b] [&>span]:shadow-[0_0_10px_rgba(231,0,11,0.5)]"
              }`}
            />
            
            <div className="flex justify-between text-xs text-gray-500 mt-2 mb-6">
              <span>1章</span>
              <span>10章</span>
              <span>20章</span>
            </div>
            
            <p className="text-xs text-gray-400 text-center italic mt-2">
              为确保您的小说能够准确在某平台发布，我们会保证每章字数不低于1200字。
            </p>
          </div>
          
          <div className="flex justify-center mt-10 mb-4">
            <Button 
              size="lg"
              onClick={handleStart}
              disabled={!selectedGender || !selectedCategory || selectedSubcategories.length === 0 || isLoading}
              className={`
                w-full max-w-md py-8 font-bold text-xl tracking-wide transition-all duration-300 
                bg-gradient-to-r from-[#e7000b] to-[#155dfc] border-none
                hover:shadow-[0_0_30px_rgba(21,93,252,0.5)]
                disabled:opacity-50 disabled:cursor-not-allowed
                relative overflow-hidden rounded-xl
                mx-4 md:mx-8
              `}
            >
              <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
              <div className="relative flex items-center hover:cursor-pointer justify-center">
                {isLoading ? (
                  <Loader2 className="mr-3 h-7 w-7 animate-spin" />
                ) : (
                  <Zap className="mr-3 h-7 w-7" />
                )}
                {isLoading ? "处理中..." : "开始创作"}
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* 任务进行中的弹窗 */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-center font-bold">任务正在后台进行中</DialogTitle>
            <DialogDescription className="text-center mt-2">
              您可以前往历史记录页面查看任务进度，或继续创建新的任务。<br />
              我们会尽快处理您的请求，请耐心等待。
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              className='hover:cursor-pointer'
              variant="outline" 
              onClick={() => setShowTaskDialog(false)}
            >
              继续创作
            </Button>
            <Button 
              className='hover:cursor-pointer'
              onClick={() => {
                setShowTaskDialog(false);
                navigateToHistory();
              }}
            >
              查看进度
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}