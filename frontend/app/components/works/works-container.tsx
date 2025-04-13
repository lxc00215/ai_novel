"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, UploadCloud, Settings2 } from "lucide-react";
import WorkCard from "./work-card";
import CreateWorkCard from "./create-work-card";
import EmptyState from "./empty-state";
import CreateWorkDialog from "./create-work-dialog";
import apiService from "@/app/services/api";
import { useRouter } from "next/navigation";
import { Novel } from "@/app/services/types";


export default function WorksContainer() {

  const router = useRouter();
  const [works, setWorks] = useState<Novel[]>([]);
  const [archive_works,setAchiveWorks] = useState<Novel[]>([])
  const [isLoading,setIsLoading] = useState(false)

  // 跟踪当前激活的标签
  const [activeTab, setActiveTab] = useState("works");
  
  // 控制新建作品对话框
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // 处理标签变化
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // 打开创建作品对话框
  const openCreateDialog = () => {
    setCreateDialogOpen(true);
  };
  
  // 处理创建作品提交
  const handleCreateSubmit = async (title: string, description: string) => {
    // 创建新作品并添加到列表
    const newWork = await apiService.novels.create(title, description)
    console.log(JSON.stringify(newWork))
    if(newWork){  
        //跳转页面
        console.log(newWork)
        router.push(`/dashboard/writing/${newWork.id}`)
    }
  };


//   获取作品数据

const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.novels.getNovel("4");
      
      if(response) {
        const normalWorks: Novel[] = [];
        const archivedWorks: Novel[] = [];
        
        response.forEach((item: Novel) => {
          if(item.is_archive) {
            archivedWorks.push(item);
          } else {
            normalWorks.push(item);
          }
        });
        
        setWorks(normalWorks);
        setAchiveWorks(archivedWorks);
      }
    } catch (error) {
      console.error("获取作品数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

// 归档动作发出执行的方法
const handleArchive = async (id: string, isArchive: boolean) => {
    try {
      const response = await apiService.novels.updateNovel(id, {is_archive: isArchive});
      
      if(response && response.data) {
        if(isArchive) {
          // 从作品列表移除，添加到归档列表
          setWorks(prev => prev.filter(item => item.id !== id));
          setAchiveWorks(prev => [...prev, response.data]);
        } else {
          // 从归档列表移除，添加到作品列表
          setAchiveWorks(prev => prev.filter(item => item.id !== id));
          setWorks(prev => [...prev, response.data]);
        }
      }
    } catch (error) {
      console.error("更新归档状态失败:", error);
    }
  };


useEffect(()=>{
    fetchData()
},[])
  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="works" onValueChange={handleTabChange} className="w-full">
        <div className="bg-black rounded-lg shadow-sm mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto p-1 bg-black-50 rounded-lg">
            <TabsTrigger 
              value="works" 
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${
                activeTab === "works" 
                  ? "bg-black shadow-sm font-medium after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-emerald-500 after:rounded-full" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              作品
            </TabsTrigger>
            <TabsTrigger 
              value="published" 
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${
                activeTab === "published" 
                  ? "bg-black shadow-sm font-medium after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-emerald-500 after:rounded-full" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              已归档
            </TabsTrigger>
            <TabsTrigger 
              value="recycled" 
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${
                activeTab === "recycled" 
                  ? "bg-black shadow-sm font-medium after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-emerald-500 after:rounded-full" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              回收站
            </TabsTrigger>
          </TabsList>
        </div>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          </div>
        ) : (
          <>
            <TabsContent value="works" className="mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* 新建作品卡片 */}
                <div onClick={openCreateDialog} className="h-full">
                  <CreateWorkCard />
                </div>
                
                {/* 用户作品列表 */}
                {works.length > 0 ? (
                  works.map((work, index) => (
                    <div 
                      key={work.id} 
                      className="h-full"
                      // 设置较高的z-index来确保下拉菜单不会被其他卡片遮挡
                      style={{ zIndex: works.length - index }}
                    >
                      <WorkCard key={work.id} work={work} handleArchive={handleArchive} />
                    </div>
                  ))
                ) : (
                  works.length === 0 && !isLoading && (
                    <div className="col-span-full">
                      <EmptyState message="暂无作品，点击左侧卡片创建你的第一个作品吧！" />
                    </div>
                  )
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="published" className="mt-2">
              {archive_works.length === 0 ? (
                <EmptyState message="暂无已归档作品" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {archive_works.map((work, index) => (
                    <div 
                      key={work.id} 
                      className="h-full"
                      style={{ zIndex: archive_works.length - index }}
                    >
                      <WorkCard work={work} handleArchive={handleArchive} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recycled" className="mt-2">
              <EmptyState message="回收站中没有作品" />
            </TabsContent>
          </>
        )}
      </Tabs>
      
      {/* 创建作品对话框 */}
      <CreateWorkDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}