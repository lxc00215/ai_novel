import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-playfair font-bold mb-4">AI文学工坊</h3>
            <p className="text-gray-300">
              用AI激发创作灵感，让写作更加轻松愉快
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">功能</h4>
            <ul className="space-y-2">
              <li><Link href="/ai-analysis" className="text-gray-300 hover:text-white">AI拆书</Link></li>
              <li><Link href="/generate" className="text-gray-300 hover:text-white">小说生成</Link></li>
              <li><Link href="/inspiration" className="text-gray-300 hover:text-white">灵感创作</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">资源</h4>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-gray-300 hover:text-white">帮助中心</Link></li>
              <li><Link href="/blog" className="text-gray-300 hover:text-white">创作博客</Link></li>
              <li><Link href="/community" className="text-gray-300 hover:text-white">作者社区</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">联系我们</h4>
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
              发送邮件
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
          <p>&copy; 2024 AI文学工坊. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
} 