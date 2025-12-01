import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment.types';
import { PageLoader } from '../../components/ui';
import styles from '../../styles/doctor/DoctorPatients.module.css';
import { Users, Calendar, Search, Filter, Clock, TrendingUp, Mail, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';

interface Patient {
  id: string;
  name: string;
  avatar: string;
  email: string;
  totalAppointments: number;
  lastVisit: string;
  firstVisit: string;
  lastVisitDate: Date;
  appointments: Appointment[];
  totalSpent: number;
  averageRating?: number;
  lastAppointmentId?: string;
}

type SortOption = 'name' | 'lastVisit' | 'totalVisits' | 'totalSpent';
type FilterOption = 'all' | 'recent' | 'frequent';

const DoctorPatients: React.FC = () => {
  const navigate = useNavigate();
  const { isBanned, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('lastVisit');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minVisits, setMinVisits] = useState<string>('');
  const [minSpent, setMinSpent] = useState<string>('');

  const now = new Date();

  const showBannedPopup = () => {
    if (user) {
      const startDate = (user as any)?.startDateBanned ? new Date((user as any).startDateBanned).toLocaleDateString('vi-VN') : '';
      const endDate = (user as any)?.endDateBanned ? new Date((user as any).endDateBanned).toLocaleDateString('vi-VN') : '';
      
      Swal.fire({
        title: 'Tài khoản bị tạm khóa',
        html: `Chức năng xem hồ sơ bệnh án của bạn đã bị tạm khóa từ <b>${startDate}</b> đến <b>${endDate}</b>.<br/>Mọi thắc mắc vui lòng liên hệ quản trị viên.`,
        icon: 'warning',
        confirmButtonText: 'Đã hiểu'
      });
    }
  };
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const data = await appointmentService.getMyAppointmentsByDateRange("2020-01-01", "2030-12-31");
        setAppointments(data);
        setError(null);
      } catch (err) {
        setError("Không thể tải danh sách bệnh nhân. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const patients = useMemo<Patient[]>(() => {
    if (appointments.length === 0) return [];

    const patientMap = new Map<string, { appointments: Appointment[] }>();
    appointments.forEach(app => {
      if (app.patientID && app.statusCode !== 'CancelledByPatient' && app.statusCode !== 'CancelledByDoctor') {
        if (!patientMap.has(app.patientID)) {
          patientMap.set(app.patientID, { appointments: [] });
        }
        patientMap.get(app.patientID)!.appointments.push(app);
      }
    });
    
    const mappedPatients = Array.from(patientMap.entries()).map<Patient | null>(
      ([patientId, data]) => {
        const pastAppointments = data.appointments
          .filter(app => new Date(app.appointmentStartTime) <= now)
          .sort((a, b) => new Date(b.appointmentStartTime).getTime() - new Date(a.appointmentStartTime).getTime());

        if (pastAppointments.length === 0) return null;

        const lastVisitAppointment = pastAppointments[0]; 
        const firstVisitAppointment = pastAppointments[pastAppointments.length - 1]; 

        const totalSpent = pastAppointments.reduce((sum, app) => sum + (app.totalAmount || 0), 0);
        
        const ratings = pastAppointments
          .filter(app => app.patientRating)
          .map(app => parseFloat(app.patientRating || '0'))
          .filter(rating => !isNaN(rating) && rating > 0);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
          : undefined;

        const emailFromLastVisit = (lastVisitAppointment as any).patientEmail || (lastVisitAppointment as any).email;
        let email = emailFromLastVisit || 'N/A';
        if (!email) {
          for (const app of pastAppointments) {
            const appEmail = (app as any).patientEmail || (app as any).email;
            if (appEmail) {
              email = appEmail;
              break;
            }
          }
        }

        return {
          id: patientId,
          name: lastVisitAppointment.patientName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(lastVisitAppointment.patientName)}&background=667eea&color=fff&size=128&bold=true`,
          email: email,
          totalAppointments: pastAppointments.length,
          lastVisit: new Date(lastVisitAppointment.appointmentStartTime).toLocaleDateString('vi-VN'),
          firstVisit: new Date(firstVisitAppointment.appointmentStartTime).toLocaleDateString('vi-VN'),
          lastVisitDate: new Date(lastVisitAppointment.appointmentStartTime),
          appointments: pastAppointments,
          totalSpent,
          averageRating,
          lastAppointmentId: lastVisitAppointment.id,
        };
      }
    );

    const patientList: Patient[] = mappedPatients.filter((patient): patient is Patient => patient !== null);

    return patientList.sort((a, b) => b.lastVisitDate.getTime() - a.lastVisitDate.getTime());
  }, [appointments]);

  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients];

    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBy === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(p => p.lastVisitDate >= sevenDaysAgo);
    } else if (filterBy === 'frequent') {
      result = result.filter(p => p.totalAppointments >= 3);
    }
    
    if (minVisits) {
      const minVisitsNumber = parseInt(minVisits, 10);
      if (!isNaN(minVisitsNumber)) {
        result = result.filter(p => p.totalAppointments >= minVisitsNumber);
      }
    }

    if (minSpent) {
      const minSpentNumber = parseInt(minSpent, 10);
      if (!isNaN(minSpentNumber)) {
        result = result.filter(p => p.totalSpent >= minSpentNumber);
      }
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(p => p.lastVisitDate >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(p => p.lastVisitDate <= toDate);
    }

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'vi');
          break;
        case 'lastVisit':
          comparison = a.lastVisitDate.getTime() - b.lastVisitDate.getTime();
          break;
        case 'totalVisits':
          comparison = a.totalAppointments - b.totalAppointments;
          break;
        case 'totalSpent':
          comparison = a.totalSpent - b.totalSpent;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [patients, searchTerm, sortBy, filterBy, sortOrder, dateFrom, dateTo, minVisits, minSpent]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = appointments.filter(app => {
      const appDate = new Date(app.appointmentStartTime);
      return appDate >= today && appDate < tomorrow && 
             app.statusCode !== 'CancelledByPatient' && 
             app.statusCode !== 'CancelledByDoctor';
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPatients = patients.filter(p => p.lastVisitDate >= sevenDaysAgo);

    return {
      totalPatients: patients.length,
      todayAppointments: todayAppointments.length,
      recentPatients: recentPatients.length,
      totalRevenue: patients.reduce((sum, p) => sum + p.totalSpent, 0),
    };
  }, [patients, appointments]);

  const handleViewEmr = (patient: Patient) => {
    if (!patient.lastAppointmentId) {
      Swal.fire('Thông báo', 'Bệnh nhân này chưa có hồ sơ bệnh án để xem.', 'info');
      return;
    }

    if (isBanned) {
      showBannedPopup();
      return;
    }

    navigate(`/app/doctor/medical-records/${patient.lastAppointmentId}`);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <Users size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Danh sách bệnh nhân</h1>
              <p className={styles.subtitle}>Quản lý thông tin và lịch sử khám của các bệnh nhân</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>{new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Users size={24} fill="white" color="white" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Tổng số bệnh nhân</h3>
              <p className={styles.cardSubtitle}>Tất cả bệnh nhân</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.statValue}>{stats.totalPatients}</div>
            <div className={styles.statLabel}>bệnh nhân</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCardSecondary}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
              <Calendar size={24} fill="white" color="white" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Lịch hẹn hôm nay</h3>
              <p className={styles.cardSubtitle}>Cuộc hẹn trong ngày</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.statValue}>{stats.todayAppointments}</div>
            <div className={styles.statLabel}>cuộc hẹn</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCardTertiary}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <TrendingUp size={24} fill="white" color="white" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Bệnh nhân gần đây</h3>
              <p className={styles.cardSubtitle}>7 ngày qua</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.statValue}>{stats.recentPatients}</div>
            <div className={styles.statLabel}>bệnh nhân</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCardQuaternary}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
              <Clock size={24} fill="white" color="white" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Tổng doanh thu</h3>
              <p className={styles.cardSubtitle}>Từ tất cả bệnh nhân</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.statValue}>
              {new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)} ₫
            </div>
            <div className={styles.statLabel}>tổng cộng</div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm bệnh nhân theo tên hoặc email..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className={styles.filterToggleBtn}
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
        >
          <Filter size={18} />
          Bộ lọc
          {showAdvancedFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showAdvancedFilter && (
        <div className={styles.advancedFilterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Nhóm bệnh nhân</label>
              <select
                className={styles.filterInput}
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              >
                <option value="all">Tất cả</option>
                <option value="recent">Khám gần đây (7 ngày)</option>
                <option value="frequent">Khám thường xuyên (≥3)</option>
              </select>
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Sắp xếp theo</label>
              <div className={styles.sortOptions}>
                <select
                  className={styles.filterInput}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="lastVisit">Lần khám cuối</option>
                  <option value="name">Tên</option>
                  <option value="totalVisits">Số lần khám</option>
                  <option value="totalSpent">Tổng chi tiêu</option>
                </select>
                <button
                  className={styles.sortOrderBtn}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Tối thiểu số lần khám</label>
              <input
                type="number"
                min="0"
                className={styles.filterInput}
                value={minVisits}
                onChange={(e) => setMinVisits(e.target.value)}
                placeholder="VD: 3"
              />
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>Tối thiểu chi tiêu (₫)</label>
              <input
                type="number"
                min="0"
                className={styles.filterInput}
                value={minSpent}
                onChange={(e) => setMinSpent(e.target.value)}
                placeholder="VD: 500000"
              />
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>
                <Calendar size={16} />
                Từ ngày
              </label>
              <input
                type="date"
                className={styles.filterInput}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className={styles.filterSection}>
              <label className={styles.filterLabel}>
                <Calendar size={16} />
                Đến ngày
              </label>
              <input
                type="date"
                className={styles.filterInput}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button
              className={styles.resetFilterBtn}
              onClick={() => {
                setFilterBy('all');
                setMinVisits('');
                setMinSpent('');
                setDateFrom('');
                setDateTo('');
                setSortBy('lastVisit');
                setSortOrder('desc');
              }}
            >
              <X size={16} />
              Đặt lại bộ lọc
            </button>
            <button
              className={styles.applyFilterBtn}
              onClick={() => setShowAdvancedFilter(false)}
            >
              <Filter size={16} />
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Patient List */}
      <div className={styles.patientList}>
        {filteredAndSortedPatients.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={64} />
            <p className={styles.emptyStateText}>
              {searchTerm ? 'Không tìm thấy bệnh nhân nào' : 'Chưa có bệnh nhân nào'}
            </p>
            {searchTerm && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm('')}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedPatients.map((patient, index) => (
            <div
              key={patient.id}
              className={styles.patientCard}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={styles.cardHeaderSection}>
                <div className={styles.avatarWrapper}>
                  <img src={patient.avatar} alt={patient.name} className={styles.avatar} />
                  {patient.lastVisitDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                    <div className={styles.activeBadge}></div>
                  )}
                </div>
                <div className={styles.patientBasicInfo}>
                  <h3 className={styles.patientName}>{patient.name}</h3>
                  <div className={styles.patientMeta}>
                    <span className={styles.metaItem}>
                      <Mail size={14} />
                      {patient.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.cardBodySection}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <Calendar size={16} />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>Lần khám cuối</div>
                      <div className={styles.infoValue}>{patient.lastVisit}</div>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <Clock size={16} />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>Tổng số lần khám</div>
                      <div className={styles.infoValue}>{patient.totalAppointments} lần</div>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <TrendingUp size={16} />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>Tổng chi tiêu</div>
                      <div className={styles.infoValue}>
                        {new Intl.NumberFormat('vi-VN').format(patient.totalSpent)} ₫
                      </div>
                    </div>
                  </div>
                  {patient.averageRating && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <TrendingUp size={16} />
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoLabel}>Đánh giá trung bình</div>
                        <div className={styles.infoValue}>
                          ⭐ {patient.averageRating.toFixed(1)}/5.0
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardFooterSection}>
                <div className={styles.footerInfo}>
                  <span className={styles.footerText}>
                    Lần khám đầu: {patient.firstVisit}
                  </span>
                </div>
                <button
                  className={styles.viewDetailsBtn}
                  onClick={() => handleViewEmr(patient)}
                >
                  <FileText size={16} />
                  Xem EMR
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default DoctorPatients;
