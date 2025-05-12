// app/dashboard/inspiration/[id]/ClientOnlyDetail.tsx
'use client'

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SpirateDetailClient from './SpirateDetailClient';
import LoadingUI from '@/components/ui/loading';
import apiService from '@/app/services/api';

export default function ClientOnlyDetail({ inspirationId }: { inspirationId: string }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const isNew = searchParams?.get('isNew') === 'true';
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await apiService.spirate.get(inspirationId);
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error('获取数据失败:', err);
        setError(err.message || '加载失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [inspirationId]);
  
  if (isLoading) return <LoadingUI />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md p-6 rounded-lg bg-gray-900">
          <h2 className="text-xl mb-4">加载失败</h2>
          <p className="text-gray-400 mb-4">
            {error}
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
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>未找到数据</p>
      </div>
    );
  }
  
  return (
    <SpirateDetailClient
      initialData={data}
      inspirationId={inspirationId}
      isNew={isNew}
    />
  );
}