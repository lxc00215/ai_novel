'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageSliderProps {
  mainPage: ReactNode
  secondaryPage: ReactNode
  isSecondaryVisible: boolean
  transitionDuration?: number
}

export function PageSlider({
  mainPage,
  secondaryPage,
  isSecondaryVisible,
  transitionDuration = 300
}: PageSliderProps) {
  // 设置CSS变量以控制过渡时间
  const transitionStyle = {
    '--transition-duration': `${transitionDuration}ms`
  } as React.CSSProperties

  return (
    <div className="relative  w-full overflow-hidden">
      {/* 页面容器 */}
      <div 
        className="flex h-full w-[200%]"
        style={transitionStyle}
      >
        {/* 主页面 */}
        <div 
          className={cn(
            "w-full h-full transition-transform",
            "duration-[var(--transition-duration)]"
          )}
          style={{
            transform: isSecondaryVisible ? 'translateX(-100%)' : 'translateX(0)'
          }}
        >
          {mainPage}
        </div>

        {/* 次要页面 */}
        <div 
          className={cn(
            "w-full h-full transition-transform",
            "duration-[var(--transition-duration)]"
          )}
          style={{
            transform: isSecondaryVisible ? 'translateX(-100%)' : 'translateX(0)'
          }}
        >
          {secondaryPage}
        </div>
      </div>
    </div>
  )
} 