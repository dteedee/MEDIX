import React from 'react';
import { UserDTO } from '../../types/user.types';
import styles from '../../styles/admin/UserDetails.module.css';

interface Props {
  user: UserDTO | null;
  onClose: () => void;
  isLoading: boolean;
}

export default function UserDetails({ user, onClose, isLoading }: Props) {
  if (!user) return null;

  const fmtDate = (d?: string | null) => d ? new Date(`${d}Z`).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có';
  const getGender = (code?: string) => {
    if (code === 'MALE') return 'Nam';
    if (code === 'FEMALE') return 'Nữ';
    if (code === 'OTHER') return 'Khác';
    return 'Chưa có';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.userAvatar}>
                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.userName || user.email)}&background=667eea&color=fff`} alt="Avatar" />
              </div>
              <div className={styles.userInfo}>
                <h2 className={styles.title}>{user.fullName || 'Chưa có tên'}</h2>
                <p className={styles.subtitle}>{user.userName ? `@${user.userName}` : user.email}</p>
                <div className={styles.statusBadge}>
                  <span className={`${styles.statusDot} ${user.lockoutEnabled ? styles.statusInactive : styles.statusActive}`}></span>
                  <span>{user.lockoutEnabled ? 'Đang khóa' : 'Hoạt động'}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải chi tiết...</p>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.sections}>
              {/* Personal Information */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="bi bi-person"></i>
                  <h3>Thông tin cá nhân</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>Họ và tên</label>
                      <span>{user.fullName || 'Chưa có'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Tên đăng nhập</label>
                      <span>{user.userName || 'Chưa có'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Email</label>
                      <span>{user.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Số điện thoại</label>
                      <span>{user.phoneNumber || 'Chưa có'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Ngày sinh</label>
                      <span>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa có'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Giới tính</label>
                      <span>{getGender(user.genderCode)}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Số CMND/CCCD</label>
                      <span>{user.identificationNumber || 'Chưa có'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Địa chỉ</label>
                      <span>{user.address || 'Chưa có'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="bi bi-shield-check"></i>
                  <h3>Thông tin tài khoản</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>Vai trò</label>
                      <span className={styles.roleBadge}>{user.role || 'Chưa có'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Email xác thực</label>
                      <span className={`${styles.statusBadge} ${user.emailConfirmed ? styles.statusActive : styles.statusInactive}`}>
                        {user.emailConfirmed ? 'Đã xác thực' : 'Chưa xác thực'}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Trạng thái tài khoản</label>
                      <span className={`${styles.statusBadge} ${user.lockoutEnabled ? styles.statusInactive : styles.statusActive}`}>
                        {user.lockoutEnabled ? 'Đang khóa' : 'Hoạt động'}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Khóa đến</label>
                      <span>{fmtDate(user.lockoutEnd)}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Số lần đăng nhập sai</label>
                      <span>{user.accessFailedCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="bi bi-gear"></i>
                  <h3>Thông tin hệ thống</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>Ngày tạo</label>
                      <span>{fmtDate(user.createdAt)}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Cập nhật lần cuối</label>
                      <span>{fmtDate(user.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}