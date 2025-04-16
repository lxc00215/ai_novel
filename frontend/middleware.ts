import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 这个函数可以是异步的，用于拦截请求
export function middleware(request: NextRequest) {
  // 获取当前路径
  const path = request.nextUrl.pathname
  
  // 获取是否登录的信息（从 cookie 中获取）
  const isAuthenticated = request.cookies.has('auth') || request.cookies.has('token')
  
  // 无需身份验证即可访问的路径
  const publicPaths = ['/auth/login', '/auth/register', '/about', '/contact', '/']
  const isPublicPath = publicPaths.includes(path) || path.startsWith('/api/public')
  
  


  // 需要身份验证的路径列表
  const authRequiredPaths = [
    '/settings',
    '/profile',
    '/create',
  ]
  
  // 路径重定向映射
  const redirectMappings: Record<string, string> = {
    '/old-page': '/new-page',
    '/legacy': '/modern',
    '/api/v1': '/api/v2',
    '/dashboard': '/dashboard/inspiration',
  }
  
  // === 1. 处理重定向映射 ===
  if (path in redirectMappings) {
    const newUrl = new URL(redirectMappings[path], request.url)
    return NextResponse.redirect(newUrl)
  }
  
  // === 2. 处理需要身份验证的路径 ===
  if (authRequiredPaths.some(authPath => path.startsWith(authPath)) && !isAuthenticated) {
    // 保存当前 URL 以便登录后重定向回来
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', path)
    return NextResponse.redirect(loginUrl)
  }
  
  // === 3. 处理不存在的页面（通常由 Next.js 的 404 机制处理）===
  // 这里我们可以添加自定义逻辑，如针对特定条件重定向到自定义 404 页面
  
  // 继续请求处理（如果没有被拦截）
  return NextResponse.next()
}

// 配置中间件应用于哪些路径
export const config = {
  // 包含：应用中间件的路径
  matcher: [
    // 应用于所有路径除了 _next, public, favicon, 等静态资源
    // 以及 api 路由和特定的静态文件
    '/((?!_next/static|_next/image|favicon.ico|public|api/public).*)',
  ],
}