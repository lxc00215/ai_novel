// app/dashboard/inspiration/[id]/page.tsx (服务器组件)
import { Suspense } from 'react';
import SpirateDetailClient from './SpirateDetailClient';
import LoadingUI from '@/components/ui/loading';
// import { getInspiration } from '@/app/services/server-api';
import { notFound } from 'next/navigation';
import apiService from '@/app/services/api';

// 服务器端数据获取
export default async function SpirateDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  try {
    // 在服务器端获取初始数据



    const resolvedParams = await params;
    const inspirationId = resolvedParams.id;





    if (!inspirationId) return notFound();

    const resolvedSearchParams = await searchParams;
    const isNew = resolvedSearchParams?.isNew === 'true';


    // 从服务器获取初始数据
     let inspirationData;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时
      
      // 从服务器获取初始数据
      inspirationData = await apiService.spirate.get(inspirationId);
      
      clearTimeout(timeoutId);
    } catch (fetchError:any) {
      console.error("获取数据超时或连接问题:", fetchError);
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center max-w-md p-6 rounded-lg bg-gray-900">
            <h2 className="text-xl mb-4">加载失败</h2>
            <p className="text-gray-400 mb-4">
              服务器暂时无法连接，可能是网络问题或服务器维护中。
            </p>
            <p className="text-gray-400 mb-6">
              错误详情: {fetchError.message || '连接超时'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              重试
            </button>
            <a
              href="/dashboard/inspiration"
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              返回列表
            </a>
          </div>
        </div>
      );
    }

    if (!inspirationData) {
      return notFound();
    }

    // 将数据传递给客户端组件
    return (
      <Suspense fallback={<LoadingUI />}>
        <SpirateDetailClient
          initialData={inspirationData}
          inspirationId={inspirationId}
          isNew={isNew}
        />
      </Suspense>
    );
  } catch (error: any) {
    console.error("加载灵感详情失败:", error);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl mb-4">加载失败</h2>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }
}


