'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { PenTool, Sparkles, Edit, FileText } from 'lucide-react'

const steps = [
  {
    icon: PenTool,
    title: '选择模式',
    description: '选择你想要的创作模式'
  },
  {
    icon: Sparkles,
    title: '输入要求',
    description: '描述你的创作需求和偏好'
  },
  {
    icon: Edit,
    title: 'AI生成',
    description: 'AI快速生成符合要求的内容'
  },
  {
    icon: FileText,
    title: '编辑完善',
    description: '对生成的内容进行修改完善'
  }
]

export default function Process() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-playfair font-bold text-primary mb-4">
            创作流程
          </h2>
          <p className="text-xl text-gray-600">
            四步轻松完成创作
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-0 w-full h-[2px] bg-primary/20 -z-10" />
              )}
              <Card className="relative bg-white hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-playfair font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 