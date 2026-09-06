import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { useDashboard } from '../hooks/useData';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: dashboard } = useDashboard();

  return (
    <div className="flex min-h-screen bg-[#f8faf8]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          farmName={dashboard?.farmName}
          roverConnected={dashboard?.connectivity === 'Connected'}
          lastSync={dashboard?.lastSynchronized}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
