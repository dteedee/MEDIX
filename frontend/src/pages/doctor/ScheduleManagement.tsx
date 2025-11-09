"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import { scheduleService } from "../../services/scheduleService";
import { appointmentService } from "../../services/appointmentService";
import { DoctorSchedule, ScheduleOverride } from "../../types/schedule";
import { Appointment } from "../../types/appointment.types";
import "../../styles/doctor/ScheduleManagement.css";
import FixedScheduleManager from "./FixedScheduleManager";
import FlexibleScheduleManager from "./FlexibleScheduleManager";

const monthNames = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// --- Helper: chuẩn hóa ngày local thành dạng YYYY-MM-DD ---
const getLocalDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

type ViewMode = "month" | "week";

// --- Modal Chi tiết ngày ---
interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formattedDate: string;
  schedules: DoctorSchedule[];
  overrides: ScheduleOverride[];
  appointments: Appointment[];
  onAddFlexibleSchedule: () => void;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  formattedDate,
  schedules,
  overrides,
  appointments,
  onAddFlexibleSchedule
}) => {
  const allSlots = useMemo(() => {
    // Lấy tất cả lịch linh hoạt (cả tăng ca và nghỉ)
    const allOverrides = overrides.map(o => ({ ...o, type: "override" as const }));

    // Lọc ra những ca cố định không bị "ghi đè" bởi một lịch "Nghỉ" (overrideType = false)
    const visibleFixedSlots = schedules.filter(fixedSlot => {
      // Một ca cố định sẽ bị ẩn nếu nó trùng giờ với một lịch "Nghỉ" (overrideType = false)
      const isOverriddenByNghi = allOverrides.some(overrideSlot => 
        !overrideSlot.overrideType && // Kiểm tra nếu là lịch "Nghỉ"
        overrideSlot.startTime < fixedSlot.endTime && overrideSlot.endTime > fixedSlot.startTime
      );
      return !isOverriddenByNghi;
    }).map(s => ({ ...s, type: "fixed" as const }));

    // Chỉ lấy các ca "Tăng ca" (overrideType = true) mà vẫn còn khả dụng (isAvailable = true)
    const visibleOverrideSlots = allOverrides.filter(o => o.overrideType && o.isAvailable);

    // Gộp các ca cố định hợp lệ và tất cả các ca linh hoạt, sau đó sắp xếp
    return [...visibleFixedSlots, ...visibleOverrideSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, overrides]);

  if (!isOpen) return null;

  return (
    <div className="details-modal-overlay" onClick={onClose}>
      <div className="details-modal-content" onClick={e => e.stopPropagation()}>
        <div className="details-modal-header">
          <h3>{formattedDate}</h3>
          <button onClick={onClose} className="details-modal-close-btn">
            &times;
          </button>
        </div>

        <div className="details-modal-body">
          {allSlots.length > 0 ? (
            allSlots.map(slot => {
              const apps = appointments.filter(app => {
                const start = new Date(app.appointmentStartTime).toTimeString().slice(0, 8);
                return start >= slot.startTime && start < slot.endTime;
              });

              return (
                <div
                  key={slot.id}
                  className={`detail-item ${
                    slot.type === "override" ? (slot.overrideType ? "override-available" : "override-item") : ""
                  }`}
                >
                  <p className="detail-time">
                    {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                  </p>
                  <p className={`detail-status ${
                    // Chỉ áp dụng class màu cho lịch linh hoạt, lịch cố định có màu mặc định
                    slot.type === 'override' && (slot.overrideType ? "status-available" : "status-unavailable")
                  }`}>
                    <span
                      className="status-dot"
                      style={{
                        // Nếu là lịch cố định, màu là xám. Nếu là lịch linh hoạt, màu dựa trên overrideType.
                        backgroundColor: slot.type === 'fixed' 
                          ? '#4080ffff' // Màu xám cho lịch cố định
                          : slot.overrideType 
                            ? '#10b981' // Màu xanh cho tăng cas
                            : '#ef4444' // Màu đỏ cho nghỉ
                      }}
                    ></span>
                    {slot.type === "fixed"
                      ? slot.isAvailable
                        ? "Sẵn sàng"
                        : "Không sẵn sàng"
                      : slot.overrideType // Nếu là override, hiển thị dựa trên overrideType
                        ? `Tăng ca${slot.reason ? ` - ${slot.reason}` : ''}`
                        : `Nghỉ${slot.reason ? ` - ${slot.reason}` : ''}`
                    }
                  </p>

                  {apps.length > 0 && (
                    <div className="appointment-list-nested">
                      {apps.map(app => (
                        <div key={app.id} className="appointment-item">
                          <p className="appointment-time">
                            {new Date(app.appointmentStartTime).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}{" "}
                            -{" "}
                            {new Date(app.appointmentEndTime).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                          <p className="appointment-patient">BN: {app.patientName}</p>
                          <p className="appointment-status">
                            {app.statusDisplayName || app.statusCode}
                          </p>
                          <Link
                            to={`/app/doctor/medical-records/${app.id}`}
                            className="view-record-button"
                          >
                            Xem hồ sơ
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="details-placeholder">
              Không có lịch làm việc hoặc cuộc hẹn nào trong ngày này.
            </p>
          )}
        </div>
        <div className="details-modal-footer">
          <button
            onClick={() => {
              onAddFlexibleSchedule();
            }}
            className="manage-button primary"
          >
            Thêm lịch linh hoạt
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Component chính ---
const ScheduleManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const [viewData, setViewData] = useState({
    schedules: [] as DoctorSchedule[],
    overrides: [] as ScheduleOverride[],
    appointments: [] as Appointment[]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialOverrideDate, setInitialOverrideDate] = useState<string | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // --- Fetch dữ liệu ---
  const refreshAllData = async () => {
    if (!isAuthenticated || !user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const [fixed, overrides] = await Promise.all([
        scheduleService.getMySchedules(),
        scheduleService.getMyScheduleOverrides()
      ]);

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const appointments = await appointmentService.getMyAppointmentsByDateRange(
        getLocalDateKey(start),
        getLocalDateKey(end)
      );

      setViewData({ schedules: fixed, overrides, appointments });
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu lịch.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentDate, viewMode, isAuthenticated, user?.id]);

  // --- Map dữ liệu ---
  const { schedulesByDay, overridesByDate, appointmentsByDate } = useMemo(() => {
    const sMap = new Map<number, DoctorSchedule[]>();
    viewData.schedules.forEach(s => {
      if (!sMap.has(s.dayOfWeek)) sMap.set(s.dayOfWeek, []);
      sMap.get(s.dayOfWeek)!.push(s);
    });

    const oMap = new Map<string, ScheduleOverride[]>();
    viewData.overrides.forEach(o => {
      const key = o.overrideDate;
      if (!oMap.has(key)) oMap.set(key, []);
      oMap.get(key)!.push(o);
    });

    const aMap = new Map<string, Appointment[]>();
    viewData.appointments.forEach(a => {
      const key = a.appointmentStartTime.substring(0, 10);
      if (!aMap.has(key)) aMap.set(key, []);
      aMap.get(key)!.push(a);
    });

    return { schedulesByDay: sMap, overridesByDate: oMap, appointmentsByDate: aMap };
  }, [viewData]);

  // --- Sinh danh sách ngày ---
  const { days, headerLabel } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    if (viewMode === "month") {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const firstDay = new Date(y, m, 1).getDay() || 7;
      const daysArray: (Date | null)[] = [];

      for (let i = 1; i < firstDay; i++) daysArray.push(null);
      for (let d = 1; d <= daysInMonth; d++) daysArray.push(new Date(y, m, d));

      return { days: daysArray, headerLabel: `${monthNames[m]} ${y}` };
    } else {
      const dayOfWeek = currentDate.getDay() || 7;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - (dayOfWeek - 1));
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
      const label = `${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
      return { days: weekDays, headerLabel: label };
    }
  }, [currentDate, viewMode]);

  const openDayDetails = (date: Date) => {
    setSelectedDate(date);
    setIsDetailsModalOpen(true);
  };

  const handleAddFlexibleSchedule = () => {
    if (!selectedDate) return;
    const dateString = getLocalDateKey(selectedDate);
    setInitialOverrideDate(dateString);
    setIsDetailsModalOpen(false); // Đóng modal chi tiết
    setIsOverrideModalOpen(true); // Mở modal thêm lịch linh hoạt
  };

  const getFormattedSelectedDate = () => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="schedule-management-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Quản lý lịch làm việc</h1>
          <p>Thiết lập lịch cố định và đăng ký các ca làm việc linh hoạt.</p>
        </div>
        <div className="header-right">
          <div className="_dateTime_1lhoz_107"><i className="bi bi-calendar3"></i><span>{new Date().toLocaleDateString('vi-VN')}</span></div>
        </div>
      </div>

      {/* Chú thích */}
      <div className="schedule-guide-note">
        <p className="note-label">Lưu ý:</p>
        <ul>
          <li><span className="note-dot orange"></span> Có lịch hẹn</li>
          <li><span className="note-dot green"></span> Có lịch linh hoạt</li>
          <li><span className="important-note">Quan trọng:</span> Không thể ghi đè nhiều lịch trên 1 khoảng thời gian, nếu muốn thay đổi trạng thái, xin hãy xóa lịch ghi đè trước!!!</li>
        </ul>
      </div>
      <div className="schedule-calendar-section">
        <div className="calendar-header">
          <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - (viewMode === "month" ? 1 : 0), d.getDate() - (viewMode === "week" ? 7 : 0)))}>
            <ChevronLeft size={20} />
          </button>
          <h2>{headerLabel}</h2>
          <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + (viewMode === "month" ? 1 : 0), d.getDate() + (viewMode === "week" ? 7 : 0)))}>
            <ChevronRight size={20} />
          </button>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              Tháng
            </button>
            <button
              className={`toggle-btn ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >
              Tuần
            </button>
          </div>
        </div>

        <div className="calendar-container">
          {error && <p className="warning-text">{error}</p>}
          {isLoading && <p>Đang tải...</p>}

          <div className="calendar-grid">
            <div className="day-headers">
              {dayNames.map(d => (
                <div key={d} className="day-header">{d}</div>
              ))}
            </div>
            <div className="calendar-days">
              {days.map((date, i) => {
                if (!date) {
                  return <div key={i} className="calendar-day empty" />;
                }

                const dateKey = getLocalDateKey(date);
                const dayOfWeek = date.getDay(); // 0=CN, 1=T2,...

                // Lấy lịch cố định và lịch linh hoạt cho ngày hiện tại
                const fixedSchedules = schedulesByDay.get(dayOfWeek) || [];
                const dayOverrides = overridesByDate.get(dateKey) || [];
                const dayAppointments = appointmentsByDate.get(dateKey) || [];


                // Tính toán các ca làm việc thực tế trong ngày
                const workSlots = [
                  // Lấy các ca cố định không bị lịch nghỉ ghi đè
                  ...fixedSchedules.filter(fs =>
                    // Lịch cố định bị ẩn nếu trùng với lịch "Nghỉ" (overrideType = false)
                    !dayOverrides.some(
                      o => !o.overrideType && o.startTime < fs.endTime && o.endTime > fs.startTime
                    )
                  ),
                  // Lấy các ca "Tăng ca" (overrideType = true) mà vẫn còn khả dụng (isAvailable = true)
                  ...dayOverrides.filter(o => o.overrideType && o.isAvailable)
                ];

                const isToday = getLocalDateKey(date) === getLocalDateKey(new Date());

                const dayClasses = [
                  "calendar-day",
                  selectedDate && getLocalDateKey(selectedDate) === dateKey ? "selected" : "",
                  dayOverrides.length > 0 ? "has-override" : "",
                  dayAppointments.length > 0 ? "has-appointment-day" : "",
                  isToday ? "today" : ""
                ].join(" ");

                return (
                  <div
                    key={dateKey}
                    className={dayClasses}
                    onClick={() => openDayDetails(date)}
                  >
                    <div className="day-number">{date.getDate()}</div>
                    <div className="day-indicators">
                      {/* Render một chấm tròn cho mỗi ca làm việc */}
                      {workSlots.map((slot, index) => (
                        <span
                          key={index}
                          className="indicator"
                          title={`${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`}
                        ></span>
                      ))}
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
            <button
              onClick={() => {
                setInitialOverrideDate(null); // Không truyền ngày ban đầu để hiển thị danh sách
                setIsOverrideModalOpen(true);
              }}
              className="manage-button primary"
            >
              Quản lý lịch linh hoạt
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <FixedScheduleManager
          schedules={viewData.schedules}
          onClose={() => setIsModalOpen(false)}
          onRefresh={refreshAllData}
        />
      )}
      {isOverrideModalOpen && (
        <FlexibleScheduleManager
          schedules={viewData.schedules}
          overrides={viewData.overrides}
          initialDate={initialOverrideDate}
          onClose={() => { setIsOverrideModalOpen(false); setInitialOverrideDate(null); }}
          onRefresh={refreshAllData}
        />
      )}

      <DayDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        formattedDate={getFormattedSelectedDate()}
        schedules={
          selectedDate
            ? schedulesByDay.get(selectedDate.getDay()) || []
            : []
        }
        overrides={selectedDate ? overridesByDate.get(getLocalDateKey(selectedDate)) || [] : []}
        onAddFlexibleSchedule={handleAddFlexibleSchedule}
        appointments={selectedDate ? appointmentsByDate.get(getLocalDateKey(selectedDate)) || [] : []}
      />
    </div>
  );
};

export default ScheduleManagement;
