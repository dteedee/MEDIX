import React from 'react';
import styles from './Toast.module.css';

export interface ToastProps {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: (id: number) => void;
}

export interface ToastActionElement {
  altText: string;
  action: () => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'bi bi-check-circle-fill';
      case 'error':
        return 'bi bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi bi-exclamation-circle-fill';
      case 'info':
      default:
        return 'bi bi-info-circle-fill';
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.toastContent}>
        <div className={styles.icon}>
          <i className={getIcon()}></i>
        </div>
        <div className={styles.message}>
          {message}
        </div>
        <button 
          className={styles.closeButton}
          onClick={() => onClose(id)}
          title="Đóng"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progress}></div>
      </div>
    </div>
  );
};

export default Toast;