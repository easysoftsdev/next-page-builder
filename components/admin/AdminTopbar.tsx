'use client';

import {
  Bell,
  User,
  Menu,
  Globe,
  Grid3X3,
  ShoppingBag,
  Maximize2,
  Moon,
  Search,
} from 'lucide-react';

export default function AdminTopbar({
  onToggleSidebar,
  collapsed,
}: {
  onToggleSidebar: () => void;
  collapsed: boolean;
}) {
  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={20} />
        </button>

        <div className="topbar-search">
          <Search size={16} />
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Language">
          <Globe size={18} />
        </button>
        <button className="topbar-icon-btn" title="Apps">
          <Grid3X3 size={18} />
        </button>
        <button className="topbar-icon-btn" title="Store">
          <ShoppingBag size={18} />
        </button>
        <button className="topbar-icon-btn" title="Fullscreen">
          <Maximize2 size={18} />
        </button>
        <button className="topbar-icon-btn" title="Theme">
          <Moon size={18} />
        </button>

        <div className="topbar-divider"></div>

        <button className="topbar-icon-btn notification-btn">
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </button>

        <button className="topbar-user-btn">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Anna Adame</div>
            <div className="user-role">Founder</div>
          </div>
        </button>
      </div>
    </header>
  );
}
