import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/CommissionManagement.module.css'

interface Commission {
  id: string;
  doctorName: string;
  specialty: string;
  totalAppointments: number;
  totalRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  month: string;
  status: 'pending' | 'paid' | 'cancelled';
}

export default function CommissionManagement() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const { showToast } = useToast();

  useEffect(() => {
    loadCommissions();
  }, [selectedMonth]);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const mockCommissions: Commission[] = [
        {
          id: '1',
          doctorName: 'Phạm Quỳnh Anh',
          specialty: 'Nội khoa',
          totalAppointments: 45,
          totalRevenue: 2250000,
          commissionRate: 10,
          commissionAmount: 225000,
          month: '2024-01',
          status: 'paid'
        },
        {
          id: '2',
          doctorName: 'Lê Thu Hằng',
          specialty: 'Nhi khoa',
          totalAppointments: 38,
          totalRevenue: 2850000,
          commissionRate: 12,
          commissionAmount: 342000,
          month: '2024-01',
          status: 'pending'
        }
      ];

      setTimeout(() => {
        setCommissions(mockCommissions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      showToast('Không thể tải dữ liệu hoa hồng', 'error');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatCurrencyCompact = (value: number): string => {
    const amount = value || 0;
    const abs = Math.abs(amount);

    if (abs >= 1_000_000_000) {
      const compact = amount / 1_000_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}B VND`;
    }

    if (abs >= 1_000_000) {
      const compact = amount / 1_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}M VND`;
    }

    return `${amount.toLocaleString('vi-VN')} VND`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Chờ thanh toán', class: styles.statusPending },
      paid: { text: 'Đã thanh toán', class: styles.statusPaid },
      cancelled: { text: 'Đã hủy', class: styles.statusCancelled }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`${styles.statusBadge} ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu hoa hồng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Hoa hồng</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý hoa hồng bác sĩ</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.monthSelector}>
            <label>Tháng:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={styles.monthInput}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCard1}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
            <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Tổng hoa hồng</div>
            <div className={styles.summaryValue}>
              {formatCurrencyCompact(commissions.reduce((sum, c) => sum + c.commissionAmount, 0))}
            </div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCard2}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
            <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Chờ thanh toán</div>
            <div className={styles.summaryValue}>
              {formatCurrencyCompact(commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0))}
            </div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCard3}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
            <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Đã thanh toán</div>
            <div className={styles.summaryValue}>
              {formatCurrencyCompact(commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Chi tiết Hoa hồng</h3>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Chuyên khoa</th>
                <th>Số lịch hẹn</th>
                <th>Doanh thu</th>
                <th>Tỷ lệ hoa hồng</th>
                <th>Số tiền hoa hồng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id}>
                  <td>
                    <div className={styles.doctorCell}>
                      <span className={styles.doctorName}>{commission.doctorName}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.specialtyBadge}>{commission.specialty}</span>
                  </td>
                  <td>
                    <span className={styles.appointmentCount}>{commission.totalAppointments}</span>
                  </td>
                  <td>
                    <span className={styles.revenueAmount}>{formatCurrency(commission.totalRevenue)}</span>
                  </td>
                  <td>
                    <span className={styles.commissionRate}>{commission.commissionRate}%</span>
                  </td>
                  <td>
                    <span className={styles.commissionAmount}>{formatCurrency(commission.commissionAmount)}</span>
                  </td>
                  <td>{getStatusBadge(commission.status)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      {commission.status === 'pending' && (
                        <button className={styles.payButton}>
                          Thanh toán
                        </button>
                      )}
                      <button className={styles.viewButton}>
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
