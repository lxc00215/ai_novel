









// 退出登录按钮组件

import { Button } from "@/components/ui/button"
import { IoLogOutOutline } from "react-icons/io5"
import { useRouter } from "next/navigation"


const handleLogout = () => {
    const router = useRouter();

    // 清除localStorage中的token和用户信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 清除cookie中的token
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // 重定向到登录页
    router.push('/auth');
}
const LogoutButton = () => {
    return (
        <Button
                  onClick={handleLogout}
                  className="flex w-full hover:cursor-pointer items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors"
                >
                  <IoLogOutOutline className="h-4 w-4" />
                  <span >退出登录</span>
                </Button>
    )
}

export default LogoutButton;
