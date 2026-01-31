'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Layers,
  Globe,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export default function AdminSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const pathname = usePathname() || '';
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const items = [
    {
      href: '/admin/languages',
      label: 'Languages',
      icon: Globe,
    },
    {
      href: '/admin/pages',
      label: 'Pages',
      icon: FileText,
      children: [
        { href: '/admin/pages', label: 'All Pages' },
        { href: '/admin/pages/create', label: 'Add New' },
      ],
    },
    {
      href: '/admin/posts',
      label: 'Posts',
      icon: Layers,
      children: [
        { href: '/admin/posts', label: 'All Posts' },
        { href: '/admin/posts?new=true', label: 'Add New' },
      ],
    },
  ];

  function toggleExpand(href: string) {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href],
    );
  }

  return (
    <nav className={`admin-nav ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-brand">{collapsed ? 'VZ' : 'VELZON'}</div>
      <ul className="nav-list">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          const isExpanded = expandedItems.includes(item.href);

          return (
            <li
              key={item.href}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <Link
                href={item.href}
                className="nav-link"
                onClick={(e) => {
                  if (item.children && !collapsed) {
                    e.preventDefault();
                    toggleExpand(item.href);
                  }
                }}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                {!collapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.children && !collapsed && (
                      <span
                        className={`nav-chev ${isExpanded ? 'expanded' : ''}`}
                      >
                        <ChevronDown size={16} />
                      </span>
                    )}
                  </>
                )}
              </Link>
              {item.children && !collapsed && isExpanded && (
                <ul className="nav-sub">
                  {item.children.map((c) => (
                    <li
                      key={c.href}
                      className={pathname === c.href ? 'active' : ''}
                    >
                      <Link href={c.href} className="nav-sub-link">
                        <span className="sub-dot"></span>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {item.children && collapsed && (
                <ul className="nav-sub nav-sub-flyout">
                  {item.children.map((c) => (
                    <li
                      key={c.href}
                      className={pathname === c.href ? 'active' : ''}
                    >
                      <Link href={c.href} className="nav-sub-link">
                        <span className="sub-dot"></span>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
