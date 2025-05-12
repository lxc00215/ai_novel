// app/dashboard/inspiration/[id]/page.tsx (服务器组件)
import { Suspense } from 'react';
import SpirateDetailClient from './SpirateDetailClient';
import LoadingUI from '@/components/ui/loading';
// import { getInspiration } from '@/app/services/server-api';
import { notFound } from 'next/navigation';
import apiService from '@/app/services/api';
import ErrorFallback from './ErrorFallback';
import dynamic from 'next/dynamic';
import ClientOnlyDetail from './clientFallback';

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
  



    // 将数据传递给客户端组件
    return (
      <Suspense fallback={<LoadingUI />}>
        <ClientOnlyDetail
        inspirationId={inspirationId} />
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


