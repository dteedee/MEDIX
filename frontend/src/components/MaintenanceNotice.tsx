import React, { useEffect, useRef, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import styles from '../styles/components/MaintenanceNotice.module.css';
import { useAuth } from '../contexts/AuthContext';

const DISMISS_KEY_PREFIX = 'maintenanceNoticeDismissed';

export const MaintenanceNotice: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      hasCheckedRef.current = false;
      return;
    }

    const dismissKey = getDismissKey(user.id);
    if (sessionStorage.getItem(dismissKey) === 'true') {
      return;
    }

    if (hasCheckedRef.current) {
      return;
    }
    hasCheckedRef.current = true;

    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const modeRes = await apiClient.get('/SystemConfiguration/MAINTENANCE_MODE');
        const isMaintenance = modeRes.data?.configValue?.toLowerCase() === 'true';
        if (!isMaintenance || cancelled) {
          return;
        }

        const [messageRes, scheduleRes] = await Promise.all([
          apiClient.get('/SystemConfiguration/MAINTENANCE_MESSAGE'),
          apiClient.get('/SystemConfiguration/MAINTENANCE_SCHEDULE'),
        ]);

        if (cancelled) return;

        setMessage(messageRes.data?.configValue || 'Hệ thống đang bảo trì.');
        setSchedule(scheduleRes.data?.configValue || null);
        setOpen(true);
      } catch (error) {
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleDismiss = () => {
    const dismissKey = getDismissKey(user?.id);
    sessionStorage.setItem(dismissKey, 'true');
    setOpen(false);
  };

  if (!open) return null;

  const scheduleText = schedule ? formatSchedule(schedule) : null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>
          <i className="bi bi-cone-striped"></i>
        </div>
        <h3>Hệ thống đang bảo trì</h3>
        <p className={styles.message}>{message}</p>
        {scheduleText && (
          <p className={styles.schedule}>Dự kiến hoàn thành: {scheduleText}</p>
        )}
        <button className={styles.closeBtn} onClick={handleDismiss}>
          Tôi đã hiểu
        </button>
      </div>
    </div>
  );
};

function formatSchedule(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('vi-VN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDismissKey(userId?: string) {
  return userId ? `${DISMISS_KEY_PREFIX}_${userId}` : DISMISS_KEY_PREFIX;
}

