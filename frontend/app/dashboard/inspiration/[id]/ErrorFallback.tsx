// app/dashboard/inspiration/[id]/components/ErrorFallback.tsx
'use client'

export default function ErrorFallback({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-md p-6 rounded-lg bg-gray-900">
        <h2 className="text-xl mb-4">加载失败</h2>
        <p className="text-gray-400 mb-4">
          服务器暂时无法连接，可能是网络问题或服务器维护中。
        </p>
        <p className="text-gray-400 mb-6">
          错误详情: {error}
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