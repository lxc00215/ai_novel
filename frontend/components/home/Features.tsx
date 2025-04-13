'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, Wand2, Lightbulb } from 'lucide-react'

const features = [
  {
    title: 'AI拆书',
    description: '深度解析经典作品，学习大师写作技巧',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-700'
  },
  {
    title: '一键生成',
    description: '智能生成完整小说，多种风格任你选择',
    icon: Wand2,
    color: 'from-purple-500 to-purple-700'
  },
  {
    title: '灵感创作',
    description: '提供创意灵感，激发你的写作思路',
    icon: Lightbulb,
    color: 'from-amber-500 to-amber-700'
  }
]

export default function Features() {
  return (
    <section className="py-20 bg-paper/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-playfair font-bold text-primary mb-4">
            核心功能
          </h2>
          <p className="text-xl text-gray-600">
            专业的AI写作工具，助你轻松创作
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10`} />
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-playfair mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-lg">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 