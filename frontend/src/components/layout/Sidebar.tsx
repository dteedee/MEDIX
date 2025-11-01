import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/common.types';
import '../../styles/Sidebar.css';

type SidebarItem = {
  to: string;
  label: string;
  submenu?: SidebarItem[];
};

interface SidebarProps {
  basePath?: string; // e.g., '/app/patient'
}

export const Sidebar: React.FC<SidebarProps> = ({ basePath }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [openCMS, setOpenCMS] = useState(false);

  const toggleCMS = () => setOpenCMS((prev) => !prev);

  // Auto-detect basePath from current /app/<module> when not provided
  const autoBasePath = useMemo(() => {
    if (basePath) return basePath;
    const segments = location.pathname.split('/').filter(Boolean);
    // Expecting /app/<section>/...
    if (segments[0] === 'app' && segments[1]) {
      return `/app/${segments[1]}`;
    }
    return '/app';
  }, [basePath, location.pathname]);

  // Menu per role
  const items: SidebarItem[] = useMemo(() => {
    switch (user?.role as UserRole | undefined) {
      case UserRole.ADMIN:
        return [
          { to: 'dashboard', label: 'Dashboard' },
          { to: 'users', label: 'Quản lý người dùng' },
          { to: 'doctors', label: 'Quản lý bác sĩ' },
          { to: 'patients', label: 'Quản lý bệnh nhân' },
          {
            to: '#',
            label: 'Nội dung - CMS',
            submenu: [
              { to: '/manager/articles', label: 'Quản lý Bài viết' },
              { to: '/manager/banners', label: 'Quản lý Banner' },
              { to: '/articles', label: 'Xem trang bài viết' },
            ],
          },
          { to: 'analytics', label: 'Thống kê' },
          { to: 'settings', label: 'Cấu hình hệ thống' },
        ];
      case UserRole.MANAGER:
        return [
          { to: 'dashboard', label: 'Dashboard' },
          { to: 'appointments', label: 'Quản lý lịch hẹn' },
          {
            to: '#',
            label: 'Nội dung - CMS',
            submenu: [
              { to: '/manager/articles', label: 'Quản lý Bài viết' },
              { to: '/manager/banners', label: 'Quản lý Banner' },
              { to: '/manager/categories', label: 'Quản lý Danh mục' },
              { to: '/manager/cms-pages', label: 'Quản lý CMSpage' },
              { to: '/articles', label: 'Xem trang bài viết' },
            ],
          },
          { to: 'analytics', label: 'Thống kê' },
          { to: 'profile', label: 'Quản lý Profile' },
        ];
      case UserRole.DOCTOR:
        return [
          { to: 'dashboard', label: 'Dashboard' },
          { to: 'appointments', label: 'Lịch khám' },
          { to: 'patients', label: 'Hồ sơ bệnh nhân' },
          { to: 'prescriptions', label: 'Đơn thuốc' },
          { to: 'profile', label: 'Quản lý Profile' },
        ];
      case UserRole.PATIENT:
      default:
        return [
          { to: 'dashboard', label: 'Dashboard' },
          { to: 'appointments', label: 'Quản lý lịch hẹn' },
          { to: 'results', label: 'Xem kết quả' },
          { to: 'billing', label: 'Quản lý tài chính' },
          { to: 'profile', label: 'Quản lý Profile' },
          { to: 'transactions', label: 'Lịch sử giao dịch' },
        ];
    }
  }, [user?.role]);

  return (
    <aside className="medix-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo-box" />
        <div className="sidebar-logo-text">MEDIX</div>
      </div>

      <nav className="sidebar-nav">
        {items.map((it) => {
          if (it.submenu) {
            return (
              <div key={it.label}>
                <div
                  className="sidebar-section"
                  onClick={toggleCMS}
                  style={{ cursor: 'pointer' }}
                >
                  {it.label} {openCMS ? '▲' : '▼'}
                </div>
                {openCMS &&
                  it.submenu.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      target={sub.to.startsWith('http') ? '_blank' : undefined}
                      className="sidebar-link sub"
                      style={({ isActive }) => ({
                        color: isActive ? '#1f2937' : '#6b7280',
                        backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                        textDecoration: 'none',
                      })}
                    >
                      {sub.label}
                    </NavLink>
                  ))}
              </div>
            );
          }

          return (
            <NavLink
              key={it.to}
              to={`${autoBasePath}/${it.to}`}
              end
              className="sidebar-link"
              style={({ isActive }) => ({
                color: isActive ? '#1f2937' : '#6b7280',
                backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {it.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
