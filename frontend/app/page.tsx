// 文件: app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  PenTool,
  ChevronRight,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import Logo from './components/logo';
import { useAuth } from './hooks/useAuth';
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LogoutButton from '@/app/components/LogoutButton';

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("novels");
  const { user, isAuthenticated } = useAuth();

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 切换暗黑模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // 随机故事开头
  const storyStarters = [
    "雾气弥漫的清晨，她发现一封来自未来的信...",
    "当城市的最后一盏灯熄灭时，他才敢打开那个盒子...",
    "没有人相信他关于平行宇宙的理论，直到那天...",
    "百年老店的地下室里，藏着一本能预言未来的日记...",
  ];

  const [currentStarter, setCurrentStarter] = useState(storyStarters[0]);

  const changeStoryStarter = () => {
    const randomIndex = Math.floor(Math.random() * storyStarters.length);
    setCurrentStarter(storyStarters[randomIndex]);
  };

  return (
    <div className={cn(
      "min-h-screen w-full transition-colors duration-300 bg-background text-foreground",
    )}>
      {/* 导航栏 */}
      <header className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-background text-foreground",
        scrollY > 50 ? "bg-opacity-95" : "bg-opacity-70",
      )}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo isCollapsed={false} />
          </div>

          {/* 桌面导航 */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/pricing" className="hover:text-[#7b1fa2] transition-colors">定价</Link>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.account} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-100 font-medium">
                          {user?.account?.charAt(0) || 'U'}
                        </div>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium">{user?.account}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>个人中心</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <LogoutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button size="sm" className="bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] hover:opacity-90 text-white shadow-lg hover:shadow-xl" onClick={() => window.location.href = '/auth'}>
                  开始创作
                </Button>
                <Link href="/auth" className="hover:text-[#7b1fa2] transition-colors">登录</Link>
              </>
            )}
            <ThemeToggle />
          </nav>

          {/* 移动端菜单按钮 */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle/>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-background"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "md:hidden py-4 px-4 shadow-lg bg-background"
            )}
          >
            <nav className="flex flex-col space-y-3">
              <Link href="#features" className="py-2 px-4 hover:bg-background rounded-md">AI拆书</Link>
              <Link href="#features" className="py-2 px-4 hover:bg-background rounded-md">小说生成</Link>
              <Link href="#features" className="py-2 px-4 hover:bg-background rounded-md">灵感创作</Link>
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 py-2 px-4">
                    <Avatar className="h-8 w-8">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.account} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-100 font-medium">
                          {user?.account?.charAt(0) || 'U'}
                        </div>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium">{user?.account}</span>
                  </div>
                  <Link href="/dashboard" className="py-2 px-4 hover:bg-background rounded-md">个人中心</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Button className="bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] hover:opacity-90 text-white w-full" onClick={() => window.location.href = '/auth'}>
                    开始创作
                  </Button>
                  <Link href="/auth" className="py-2 px-4 hover:bg-background rounded-md">登录</Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </header>

      <main>
        {/* 英雄区域 */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 opacity-10 z-0">
            <div className="absolute w-full h-full bg-gradient-to-b from-[#1a237e] to-[#7b1fa2] opacity-20"></div>
            <div className="grid grid-cols-10 grid-rows-10 w-full h-full">
              {Array(100).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                  <div
                    className={`w-1 h-1 rounded-full bg-background opacity-${Math.random() > 0.7 ? '100' : '0'}`}
                    style={{animation: `pulse ${2 + Math.random() * 3}s infinite`}}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <motion.div
                className="max-w-xl mb-10 md:mb-0"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                  让AI点亮你的创作灵感
                </h1>
                <p className="mt-6 text-lg md:text-xl opacity-90">
                  专业的AI小说创作平台，助你轻松完成从灵感到成书的全过程
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="border-[#7b1fa2] text-[#7b1fa2] hover:bg-[#7b1fa2]/10" onClick={() => window.location.href = '/auth'}>
                    免费体验
                  </Button>
                </div>
              </motion.div>

              <motion.div
                className="relative w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative w-full h-80 perspective-1000">
                  <div className="absolute w-full h-full book-container">
                    <div className="book w-full h-full bg-gradient-to-b from-[#1a237e] to-[#7b1fa2] rounded-lg shadow-2xl transform rotate-y-10 rotate-z-5 relative">
                      <div className="absolute inset-2 bg-background rounded-sm p-6 overflow-hidden">
                        <div className="h-full flex flex-col">
                          <div className="flex-1">
                            <div className="w-20 h-1 bg-[#ffd700] mb-4"></div>
                            <div className="h-2 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                            <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                            <div className="h-2 w-5/6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                            <div className="h-2 w-4/5 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>

                            <div className="text-sm opacity-90 italic mb-4 min-h-12 border-l-2 border-[#7b1fa2] pl-3">
                              {currentStarter}
                            </div>

                            <div className="h-2 w-5/6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                            <div className="h-2 w-full bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                            <div className="h-2 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                          </div>
                          <button
                            onClick={changeStoryStarter}
                            className="text-xs text-foreground hover:underline hover:cursor-pointer self-end flex items-center"
                          >
                            换一个开头 <Sparkles className="ml-1 w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 粒子效果 */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array(15).fill(0).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#ffd700]"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          opacity: Math.random() * 0.7 + 0.3,
                          animation: `float ${3 + Math.random() * 7}s infinite ease-in-out`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 功能展示区 */}
        <section id="features" className="py-20 relative">


          <div className="container mx-auto bg-background px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1a237e] to-[#7b1fa2]">
                  三大核心功能
                </span>
              </h2>
              <p className="mt-4 text-lg opacity-80 max-w-2xl mx-auto">
                借助先进的人工智能技术，我们为您提供从灵感萌发到成书的全流程解决方案
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <BookOpen className="w-10 h-10" />,
                  title: "AI拆书",
                  description: "学习经典作品的写作技巧，AI分析并提取创作精髓，转化为你的创作养分",
                  color: "from-blue-600 to-indigo-700"
                },
                {
                  icon: <PenTool className="w-10 h-10" />,
                  title: "一键生成",
                  description: "根据你的需求，AI可以生成不同长度的完整小说，包括章节结构和内容",
                  color: "from-[#1a237e] to-[#7b1fa2]"
                },
                {
                  icon: <Sparkles className="w-10 h-10" />,
                  title: "灵感创作",
                  description: "输入简单提示或关键词，获取丰富创作灵感和素材，突破创作瓶颈",
                  color: "from-purple-600 to-pink-600"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className={cn(
                    "overflow-hidden h-full border-0 shadow-lg bg-background",
                  )}>
                    <div className={`h-2 w-full bg-gradient-to-r ${feature.color}`}></div>
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-4`}>
                        {feature.icon}
                      </div>
                      <CardTitle className="text-2xl font-serif">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="opacity-80">{feature.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" className="text-foreground  hover:bg-foreground/10 p-0" onClick={() => window.location.href = '/auth'}>
                        了解更多 <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 创作流程 */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1a237e] to-[#7b1fa2]">
                  简单四步，成就你的创作梦想
                </span>
              </h2>
              <p className="mt-4 text-lg opacity-80 max-w-2xl mx-auto">
                从创意到成书，我们为您精心打造流畅高效的创作体验
              </p>
            </div>

            <div className="relative">
              {/* 连接线 */}
              <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-gradient-to-b from-[#1a237e] to-[#7b1fa2] hidden md:block"></div>

              <div className="space-y-16  md:space-y-0">
                {[
                  {
                    icon: <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] flex items-center justify-center text-white text-xl font-bold">1</div>,
                    title: "选择模式",
                    description: "根据您的需求选择AI拆书、一键生成或灵感创作模式",
                    align: "right"
                  },
                  {
                    icon: <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] flex items-center justify-center text-white text-xl font-bold">2</div>,
                    title: "输入要求",
                    description: "描述您的创作需求，风格偏好，或上传参考资料",
                    align: "left"
                  },
                  {
                    icon: <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] flex items-center justify-center text-white text-xl font-bold">3</div>,
                    title: "AI生成",
                    description: "我们的AI模型会根据您的要求生成高质量的创作内容",
                    align: "right"
                  },
                  {
                    icon: <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] flex items-center justify-center text-white text-xl font-bold">4</div>,
                    title: "编辑完善",
                    description: "对AI生成的内容进行编辑和完善，导出您的成品",
                    align: "left"
                  }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    className="relative flex flex-col md:flex-row items-center md:items-start"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    <div className={cn(
                      "w-full md:w-1/2 flex",
                      step.align === "right" ? "md:justify-end md:pr-16" : "md:order-last md:justify-start md:pl-16",
                      "mb-6 md:mb-0"
                    )}>
                      <Card className={cn(
                        "w-full md:max-w-xs border-0 shadow-lg bg-background",
                      )}>
                        <CardHeader>
                          <div className="mb-4">{step.icon}</div>
                          <CardTitle className="text-xl font-serif">{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="opacity-80">{step.description}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="hidden md:flex justify-center items-center">
                      <div className="w-8 h-8 rounded-full bg-[#ffd700] z-10"></div>
                    </div>

                    <div className={cn(
                      "w-full md:w-1/2",
                      step.align === "right" ? "md:order-last" : ""
                    )}>
                      {/* 这里可以放置图片或图标 */}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 用户作品展示 */}
        <section className="py-20 relative overflow-hidden">
          <div className={cn(
            "absolute inset-0 z-0 bg-background",

          )}></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1a237e] to-[#7b1fa2]">
                  用户创作展示
                </span>
              </h2>
              <p className="mt-4 text-lg opacity-80 max-w-2xl mx-auto">
                探索使用NonReal创作的精彩作品
              </p>
            </div>
            {/* 如果选中，加一个下边框为白色 2px 的边框 */}
            <Tabs defaultValue="novels" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
              <TabsTrigger
              value="novels"
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${
                activeTab === "novels" 
                  ? "bg-secondary shadow-sm  after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4  after:h-0.5 after:bg-emerald-500 after:rounded-full" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              长篇小说
            </TabsTrigger>
                <TabsTrigger
              value="shorts"
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${
                activeTab === "shorts" 
                  ? "bg-secondary shadow-sm font-medium after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-emerald-500 after:rounded-full" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              短篇故事</TabsTrigger>
                <TabsTrigger
              value="poetry"
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${
                activeTab === "poetry" 
                  ? "bg-secondary shadow-sm font-medium after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-emerald-500 after:rounded-full" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              诗歌散文</TabsTrigger>
              </TabsList>

              <TabsContent value="novels" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "星际迷途",
                      author: "陈星辰",
                      cover: "/api/placeholder/240/360",
                      description: "一部融合硬科幻与人文思考的作品，讲述了星际移民时代的人类命运"
                    },
                    {
                      title: "时光织锦",
                      author: "林晓梦",
                      cover: "/api/placeholder/240/360",
                      description: "穿越百年的爱情故事，展现了不同时代的社会变迁与人性坚韧"
                    },
                    {
                      title: "云端城市",
                      author: "王未来",
                      cover: "/api/placeholder/240/360",
                      description: "未来都市背景下的悬疑推理，探讨科技与人类伦理的边界"
                    }
                  ].map((book, index) => (
                    <motion.div
                      key={index}
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <div className="w-full aspect-[2/3] relative shadow-xl mb-4 overflow-hidden rounded-lg">
                        <Image
                          src={book.cover}
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end">
                          <div className="p-4 text-white">
                            <p className="font-bold">{book.title}</p>
                            <p className="text-sm opacity-80">作者: {book.author}</p>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-serif font-bold text-lg">{book.title}</h3>
                      <p className="text-sm opacity-70 mb-2">by {book.author}</p>
                      <p className="text-sm opacity-90 line-clamp-2">{book.description}</p>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="shorts" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 短篇故事展示内容，结构类似长篇小说 */}
                  {[1, 2, 3].map((_, index) => (
                    <Card key={index} className={cn(
                      "border-0 shadow-lg h-full bg-background",
                    )}>
                      <CardHeader>
                        <CardTitle className="font-serif">午夜来客</CardTitle>
                        <CardDescription>短篇悬疑 · 李明辉</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-4 opacity-80">那扇窗户总在午夜敲响，却从未见人影。雨夜之后，我决定一探究竟...</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" className="text-[#7b1fa2]">
                          阅读全文
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="poetry" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 诗歌散文展示内容 */}
                  {[1, 2].map((_, index) => (
                    <Card key={index} className={cn(
                      "border-0 shadow-lg h-full bg-background",
                    )}>
                      <CardHeader>
                        <CardTitle className="font-serif">春日私语</CardTitle>
                        <CardDescription>现代诗 · 张雨</CardDescription>
                      </CardHeader>
                      <CardContent>
                      <p className="italic opacity-80">
                          阳光碎在青石板上<br/>
                          风轻抚过柳条<br/>
                          那些未说出口的词句<br/>
                          化作春天的絮语
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" className="text-[#7b1fa2]">
                          阅读全文
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>


          </div>
        </section>

        {/* 数据统计 */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
              {[
                { value: "10,000+", label: "创作者" },
                { value: "50,000+", label: "已生成故事" },
                { value: "98%", label: "用户满意度" },
                { value: "24/7", label: "AI创作支持" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] mb-2">{stat.value}</p>
                  <p className="opacity-70">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 常见问题 */}
        <section id="faq" className="py-20 relative">
          <div className={cn(
            "absolute inset-0 z-0 bg-background",
          )}></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-serif">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1a237e] to-[#7b1fa2]">
                  常见问题
                </span>
              </h2>
              <p className="mt-4 text-lg opacity-80 max-w-2xl mx-auto">
                对NonReal有疑问？这里为您解答
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              {[
                {
                  question: "AI创作的内容版权归谁所有？",
                  answer: "使用我们平台生成的所有内容版权完全归您所有。AI仅作为您的创作助手，不会对创作成果主张任何权利。"
                },
                {
                  question: "我的创作数据会被用来训练AI吗？",
                  answer: "不会。我们高度重视用户隐私和数据安全，您的创作内容仅供您个人使用，不会被用于训练AI或分享给第三方。"
                },
                {
                  question: "如何提高AI生成内容的质量？",
                  answer: "提供更详细的创作要求，包括人物设定、故事背景、风格偏好等，能够显著提升AI生成内容的质量。此外，多次迭代和反馈也能让系统更好地理解您的需求。"
                },
                {
                  question: "免费账户有使用限制吗？",
                  answer: "免费账户每月可以生成有限数量的内容，并且有字数限制。升级至专业账户可以解锁无限生成次数、更高的字数上限以及更多高级功能。"
                },
                {
                  question: "能否导出不同格式的成品？",
                  answer: "是的，我们支持多种格式导出，包括TXT、DOCX、PDF和EPUB等，方便您在不同设备上阅读或进行后续编辑。"
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className={cn(
                    "mb-4 border-0 shadow-md bg-background",
                  )}>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] flex items-center justify-center text-white text-xs mr-3">Q</div>
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="pl-9">
                        <p className="opacity-80">{faq.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              <div className="text-center mt-10">
                <Button variant="outline" className="border-[#7b1fa2] text-[#7b1fa2] hover:bg-[#7b1fa2]/10">
                  查看更多问题
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 创意启发器 */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className={cn(
              "rounded-xl p-8 relative overflow-hidden shadow-xl bg-background",
            )}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1a237e] to-[#7b1fa2]"></div>
              <div className="relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-2xl md:text-3xl font-bold font-serif mb-6">试试创意启发器</h2>
                  <p className="mb-8 opacity-80">
                    卡住了？没有灵感？尝试我们的创意启发器，随机生成故事元素，激发你的创作火花
                  </p>

                  <Card className={cn(
                    "mb-8 border-0 bg-background",
                  )}>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm opacity-70 mb-1">角色</p>
                          <p className="font-medium">一位有预知能力的街头艺术家</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-70 mb-1">设定</p>
                          <p className="font-medium">浮空城市群中的黑市交易所</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-70 mb-1">冲突</p>
                          <p className="font-medium">秘密身份被最亲近的人发现</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button className="bg-gradient-to-r from-[#1a237e] to-[#7b1fa2] hover:opacity-90 text-white" onClick={() => window.location.href = '/auth'}>
                    重新生成
                  </Button>
                  <Button variant="outline" className="ml-4 border-[#7b1fa2] text-[#7b1fa2] hover:bg-[#7b1fa2]/10" onClick={() => window.location.href = '/auth'}>
                    使用这个创意
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 行动召唤 */}
        <section className="py-20  relative overflow-hidden">
          <div className="absolute  inset-0 z-0  opacity-90"></div>
          <div className="absolute inset-0 z-0 opacity-20">
            {Array(50).fill(0).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 4 + 1 + 'px',
                  height: Math.random() * 4 + 1 + 'px',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  opacity: Math.random() * 0.8 + 0.2,
                  animation: `twinkle ${Math.random() * 5 + 3}s infinite`
                }}
              ></div>
            ))}
          </div>

          <div className="container  mx-auto px-4 relative z-10">
            <div className="max-w-3xl  mx-auto text-center text-white">
              <motion.h2
                className="text-3xl md:text-4xl lg:text-5xlfont-bold font-serif mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                开启你的AI创作之旅
              </motion.h2>
              <motion.p
                className="text-lg mb-10 opacity-90"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                无论你是畅销作家还是初次创作，NonReal都能成为你的得力助手
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Button className="bg-white hover:bg-gray-100 text-[#7b1fa2] text-lg px-8 py-6" onClick={() => window.location.href = '/auth'}>
                  立即注册
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/20 text-lg px-8 py-6" onClick={() => window.location.href = '/auth'}>
                  了解更多
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* 底部 */}
      <footer className={cn(
        "py-12 border-t bg-background",
      )}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">

                <Logo isCollapsed={false} />
              </div>
              <p className="opacity-70 mb-4">
                专业的AI小说创作平台，助你轻松完成从灵感到成书的全过程
              </p>
              <div className="flex space-x-4">
                {/* 社交媒体图标 */}
                {['twitter', 'facebook', 'instagram', 'github'].map((social) => (
                  <a key={social} href="#" className="opacity-70 hover:opacity-100">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs">{social[0].toUpperCase()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">功能</h3>
              {/* <ul className="space-y-2 opacity-70">
                <li><Link href="#" className="hover:underline">AI拆书</Link></li>
                <li><Link href="#" className="hover:underline">小说生成</Link></li>
                <li><Link href="#" className="hover:underline">灵感创作</Link></li>
                <li><Link href="#" className="hover:underline">写作辅助</Link></li>
              </ul> */}
            </div>

            <div>
              <h3 className="font-bold mb-4">资源</h3>
              <ul className="space-y-2 opacity-70">
                <li><Link href="#" className="hover:underline">使用教程</Link></li>
                <li><Link href="#" className="hover:underline">博客</Link></li>
                <li><Link href="#" className="hover:underline">社区</Link></li>
                <li><Link href="#" className="hover:underline">API接口</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">公司</h3>
              <ul className="space-y-2 opacity-70">
                <li><Link href="#" className="hover:underline">关于我们</Link></li>
                <li><Link href="#" className="hover:underline">联系我们</Link></li>
                <li><Link href="#" className="hover:underline">隐私政策</Link></li>
                <li><Link href="#" className="hover:underline">服务条款</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center opacity-70 text-sm">
            <p>© {new Date().getFullYear()} NonReal 版权所有</p>
          </div>
        </div>
      </footer>

      {/* 全局样式 */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        
        .book-container {
          perspective: 1000px;
        }
        
        .book {
          transform-style: preserve-3d;
          animation: bookFloat 6s ease-in-out infinite;
        }
        
        @keyframes bookFloat {
          0%, 100% { transform: rotateY(10deg) rotateZ(5deg) translateY(0); }
          50% { transform: rotateY(15deg) rotateZ(5deg) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}