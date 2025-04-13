'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'AI创作是否会侵犯版权？',
    answer: '我们的AI系统经过特殊训练，生成的内容都是原创的。我们也提供版权检测工具，确保创作的独特性。'
  },
  {
    question: '如何开始使用AI创作？',
    answer: '只需注册账号，选择创作模式，输入你的创作需求，AI就会为你生成相应的内容。整个过程简单直观。'
  },
  {
    question: '生成的内容可以修改吗？',
    answer: '当然可以。我们提供完整的编辑功能，你可以随时修改、完善AI生成的内容，直到满意为止。'
  }
]

export default function FAQ() {
  return (
    <section className="py-20 bg-paper/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-playfair font-bold text-primary mb-4">
            常见问题
          </h2>
          <p className="text-xl text-gray-600">
            解答你的疑惑
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
} 