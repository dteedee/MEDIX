import React from 'react';
import styles from '../../styles/patient/PatientDashboard.module.css';

export const PatientResults: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Kết quả khám</h1>
          <p>Xem kết quả khám bệnh và chẩn đoán</p>
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
            <i className="bi bi-clipboard-data"></i>
          </div>
          <h3 className={styles.cardTitle}>Kết quả gần đây</h3>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
          <i className="bi bi-file-text" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
          <p>Chưa có kết quả khám nào</p>
        </div>
      </div>
    </div>
  );
};
