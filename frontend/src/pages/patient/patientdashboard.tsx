import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/walletService';
import { WalletDto } from '../../types/wallet.types';
import styles from '../../styles/patient/PatientDashboard.module.css';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        setError(null);
        const walletData = await walletService.getWalletByUserId();
        setWallet(walletData);
      } catch (err: any) {
        console.error('Error fetching wallet:', err);
        setError(err.message || 'Không thể tải thông tin ví');
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const formatBalance = (balance: number, currency: string): string => {
    const formatted = new Intl.NumberFormat('vi-VN').format(balance);
    return `${formatted} ${currency}`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Dashboard</h1>
          <p>
            <span className={styles.waveEmoji}>👋</span>
            Chào mừng trở lại, <strong>{user?.fullName || 'Bệnh nhân'}</strong>!
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.walletBalance}>
            <i className={`bi bi-wallet2 ${styles.walletIcon}`}></i>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Số dư ví</div>
              {loading ? (
                <div className={styles.walletAmount}>Đang tải...</div>
              ) : error ? (
                <div className={styles.walletAmount} style={{ color: '#ef4444' }}>
                  Lỗi
                </div>
              ) : wallet ? (
                <div className={styles.walletAmount}>
                  {formatBalance(wallet.balance, wallet.currency)}
                </div>
              ) : (
                <div className={styles.walletAmount}>0 đ</div>
              )}
            </div>
            <button
              onClick={() => navigate('/app/patient/finance')}
              style={{
                marginLeft: '12px',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#667eea',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5568d3';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#667eea';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Nạp tiền"
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Lịch hẹn sắp tới</div>
            <div className={styles.statValue}>3</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+1 tuần này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-calendar-check"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-clipboard-data"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Lịch sử khám</div>
            <div className={styles.statValue}>12</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+2 tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-clipboard-data"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-robot"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Kết quả AI</div>
            <div className={styles.statValue}>5</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+1 tuần này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-robot"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-bell"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Nhắc nhở</div>
            <div className={styles.statValue}>8</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+3 hôm nay</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-bell"></i>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Upcoming Appointment */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-calendar-check"></i>
            </div>
            <h3 className={styles.cardTitle}>Lịch hẹn sắp tới</h3>
          </div>
          <div className={styles.appointmentCard}>
            <div className={styles.doctorInfo}>
              <div className={styles.doctorAvatar}>
                <img src="https://ui-avatars.com/api/?name=Vu+Nam+Anh&background=667eea&color=fff" alt="Doctor" />
              </div>
              <div className={styles.doctorDetails}>
                <div className={styles.doctorName}>Vũ Nam Anh</div>
                <div className={styles.doctorTitle}>Giáo sư</div>
                <div className={styles.doctorSpecialty}>Xương khớp</div>
              </div>
            </div>
            <div className={styles.appointmentTime}>
              <span className={styles.timeText}>2pm, 21/12/2025</span>
              <span className={styles.statusBadge}>Sắp diễn ra</span>
            </div>
            <div className={styles.rating}>
              <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
              <span className={styles.ratingText}>(99 Đánh giá)</span>
            </div>
            <div className={styles.appointmentActions}>
              <button className={styles.updateBtn}>CẬP NHẬT</button>
              <button className={styles.cancelBtn}>HỦY LỊCH KHÁM</button>
            </div>
          </div>
        </div>

        {/* Examination History */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-clipboard-data"></i>
            </div>
            <h3 className={styles.cardTitle}>Lịch sử khám</h3>
          </div>
          <div className={styles.historyList}>
            <div className={styles.historyItem}>
              <div className={styles.historyDate}>19/8/2025</div>
              <div className={styles.historyDoctor}>Phạm Xuân Ẩn</div>
              <div className={styles.historyDiagnosis}>Hở van tim</div>
            </div>
            <div className={styles.historyItem}>
              <div className={styles.historyDate}>19/6/2025</div>
              <div className={styles.historyDoctor}>Hoàng Nam Thuận</div>
              <div className={styles.historyDiagnosis}>Thoái hóa khớp GD 1</div>
            </div>
          </div>
          <button className={styles.viewAllBtn}>XEM TẤT CẢ</button>
        </div>

        {/* AI Checkup Results */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-robot"></i>
            </div>
            <h3 className={styles.cardTitle}>Kết quả kiểm tra AI gần đây</h3>
          </div>
          <div className={styles.aiResult}>
            <div className={styles.aiAvatar}>
              <div className={styles.aiLogo}>MEDIX</div>
              <div className={styles.aiDate}>11/11/2025</div>
            </div>
            <div className={styles.aiContent}>
              <div className={styles.aiSymptoms}>Đau đầu, nóng trong, khó ngủ.</div>
              <div className={styles.aiStatus}>Cần chú ý</div>
            </div>
            <div className={styles.aiActions}>
              <button className={styles.viewDetailBtn}>XEM CHI TIẾT</button>
              <button className={styles.recheckBtn}>KIỂM TRA LẠI</button>
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-bell"></i>
            </div>
            <h3 className={styles.cardTitle}>Nhắc nhở</h3>
          </div>
          <div className={styles.remindersList}>
            <div className={styles.reminderItem}>
              <div className={styles.reminderIcon}>
                <i className="bi bi-capsule"></i>
              </div>
              <div className={styles.reminderText}>Uống thuốc huyết áp sau bữa sáng.</div>
            </div>
            <div className={styles.reminderItem}>
              <div className={styles.reminderIcon}>
                <i className="bi bi-calendar-event"></i>
              </div>
              <div className={styles.reminderText}>Tái khám với BS. Nguyễn Văn A vào ngày 05/12/2025.</div>
            </div>
            <div className={styles.reminderItem}>
              <div className={styles.reminderIcon}>
                <i className="bi bi-credit-card"></i>
              </div>
              <div className={styles.reminderText}>Thanh toán viện phí còn lại trước ngày 07/12/2025.</div>
            </div>
          </div>
          <button className={styles.updateRemindersBtn}>UPDATE</button>
        </div>
      </div>
    </div>
  );
};