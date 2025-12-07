// Must be a Client Component to use Zustand store and dynamic components
'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function Home() {
  return (
    <main className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        {/* Main draggable dashboard */}
        <DashboardLayout />
      </div>
    </main>
  );
}