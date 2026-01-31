'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminSidebarCollapsed', collapsed ? 'true' : 'false');
  }, [collapsed]);

  function toggle() {
    setCollapsed((s) => !s);
  }

  return (
    <div className={`admin-root ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="admin-topbar-wrap">
        <AdminTopbar onToggleSidebar={toggle} collapsed={collapsed} />
      </div>
      <aside className="admin-sidebar">
        <AdminSidebar collapsed={collapsed} />
      </aside>
      <div className="admin-container">
        <section className="admin-main">{children}</section>
      </div>
    </div>
  );
}
