import React from 'react';
import styles from '../../styles/patient/PatientDashboard.module.css';

export const PatientFinance: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Tài chính</h1>
          <p>Quản lý thanh toán và hóa đơn</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <i className="bi bi-credit-card"></i>
          </div>
          <h3 className={styles.cardTitle}>Hóa đơn gần đây</h3>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
          <i className="bi bi-receipt" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
          <p>Chưa có hóa đơn nào</p>
        </div>
      </div>
    </div>
  );
};
