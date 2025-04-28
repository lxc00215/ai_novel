'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Save, ArrowLeft, Edit, Check, X, Book, BookOpen, ChevronRight, Download, FileText, Archive } from 'lucide-react'
import Markdown from 'react-markdown'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import apiService from '@/app/services/api'

// 类型定义
type Chapter = {
  title: string
  content: string
  id?: string | number
}

type Book = {
  title: string
  description: string
  chapters: Chapter[]
}

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  
  // 状态管理
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [savingChanges, setSavingChanges] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [activeChapter, setActiveChapter] = useState<number>(0)
  const [exporting, setExporting] = useState(false)
  
  // 获取书籍数据
  useEffect(() => {
    async function fetchBookData() {
      try {
        setLoading(true)
        const response = await apiService.crazy.get(bookId)
        
        if (!response) {
          throw new Error('Failed to fetch book data')
        }
        
        setBook(response)
        setEditingBook(JSON.parse(JSON.stringify(response))) // 深拷贝，用于编辑
      } catch (error) {
        console.error('Error fetching book:', error)
        toast.error('加载书籍数据失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchBookData()
  }, [bookId])
  
  // 保存更改
  const handleSaveChanges = async () => {
    if (!editingBook) return
    
    try {
      setSavingChanges(true)
      
      // 替换为你的API端点
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingBook),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save changes')
      }
      
      // 更新原始数据
      setBook(editingBook)
      setEditMode(false)
      toast.success('保存成功')
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('保存失败')
    } finally {
      setSavingChanges(false)
    }
  }
  
  // 编辑章节内容
  const handleChapterContentChange = (content: string, index: number) => {
    if (!editingBook) return
    
    const updatedChapters = [...editingBook.chapters]
    updatedChapters[index] = {
      ...updatedChapters[index],
      content
    }
    
    setEditingBook({
      ...editingBook,
      chapters: updatedChapters
    })
  }
  
  // 编辑章节标题
  const handleChapterTitleChange = (title: string, index: number) => {
    if (!editingBook) return
    
    const updatedChapters = [...editingBook.chapters]
    updatedChapters[index] = {
      ...updatedChapters[index],
      title
    }
    
    setEditingBook({
      ...editingBook,
      chapters: updatedChapters
    })
  }
  
  // 编辑书籍标题
  const handleBookTitleChange = (title: string) => {
    if (!editingBook) return
    setEditingBook({
      ...editingBook,
      title
    })
  }
  
  // 编辑书籍描述
  const handleBookDescriptionChange = (description: string) => {
    if (!editingBook) return
    setEditingBook({
      ...editingBook,
      description
    })
  }
  
  // 取消编辑
  const handleCancelEdit = () => {
    setEditingBook(JSON.parse(JSON.stringify(book))) // 重置为原始数据
    setEditMode(false)
  }
  
  // 导航回历史列表
  const handleGoBack = () => {
    router.push('/dashboard/crazy/history')
  }
  
  // 导出为TXT文件
  const exportAsTxt = () => {
    if (!book) return
    
    try {
      setExporting(true)
      
      // 创建完整内容
      let content = `${book.title}\n\n`;
      content += `${book.description}\n\n`;
      
      // 添加每章内容
      book.chapters.forEach((chapter, index) => {
        content += `第 ${index + 1} 章: ${chapter.title}\n\n`;
        content += `${chapter.content}\n\n`;
        content += '--------------------\n\n';
      });
      
      // 创建Blob并下载
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExporting(false);
        toast.success('TXT文件导出成功');
      }, 100);
    } catch (error) {
      console.error('Error exporting as TXT:', error);
      toast.error('导出失败');
      setExporting(false);
    }
  };
  
  // 导出为ZIP文件
  const exportAsZip = async () => {
    if (!book) return
    
    try {
      setExporting(true);
      
      // 动态导入JSZip库
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // 添加书籍信息
      zip.file("info.txt", `标题: ${book.title}\n描述: ${book.description}`);
      
      // 创建chapters文件夹
      const chaptersFolder = zip.folder("chapters");
      
      // 添加每章内容
      book.chapters.forEach((chapter, index) => {
        const chapterNum = String(index + 1).padStart(2, '0'); // 01, 02, etc.
        chaptersFolder?.file(
          `${chapterNum}-${chapter.title.replace(/[\/\\:*?"<>|]/g, '_')}.md`, 
          `# ${chapter.title}\n\n${chapter.content}`
        );
      });
      
      // 生成ZIP文件
      const content = await zip.generateAsync({ type: "blob" });
      
      // 下载文件
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.zip`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExporting(false);
        toast.success('ZIP文件导出成功');
      }, 100);
    } catch (error) {
      console.error('Error exporting as ZIP:', error);
      toast.error('导出失败');
      setExporting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-background/90">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">加载书籍内容...</p>
        </div>
      </div>
    )
  }
  
  if (!book) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-background to-background/90">
        <div className="rounded-full bg-muted/20 p-6">
          <Book className="h-12 w-12 text-muted" />
        </div>
        <h1 className="text-2xl font-bold">书籍未找到</h1>
        <p className="text-muted-foreground">无法找到请求的书籍内容</p>
        <Button onClick={handleGoBack} className="mt-2">返回列表</Button>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      {/* 浮动按钮栏 */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer" onClick={handleGoBack}>书籍列表</span>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="font-medium text-foreground truncate max-w-[200px]">{book.title}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* 导出按钮 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full" disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  导出
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>选择导出格式</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportAsTxt} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>导出为TXT (全文)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsZip} className="cursor-pointer">
                  <Archive className="mr-2 h-4 w-4" />
                  <span>导出为ZIP (章节分离)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 编辑按钮 */}
            {editMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={savingChanges}
                  className="rounded-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  取消
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  disabled={savingChanges}
                  className="rounded-full bg-primary hover:bg-primary/90"
                >
                  {savingChanges ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存修改
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)} className="rounded-full">
                <Edit className="mr-2 h-4 w-4" />
                编辑
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        {/* 书籍标题和描述 - 使用卡片加强视觉效果 */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <BookOpen className="h-8 w-8" />
              </div>
              
              <div className="flex-1">
                {editMode ? (
                  <div className="space-y-4">
                    <Input 
                      value={editingBook?.title}
                      onChange={(e) => handleBookTitleChange(e.target.value)}
                      className="text-2xl font-bold bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                      placeholder="书籍标题"
                    />
                    <Textarea 
                      value={editingBook?.description}
                      onChange={(e) => handleBookDescriptionChange(e.target.value)}
                      className="min-h-[100px] bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                      placeholder="书籍描述"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="mb-2 text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">{book.title}</h1>
                    <p className="text-muted-foreground">{book.description}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 内容区 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* 章节列表侧边栏 */}
          <div className="md:col-span-1">
            <Card className="border-border/50 bg-card/95 backdrop-blur-sm shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/30 px-4 py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Book className="h-4 w-4 text-primary/70" />
                  章节列表
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="py-2 px-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {(editingBook ? editMode ? editingBook?.chapters : book.chapters:[]).map((chapter, index) => (
                    <Button
                      key={index}
                      variant={activeChapter === index ? "default" : "ghost"}
                      className={`w-full justify-start text-left my-1 px-3 py-2 h-auto ${
                        activeChapter === index 
                          ? "bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveChapter(index)}
                    >
                      <div>
                        <div className="font-medium">{chapter.title}</div>
                        <div className="text-xs text-muted-foreground">第 {index + 1} 章</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 主要内容区 */}
          <div className="md:col-span-3">
            <Card className="border-border/50 bg-card/95 backdrop-blur-sm shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border/30 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">第 {activeChapter + 1} 章</div>
                    {editMode ? (
                      <Input 
                        value={editingBook?.chapters[activeChapter]?.title || ''}
                        onChange={(e) => handleChapterTitleChange(e.target.value, activeChapter)}
                        placeholder="章节标题"
                        className="text-xl font-medium border-primary/20 focus-visible:ring-primary/30"
                      />
                    ) : (
                      <CardTitle className="text-xl">
                        {book.chapters[activeChapter]?.title || '无标题章节'}
                      </CardTitle>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="view" className="w-full">
                  <div className="border-b border-border/30">
                    <div className="px-6">
                      <TabsList className="h-10 bg-transparent border-b-0 p-0">
                        <TabsTrigger 
                          value="view" 
                          className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none px-4 h-10"
                        >
                          阅读
                        </TabsTrigger>
                        {editMode && (
                          <TabsTrigger 
                            value="edit"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none px-4 h-10"
                          >
                            编辑
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </div>
                  </div>
                  
                  <TabsContent value="view" className="mt-0">
                    <div className="p-6 prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none min-h-[60vh]">
                      <Markdown>
                        {editMode 
                          ? editingBook?.chapters[activeChapter]?.content || '' 
                          : book.chapters[activeChapter]?.content || ''}
                      </Markdown>
                    </div>
                  </TabsContent>
                  
                  {editMode && (
                    <TabsContent value="edit" className="mt-0">
                      <div className="p-6">
                        <Textarea
                          value={editingBook?.chapters[activeChapter]?.content || ''}
                          onChange={(e) => handleChapterContentChange(e.target.value, activeChapter)}
                          placeholder="输入章节内容，支持Markdown格式"
                          className="min-h-[60vh] font-mono border-primary/20 focus-visible:ring-primary/30 bg-background/50"
                        />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* 自定义滚动条样式 */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(150, 150, 150, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(150, 150, 150, 0.5);
        }
        
        /* 为Markdown内容添加样式 */
        .prose {
          line-height: 1.8;
          color: hsl(var(--foreground));
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4 {
          color: hsl(var(--foreground));
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
        }
        
        .prose p {
          margin-bottom: 1.25em;
        }
        
        .prose a {
          color: hsl(var(--primary));
          text-decoration: none;
          font-weight: 500;
        }
        
        .prose a:hover {
          text-decoration: underline;
        }
        
        .prose blockquote {
          border-left: 3px solid hsl(var(--primary) / 0.5);
          padding-left: 1rem;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        
        .prose code {
          background-color: hsl(var(--muted) / 0.5);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  )
}