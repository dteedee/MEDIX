import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, List, User, Clock, Users } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment.types';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/ui';
import styles from '../../styles/doctor/DoctorAppointments.module.css';

type ViewMode = 'week' | 'month';

const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const DoctorAppointments: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { startDate, endDate, headerLabel } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    let start: Date, end: Date, label: string;

    switch (viewMode) {
      case 'week':
        const dayOfWeek = currentDate.getDay();
        const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday is the start of the week
        start = new Date(year, month, day + offset);
        end = new Date(year, month, day + offset + 6);
        label = `Tuần ${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        break;
      case 'month':
      default:
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
        label = `Tháng ${month + 1}, ${year}`;
        break;
    }
    return { startDate: start, endDate: end, headerLabel: label };
  }, [currentDate, viewMode]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await appointmentService.getMyAppointmentsByDateRange(
          toYYYYMMDD(startDate),
          toYYYYMMDD(endDate)
        );
        setAppointments(data.sort((a, b) => new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime()));
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Không thể tải danh sách lịch hẹn. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [isAuthenticated, startDate, endDate]);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const appointmentsByDay = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      const dateKey = toYYYYMMDD(new Date(appointment.appointmentStartTime));
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);
  }, [appointments]);

  // Logic cho chế độ xem thời khóa biểu (tuần)
  const { weekDays, timeSlots } = useMemo(() => {
    // if (viewMode !== 'week') return { weekDays: [], timeSlots: [] };

    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const slots = [];
    for (let hour = 7; hour < 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    return { weekDays: days, timeSlots: slots };
  }, [startDate, endDate, viewMode]);

  const getAppointmentsForSlot = (day: Date, time: string) => {
    const dateKey = toYYYYMMDD(day);
    const hour = parseInt(time.split(':')[0]);
    return (appointmentsByDay[dateKey] || []).filter(app => new Date(app.appointmentStartTime).getHours() === hour);
  };

  // Logic cho chế độ xem Lịch (tháng)
  const { monthDays, monthHeaderLabel } = useMemo(() => {
    if (viewMode !== 'month') return { monthDays: [], monthHeaderLabel: '' };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Các ô trống cho các ngày của tháng trước
    const emptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Điều chỉnh cho tuần bắt đầu từ thứ 2
    for (let i = 0; i < emptyCells; i++) {
      days.push(null);
    }
    // Các ngày trong tháng
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return { monthDays: days, monthHeaderLabel: `Tháng ${month + 1}, ${year}` };
  }, [currentDate, viewMode]);

  return (
    <div className="doctor-appointments-page">
      <div className="appointments-header">
        <h1>Các lịch hẹn</h1>
        <div className="controls-wrapper">
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Tuần</button>
            <button className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Tháng</button>
          </div>
         <div className="date-controls">
  <button onClick={handleGoToToday} className="today-btn">
    Hôm nay
  </button>

  <div className="date-navigator">
    <button onClick={handlePrev} className="nav-button"><ChevronLeft size={20} /></button>
    <h2 className="date-label">{headerLabel}</h2>
    <button onClick={handleNext} className="nav-button"><ChevronRight size={20} /></button>
  </div>
</div>

        </div>
      </div>

      <div className="appointments-content">
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : viewMode === 'week' ? (
          <div className={styles.timetableContainer}>
            <div className={styles.timetableGrid}>
              <div className={styles.timeHeader}></div> {/* Góc trống */}
              {weekDays.map(day => (
                <div
                  key={day.toISOString()}
                  className={`${styles.dayHeader} ${toYYYYMMDD(day) === toYYYYMMDD(new Date()) ? styles.today : ''}`}
                >
                  <span className={styles.dayName}>{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                  <span className={styles.dayNumber}>{day.getDate()}</span>
                </div>
              ))}
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div className={styles.timeLabel}>{time}</div>
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className={styles.timeSlot}>
                      {getAppointmentsForSlot(day, time).map(app => (
                        <Link to={`/app/doctor/medical-records/${app.id}`} key={app.id} className={styles.timetableAppointment}>
                          <div className={styles.appointmentTime}>
                            <Clock size={12} /> {new Date(app.appointmentStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={styles.appointmentPatient}><User size={12} /> {app.patientName}</div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : viewMode === 'month' ? (
          <div className={styles.monthViewContainer}>
            <div className={styles.monthGrid}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                <div key={day} className={styles.monthDayHeader}>{day}</div>
              ))}
              {monthDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className={styles.monthDayCellEmpty}></div>;
                const dateKey = toYYYYMMDD(day);
                const dailyAppointments = appointmentsByDay[dateKey] || [];
                const isToday = toYYYYMMDD(new Date()) === dateKey;
                return (
                  <div key={dateKey} className={`${styles.monthDayCell} ${isToday ? styles.today : ''}`}>
                    <div className={styles.monthDayNumber}>{day.getDate()}</div>
                    {dailyAppointments.length > 0 && (
                      <div className={styles.monthAppointmentsInfo}>
                        <span className={styles.appointmentCount}><Users size={14} /> {dailyAppointments.length}</span>
                        <div className={styles.appointmentsTooltip}>
                          {dailyAppointments.map(app => (
                            <div key={app.id} className={styles.tooltipItem}>
                              <Clock size={12} /> {new Date(app.appointmentStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {app.patientName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-appointments">Không có lịch hẹn nào trong khoảng thời gian này.</div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
