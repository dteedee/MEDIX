import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/common.types';

type SidebarItem = {
  to: string;
  label: string;
};

interface SidebarProps {
  basePath?: string; // e.g., '/app/patient'
}

export const Sidebar: React.FC<SidebarProps> = ({ basePath }) => {
  const { user } = useAuth();
  const location = useLocation();

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
          { to: 'analytics', label: 'Thống kê' },
          { to: 'settings', label: 'Cấu hình hệ thống' },
        ];
      case UserRole.MANAGER:
        return [
          { to: 'dashboard', label: 'Dashboard' },
          { to: 'appointments', label: 'Quản lý lịch hẹn' },
          { to: 'content', label: 'Quản lý nội dung' },
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
    <aside style={{
      width: 220,
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      padding: '16px 8px',
      height: 'calc(100vh - 56px)',
      position: 'sticky',
      top: 56,
    }}>
      <div style={{ fontWeight: 700, color: '#111827', padding: '8px 12px', marginBottom: 8 }}>
        MEDIX
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={`${autoBasePath}/${it.to}`}
            end
            style={({ isActive }) => ({
              padding: '10px 12px',
              borderRadius: 6,
              color: isActive ? '#1f2937' : '#6b7280',
              backgroundColor: isActive ? '#f3f4f6' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            })}
          >
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;