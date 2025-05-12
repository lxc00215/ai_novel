// app/dashboard/inspiration/[id]/components/ClientFallback.tsx
'use client'

import { useEffect, useState } from 'react';
import apiService from '@/app/services/api';
import SpirateDetailClient from './SpirateDetailClient';
import LoadingUI from '@/components/ui/loading';

export default function ClientFallback({ 
  inspirationId, 
  isNew = false 
}: { 
  inspirationId: string,
  isNew?: boolean
}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 客户端API请求
        const result = await apiService.spirate.get(inspirationId);
        setData(result);
      } catch (err: any) {
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [inspirationId]);

  if (loading) return <LoadingUI />;
  if (error) return <div className="text-center p-8">加载失败: {error}</div>;

  return <SpirateDetailClient initialData={data} inspirationId={inspirationId} isNew={isNew} />;
}