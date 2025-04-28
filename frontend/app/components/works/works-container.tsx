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
  const [archive_works, setAchiveWorks] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    const newWork = await apiService.novels.create(title, description);
    console.log(JSON.stringify(newWork));
    if (newWork) {
      // 跳转页面
      console.log(newWork);
      router.push(`/dashboard/writing/${newWork.id}`);
    }
  };

  // 获取作品数据
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { getCurrentUserId } = await import('@/app/utils/jwt')
      const userId = getCurrentUserId();
      const response = await apiService.novels.getNovel(userId.toString());
      if (response) {
        const normalWorks: Novel[] = [];
        const archivedWorks: Novel[] = [];
        response.forEach((item: Novel) => {
          if (item.is_archive) {
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
      const response = await apiService.novels.updateNovel(id, { is_archive: isArchive });

      if (response && response.data) {
        if (isArchive) {
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

  // 处理作品删除
  const handleDelete = async (id: string) => {
    try {
      await apiService.novels.deleteNovel(id);
      // 删除成功后从列表中移除
      setWorks(prev => prev.filter(item => item.id !== id));
      setAchiveWorks(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("删除作品失败:", error);
    }
  };

  // 处理作品更新
  const handleUpdate = async (id: string, title: string, description: string) => {
    try {
      const response = await apiService.novels.updateNovel(id, { title, description });

      if (response && response.data) {
        // 更新作品列表中的作品信息
        setWorks(prev => prev.map(item =>
          item.id === id ? { ...item, title, description } : item
        ));

        // 更新归档列表中的作品信息
        setAchiveWorks(prev => prev.map(item =>
          item.id === id ? { ...item, title, description } : item
        ));
      }
    } catch (error) {
      console.error("更新作品信息失败:", error);
    }
  };

  // 对作品进行排序的函数：置顶的排在前面，相同置顶状态下按更新时间倒序排列
  const sortWorks = (items: Novel[]) => {
    return [...items].sort((a, b) => {
      // 首先按置顶状态排序
      if (a.is_top && !b.is_top) return -1;
      if (!a.is_top && b.is_top) return 1;

      // 置顶状态相同时，按更新时间排序（假设有updated_at字段，如果没有可以用created_at）
      const aDate = a.updated_at ? new Date(a.updated_at) : new Date(a.created_at);
      const bDate = b.updated_at ? new Date(b.updated_at) : new Date(b.created_at);

      // 降序排列，最新的在前面
      return bDate.getTime() - aDate.getTime();
    });
  };

  // 获取排序后的作品列表
  const getSortedWorks = () => {
    return sortWorks(works);
  };

  // 获取排序后的归档作品列表
  const getSortedArchiveWorks = () => {
    return sortWorks(archive_works);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="works" onValueChange={handleTabChange} className="w-full">
        <div className="bg-background rounded-lg shadow-sm mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto p-1 bg-background rounded-lg">
            <TabsTrigger
              value="works"
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${activeTab === "works"
                  ? "bg-background shadow-sm font-medium after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-emerald-500 after:rounded-full"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              作品
            </TabsTrigger>
            <TabsTrigger
              value="published"
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${activeTab === "published"
                  ? "bg-background shadow-sm font-medium after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-emerald-500 after:rounded-full"
                  : "text-gray-600 hover:text-gray-900"
                }`}>
              已归档
            </TabsTrigger>
            <TabsTrigger
              value="recycled"
              className={`hover:cursor-pointer text-base py-3 rounded-md transition-all ${activeTab === "recycled"
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
                {/* 新建作品卡片始终在第一位 */}
                <div onClick={openCreateDialog} className="h-full">
                  <CreateWorkCard />
                </div>

                {/* 排序后的用户作品列表 */}
                {getSortedWorks().map((work, index) => (
                  <div
                    key={work.id}
                    className="h-full"
                    // 设置较高的z-index来确保下拉菜单不会被其他卡片遮挡
                    style={{ zIndex: works.length - index }}
                  >
                    <WorkCard
                      work={work}
                      handleArchive={handleArchive}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="published" className="mt-2">
              {archive_works.length === 0 ? (
                <EmptyState message="暂无已归档作品" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getSortedArchiveWorks().map((work, index) => (
                    <div
                      key={work.id}
                      className="h-full"
                      style={{ zIndex: archive_works.length - index }}
                    >
                      <WorkCard
                        work={work}
                        handleArchive={handleArchive}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                      />
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