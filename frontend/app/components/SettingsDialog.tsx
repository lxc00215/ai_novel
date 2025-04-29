'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useTheme } from 'next-themes'
import { Sun, Moon, X } from 'lucide-react'

// 设置项目类型
type SettingOption = {
  id: string
  label: string
  icon: React.ReactNode
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  // 当前选中的设置项
  const [activeOption, setActiveOption] = useState('theme')
  
  // 主题设置
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 确保主题组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 设置选项列表
  const settingOptions: SettingOption[] = [
    { 
      id: 'theme', 
      label: '主题设置', 
      icon: theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
    },
    
    // 以后可以在这里添加更多设置选项
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 bg-background border-border overflow-hidden">
        <div className="flex h-[600px] overflow-hidden">
          {/* 左侧选项菜单 */}
          <div className="w-3/10 border-r border-border bg-muted/30">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle className="text-xl font-semibold">设置</DialogTitle>
              <DialogDescription>自定义您的使用体验</DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col py-2">
              {settingOptions.map((option) => (
                <Button 
                  key={option.id}
                  variant="ghost"
                  className={`justify-start rounded-none px-4 py-3 h-auto ${
                    activeOption === option.id 
                      ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                  onClick={() => setActiveOption(option.id)}
                >
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          {/* 右侧内容区域 */}
          <div className="w-7/10 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeOption}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {/* 主题设置内容 */}
                {activeOption === 'theme' && mounted && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">主题设置</h2>
                      <p className="text-muted-foreground">选择您喜欢的显示主题</p>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h3 className="text-base font-medium">深色模式</h3>
                          <p className="text-sm text-muted-foreground">切换深色和浅色模式</p>
                        </div>
                        <Switch 
                          checked={theme === 'dark'} 
                          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          className="h-24 w-full flex flex-col justify-center gap-2 border-2"
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="h-6 w-6" />
                          <span>浅色</span>
                        </Button>
                        
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          className="h-24 w-full flex flex-col justify-center gap-2 border-2"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="h-6 w-6" />
                          <span>深色</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}