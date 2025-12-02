import React, { useState, useMemo } from 'react';
import { DoctorSchedule, CreateSchedulePayload } from '../../types/schedule';
import { Appointment } from '../../types/appointment.types';
import { scheduleService } from '../../services/scheduleService';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { X, Clock, CheckCircle, XCircle, Edit, Trash2, Plus } from 'lucide-react';
import styles from '../../styles/doctor/FixedScheduleManager.module.css';

interface FixedScheduleManagerProps {
  schedules: DoctorSchedule[];
  appointments: Appointment[];
  onClose: () => void;
  onRefresh: () => void;
}

const daysOfWeek = [
  { value: 1, label: 'Thứ Hai' }, { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' }, { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' }, { value: 6, label: 'Thứ Bảy' },
  { value: 7, label: 'Chủ Nhật' },
];

const timeSlots = [
  { label: 'Ca 1 (07:00 - 07:50)', startTime: '07:00', endTime: '07:50' },
  { label: 'Ca 2 (08:00 - 08:50)', startTime: '08:00', endTime: '08:50' },
  { label: 'Ca 3 (09:00 - 09:50)', startTime: '09:00', endTime: '09:50' },
  { label: 'Ca 4 (10:00 - 10:50)', startTime: '10:00', endTime: '10:50' },
  { label: 'Ca 5 (13:00 - 13:50)', startTime: '13:00', endTime: '13:50' },
  { label: 'Ca 6 (14:00 - 14:50)', startTime: '14:00', endTime: '14:50' },
  { label: 'Ca 7 (15:00 - 15:50)', startTime: '15:00', endTime: '15:50' },
  { label: 'Ca 8 (16:00 - 16:50)', startTime: '16:00', endTime: '16:50' },
];

const parseTimeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getDayOfWeekFromDate = (date: Date): number => {
  const js = date.getDay(); // 0-6, Sunday = 0
  return js === 0 ? 7 : js;
};

const getDayLabel = (dayValue: number) => daysOfWeek.find(d => d.value === dayValue)?.label || 'Không xác định';

const FixedScheduleManager: React.FC<FixedScheduleManagerProps> = ({ schedules, appointments, onClose, onRefresh }) => {
  const { isBanned } = useAuth();
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const schedulesForSelectedDay = useMemo(() => {
    return schedules
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => {
        const [hA, mA] = a.startTime.split(':').map(Number);
        const [hB, mB] = b.startTime.split(':').map(Number);
        return hA - hB || mA - mB;
      });
  }, [schedules, selectedDay]);

  const slotStatuses = useMemo(() => {
    return timeSlots.map(slot => {
      const existing = schedulesForSelectedDay.find(s =>
        s.startTime.substring(0, 5) === slot.startTime &&
        s.endTime.substring(0, 5) === slot.endTime
      );

      const slotStartMin = parseTimeToMinutes(slot.startTime);
      const slotEndMin = parseTimeToMinutes(slot.endTime);

      const hasAppointment = appointments.some(app => {
        const startDate = new Date(app.appointmentStartTime);
        if (getDayOfWeekFromDate(startDate) !== selectedDay) return false;

        const startTimeStr = app.appointmentStartTime.substring(11, 16);
        const endTimeStr = app.appointmentEndTime.substring(11, 16);
        const appStartMin = parseTimeToMinutes(startTimeStr);
        const appEndMin = parseTimeToMinutes(endTimeStr);

        return appStartMin < slotEndMin && appEndMin > slotStartMin;
      });

      let status: 'none' | 'work' | 'off' | 'occupied' = 'none';
      if (existing) {
        if (hasAppointment) {
          // Ưu tiên hiển thị O (có hẹn) ngay cả khi lịch cố định đang ở trạng thái nghỉ
          status = 'occupied';
        } else if (!existing.isAvailable) {
          status = 'off';
        } else {
          status = 'work';
        }
      } else if (hasAppointment) {
        // Phòng trường hợp có cuộc hẹn nhưng thiếu lịch cố định (không mong muốn nhưng xử lý an toàn)
        status = 'occupied';
      }

      const session: 'morning' | 'afternoon' = Number(slot.startTime.split(':')[0]) < 12 ? 'morning' : 'afternoon';

      return {
        ...slot,
        status,
        session,
        schedule: existing,
      };
    });
  }, [schedulesForSelectedDay, appointments, selectedDay]);

  const handleSlotClick = (slotStartTime: string) => {
    if (isBanned) {
      Swal.fire('Tài khoản bị khóa', 'Bạn không thể chỉnh sửa lịch làm việc vào lúc này.', 'warning');
      return;
    }

    const existing = schedulesForSelectedDay.find(s => s.startTime.substring(0, 5) === slotStartTime);
    const slot = timeSlots.find(t => t.startTime === slotStartTime);
    if (!slot) return;

    // Nếu ca này đang có cuộc hẹn thì không cho phép thay đổi lịch cố định
    const slotStartMin = parseTimeToMinutes(slot.startTime);
    const slotEndMin = parseTimeToMinutes(slot.endTime);
    const hasAppointment = appointments.some(app => {
      const startDate = new Date(app.appointmentStartTime);
      if (getDayOfWeekFromDate(startDate) !== selectedDay) return false;

      const startTimeStr = app.appointmentStartTime.substring(11, 16);
      const endTimeStr = app.appointmentEndTime.substring(11, 16);
      const appStartMin = parseTimeToMinutes(startTimeStr);
      const appEndMin = parseTimeToMinutes(endTimeStr);

      return appStartMin < slotEndMin && appEndMin > slotStartMin;
    });

    if (hasAppointment) {
      showToast('Ca này đang có cuộc hẹn, không thể thay đổi lịch cố định.', 'warning');
      return;
    }

    // Vòng đời: - (none) -> V (work) -> X (off) -> - (xóa)
    const nextState: 'none' | 'work' | 'off' = existing
      ? existing.isAvailable
        ? 'off'
        : 'none'
      : 'work';

    const basePayload: CreateSchedulePayload = {
      dayOfWeek: selectedDay,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: nextState === 'work',
    };

    const perform = async () => {
      try {
        if (!existing && nextState === 'work') {
          await scheduleService.createSchedule(basePayload);
        } else if (existing && nextState === 'none') {
          await scheduleService.deleteSchedule(existing.id);
        } else if (existing && nextState === 'off') {
          await scheduleService.updateSchedule(existing.id, {
            ...basePayload,
            dayOfWeek: existing.dayOfWeek,
          });
        }
        await onRefresh();

        const actionText =
          nextState === 'work'
            ? 'được đánh dấu là làm việc (V).'
            : nextState === 'off'
              ? 'được đánh dấu là không làm (X).'
              : 'đã được xóa khỏi lịch cố định.';

        showToast(
          `Cập nhật lịch cố định - ${getDayLabel(selectedDay)}: Ca ${slot.label} ${actionText}`,
          'success'
        );
      } catch (err: any) {
        let errorMessage = 'Cập nhật lịch làm việc thất bại.';
        if (err.response && err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (typeof err.response.data === 'object') {
            errorMessage =
              err.response.data.detail ||
              err.response.data.message ||
              JSON.stringify(err.response.data);
          }
        }
        Swal.fire('Thất bại!', errorMessage, 'error');
      }
    };

    perform();
  };

  const handleFillAllSlots = async () => {
    if (isBanned) {
      Swal.fire('Tài khoản bị khóa', 'Bạn không thể chỉnh sửa lịch làm việc vào lúc này.', 'warning');
      return;
    }

    const ops: Promise<any>[] = [];

    timeSlots.forEach(slot => {
      const existing = schedulesForSelectedDay.find(s =>
        s.startTime.substring(0, 5) === slot.startTime &&
        s.endTime.substring(0, 5) === slot.endTime
      );

      const slotStartMin = parseTimeToMinutes(slot.startTime);
      const slotEndMin = parseTimeToMinutes(slot.endTime);
      const hasAppointment = appointments.some(app => {
        const startDate = new Date(app.appointmentStartTime);
        if (getDayOfWeekFromDate(startDate) !== selectedDay) return false;

        const startTimeStr = app.appointmentStartTime.substring(11, 16);
        const endTimeStr = app.appointmentEndTime.substring(11, 16);
        const appStartMin = parseTimeToMinutes(startTimeStr);
        const appEndMin = parseTimeToMinutes(endTimeStr);

        return appStartMin < slotEndMin && appEndMin > slotStartMin;
      });

      // Không đè lên các ca đã có cuộc hẹn
      if (hasAppointment) {
        return;
      }

      const payload: CreateSchedulePayload = {
        dayOfWeek: selectedDay,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true,
      };

      if (!existing) {
        ops.push(scheduleService.createSchedule(payload));
      } else if (!existing.isAvailable) {
        ops.push(
          scheduleService.updateSchedule(existing.id, {
            ...payload,
            dayOfWeek: existing.dayOfWeek,
          })
        );
      }
    });

    if (ops.length === 0) {
      showToast(
        `Tất cả 8 ca của ${getDayLabel(selectedDay)} đã ở trạng thái làm việc (V).`,
        'info'
      );
      return;
    }

    try {
      await Promise.all(ops);
      await onRefresh();
      showToast(
        `Đã đăng ký đủ 8 ca làm việc (V) cho ${getDayLabel(selectedDay)}.`,
        'success'
      );
    } catch (err: any) {
      let errorMessage = 'Cập nhật lịch làm việc thất bại.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (typeof err.response.data === 'object') {
          errorMessage =
            err.response.data.detail ||
            err.response.data.message ||
            JSON.stringify(err.response.data);
        }
      }
      Swal.fire('Thất bại!', errorMessage, 'error');
    }
  };

  // Các hàm chỉnh sửa/xóa chi tiết và form phía dưới đã được loại bỏ theo logic mới

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Quản lý lịch làm việc cố định</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        
        <div className={styles.dayTabs}>
          {daysOfWeek.map(day => (
            <button
              key={day.value}
              onClick={() => setSelectedDay(day.value)}
              className={`${styles.dayTab} ${selectedDay === day.value ? styles.active : ''}`}
            >
              {day.label}
            </button>
          ))}
        </div>

        <div className={styles.schedulesList}>
              <div className={styles.fixedMatrixLegend}>
            <span><strong>V</strong>: Làm việc</span>
            <span><strong>X</strong>: Không làm</span>
            <span><strong>O</strong>: Có hẹn</span>
            <span><strong>-</strong>: Chưa đăng ký</span>
            <span className={styles.fixedMatrixHint}>Nhấn vào ca để thêm hoặc chỉnh sửa lịch cố định</span>
          </div>

          <div className={styles.fixedSlotMatrix}>
            <div className={styles.fixedMatrixHeaderRow}>
              <div className={styles.fixedMatrixCorner}></div>
              {timeSlots.slice(0, 4).map(slot => (
                <div key={slot.startTime} className={styles.fixedMatrixHeaderCell}>{slot.label.split(' ')[1]}</div>
              ))}
            </div>
            <div className={styles.fixedMatrixRow}>
              <div className={styles.fixedSessionCell}>Buổi sáng</div>
              {slotStatuses.filter(s => s.session === 'morning').map(slot => (
                <div
                  key={slot.startTime}
                  className={`${styles.fixedSlotCell} ${
                    slot.status === 'occupied'
                      ? styles.fixedSlotCellOccupied
                      : slot.status === 'work'
                        ? styles.fixedSlotCellWork
                        : slot.status === 'off'
                          ? styles.fixedSlotCellOff
                          : styles.fixedSlotCellNone
                  }`}
                  onClick={() => handleSlotClick(slot.startTime)}
                >
                  <span className={styles.fixedSlotSymbol}>
                    {slot.status === 'occupied'
                      ? 'O'
                      : slot.status === 'work'
                        ? 'V'
                        : slot.status === 'off'
                          ? 'X'
                          : '-'}
                  </span>
                  <span className={styles.fixedSlotTimeSmall}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.fixedMatrixHeaderRow}>
              <div className={styles.fixedMatrixCorner}></div>
              {timeSlots.slice(4).map(slot => (
                <div key={slot.startTime} className={styles.fixedMatrixHeaderCell}>{slot.label.split(' ')[1]}</div>
              ))}
            </div>
            <div className={styles.fixedMatrixRow}>
              <div className={styles.fixedSessionCell}>Buổi chiều</div>
              {slotStatuses.filter(s => s.session === 'afternoon').map(slot => (
                <div
                  key={slot.startTime}
                  className={`${styles.fixedSlotCell} ${
                    slot.status === 'occupied'
                      ? styles.fixedSlotCellOccupied
                      : slot.status === 'work'
                        ? styles.fixedSlotCellWork
                        : slot.status === 'off'
                          ? styles.fixedSlotCellOff
                          : styles.fixedSlotCellNone
                  }`}
                  onClick={() => handleSlotClick(slot.startTime)}
                >
                  <span className={styles.fixedSlotSymbol}>
                    {slot.status === 'occupied'
                      ? 'O'
                      : slot.status === 'work'
                        ? 'V'
                        : slot.status === 'off'
                          ? 'X'
                          : '-'}
                  </span>
                  <span className={styles.fixedSlotTimeSmall}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.addButton}
              onClick={handleFillAllSlots}
              disabled={isBanned}
            >
              <Plus size={18} />
              Đăng ký đủ 8 ca làm việc cho {getDayLabel(selectedDay)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedScheduleManager;
