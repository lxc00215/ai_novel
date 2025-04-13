'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e] to-[#7b1fa2] opacity-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 文字内容 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-playfair font-bold text-primary mb-6">
              让AI点亮你的创作灵感
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              专业的AI小说创作平台，助你轻松完成从灵感到成书的全过程
            </p>
            <div className="flex space-x-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                开始创作
              </Button>
              <Button size="lg" variant="outline">
                了解更多
              </Button>
            </div>
          </motion.div>

          {/* 3D书籍模型 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-[500px]"
          >
            <Image
              src="/book-3d.png"
              alt="AI创作平台"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
} 