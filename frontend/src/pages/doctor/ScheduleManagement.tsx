"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Plus, User } from "lucide-react";
import Swal from "sweetalert2";
import { scheduleService } from "../../services/scheduleService";
import { appointmentService } from "../../services/appointmentService";
import { DoctorSchedule, ScheduleOverride, CreateScheduleOverridePayload } from "../../types/schedule";
import { Appointment } from "../../types/appointment.types";
import styles from "../../styles/doctor/ScheduleManagement.module.css";
import FixedScheduleManager from "./FixedScheduleManager";
import FlexibleScheduleManager from "./FlexibleScheduleManager";
import { useToast } from "../../contexts/ToastContext";

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

// Lấy số phút từ chuỗi thời gian ISO của cuộc hẹn, bù thêm 7 giờ để khớp với ma trận ca (07:00, 08:00, ...).
// Ví dụ: 03:00 (+07:00) -> 10:00 trong ma trận.
const getLocalMinutesFromISO = (isoString: string): number => {
  const date = new Date(isoString);
  const h = (date.getHours() + 7) % 24;
  const m = date.getMinutes();
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
  dateKey: string;
  schedules: DoctorSchedule[];
  overrides: ScheduleOverride[];
  appointments: Appointment[];
  onRefresh: () => void;
  onAddFlexibleSchedule: (slot?: { startTime: string; endTime: string }) => void;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  formattedDate,
  dateKey,
  schedules,
  overrides,
  appointments,
  onRefresh,
  onAddFlexibleSchedule
}) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const slotStatuses = useMemo(() => {
    return timeSlotMatrix.map(slot => {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);

      const hasAppointment = appointments.some(app => {
        const appStart = getLocalMinutesFromISO(app.appointmentStartTime);
        const appEnd = getLocalMinutesFromISO(app.appointmentEndTime);
        return appStart < slotEnd && appEnd > slotStart;
      });

      const hasOff = overrides.some(o => {
        if (o.overrideType || !o.isAvailable) return false;
        const oStart = parseTimeToMinutes(o.startTime);
        const oEnd = parseTimeToMinutes(o.endTime);
        return oStart < slotEnd && oEnd > slotStart;
      });

      const hasWork =
        !hasOff &&
        (schedules.some(s => {
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
          }));

      const status =
        hasAppointment ? ("occupied" as const)
        : hasOff ? ("off" as const)
        : hasWork ? ("work" as const)
        : ("none" as const);

      return {
        ...slot,
        status,
      };
    });
  }, [schedules, overrides, appointments]);

  const morningSlots = slotStatuses.filter(s => s.session === "morning");
  const afternoonSlots = slotStatuses.filter(s => s.session === "afternoon");

  const handleSlotClick = async (slot: typeof slotStatuses[number]) => {
    try {
      if (!dateKey) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(dateKey);
      selectedDate.setHours(0, 0, 0, 0);

      if (slot.status === "occupied") {
        // Điều hướng sang trang lịch hẹn và highlight các cuộc hẹn thuộc ca này
        const slotStartMin = parseTimeToMinutes(slot.startTime);
        const slotEndMin = parseTimeToMinutes(slot.endTime);

        const relatedIds = appointments
          .filter(app => {
            const appStartMin = getLocalMinutesFromISO(app.appointmentStartTime);
            const appEndMin = getLocalMinutesFromISO(app.appointmentEndTime);
            return appStartMin < slotEndMin && appEndMin > slotStartMin;
          })
          .map(app => app.id);

        navigate('/app/doctor/appointments', {
          state: {
            fromSchedule: true,
            highlightAppointmentIds: relatedIds
          }
        });
        return;
      }

      if (slot.status === "none") {
        // Nếu chưa có ca làm việc, vẫn dùng form để đăng ký linh hoạt chi tiết
        onAddFlexibleSchedule({ startTime: slot.startTime, endTime: slot.endTime });
        return;
      }

      // Xử lý toggle nghỉ / làm việc thông qua overrides
      const existingOff = overrides.find(o => {
        if (o.overrideType || !o.isAvailable) return false;
        if (o.overrideDate !== dateKey) return false;
        const oStart = parseTimeToMinutes(o.startTime);
        const oEnd = parseTimeToMinutes(o.endTime);
        const slotStart = parseTimeToMinutes(slot.startTime);
        const slotEnd = parseTimeToMinutes(slot.endTime);
        return oStart < slotEnd && oEnd > slotStart;
      });

      // Nếu đang X (đang có override nghỉ) -> bỏ nghỉ, quay lại làm việc
      if (existingOff) {
        await scheduleService.deleteScheduleOverride(existingOff.id);
        await onRefresh();
        showToast(
          `Đã bỏ đăng ký nghỉ cho ${slot.label} (${slot.startTime} - ${slot.endTime}) ngày ${formattedDate}.`,
          "success"
        );
        return;
      }

      // Đổi sang nghỉ: chỉ áp dụng rule 2 ngày sau
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 2);
      if (selectedDate < minDate) {
        const minDateStr = minDate.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        Swal.fire({
          title: 'Lỗi!',
          html: `Ngày nghỉ phải cách hôm nay ít nhất 2 ngày. Bạn chỉ có thể đăng ký nghỉ từ <b>${minDateStr}</b> trở đi.`,
          icon: 'warning',
          confirmButtonText: 'Đã hiểu'
        });
        return;
      }

      const payload: CreateScheduleOverridePayload = {
        overrideDate: dateKey,
        startTime: `${slot.startTime}:00`,
        endTime: `${slot.endTime}:00`,
        overrideType: false, // Nghỉ
        isAvailable: true,
        reason: ''
      };

      await scheduleService.createScheduleOverride(payload);
      await onRefresh();
      showToast(
        `Đã đăng ký nghỉ cho ${slot.label} (${slot.startTime} - ${slot.endTime}) ngày ${formattedDate}.`,
        "success"
      );
    } catch (err: any) {
      let errorMessage = 'Không thể cập nhật lịch. Vui lòng kiểm tra lại thông tin.';

      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (typeof err.response.data === 'object' && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'object') {
          errorMessage = JSON.stringify(err.response.data);
        }

        switch (true) {
          case errorMessage.includes('Bạn đã có ghi đè trong khung giờ'):
            errorMessage = "Khung giờ này đã tồn tại một lịch linh hoạt khác. Vui lòng chọn thời gian khác.";
            break;
          case errorMessage.includes('Lịch tăng ca không được phép trùng với lịch cố định đã có.'):
            errorMessage = "Lịch tăng ca bạn chọn bị trùng với lịch làm việc cố định đã có. Vui lòng chọn một khung giờ khác.";
            break;
        }
      }

      Swal.fire({
        title: 'Lỗi!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Đã hiểu'
      });
    }
  };

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
            <span><strong>O</strong>: Có hẹn</span>
            <span><strong>X</strong>: Nghỉ</span>
            <span><strong>-</strong>: Chưa đăng ký</span>
            <span className={styles.matrixHint}>Nhấn vào ca để đăng ký lịch linh hoạt nhanh</span>
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
                    slot.status === "occupied"
                      ? styles.slotCellOccupied
                      : slot.status === "work"
                        ? styles.slotCellWork
                        : slot.status === "off"
                          ? styles.slotCellOff
                          : styles.slotCellNone
                  }`}
                  onClick={() => handleSlotClick(slot)}
                >
                  <span className={styles.slotSymbol}>
                    {slot.status === "occupied"
                      ? "O"
                      : slot.status === "work"
                        ? "V"
                        : slot.status === "off"
                          ? "X"
                          : "-"}
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
                    slot.status === "occupied"
                      ? styles.slotCellOccupied
                      : slot.status === "work"
                        ? styles.slotCellWork
                        : slot.status === "off"
                          ? styles.slotCellOff
                          : styles.slotCellNone
                  }`}
                  onClick={() => handleSlotClick(slot)}
                >
                  <span className={styles.slotSymbol}>
                    {slot.status === "occupied"
                      ? "O"
                      : slot.status === "work"
                        ? "V"
                        : slot.status === "off"
                          ? "X"
                          : "-"}
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
  const [initialOverrideStart, setInitialOverrideStart] = useState<string | null>(null);
  const [initialOverrideEnd, setInitialOverrideEnd] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

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

  const getMonthRange = (date: Date): { start: Date; end: Date } => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const refreshAllData = async () => {
    if (!isAuthenticated || !user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const range = viewMode === "week" ? getWeekRange(currentDate) : getMonthRange(currentDate);
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
        getLocalDateKey(range.start),
        getLocalDateKey(range.end)
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
  }, [currentDate, isAuthenticated, user?.id, viewMode]);

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

  const weekDays = useMemo(() => {
    if (viewMode !== "week") return [];
    const weekRange = getWeekRange(currentDate);
    const days: (Date | null)[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = new Date(weekRange.start); d <= weekRange.end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      if (day >= today) {
        days.push(new Date(day));
      } else {
        days.push(null);
      }
    }

    return days;
  }, [currentDate, viewMode]);

  const monthDays = useMemo(() => {
    if (viewMode !== "month") return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const start = new Date(firstDay);
    const startDay = start.getDay() === 0 ? 7 : start.getDay();
    start.setDate(start.getDate() - (startDay - 1));

    const end = new Date(lastDay);
    const endDay = end.getDay() === 0 ? 7 : end.getDay();
    end.setDate(end.getDate() + (7 - endDay));

    const days: { date: Date; inCurrentMonth: boolean }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d),
        inCurrentMonth: d.getMonth() === month
      });
    }
    return days;
  }, [currentDate, viewMode]);

  const headerLabel = useMemo(() => {
    const monthNames = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    if (viewMode === "week") {
      const weekRange = getWeekRange(currentDate);
      const startMonth = weekRange.start.getMonth();
      const startYear = weekRange.start.getFullYear();
      const endMonth = weekRange.end.getMonth();
      const endYear = weekRange.end.getFullYear();

      let label = `${monthNames[startMonth]} ${startYear}`;
      if (startMonth !== endMonth || startYear !== endYear) {
        label = `${monthNames[startMonth]} ${startYear} - ${monthNames[endMonth]} ${endYear}`;
      }
      return label;
    }

    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate, viewMode]);

  const openDayDetails = (date: Date) => {
    setSelectedDate(date);
    setIsDetailsModalOpen(true);
  };

  const handleAddFlexibleSchedule = (slot?: { startTime: string; endTime: string }) => {
    if (!selectedDate) return;
    const dateString = getLocalDateKey(selectedDate);
    setInitialOverrideDate(dateString);
    setInitialOverrideStart(slot?.startTime ?? null);
    setInitialOverrideEnd(slot?.endTime ?? null);
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

  const renderDayCard = (date: Date, options?: { isOutsideMonth?: boolean }) => {
    const dateKey = getLocalDateKey(date);
    const dayOfWeek = convertDayOfWeek(date.getDay());

    const fixedSchedules = schedulesByDay.get(dayOfWeek) || [];
    const dayOverrides = overridesByDate.get(dateKey) || [];
    const dayAppointments = appointmentsByDate.get(dateKey) || [];

    const slotStatuses = timeSlotMatrix.map(slot => {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);

      const hasAppointment = dayAppointments.some(app => {
        const appStart = getLocalMinutesFromISO(app.appointmentStartTime);
        const appEnd = getLocalMinutesFromISO(app.appointmentEndTime);
        return appStart < slotEnd && appEnd > slotStart;
      });

      const hasOff = dayOverrides.some(o => {
        if (o.overrideType || !o.isAvailable) return false;
        const oStart = parseTimeToMinutes(o.startTime);
        const oEnd = parseTimeToMinutes(o.endTime);
        return oStart < slotEnd && oEnd > slotStart;
      });

      const hasWork =
        !hasOff &&
        (fixedSchedules.some(s => {
          if (!s.isAvailable) return false;
          const sStart = parseTimeToMinutes(s.startTime);
          const sEnd = parseTimeToMinutes(s.endTime);
          return sStart < slotEnd && sEnd > slotStart;
        }) ||
          dayOverrides.some(o => {
            if (!o.overrideType || !o.isAvailable) return false;
            const oStart = parseTimeToMinutes(o.startTime);
            const oEnd = parseTimeToMinutes(o.endTime);
            return oStart < slotEnd && oEnd > slotStart;
          }));

      const status =
        hasAppointment ? ("occupied" as const)
        : hasOff ? ("off" as const)
        : hasWork ? ("work" as const)
        : ("none" as const);

      return {
        ...slot,
        status,
      };
    });

    const appointmentCount = dayAppointments.length;
    const hasDayOffOnly = appointmentCount === 0 && slotStatuses.some(s => s.status === "off");
    const morningSlots = slotStatuses.filter(s => s.session === "morning");
    const afternoonSlots = slotStatuses.filter(s => s.session === "afternoon");

    const isToday = getLocalDateKey(date) === getLocalDateKey(new Date());

    const dayClasses = [
      styles.calendarDay,
      selectedDate && getLocalDateKey(selectedDate) === dateKey ? styles.selected : "",
      dayOverrides.length > 0 ? styles.hasOverride : "",
      hasDayOffOnly ? styles.dayOff : "",
      appointmentCount > 0 ? styles.hasAppointment : "",
      isToday ? styles.today : "",
      options?.isOutsideMonth ? styles.outsideMonth : ""
    ].filter(Boolean).join(" ");

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
        
        <div className={styles.daySessionMatrix}>
          <div className={styles.daySessionRow}>
            <span className={styles.daySessionLabel}>Sáng</span>
            <div className={styles.daySessionSlots}>
              {morningSlots.map(slot => (
                <span
                  key={slot.id}
                  className={`${styles.daySlotSymbol} ${
                    slot.status === "occupied"
                      ? styles.daySlotOccupied
                      : slot.status === "work"
                        ? styles.daySlotWork
                        : slot.status === "off"
                          ? styles.daySlotOff
                          : styles.daySlotNone
                  }`}
                  title={`${slot.label}: ${slot.startTime}-${slot.endTime}`}
                >
                  {slot.status === "occupied"
                    ? "O"
                    : slot.status === "work"
                      ? "V"
                      : slot.status === "off"
                        ? "X"
                        : "-"}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.daySessionRow}>
            <span className={styles.daySessionLabel}>Chiều</span>
            <div className={styles.daySessionSlots}>
              {afternoonSlots.map(slot => (
                <span
                  key={slot.id}
                  className={`${styles.daySlotSymbol} ${
                    slot.status === "occupied"
                      ? styles.daySlotOccupied
                      : slot.status === "work"
                        ? styles.daySlotWork
                        : slot.status === "off"
                          ? styles.daySlotOff
                          : styles.daySlotNone
                  }`}
                  title={`${slot.label}: ${slot.startTime}-${slot.endTime}`}
                >
                  {slot.status === "occupied"
                    ? "O"
                    : slot.status === "work"
                      ? "V"
                      : slot.status === "off"
                        ? "X"
                        : "-"}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  };
  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === "week") {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      } else {
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      }
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
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'week' ? styles.activeToggle : ''}`}
              onClick={() => setViewMode('week')}
            >
              Xem theo tuần
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'month' ? styles.activeToggle : ''}`}
              onClick={() => setViewMode('month')}
            >
              Xem theo tháng
            </button>
          </div>
          <div className={styles.monthNav}>
            <button 
              onClick={() => navigate('prev')} 
              className={styles.navButton}
              aria-label="Tháng trước"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className={styles.calendarTitle}>{headerLabel}</h2>
            <button 
              onClick={() => navigate('next')} 
              className={styles.navButton}
              aria-label="Tháng sau"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
        {isLoading && <p className={styles.loadingText}>Đang tải...</p>}

        {viewMode === 'week' ? (
          <div className={styles.calendarGrid}>
            <div className={styles.dayHeaders}>
              {dayNames.map((day, idx) => (
                <div key={idx} className={styles.dayHeader}>{day}</div>
              ))}
            </div>
            <div className={styles.calendarDays}>
              {weekDays.map((date, i) => {
                if (!date) {
                  return <div key={`empty-${i}`} className={`${styles.calendarDay} ${styles.emptyDay}`}></div>;
                }
                return renderDayCard(date);
              })}
            </div>
          </div>
        ) : (
          <div className={styles.monthGrid}>
            <div className={styles.dayHeaders}>
              {dayNames.map((day, idx) => (
                <div key={idx} className={styles.dayHeader}>{day}</div>
              ))}
            </div>
            <div className={styles.monthDays}>
              {monthDays.map(({ date, inCurrentMonth }) =>
                renderDayCard(date, { isOutsideMonth: !inCurrentMonth })
              )}
            </div>
          </div>
        )}

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
                setInitialOverrideStart(null);
                setInitialOverrideEnd(null);
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
          appointments={viewData.appointments}
          onClose={() => setIsModalOpen(false)}
          onRefresh={refreshAllData}
        />
      )}
      {isOverrideModalOpen && (
        <FlexibleScheduleManager
          schedules={viewData.schedules}
          overrides={viewData.overrides}
          initialDate={initialOverrideDate}
          initialStartTime={initialOverrideStart}
          initialEndTime={initialOverrideEnd}
          onClose={() => { setIsOverrideModalOpen(false); setInitialOverrideDate(null); }}
          onRefresh={refreshAllData}
        />
      )}

      <DayDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        formattedDate={getFormattedSelectedDate()}
        dateKey={selectedDate ? getLocalDateKey(selectedDate) : ''}
        schedules={
          selectedDate
            ? schedulesByDay.get(convertDayOfWeek(selectedDate.getDay())) || []
            : []
        }
        overrides={selectedDate ? overridesByDate.get(getLocalDateKey(selectedDate)) || [] : []}
        onRefresh={refreshAllData}
        onAddFlexibleSchedule={handleAddFlexibleSchedule}
        appointments={selectedDate ? appointmentsByDate.get(getLocalDateKey(selectedDate)) || [] : []}
      />
    </div>
  );
};

export default ScheduleManagement;
