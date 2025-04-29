'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  // 可选：自动重定向到首页
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000) // 5秒后重定向
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div className="max-w-md text-center p-8">
        <h1 className="text-6xl font-bold text-text-primary mb-6">404</h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">页面不存在</h2>
        <p className="text-text-secondary mb-8">
          您访问的页面可能已被移除、名称已更改或暂时不可用。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => router.back()}>
            返回上一页
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              返回首页
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-text-tertiary">
          页面将在 5 秒后自动跳转到首页...
        </p>
      </div>
    </div>
  )
}