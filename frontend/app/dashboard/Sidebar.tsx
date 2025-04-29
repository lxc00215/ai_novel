// components/Sidebar/Sidebar.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  IoHomeOutline,
  IoChatbubbleOutline,
  IoFlaskOutline,
  IoLogInOutline,
  IoDownloadOutline,
  IoSettingsOutline,
  IoAddOutline
} from 'react-icons/io5';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
};

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      label: '生成',
      icon: <IoAddOutline className="h-5 w-5" />,
      href: '/create',
      active: pathname === '/create',
    },
    {
      label: '首页',
      icon: <IoHomeOutline className="h-5 w-5" />,
      href: '/',
      active: pathname === '/',
    },
    {
      label: '消息',
      icon: <IoChatbubbleOutline className="h-5 w-5" />,
      href: '/messages',
      active: pathname === '/messages',
    },
    {
      label: '实验室',
      icon: <IoFlaskOutline className="h-5 w-5" />,
      href: '/lab',
      active: pathname === '/lab',
    },

  ];

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="relative h-6 w-6">
            <div className="absolute h-4 w-4 rounded-full bg-blue-600 left-0 top-1"></div>
            <div className="absolute h-4 w-4 rounded-full bg-red-600 left-2 top-1"></div>
          </div>
          <span className="text-xl font-semibold tracking-tight">MidReal</span>
          <span className="text-xs align-top">TL</span>
        </div>
      </div>
      <nav className="flex-1 space-y-2 p-2">
        {navItems.map((item) => (
          <TooltipProvider key={item.href} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-zinc-800",
                    item.active && "bg-zinc-700"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
                {item.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>
      <div className="flex flex-col gap-2 p-4">
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
        >
          <IoLogInOutline className="h-5 w-5" />
          <span>登录</span>
        </Link>
        <Link
          href="/download"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-700 to-rose-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <IoDownloadOutline className="h-5 w-5" />
          <span>MidReal App</span>
        </Link>
        <Link
          href="/settings"
          className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          <IoSettingsOutline className="h-5 w-5" />
          <span>更多</span>
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;