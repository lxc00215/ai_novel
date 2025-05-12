// app/dashboard/inspiration/[id]/page.tsx (服务器组件)
import { Suspense } from 'react';
import SpirateDetailClient from './SpirateDetailClient';
import LoadingUI from '@/components/ui/loading';
// import { getInspiration } from '@/app/services/server-api';
import { notFound } from 'next/navigation';
import apiService from '@/app/services/api';
import ErrorFallback from './ErrorFallback';
import dynamic from 'next/dynamic';

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
      return (<ErrorFallback error={fetchError.message || '连接超时'} />)
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


