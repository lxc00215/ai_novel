'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useScroll } from 'framer-motion'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()
  
  // 监听滚动更新导航栏透明度
  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-playfair text-primary">AI文学工坊</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/ai-analysis" className="text-gray-700 hover:text-primary transition">AI拆书</Link>
            <Link href="/generate" className="text-gray-700 hover:text-primary transition">小说生成</Link>
            <Link href="/inspiration" className="text-gray-700 hover:text-primary transition">灵感创作</Link>
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              开始创作
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
} 