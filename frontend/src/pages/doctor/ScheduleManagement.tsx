"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from "lucide-react";
import Swal from 'sweetalert2';
import { scheduleService } from '../../services/scheduleService';
import { appointmentService } from '../../services/appointmentService';
import { DoctorSchedule, CreateSchedulePayload } from '../../types/schedule';
import { Appointment } from '../../types/appointment.types';
import "../../styles/ScheduleManagement.css";
import FixedScheduleManager from './FixedScheduleManager'; // Giữ nguyên vì file mới được tạo cùng thư mục

const monthNames = [ "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12" ];
const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// Hàm tiện ích để định dạng ngày thành YYYY-MM-DD một cách an toàn, không bị ảnh hưởng bởi múi giờ.
const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ScheduleManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [currentDayAppointments, setCurrentDayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Map schedules by day of the week for quick lookup
  const schedulesByDayOfWeek = useMemo(() => {
    const map = new Map<number, DoctorSchedule[]>();
    schedules.forEach(schedule => {
      const day = schedule.dayOfWeek;
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day)?.push(schedule);
    });
    return map;
  }, [schedules]);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      if (!isAuthenticated || !user?.id) {
        setError('Bạn cần đăng nhập để xem và quản lý lịch làm việc.');
        setIsLoading(false);
        return;
      }

      // Chỉ lấy lịch làm việc định kỳ
      const data = await scheduleService.getMySchedules();
      setSchedules(data);

      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách lịch làm việc. Vui lòng thử lại.');
      console.error('Error fetching schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect để lấy cuộc hẹn khi ngày được chọn thay đổi
  useEffect(() => {
    const fetchAppointmentsForSelectedDay = async () => {
      if (!isAuthenticated || !user?.id || !selectedDate) return;
      const selectedFullDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
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

  useEffect(() => {
    fetchSchedules();
  }, [isAuthenticated, user?.id]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Add empty cells for days before month starts (Monday is 1, Sunday is 0)
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    days.push(null);
  }

  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectedDaySchedules = useMemo(() => {
    if (!selectedDate) return [];
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const dayOfWeek = date.getDay();
    return schedulesByDayOfWeek.get(dayOfWeek) || [];
  }, [selectedDate, currentMonth, schedulesByDayOfWeek]);

  const selectedDayAppointments = useMemo(() => {
    return currentDayAppointments; // Đã được fetch và sắp xếp trong useEffect
  }, [currentDayAppointments]);

  const getFormattedSelectedDate = () => {
    if (!selectedDate) return "";
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('vi-VN', options);
  }

  return (
    <div className="schedule-calendar">
      <div className="calendar-header">
        <div className="month-selector">
          <button onClick={handlePrevMonth} className="nav-button">
            <ChevronLeft size={20} />
          </button>
          <h2>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button onClick={handleNextMonth} className="nav-button">
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="warning-text">*Lịch làm việc được áp dụng hàng tuần theo các thứ đã đăng ký.</p>
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
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="calendar-day empty"></div>;
              }
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1
              const timeSlots = schedulesByDayOfWeek.get(dayOfWeek) || [];
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${day === selectedDate ? "selected" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="day-number">{day}</div>
                  <div className="time-slots">
                    {timeSlots.map((slot) => (
                      <div key={slot.id} className="time-slot" style={{ color: slot.isAvailable ? '#10b981' : '#f87171' }}>
                        {slot.startTime.substring(0, 5)}-{slot.endTime.substring(0, 5)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Nút này hiện chưa có chức năng, sẽ cần phát triển thêm */}
        <button onClick={() => setIsModalOpen(true)} className="save-button" style={{marginTop: '24px'}}>
          Quản lý lịch cố định
        </button>
      </div>

      <div className="schedule-details">
        {selectedDate ? (
          <>
            <h3 className="details-header">{getFormattedSelectedDate()}</h3>
            {selectedDaySchedules.length > 0 ? (
              <div className="details-list">
                {selectedDaySchedules.map(schedule => (
                  <div key={schedule.id} className="detail-item">
                    <p className="detail-time">{schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}</p>
                    <p className="detail-status">
                      <span className="status-dot" style={{ backgroundColor: schedule.isAvailable ? '#10b981' : '#ef4444' }}></span>
                      {schedule.isAvailable ? 'Sẵn sàng nhận lịch' : 'Không nhận lịch'}
                    </p>
                  </div>
                ))}
              </div>
            ) : <p className="details-placeholder">Không có ca làm việc nào cho ngày này.</p>}

            {selectedDayAppointments.length > 0 && (
              <div className="appointment-list">
                <h4 className="appointment-list-header">Các cuộc hẹn</h4>
                <div className="details-list">
                  {selectedDayAppointments.map(app => (
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
              </div>
            )}
          </>
        ) : <p className="details-placeholder">Chọn một ngày để xem chi tiết</p>}
      </div>

      {isModalOpen && (
        <FixedScheduleManager schedules={schedules} onClose={() => setIsModalOpen(false)} onRefresh={fetchSchedules} />
      )}
    </div>
  );
};

export default ScheduleManagement;
