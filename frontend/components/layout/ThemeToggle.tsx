"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react" // 确保安装了 lucide-react

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:text-[#7b1fa2] hover:cursor-pointer bg-background text-foreground"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}