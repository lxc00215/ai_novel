// app/dashboard/inspiration/[id]/page.tsx (服务器组件)
import { Suspense } from 'react';
import SpirateDetailClient from './SpirateDetailClient';
import LoadingUI from '@/components/ui/loading';
// import { getInspiration } from '@/app/services/server-api';
import { notFound } from 'next/navigation';
import apiService from '@/app/services/api';

// 服务器端数据获取
export default async function SpirateDetailPage({ params, searchParams }:{ 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  try {
    // 在服务器端获取初始数据
    

    let inspirationId = ""
    params.then((params) => {
      inspirationId = params?.id as string;
    })

    if (!inspirationId) return notFound();
    let isNew = true;
     searchParams.then((params) => {
      isNew = params?.isNew === 'true';
    })
    
    // 从服务器获取初始数据
    const inspirationData = await apiService.spirate.get(inspirationId);
    
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
  } catch (error:  any) {
    console.error("加载灵感详情失败:", error);
  }
}


