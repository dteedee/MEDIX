"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Plus, User } from "lucide-react";
import Swal from "sweetalert2";
import { scheduleService } from "../../services/scheduleService";
import { appointmentService } from "../../services/appointmentService";
import { DoctorSchedule, ScheduleOverride } from "../../types/schedule";
import { Appointment } from "../../types/appointment.types";
import styles from "../../styles/doctor/ScheduleManagement.module.css";
import FixedScheduleManager from "./FixedScheduleManager";
import FlexibleScheduleManager from "./FlexibleScheduleManager";

const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const timeSlotMatrix = [
  { id: 1, label: "Ca 1", startTime: "07:00", endTime: "07:50", session: "morning" as const },
  { id: 2, label: "Ca 2", startTime: "08:00", endTime: "08:50", session: "morning" as const },
  { id: 3, label: "Ca 3", startTime: "09:00", endTime: "09:50", session: "morning" as const },
  { id: 4, label: "Ca 4", startTime: "10:00", endTime: "10:50", session: "morning" as const },
  { id: 5, label: "Ca 5", startTime: "13:00", endTime: "13:50", session: "afternoon" as const },
  { id: 6, label: "Ca 6", startTime: "14:00", endTime: "14:50", session: "afternoon" as const },
  { id: 7, label: "Ca 7", startTime: "15:00", endTime: "15:50", session: "afternoon" as const },
  { id: 8, label: "Ca 8", startTime: "16:00", endTime: "16:50", session: "afternoon" as const },
];

const parseTimeToMinutes = (timeStr: string) => {
  const normalized = timeStr.length === 5 ? timeStr : timeStr.substring(0, 5);
  const [h, m] = normalized.split(":").map(Number);
  return h * 60 + m;
};

const getLocalDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const convertDayOfWeek = (jsDayOfWeek: number): number => {
  return jsDayOfWeek === 0 ? 7 : jsDayOfWeek;
};

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
  const slotStatuses = useMemo(() => {
    return timeSlotMatrix.map(slot => {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);

      const hasOff = overrides.some(o => {
        if (o.overrideType || !o.isAvailable) return false;
        const oStart = parseTimeToMinutes(o.startTime);
        const oEnd = parseTimeToMinutes(o.endTime);
        return oStart < slotEnd && oEnd > slotStart;
      });

      const hasWork =
        !hasOff &&
        (
          schedules.some(s => {
            if (!s.isAvailable) return false;
            const sStart = parseTimeToMinutes(s.startTime);
            const sEnd = parseTimeToMinutes(s.endTime);
            return sStart < slotEnd && sEnd > slotStart;
          }) ||
          overrides.some(o => {
            if (!o.overrideType || !o.isAvailable) return false;
            const oStart = parseTimeToMinutes(o.startTime);
            const oEnd = parseTimeToMinutes(o.endTime);
            return oStart < slotEnd && oEnd > slotStart;
          })
        );

      return {
        ...slot,
        status: hasOff ? ("off" as const) : hasWork ? ("work" as const) : ("none" as const),
      };
    });
  }, [schedules, overrides]);

  const morningSlots = slotStatuses.filter(s => s.session === "morning");
  const afternoonSlots = slotStatuses.filter(s => s.session === "afternoon");

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3>{formattedDate}</h3>
            <p className={styles.modalSubtitle}>Chi tiết lịch làm việc và cuộc hẹn</p>
          </div>
          <button onClick={onClose} className={styles.modalCloseBtn}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.matrixLegend}>
            <span><strong>V</strong>: Làm việc</span>
            <span><strong>X</strong>: Nghỉ</span>
            <span><strong>-</strong>: Chưa đăng ký</span>
          </div>

          <div className={styles.slotMatrix}>
            <div className={styles.matrixHeaderRow}>
              <div className={styles.matrixCorner}></div>
              {morningSlots.map(slot => (
                <div key={slot.id} className={styles.matrixHeaderCell}>{slot.label}</div>
              ))}
            </div>
            <div className={styles.matrixRow}>
              <div className={styles.sessionCell}>Buổi sáng</div>
              {morningSlots.map(slot => (
                <div
                  key={slot.id}
                  className={`${styles.slotCell} ${
                    slot.status === "work"
                      ? styles.slotCellWork
                      : slot.status === "off"
                        ? styles.slotCellOff
                        : styles.slotCellNone
                  }`}
                >
                  <span className={styles.slotSymbol}>
                    {slot.status === "work" ? "V" : slot.status === "off" ? "X" : "-"}
                  </span>
                  <span className={styles.slotTimeSmall}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.matrixHeaderRow}>
              <div className={styles.matrixCorner}></div>
              {afternoonSlots.map(slot => (
                <div key={slot.id} className={styles.matrixHeaderCell}>{slot.label}</div>
              ))}
            </div>
            <div className={styles.matrixRow}>
              <div className={styles.sessionCell}>Buổi chiều</div>
              {afternoonSlots.map(slot => (
                <div
                  key={slot.id}
                  className={`${styles.slotCell} ${
                    slot.status === "work"
                      ? styles.slotCellWork
                      : slot.status === "off"
                        ? styles.slotCellOff
                        : styles.slotCellNone
                  }`}
                >
                  <span className={styles.slotSymbol}>
                    {slot.status === "work" ? "V" : slot.status === "off" ? "X" : "-"}
                  </span>
                  <span className={styles.slotTimeSmall}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            onClick={() => {
              onAddFlexibleSchedule();
            }}
            className={styles.addFlexibleBtn}
          >
            <Plus size={18} />
            Thêm lịch linh hoạt
          </button>
        </div>
      </div>
    </div>
  );
};

const ScheduleManagement: React.FC = () => {
  const { user, isAuthenticated, isBanned } = useAuth();

  const [viewData, setViewData] = useState({
    schedules: [] as DoctorSchedule[],
    overrides: [] as ScheduleOverride[],
    appointments: [] as Appointment[]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialOverrideDate, setInitialOverrideDate] = useState<string | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const showBannedPopup = () => {
    if (user) {
      const startDate = (user as any)?.startDateBanned ? new Date((user as any).startDateBanned).toLocaleDateString('vi-VN') : '';
      const endDate = (user as any)?.endDateBanned ? new Date((user as any).endDateBanned).toLocaleDateString('vi-VN') : '';
      
      Swal.fire({
        title: 'Tài khoản bị tạm khóa',
        html: `Chức năng chỉnh sửa lịch làm việc của bạn đã bị tạm khóa từ <b>${startDate}</b> đến <b>${endDate}</b>.<br/>Mọi thắc mắc vui lòng liên hệ quản trị viên.`,
        icon: 'warning',
        confirmButtonText: 'Đã hiểu'
      });
    }
  };

  // Get week range: if today is Friday, show current week + next week
  const getWeekRange = (date: Date): { start: Date; end: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the Monday of the week containing the given date
    // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate days to subtract to get to Monday
    // Sunday (0) -> subtract 6 days, Monday (1) -> subtract 0 days, Tuesday (2) -> subtract 1 day, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // If today is Friday or later, show current week + next week
    // Friday is 5 days from Monday (Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5)
    const todayDayOfWeek = today.getDay();
    const todayDaysToMonday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
    let endDate = new Date(monday);
    
    if (todayDaysToMonday >= 4) { // Friday (4 days from Monday, since Monday=0) or later
      // Show 2 weeks
      endDate.setDate(monday.getDate() + 13); // Monday + 13 days = Sunday of next week
    } else {
      // Show 1 week
      endDate.setDate(monday.getDate() + 6); // Monday + 6 days = Sunday
    }

    return { start: monday, end: endDate };
  };

  const refreshAllData = async () => {
    if (!isAuthenticated || !user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const weekRange = getWeekRange(currentDate);
      const [fixed, overrides] = await Promise.all([
        scheduleService.getMySchedules(),
        scheduleService.getMyScheduleOverrides()
      ]);

      // Filter overrides to only future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureOverrides = overrides.filter(o => {
        const overrideDate = new Date(o.overrideDate);
        overrideDate.setHours(0, 0, 0, 0);
        return overrideDate >= today;
      });

      const appointments = await appointmentService.getMyAppointmentsByDateRange(
        getLocalDateKey(weekRange.start),
        getLocalDateKey(weekRange.end)
      );

      setViewData({ schedules: fixed, overrides: futureOverrides, appointments });
    } catch (err) {
      setError("Không thể tải dữ liệu lịch.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentDate, isAuthenticated, user?.id]);

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

  const { weekDays, headerLabel } = useMemo(() => {
    const weekRange = getWeekRange(currentDate);
    const days: (Date | null)[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Always show all 7 days of the week (or 14 if 2 weeks)
    // Use null for past dates to maintain grid structure
    for (let d = new Date(weekRange.start); d <= weekRange.end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      // Include all days, but mark past dates as null
      if (day >= today) {
        days.push(new Date(day));
      } else {
        days.push(null); // Keep grid structure but mark as empty
      }
    }

    const startMonth = weekRange.start.getMonth();
    const startYear = weekRange.start.getFullYear();
    const endMonth = weekRange.end.getMonth();
    const endYear = weekRange.end.getFullYear();
    
    const monthNames = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    let label = `${monthNames[startMonth]} ${startYear}`;
    if (startMonth !== endMonth || startYear !== endYear) {
      label = `${monthNames[startMonth]} ${startYear} - ${monthNames[endMonth]} ${endYear}`;
    }

    return { weekDays: days, headerLabel: label };
  }, [currentDate]);

  const openDayDetails = (date: Date) => {
    setSelectedDate(date);
    setIsDetailsModalOpen(true);
  };

  const handleAddFlexibleSchedule = () => {
    if (!selectedDate) return;
    const dateString = getLocalDateKey(selectedDate);
    setInitialOverrideDate(dateString);
    setIsDetailsModalOpen(false);
    setIsOverrideModalOpen(true);
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Lịch làm việc</h1>
          <p className={styles.pageSubtitle}>Quản lý và xem lịch làm việc cố định, linh hoạt và cuộc hẹn của bạn</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTimeCard}>
            <Calendar size={20} />
            <span>{new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className={styles.calendarSection}>
        <div className={styles.calendarHeader}>
          <button 
            onClick={() => navigateWeek('prev')} 
            className={styles.navButton}
            aria-label="Tuần trước"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className={styles.calendarTitle}>{headerLabel}</h2>
          <button 
            onClick={() => navigateWeek('next')} 
            className={styles.navButton}
            aria-label="Tuần sau"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
        {isLoading && <p className={styles.loadingText}>Đang tải...</p>}

        <div className={styles.calendarGrid}>
          <div className={styles.dayHeaders}>
            {dayNames.map((day, idx) => (
              <div key={idx} className={styles.dayHeader}>{day}</div>
            ))}
          </div>
          <div className={styles.calendarDays}>
            {weekDays.map((date, i) => {
              // Handle null dates (past dates)
              if (!date) {
                return <div key={`empty-${i}`} className={`${styles.calendarDay} ${styles.emptyDay}`}></div>;
              }

              const dateKey = getLocalDateKey(date);
              const dayOfWeek = convertDayOfWeek(date.getDay());

              const fixedSchedules = schedulesByDay.get(dayOfWeek) || [];
              const dayOverrides = overridesByDate.get(dateKey) || [];
              const dayAppointments = appointmentsByDate.get(dateKey) || [];

              const workSlots = [
                ...fixedSchedules.filter(fs =>
                  !dayOverrides.some(
                    o => !o.overrideType && o.startTime < fs.endTime && o.endTime > fs.startTime
                  )
                ),
                ...dayOverrides.filter(o => o.overrideType && o.isAvailable)
              ];

              const hasDayOff = dayOverrides.some(o => !o.overrideType && o.isAvailable);

              const isToday = getLocalDateKey(date) === getLocalDateKey(new Date());
              const appointmentCount = dayAppointments.length;

              const dayClasses = [
                styles.calendarDay,
                selectedDate && getLocalDateKey(selectedDate) === dateKey ? styles.selected : "",
                dayOverrides.length > 0 ? styles.hasOverride : "",
                hasDayOff ? styles.dayOff : "",
                appointmentCount > 0 ? styles.hasAppointment : "",
                isToday ? styles.today : ""
              ].filter(Boolean).join(" ");

              // Sort appointments by time
              const sortedAppointments = [...dayAppointments].sort((a, b) => 
                new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime()
              );

              return (
                <div
                  key={dateKey}
                  className={dayClasses}
                  onClick={() => openDayDetails(date)}
                >
                  <div className={styles.dayNumberWrapper}>
                    <span className={styles.dayNumber}>{date.getDate()}</span>
                    {appointmentCount > 0 && (
                      <span className={styles.appointmentBadge} title={`${appointmentCount} cuộc hẹn`}>
                        {appointmentCount}
                      </span>
                    )}
                  </div>
                  
                  {/* Work slots indicators */}
                  <div className={styles.dayIndicators}>
                    {workSlots.map((slot, index) => (
                      <span
                        key={index}
                        className={styles.indicator}
                        title={`${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`}
                      ></span>
                    ))}
                  </div>

                  {/* Appointments list - hiển thị trực tiếp trên calendar */}
                  {appointmentCount > 0 && (
                    <div className={styles.appointmentsPreview}>
                      <div className={styles.appointmentsPreviewHeader}>
                        <Users size={12} />
                        <span>{appointmentCount} cuộc hẹn</span>
                      </div>
                      <div className={styles.appointmentsList}>
                        {sortedAppointments.slice(0, 3).map((app, idx) => {
                          const appTime = new Date(app.appointmentStartTime);
                          const appEndTime = new Date(app.appointmentEndTime);
                          const timeStr = appTime.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit"
                          });
                          const endTimeStr = appEndTime.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit"
                          });
                          const tooltipText = `${timeStr} - ${endTimeStr}\n${app.patientName}\n${app.statusDisplayName || app.statusCode}`;
                          return (
                            <div 
                              key={app.id} 
                              className={styles.appointmentPreviewItem} 
                              title={tooltipText}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDayDetails(date);
                              }}
                            >
                              <div className={styles.appointmentPreviewTime}>{timeStr}</div>
                              <div className={styles.appointmentPreviewPatient}>
                                <User size={10} />
                                <span>{app.patientName.length > 12 ? app.patientName.substring(0, 12) + '...' : app.patientName}</span>
                              </div>
                            </div>
                          );
                        })}
                        {appointmentCount > 3 && (
                          <div 
                            className={styles.appointmentMore}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDayDetails(date);
                            }}
                          >
                            +{appointmentCount - 3} cuộc hẹn khác
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.managementButtons}>
          <button 
            onClick={() => isBanned ? showBannedPopup() : setIsModalOpen(true)} 
            className={styles.manageButton}
          >
            <Calendar size={18} />
            Quản lý lịch cố định
          </button>
          <button
            onClick={() => {
              if (isBanned) {
                showBannedPopup();
              } else {
                setInitialOverrideDate(null);
                setIsOverrideModalOpen(true);
              }
            }}
            className={styles.manageButton}
          >
            <Clock size={18} />
            Quản lý lịch linh hoạt
          </button>
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
            ? schedulesByDay.get(convertDayOfWeek(selectedDate.getDay())) || []
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
