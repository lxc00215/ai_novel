// app/components/ui/loading.tsx
export default function LoadingUI() {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>正在加载故事内容...</p>
        </div>
      </div>
    );
  }