'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, X, Camera, Check } from 'lucide-react'
import { toast } from 'sonner'
import { User } from '../services/types'
import apiService from '../services/api'

// 用户信息类型


export function ProfileDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  // 用户信息
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // 编辑字段
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  // 从localStorage或API获取用户信息
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!open) return
      
      setLoading(true)
      try {

        const user = localStorage.getItem('user')
        
        if (!user) {
          throw new Error('未登录')
        }
        
        setUserProfile(JSON.parse(user))
        setUserName(JSON.parse(user).account)
        setEmail(JSON.parse(user).email)
        setAvatar(JSON.parse(user).avatar_url || null)
      } catch (error) {
        console.error('获取用户信息失败:', error)
        toast.error('获取用户信息失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [open])
  
  // 选择头像文件
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      
      // 创建预览URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 保存更新
  const handleSaveProfile = async () => {
    setUpdating(true)
    try {
      // 模拟API调用
      // 实际项目中替换为真实API调用
      let image_url = null
    //   先上传图片到图床
    if (avatarFile) {
      image_url = await apiService.utils.uploadImage(avatarFile)
    }

      console.log(image_url+"上传图片成功")
      const user = localStorage.getItem('user')
      const new_user = {
        account: userName,
        email: email,
        avatar_url: image_url,
        ...JSON.parse(user || '{}')
      }
      const res = await apiService.user.updateUser(new_user)
      
      console.log(JSON.stringify(res))
      // 模拟保存到localStorage

      toast.success('个人信息更新成功')
      onOpenChange(false)
    } catch (error) {
      console.error('更新个人信息失败:', error)
      toast.error('更新个人信息失败')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">个人信息</DialogTitle>
          <DialogDescription>
            查看和更新您的个人资料信息
          </DialogDescription>
        </DialogHeader>

        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* 头像上传 */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">点击图标上传新头像</p>
              </div>
            </div>
            
            <Separator />
            
            {/* 用户名和邮箱 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input 
                  id="username" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="请输入用户名"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">电子邮箱</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={updating}
              >
                取消
              </Button>
              
              <Button 
                onClick={handleSaveProfile}
                disabled={updating}
                className="gap-2"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                保存修改
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}