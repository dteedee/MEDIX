import React, { useState, FormEvent, useMemo } from 'react';
import { DoctorSchedule, CreateSchedulePayload } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { X, Clock, CheckCircle, XCircle, Edit, Trash2, Plus } from 'lucide-react';
import styles from '../../styles/doctor/FixedScheduleManager.module.css';

interface FixedScheduleManagerProps {
  schedules: DoctorSchedule[];
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

const getDayLabel = (dayValue: number) => daysOfWeek.find(d => d.value === dayValue)?.label || 'Không xác định';

const FixedScheduleManager: React.FC<FixedScheduleManagerProps> = ({ schedules, onClose, onRefresh }) => {
  const { isBanned } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [formState, setFormState] = useState<CreateSchedulePayload>({
    dayOfWeek: 1,
    startTime: timeSlots[0].startTime,
    endTime: timeSlots[0].endTime,
    isAvailable: true,
  });

  const schedulesForSelectedDay = useMemo(() => {
    return schedules
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => {
        const [hA, mA] = a.startTime.split(':').map(Number);
        const [hB, mB] = b.startTime.split(':').map(Number);
        return hA - hB || mA - mB;
      });
  }, [schedules, selectedDay]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'dayOfWeek' ? Number(value) : value,
    }));
  };

  const handleTimeSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSlot = timeSlots.find(slot => slot.startTime === e.target.value);
    if (selectedSlot) {
      setFormState(prev => ({
        ...prev,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      }));
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    if (formState.startTime >= formState.endTime) {
      Swal.fire('Lỗi!', 'Giờ bắt đầu phải trước giờ kết thúc.', 'error');
      return;
    }

    const schedulesForDay = schedules.filter(s => s.dayOfWeek === formState.dayOfWeek && s.id !== editingScheduleId);

    const isOverlap = schedulesForDay.some(existingSchedule =>
      formState.startTime < existingSchedule.endTime && formState.endTime > existingSchedule.startTime
    );

    if (isOverlap) {
      Swal.fire(
        'Lỗi!',
        `Lịch làm việc bị trùng lặp với một ca khác trong cùng ngày ${getDayLabel(formState.dayOfWeek)}.`,
        'error'
      );
      return;
    }

    const payload: CreateSchedulePayload = {
      ...formState,
      startTime: `${formState.startTime}:00`,
      endTime: `${formState.endTime}:00`,
    };

    try {
      if (editingScheduleId) {
        await scheduleService.updateSchedule(editingScheduleId, payload);
        Swal.fire('Thành công!', 'Đã cập nhật lịch làm việc.', 'success');
      } else {
        await scheduleService.createSchedule(payload);
        Swal.fire('Thành công!', 'Đã thêm lịch làm việc mới.', 'success');
      }
      onRefresh();
      setEditingScheduleId(null);
      setIsAdding(false);
    } catch (err: any) {
      let errorMessage = 'Lưu lịch làm việc thất bại.'; 
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

      Swal.fire({
        title: 'Thất bại!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Đã hiểu'
      });
    }
  };

  const handleDelete = async (scheduleId: string) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn sẽ không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await scheduleService.deleteSchedule(scheduleId);
        Swal.fire('Đã xóa!', 'Lịch làm việc đã được xóa.', 'success');
        onRefresh();
      } catch (err: any) {
        let errorMessage = 'Xóa lịch làm việc thất bại.'; 
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

        Swal.fire({
          title: 'Thất bại!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Đã hiểu'
        });
      }
    }
  };

  const startEditing = (schedule: DoctorSchedule) => {
    setEditingScheduleId(schedule.id);
    setFormState({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.substring(0, 5),
      endTime: schedule.endTime.substring(0, 5),
      isAvailable: schedule.isAvailable,
    });
  };

  const renderForm = () => (
    <form onSubmit={handleSave} className={styles.scheduleForm}>
      <h4 className={styles.formTitle}>{editingScheduleId ? 'Chỉnh sửa lịch' : 'Thêm lịch mới'}</h4>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <div className={styles.dayDisplay}>
            Ngày: <span className={styles.dayName}>{getDayLabel(formState.dayOfWeek)}</span>
          </div>
        </div>
        <div className={styles.formGroup}>
          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="isAvailable" 
              name="isAvailable" 
              checked={formState.isAvailable} 
              onChange={handleInputChange}
            />
            <label htmlFor="isAvailable">Sẵn sàng</label>
          </div>
        </div>
        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label className={styles.formLabel}>Ca làm việc</label>
          <select 
            name="timeSlot" 
            value={formState.startTime} 
            onChange={handleTimeSlotChange} 
            className={styles.formSelect}
          >
            {timeSlots.map(slot => <option key={slot.startTime} value={slot.startTime}>{slot.label}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.saveButton}>Lưu</button>
        <button 
          type="button" 
          onClick={() => { setIsAdding(false); setEditingScheduleId(null); }} 
          className={styles.cancelButton}
        >
          Hủy
        </button>
      </div>
    </form>
  );

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
              onClick={() => { setSelectedDay(day.value); setIsAdding(false); setEditingScheduleId(null); }}
              className={`${styles.dayTab} ${selectedDay === day.value ? styles.active : ''}`}
            >
              {day.label}
            </button>
          ))}
        </div>

        <div className={styles.schedulesList}>
          {schedulesForSelectedDay.length > 0 ? (
            <>
              {schedulesForSelectedDay.map(schedule => (
                editingScheduleId === schedule.id ? (
                  <div key={schedule.id}>{renderForm()}</div>
                ) : (
                  <div key={schedule.id} className={styles.scheduleItem}>
                    <div className={styles.scheduleInfo}>
                      <p className={styles.scheduleTime}>
                        <Clock size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                        {schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}
                      </p>
                      <span className={`${styles.scheduleStatus} ${schedule.isAvailable ? styles.available : styles.unavailable}`}>
                        {schedule.isAvailable ? (
                          <>
                            <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            Sẵn sàng
                          </>
                        ) : (
                          <>
                            <XCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            Không sẵn sàng
                          </>
                        )}
                      </span>
                    </div>
                    <div className={styles.scheduleActions}>
                      <button 
                        onClick={() => startEditing(schedule)} 
                        className={`${styles.actionButton} ${styles.editButton}`} 
                        disabled={isBanned}
                      >
                        <Edit size={16} />
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(schedule.id)} 
                        className={`${styles.actionButton} ${styles.deleteButton}`} 
                        disabled={isBanned}
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  </div>
                )
              ))}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>Chưa có lịch làm việc cho ngày này.</p>
            </div>
          )}

          {isAdding && !editingScheduleId && renderForm()}
          {!isAdding && !editingScheduleId && (
            <button 
              onClick={() => {
                setIsAdding(true);
                setFormState({ dayOfWeek: selectedDay, startTime: timeSlots[0].startTime, endTime: timeSlots[0].endTime, isAvailable: true });
              }} 
              className={styles.addButton}
              disabled={isBanned}
            >
              <Plus size={18} />
              Thêm ca làm việc cho {getDayLabel(selectedDay)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedScheduleManager;
