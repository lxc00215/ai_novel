'use client';

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        // 清除localStorage中的token和用户信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // 清除cookie中的token
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        // 重定向到登录页
        router.push('/auth');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-100"
        >
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
        </Button>
    );
} 