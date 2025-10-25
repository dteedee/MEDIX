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

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';
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
          <h2 className={styles.title}>Chi tiết Người dùng</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        {isLoading ? (
          <div className={styles.loading}>Đang tải chi tiết...</div>
        ) : (
          <div className={styles.contentGrid}>
            <div className={`${styles.detailItem} ${styles.fullWidthItem} ${styles.userInfoBlock}`}>
              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.userName || user.email)}&background=random`} alt="Avatar" className={styles.avatar} />
              <div>
                <p className={`${styles.value} ${styles.userNameDisplay}`}>{user.fullName || 'Chưa có tên'}</p>
                <p className={`${styles.value} ${styles.userIdentifier}`}>{user.userName ? `@${user.userName}` : user.email}</p>
              </div>
            </div>

            <div className={styles.detailItem}><span className={styles.label}>Họ và tên</span><span className={styles.value}>{user.fullName || 'Chưa có'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Tên đăng nhập</span><span className={styles.value}>{user.userName || 'Chưa có'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Email</span><span className={styles.value}>{user.email}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Số điện thoại</span><span className={styles.value}>{user.phoneNumber || 'Chưa có'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Vai trò</span><span className={styles.value}>{user.role || 'Chưa có'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Ngày sinh</span><span className={styles.value}>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa có'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Giới tính</span><span className={styles.value}>{getGender(user.genderCode)}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Số CMND/CCCD</span><span className={styles.value}>{user.identificationNumber || 'Chưa có'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Email xác thực</span><span className={styles.value}>{user.emailConfirmed ? 'Đã xác thực' : 'Chưa xác thực'}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Địa chỉ</span><span className={styles.value}>{user.address || 'Chưa có'}</span></div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Tài khoản bị khóa</span>
              <span className={`${styles.value} ${styles.statusValue} ${user.lockoutEnabled ? styles.statusInactive : styles.statusActive}`}>
                {user.lockoutEnabled ? 'Có' : 'Không'}
              </span>
            </div>
            <div className={styles.detailItem}><span className={styles.label}>Khóa đến</span><span className={styles.value}>{fmtDate(user.lockoutEnd)}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Số lần đăng nhập sai</span><span className={styles.value}>{user.accessFailedCount ?? 0}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Ngày tạo</span><span className={styles.value}>{fmtDate(user.createdAt)}</span></div>
            <div className={styles.detailItem}><span className={styles.label}>Cập nhật lần cuối</span><span className={styles.value}>{fmtDate(user.updatedAt)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}