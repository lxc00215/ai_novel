'use client'

import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import { Copy, Check, DownloadIcon } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import apiService from '@/app/services/api'
import { useParams } from 'next/navigation'

export default function MarkdownDisplay() {
  // 状态管理
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [activeTab, setActiveTab] = useState('preview')

  const params = useParams();
  const analysis_id = params?.id as string;

  // 下载Markdown文件
  const downloadMarkdown = () => {
    try {
      // 创建Blob对象
      const blob = new Blob([content], { type: 'text/markdown' })
      // 创建URL
      const url = URL.createObjectURL(blob)
      // 创建a标签并模拟点击下载
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'content'}.md`
      document.body.appendChild(a)
      a.click()
      // 清理
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('开始下载Markdown文件')
    } catch (err) {
      console.error('下载失败:', err)
      toast.error('下载失败，请稍后重试')
    }
  }
  
  useEffect(() => {
    // 获取内容
    const getContent = async () => {
      setIsLoading(true)

      if(!analysis_id){
        setError('缺少参数')
        setIsLoading(false)
        return
      }
      try {
        const response = await apiService.analysis.get_detail(Number(analysis_id))
        console.log(JSON.stringify(response)+"内容")
        setContent(response.analysis_content)
        setTitle(response.title)
      } catch (err) {
        console.error('获取内容失败:', err)
        setError('获取内容失败，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    }

    getContent()
  }, [analysis_id])
  
  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('已复制到剪贴板')
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
      toast.error('复制失败，请手动选择并复制')
    }
  }
  
  // 加载状态渲染
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/5 mb-2" />
          <Skeleton className="h-32 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
        </CardContent>
      </Card>
    )
  }
  
  // 错误状态渲染
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">加载失败</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="w-full  flex flex-col">
      <CardHeader className="border-b shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-primary truncate max-w-md" title={title}>
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              disabled={copied}
              className="transition-all  hover:bg-primary/10 hover:cursor-pointer duration-300 hover:bg-primary/10"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-green-500">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  复制
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadMarkdown}
              className="transition-all duration-300 hover:cursor-pointer hover:bg-primary/10"
            >
              <DownloadIcon className="h-4 w-4 mr-1" />
              下载
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Tabs 
        defaultValue="preview" 
        className="w-full flex flex-col flex-grow"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="px-6 pt-4 shrink-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="preview"
              className={cn(
                "transition-all duration-300 relative",
                "data-[state=active]:text-primary data-[state=active]:font-medium",
                "hover:bg-primary/5",
                "after:content-[''] after:absolute after:h-[3px] after:left-0 after:right-0 after:bottom-0 after:scale-x-0 after:bg-primary after:transition-transform after:duration-300",
                "data-[state=active]:after:scale-x-100"
              )}
            >
              预览
            </TabsTrigger>
            <TabsTrigger 
              value="source"
              className={cn(
                "transition-all duration-300 relative",
                "data-[state=active]:text-primary data-[state=active]:font-medium",
                "hover:bg-primary/5",
                "after:content-[''] after:absolute after:h-[3px] after:left-0 after:right-0 after:bottom-0 after:scale-x-0 after:bg-primary after:transition-transform after:duration-300",
                "data-[state=active]:after:scale-x-100"
              )}
            >
              源码
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent 
          value="preview" 
          className="mt-4 flex-grow overflow-hidden"
        >
          <CardContent className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none h-full overflow-y-auto pb-16">
            <Markdown>{content}</Markdown>
          </CardContent>
        </TabsContent>
        
        <TabsContent 
          value="source" 
          className="mt-4 flex-grow overflow-hidden"
        >
          <CardContent className="h-full overflow-y-auto pb-16">
            <pre className="rounded-md bg-muted p-4 overflow-x-auto whitespace-pre-wrap break-words">
              <code className="text-sm">{content}</code>
            </pre>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="border-t py-3 text-xs text-muted-foreground justify-between shrink-0">
        <span>当前模式: {activeTab === 'preview' ? '预览' : '源码'}</span>
        <span>字符数: {content.length}</span>
      </CardFooter>
    </Card>
  )
}
