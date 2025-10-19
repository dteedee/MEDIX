import React from 'react';
import { UserDTO } from '../../types/user.types';

interface Props {
  user: UserDTO | null;
  onClose: () => void;
  isLoading: boolean;
}

export default function UserDetails({ user, onClose, isLoading }: Props) {
  if (!user) return null;

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';
  const getGender = (code?: string) => {
    if (code === 'MALE') return 'Nam';
    if (code === 'FEMALE') return 'Nữ';
    if (code === 'OTHER') return 'Khác';
    return 'Chưa có';
  };

  // --- Styles ---
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 28px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 16,
    marginBottom: 24,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: '#6b7280',
  };

  const contentGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px 28px',
  };

  const detailItemStyle: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.6,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#6b7280',
    fontWeight: 500,
    marginBottom: 4,
  };

  const valueStyle: React.CSSProperties = {
    color: '#1f2937',
    wordBreak: 'break-word',
  };

  const fullWidthItem: React.CSSProperties = {
    ...detailItemStyle,
    gridColumn: '1 / -1',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Chi tiết Người dùng</h2>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>Đang tải chi tiết...</div>
        ) : (
          <div style={contentGridStyle}>
            <div style={{ ...fullWidthItem, display: 'flex', alignItems: 'center', gap: 20 }}>
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.userName || user.email)}&background=random`} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
              <div>
                <p style={{ ...valueStyle, fontSize: 18, fontWeight: 600, margin: 0 }}>{user.fullName || 'Chưa có tên'}</p>
                <p style={{ ...valueStyle, color: '#6b7280', margin: '4px 0 0 0' }}>{user.userName ? `@${user.userName}` : user.email}</p>
              </div>
            </div>

            <div style={detailItemStyle}><span style={labelStyle}>Họ và tên</span><span style={valueStyle}>{user.fullName || 'Chưa có'}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Tên đăng nhập</span><span style={valueStyle}>{user.userName || 'Chưa có'}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Email</span><span style={valueStyle}>{user.email}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Số điện thoại</span><span style={valueStyle}>{user.phoneNumber || 'Chưa có'}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Vai trò</span><span style={valueStyle}>{user.role || 'Chưa có'}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Ngày sinh</span><span style={valueStyle}>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa có'}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Giới tính</span><span style={valueStyle}>{getGender(user.genderCode)}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Số CMND/CCCD</span><span style={valueStyle}>{user.identificationNumber || 'Chưa có'}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Email xác thực</span><span style={valueStyle}>{user.emailConfirmed ? 'Đã xác thực' : 'Chưa xác thực'}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Địa chỉ</span><span style={valueStyle}>{user.address || 'Chưa có'}</span></div>
            <div style={detailItemStyle}>
              <span style={labelStyle}>Tài khoản bị khóa</span>
              <span style={{...valueStyle, color: user.lockoutEnabled ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                {user.lockoutEnabled ? 'Có' : 'Không'}
              </span>
            </div>
            <div style={detailItemStyle}><span style={labelStyle}>Khóa đến</span><span style={valueStyle}>{fmtDate(user.lockoutEnd)}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Số lần đăng nhập sai</span><span style={valueStyle}>{user.accessFailedCount ?? 0}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Ngày tạo</span><span style={valueStyle}>{fmtDate(user.createdAt)}</span></div>
            <div style={detailItemStyle}><span style={labelStyle}>Cập nhật lần cuối</span><span style={valueStyle}>{fmtDate(user.updatedAt)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}