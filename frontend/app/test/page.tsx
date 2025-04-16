'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

/**
 * 展示主题颜色系统的示例组件
 */
export function ThemeExample() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 防止水合不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">主题颜色系统</h1>
        <ThemeToggle />
      </div>

      <p className="text-text-secondary">
        当前主题: <span className="font-semibold text-text-brand">{theme}</span>
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary">文本颜色</CardTitle>
            <CardDescription className="text-text-secondary">
              不同层级的文本颜色展示
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-text-primary text-lg font-bold">主要文本颜色</p>
              <p className="text-text-primary">用于标题和重要内容</p>
            </div>
            <div className="space-y-2">
              <p className="text-text-secondary text-lg font-bold">次要文本颜色</p>
              <p className="text-text-secondary">用于段落和一般内容</p>
            </div>
            <div className="space-y-2">
              <p className="text-text-tertiary text-lg font-bold">第三级文本颜色</p>
              <p className="text-text-tertiary">用于提示和次要说明</p>
            </div>
            <div className="space-y-2">
              <p className="text-text-brand text-lg font-bold">品牌文本颜色</p>
              <p className="text-text-brand">用于突出品牌相关内容</p>
            </div>
            <div className="space-y-2">
              <p className="text-text-accent text-lg font-bold">强调文本颜色</p>
              <p className="text-text-accent">用于需要吸引注意的内容</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary">状态颜色</CardTitle>
            <CardDescription className="text-text-secondary">
              表示不同状态的文本颜色
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-text-success text-lg font-bold">成功状态</p>
              <p className="text-text-success">用于表示操作成功或积极状态</p>
            </div>
            <div className="space-y-2">
              <p className="text-text-warning text-lg font-bold">警告状态</p>
              <p className="text-text-warning">用于表示需要注意的内容</p>
            </div>
            <div className="space-y-2">
              <p className="text-text-error text-lg font-bold">错误状态</p>
              <p className="text-text-error">用于表示错误或危险操作</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary">如何使用</CardTitle>
          <CardDescription className="text-text-secondary">
            在你的组件中使用这些颜色类的方法
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 rounded-md bg-muted p-4">
            <p className="font-mono text-sm text-text-secondary">
              {'<p className="text-text-primary">主要文本</p>'}
            </p>
            <p className="font-mono text-sm text-text-secondary">
              {'<p className="text-text-secondary">次要文本</p>'}
            </p>
            <p className="font-mono text-sm text-text-secondary">
              {'<p className="text-text-brand">品牌文本</p>'}
            </p>
            <p className="font-mono text-sm text-text-secondary">
              {'<span className="text-text-error">错误信息</span>'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


export default ThemeExample;