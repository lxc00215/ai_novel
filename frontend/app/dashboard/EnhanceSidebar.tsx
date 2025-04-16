// components/Sidebar/EnhancedSidebar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from './sidebarContext';
import { 
  IoHomeOutline,
  IoBookOutline,
  IoChatbubbleOutline,
  IoFlaskOutline,
  IoNewspaperOutline,
  IoPencilOutline,
  IoRocketOutline,
  IoBulbOutline,
  IoLogInOutline,
  IoDownloadOutline,
  IoSettingsOutline,
  IoAddOutline,
  
  IoChevronBackOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';
import Logo from '../components/logo';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
  highlight?: boolean;
};

export function EnhancedSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebar();

  const navItems: NavItem[] = [

    {
      label: '灵感模式',
      icon: <IoBulbOutline className="h-5 w-5" />,
      href: '/dashboard/inspiration',
    },
    {
      label: '精细模式',
      icon: <IoFlaskOutline className="h-5 w-5" />,
      href: '/dashboard/writing',
    },
    {
      label: '拆书',
      icon: <IoBookOutline className="h-5 w-5" />,
      href: '/dashboard/analyze',
    },
    {
      label: '暴走模式',
      icon: <IoRocketOutline className="h-5 w-5" />,
      href: '/dashboard/crazy',
    },
    {
      label: '消息',
      icon: <IoChatbubbleOutline className="h-5 w-5" />,
      href: '/dashboard/messages',
    }
  ];

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 70 }
  };

  return (
    <motion.div 
      className="flex h-full flex-col bg-black text-white border-r border-zinc-800"
      initial={isCollapsed ? "collapsed" : "expanded"}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.2 }}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Logo isCollapsed={isCollapsed} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-zinc-800"
          onClick={toggleCollapse}
        >
          {isCollapsed ? 
            <IoChevronForwardOutline className="h-4 w-4" /> : 
            <IoChevronBackOutline className="h-4 w-4" />
          }
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <TooltipProvider key={item.href} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                      isActive 
                        ? "bg-zinc-800 text-white" 
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
                      item.highlight && !isActive && "bg-zinc-900",
                      isCollapsed && "justify-center p-2"
                    )}
                  >
                    {item.icon}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>

      <div className={cn(
        "flex flex-col gap-2 p-4 border-t border-zinc-800",
        isCollapsed && "items-center p-2"
      )}>
        <AnimatePresence>
          {!isCollapsed ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full space-y-2"
            >
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
              >
                <IoLogInOutline className="h-4 w-4" />
                <span>登录</span>
              </Link>
              <Link
                href="/download"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-700 to-rose-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <IoDownloadOutline className="h-4 w-4" />
                <span>MidReal App</span>
              </Link>
              <Link
                href="/settings"
                className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                <IoSettingsOutline className="h-4 w-4" />
                <span>更多</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/login"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
                    >
                      <IoLogInOutline className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
                    登录
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/download"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-700 to-rose-600 text-white hover:opacity-90 transition-opacity"
                    >
                      <IoDownloadOutline className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
                    MidReal App
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/settings"
                      className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                    >
                      <IoSettingsOutline className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
                    更多
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default EnhancedSidebar;