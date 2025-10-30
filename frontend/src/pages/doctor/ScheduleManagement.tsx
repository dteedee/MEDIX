"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from "lucide-react";
import Swal from 'sweetalert2';
import { scheduleService } from '../../services/scheduleService';
import { appointmentService } from '../../services/appointmentService';
import { DoctorSchedule, CreateSchedulePayload, ScheduleOverride } from '../../types/schedule';
import { Appointment } from '../../types/appointment.types';
import "../../styles/ScheduleManagement.css";
import FixedScheduleManager from './FixedScheduleManager'; // Giữ nguyên vì file mới được tạo cùng thư mục
import FlexibleScheduleManager from './FlexibleScheduleManager';

const monthNames = [ "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12" ];
const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];


const toYYYYMMDD = (date: Date) => {
  // Chuyển đổi sang chuỗi ISO (luôn ở múi giờ UTC) và cắt lấy phần YYYY-MM-DD.
  // Đây là cách đáng tin cậy nhất để có được ngày tháng mà không bị ảnh hưởng bởi múi giờ.
  return date.toISOString().substring(0, 10);
};


type ViewMode = 'month' | 'week';

// --- Component Modal Chi Tiết Ngày ---
interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formattedDate: string;
  schedules: DoctorSchedule[];
  overrides: ScheduleOverride[];
  appointments: Appointment[];
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ isOpen, onClose, formattedDate, schedules, overrides, appointments }) => {
  // Gộp lịch cố định và linh hoạt vào một danh sách và sắp xếp theo thời gian bắt đầu
  const allWorkSlots = useMemo(() => {
    const combinedSlots = [
      ...schedules.map(s => ({ ...s, type: 'fixed' as const })),
      ...overrides.map(o => ({ ...o, type: 'override' as const }))
    ];
    return combinedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, overrides]);

  if (!isOpen) return null;

  return (
    <div className="details-modal-overlay" onClick={onClose}>
      <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="details-modal-header">
          <h3>{formattedDate}</h3>
          <button onClick={onClose} className="details-modal-close-btn">&times;</button>
        </div>
        <div className="details-modal-body">
          {allWorkSlots.length > 0 ? (
            <div className="details-list">
              <h4 className="appointment-list-header">Ca làm việc trong ngày</h4>
              {allWorkSlots.map(slot => {
                // Tìm các cuộc hẹn thuộc về ca làm việc này
                const appointmentsInSlot = appointments.filter(app => {
                  const appStartTime = new Date(app.appointmentStartTime).toTimeString().substring(0, 8);
                  return appStartTime >= slot.startTime && appStartTime < slot.endTime;
                });

                return (
                  <div key={slot.id} className="detail-item">
                    <p className="detail-time">{slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</p>
                    <p className={`detail-status ${slot.isAvailable ? 'status-available' : 'status-unavailable'}`}>
                      <span className="status-dot" style={{ backgroundColor: slot.isAvailable ? '#10b981' : '#ef4444' }}></span>
                      {slot.type === 'fixed' ? (slot.isAvailable ? 'Sẵn sàng' : 'Không sẵn sàng') : (slot.isAvailable ? `Tăng ca - ${slot.reason}`: `Nghỉ - ${slot.reason}`)}
                    </p>
                    {/* Hiển thị danh sách cuộc hẹn bên trong ca làm việc */}
                    {appointmentsInSlot.length > 0 && (
                      <div className="appointment-list-nested">
                        {appointmentsInSlot.map(app => (
                          <div key={app.id} className="appointment-item">
                            <p className="appointment-time">{new Date(app.appointmentStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(app.appointmentEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="appointment-patient">BN: {app.patientName}</p>
                            <p className="appointment-status">{app.statusDisplayName || app.statusCode}</p>
                            <Link to={`/app/doctor/medical-records/${app.id}`} className="view-record-button">
                              Xem chi tiết hồ sơ
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="details-placeholder">Không có lịch làm việc hoặc cuộc hẹn nào trong ngày này.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ScheduleManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [viewData, setViewData] = useState<{
    schedules: DoctorSchedule[];
    overrides: ScheduleOverride[];
    appointments: Appointment[];
  }>({ schedules: [], overrides: [], appointments: [] });

  const [currentDayAppointments, setCurrentDayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // State cho modal chi tiết

  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Gộp tất cả các logic xử lý dữ liệu vào một useMemo duy nhất
  // để đảm bảo tính nhất quán và tránh race condition khi render.
  const { schedulesByDayOfWeek, scheduleOverridesByDate, appointmentsByDate } = useMemo(() => {
    const schedulesMap = new Map<number, DoctorSchedule[]>();
    viewData.schedules.forEach(schedule => {
      const day = schedule.dayOfWeek;
      if (!schedulesMap.has(day)) schedulesMap.set(day, []);
      schedulesMap.get(day)?.push(schedule);
    });

    const overridesMap = new Map<string, ScheduleOverride[]>();
    viewData.overrides.forEach(override => {
      const dateKey = override.overrideDate;
      if (!overridesMap.has(dateKey)) overridesMap.set(dateKey, []);
      overridesMap.get(dateKey)?.push(override);
    });

    const appointmentsMap = new Map<string, Appointment[]>();
    viewData.appointments.forEach(appointment => {
      const dateKey = appointment.appointmentStartTime.substring(0, 10);
      if (!appointmentsMap.has(dateKey)) appointmentsMap.set(dateKey, []);
      appointmentsMap.get(dateKey)?.push(appointment);
    });

    return { schedulesByDayOfWeek: schedulesMap, scheduleOverridesByDate: overridesMap, appointmentsByDate: appointmentsMap };
  }, [viewData]);

  const refreshAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!isAuthenticated || !user?.id) {
      setIsLoading(false);
      return;
    }

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'month') {
      startDate = new Date(Date.UTC(year, month, 1));
      endDate = new Date(Date.UTC(year, month + 1, 0)); // Last day of the month
    } else { // week view
      const dayOfWeek = currentMonth.getUTCDay(); // 0=Sun, 1=Mon
      const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to start on Monday
      const startOfWeek = new Date(currentMonth);
      startOfWeek.setUTCDate(startOfWeek.getUTCDate() + offset);
      
      startDate = new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate()));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
      endDate = new Date(Date.UTC(endOfWeek.getUTCFullYear(), endOfWeek.getUTCMonth(), endOfWeek.getUTCDate()));
    }
    
    try {
      // Sử dụng Promise.all để lấy tất cả dữ liệu cần thiết cùng lúc
      // Tách ra để đảm bảo schedules và overrides được fetch trước, tránh race condition khi render
      const [fixedSchedules, overrides] = await Promise.all([
        scheduleService.getMySchedules(),
        scheduleService.getMyScheduleOverrides()
      ]);

      // Sau khi có lịch, mới fetch các cuộc hẹn
      const appointments = await appointmentService.getMyAppointmentsByDateRange(toYYYYMMDD(startDate), toYYYYMMDD(endDate));

      setViewData({
        schedules: fixedSchedules,
        overrides: overrides,
        appointments: appointments
      });
    } catch (err) {
      console.error('Error fetching data for view:', err);
      setError('Không thể tải dữ liệu lịch. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect để lấy cuộc hẹn khi ngày được chọn thay đổi
  useEffect(() => {
    const fetchAppointmentsForSelectedDay = async () => {
      if (!isAuthenticated || !user?.id || !selectedDate) {
        setCurrentDayAppointments([]);
        return;
      }
      const selectedFullDate = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), selectedDate));
      const selectedDateString = toYYYYMMDD(selectedFullDate); // Sử dụng hàm tiện ích an toàn
      try {
        const appointments = await appointmentService.getMyDayAppointments(selectedDateString);
        setCurrentDayAppointments(appointments.sort((a, b) => a.appointmentStartTime.localeCompare(b.appointmentStartTime)));
      } catch (err) {
        console.error('Error fetching appointments for selected day:', err);
        setCurrentDayAppointments([]); // Xóa các cuộc hẹn nếu có lỗi
      }
    };
    fetchAppointmentsForSelectedDay();
  }, [selectedDate, currentMonth, isAuthenticated, user?.id]);

  // Effect to fetch all appointments for the current month/week view
  useEffect(() => {
    refreshAllData();
  }, [currentMonth, viewMode, isAuthenticated, user?.id]);

  const { daysToRender, headerLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    if (viewMode === 'month') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
      const days = [];
      const emptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
      for (let i = 0; i < emptyCells; i++) {
        days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(Date.UTC(year, month, i)));
      }
      return {
        daysToRender: days,
        headerLabel: `${monthNames[month]} ${year}`
      };
    } else { // week view
      const offset = currentMonth.getUTCDay() === 0 ? -6 : 1 - currentMonth.getUTCDay();
      // Sử dụng UTC để đảm bảo tính nhất quán với phần còn lại của logic
      const startOfWeek = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), currentMonth.getUTCDate()));
      startOfWeek.setUTCDate(startOfWeek.getUTCDate() + offset);
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setUTCDate(startOfWeek.getUTCDate() + i);
        days.push(day);
      }

      const endOfWeek = days[6];
      const startMonthName = monthNames[days[0].getUTCMonth()];
      const endMonthName = monthNames[endOfWeek.getUTCMonth()];
      const startYear = days[0].getUTCFullYear();
      const endYear = endOfWeek.getUTCFullYear();

      let label = `${startMonthName} ${startYear}`;
      if (startYear !== endYear) {
        label = `${startMonthName} ${startYear} - ${endMonthName} ${endYear}`;
      } else if (startMonthName !== endMonthName) {
        label = `${startMonthName} - ${endMonthName} ${year}`;
      }

      return { daysToRender: days, headerLabel: label };
    }
  }, [currentMonth, viewMode]);

  const handlePrev = () => {
    const newDate = new Date(currentMonth);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentMonth(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentMonth);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentMonth(newDate);
  };

  const selectedDaySchedules = useMemo(() => {
    if (!selectedDate) return [];
    const date = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), selectedDate));
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday...
    const schedules = schedulesByDayOfWeek.get(dayOfWeek) || [];
    return schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, currentMonth, schedulesByDayOfWeek]);

  const selectedDayOverrides = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDayFullDateString = toYYYYMMDD(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), selectedDate)));
    const overrides = scheduleOverridesByDate.get(selectedDayFullDateString) || [];
    return overrides.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, currentMonth, scheduleOverridesByDate]);

  const selectedDayAppointments = useMemo(() => {
    return currentDayAppointments; // Đã được fetch và sắp xếp trong useEffect
  }, [currentDayAppointments]);

  const getFormattedSelectedDate = () => {
    if (!selectedDate) return "";
    const date = new Date(Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate));
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('vi-VN', options);
  }

  return (
    <div className="schedule-management-page">
      {/* Phần lịch chính */}
      <div className="schedule-calendar-section">
        <div className="calendar-header-wrapper">
          <div className="calendar-header">
            <div className="month-selector">
              <button onClick={handlePrev} className="nav-button">
                <ChevronLeft size={20} />
              </button>
              <h2>{headerLabel}</h2>
              <button onClick={handleNext} className="nav-button">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="view-toggle">
              <button className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Tháng</button>
              <button className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Tuần</button>
            </div>
            <p className="warning-text">*Lịch làm việc được áp dụng hàng tuần theo các thứ đã đăng ký.</p>
          </div>
        </div>

        <div className="calendar-container">
          {error && <p className="warning-text">{error}</p>}
          {isLoading && <p>Đang tải lịch làm việc...</p>}
          
          <div className="calendar-grid">
            <div className="day-headers">
              {dayNames.map((day) => (
                <div key={day} className="day-header">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {daysToRender.map((date, index) => {
                if (!date) {
                  return <div key={index} className="calendar-day empty"></div>;
                }
                const dayNumber = date.getUTCDate();
                const dayOfWeek = date.getUTCDay(); // Sunday is 0, Monday is 1
                const timeSlots = (schedulesByDayOfWeek.get(dayOfWeek) || []).sort((a, b) =>
                  a.startTime.localeCompare(b.startTime)
                );
                const hasFixedSchedule = timeSlots.length > 0; // Check if there's any fixed schedule
                const fullDateString = toYYYYMMDD(date);
                const hasFlexibleOverride = scheduleOverridesByDate.has(fullDateString);
                const appointmentsForDay = appointmentsByDate.get(fullDateString);
                const hasAppointments = appointmentsByDate.has(fullDateString);

                const isSelected = selectedDate === dayNumber && currentMonth.getUTCMonth() === date.getUTCMonth() && currentMonth.getUTCFullYear() === date.getUTCFullYear();
                const isToday = toYYYYMMDD(new Date()) === fullDateString;
                
                return (
                  <div
                    key={index}
                    className={`calendar-day ${isSelected ? "selected" : ""} ${hasFlexibleOverride ? "has-override" : ""} ${isToday ? "today" : ""} ${hasAppointments ? "has-appointments" : ""}`}
                    onClick={() => {
                      setSelectedDate(dayNumber);
                      setCurrentMonth(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
                      setIsDetailsModalOpen(true); // Mở modal khi click
                    }}
                  >
                    <div className="day-number">
                      <span>{dayNumber}</span>
                    </div>

                    <div className="schedule-dots-container">
                      {/* Hiển thị một chấm cho mỗi ca làm việc cố định */}
                      {timeSlots.map((slot) => {
                        const hasAppointmentInSlot = appointmentsForDay?.some(app => {
                          const appStartTime = new Date(app.appointmentStartTime).toTimeString().substring(0, 8);
                          return appStartTime >= slot.startTime && appStartTime < slot.endTime;
                        });
                        return (
                          <div 
                            key={slot.id} 
                            className={`schedule-dot schedule-dot-fixed ${hasAppointmentInSlot ? 'has-appointment' : ''}`} 
                            title={`Lịch cố định: ${slot.startTime.substring(0, 5)}-${slot.endTime.substring(0, 5)} (${slot.isAvailable ? 'Sẵn sàng' : 'Không sẵn sàng'})${hasAppointmentInSlot ? ' - Đã có hẹn' : ''}`}>
                          </div>
                        );
                      })}
                      {/* Hiển thị một chấm cho mỗi lịch linh hoạt */}
                      {scheduleOverridesByDate.get(fullDateString)?.map((override) => {
                        const hasAppointmentInSlot = appointmentsForDay?.some(app => {
                          const appStartTime = new Date(app.appointmentStartTime).toTimeString().substring(0, 8);
                          return appStartTime >= override.startTime && appStartTime < override.endTime;
                        });
                        return (
                          <div 
                            key={override.id} 
                            className={`schedule-dot schedule-dot-override ${hasAppointmentInSlot ? 'has-appointment' : ''}`} 
                            title={`Lịch linh hoạt: ${override.startTime.substring(0, 5)}-${override.endTime.substring(0, 5)} (${override.isAvailable ? 'Tăng ca' : 'Nghỉ'})${hasAppointmentInSlot ? ' - Đã có hẹn' : ''}`}>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="management-buttons">
            <button onClick={() => setIsModalOpen(true)} className="manage-button primary">
              Quản lý lịch cố định
            </button>
            <button onClick={() => setIsOverrideModalOpen(true)} className="manage-button primary">
              Quản lý lịch linh hoạt
            </button>
          </div>
        </div>
      </div>

      {/* Render các modal */}
      {isModalOpen && (
        <FixedScheduleManager schedules={viewData.schedules} onClose={() => setIsModalOpen(false)} onRefresh={refreshAllData} />
      )}

      {isOverrideModalOpen && (
        <FlexibleScheduleManager overrides={viewData.overrides} onClose={() => setIsOverrideModalOpen(false)} onRefresh={refreshAllData} />
      )}

      <DayDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        formattedDate={getFormattedSelectedDate()}
        schedules={selectedDaySchedules}
        overrides={selectedDayOverrides} // Giữ nguyên vì selectedDayOverrides đã được tính toán đúng
        appointments={selectedDayAppointments}
      />
    </div>
  );
};

export default ScheduleManagement;
