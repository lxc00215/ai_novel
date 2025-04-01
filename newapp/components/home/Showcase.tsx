'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

const works = [
  {
    title: '星际迷航',
    author: '张三',
    cover: '/covers/book1.jpg',
    description: '一部充满想象力的科幻小说'
  },
  {
    title: '都市传说',
    author: '李四',
    cover: '/covers/book2.jpg',
    description: '现代都市奇幻故事'
  },
  {
    title: '古风传奇',
    author: '王五',
    cover: '/covers/book3.jpg',
    description: '浪漫古风武侠小说'
  }
]

export default function Showcase() {
  return (
    <section className="py-20 bg-gradient-to-b from-paper/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-playfair font-bold text-primary mb-4">
            精选作品
          </h2>
          <p className="text-xl text-gray-600">
            来自我们用户的优秀创作
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {works.map((work, index) => (
            <motion.div
              key={work.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64">
                  <Image
                    src={work.cover}
                    alt={work.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="font-playfair">{work.title}</CardTitle>
                  <p className="text-sm text-gray-500">作者: {work.author}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{work.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 