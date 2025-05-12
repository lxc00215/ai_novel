// app/dashboard/inspiration/[id]/components/ClientFallback.tsx
'use client'

import { useEffect, useState } from 'react';
import apiService from '@/app/services/api';
import SpirateDetailClient from './SpirateDetailClient';
import LoadingUI from '@/components/ui/loading';

export default function ClientFallback({ inspirationId }: { inspirationId: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl mb-4">加载失败</h2>
          <p className="text-gray-400 mb-4">{error}</p>
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

  return <SpirateDetailClient initialData={data} inspirationId={inspirationId} isNew={false} />;
}