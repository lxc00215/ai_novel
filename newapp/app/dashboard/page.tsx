// src/app/console/page.tsx
import DashboardLayout from './layout';

export const metadata = {
  title: '控制台 | AI小说创作助手',
  description: 'AI驱动的小说创作助手控制台，集中管理您的创作项目。',
};

export default function ConsolePage() {
  return (
    <DashboardLayout>
        <div>
            <h1>欢迎回来，控制台</h1>
        </div>
    </DashboardLayout>
  );
}