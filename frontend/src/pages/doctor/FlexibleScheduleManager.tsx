import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Swal from 'sweetalert2';
import { ScheduleOverride, CreateScheduleOverridePayload, DoctorSchedule } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import { X, Plus, Edit, Trash2, Clock, Calendar, AlertCircle } from 'lucide-react';
import styles from '../../styles/doctor/FlexibleScheduleManager.module.css';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  schedules: DoctorSchedule[];
  overrides: ScheduleOverride[];
  onClose: () => void;
  initialDate?: string | null;
  onRefresh: () => void;
}

type FormInputs = Omit<CreateScheduleOverridePayload, 'overrideType'> & {
  timeSlot: string;
  overrideType: number;
};

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

const FlexibleScheduleManager: React.FC<Props> = ({ schedules, overrides, onClose, onRefresh, initialDate }) => {
  const { isBanned } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingOverride, setEditingOverride] = useState<ScheduleOverride | null>(null);

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors }, watch } = useForm<FormInputs>();

  const overrideType = watch('overrideType');

  useEffect(() => {
    if (initialDate) {
      setEditingOverride(null);
      reset({
        overrideDate: initialDate,
        startTime: timeSlots[0].startTime,
        endTime: timeSlots[0].endTime,
        overrideType: 1,
        reason: ''
      });
      setIsFormVisible(true);
    }
  }, [initialDate, reset]);

  const handleAddNew = () => {
    setEditingOverride(null);
    reset({
      overrideDate: new Date().toISOString().split('T')[0],
      startTime: timeSlots[0].startTime,
      endTime: timeSlots[0].endTime,
      overrideType: 1,
      reason: ''
    });
    setIsFormVisible(true);
  };

  const handleEdit = (override: ScheduleOverride) => {
    setEditingOverride(override);
    setValue('overrideDate', override.overrideDate);
    setValue('startTime', override.startTime.substring(0, 5));
    setValue('endTime', override.endTime.substring(0, 5));
    setValue('overrideType', override.overrideType ? 1 : 0);
    setValue('reason', override.reason);
    setIsFormVisible(true);
  };

  const handleDelete = async (overrideId: string) => {
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
        await scheduleService.deleteScheduleOverride(overrideId);
        Swal.fire('Đã xóa!', 'Lịch linh hoạt đã được xóa.', 'success');
        onRefresh();
      } catch (err: any) {
        let errorMessage = 'Không thể xóa lịch. Vui lòng thử lại.'; 

        if (err.response && err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (typeof err.response.data === 'object') {
            errorMessage = err.response.data.detail || err.response.data.title || JSON.stringify(err.response.data);
          }
        }

        Swal.fire({
          title: 'Lỗi!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Đã hiểu'
        });
      }
    }
  };

  const processFormSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      const overrideTypeNumber = Number(data.overrideType);

      if (overrideTypeNumber === 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(data.overrideDate);
        selectedDate.setHours(0, 0, 0, 0);

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
            html: `Bạn chỉ có thể đăng ký nghỉ từ ngày <b>${minDateStr}</b> trở đi (tối thiểu 2 ngày sau hôm nay).`,
            icon: 'error',
            confirmButtonText: 'Đã hiểu'
          });
          return;
        }
      }

      if (overrideTypeNumber === 0 && !editingOverride) {
        const today = new Date().toISOString().split('T')[0];

        const existingNghiDays = new Set(
          overrides
            .filter(o => !o.overrideType && o.overrideDate >= today)
            .map(o => o.overrideDate)
        );

        if (!existingNghiDays.has(data.overrideDate) && existingNghiDays.size >= 2) {
          Swal.fire('Lỗi!', 'Bạn chỉ được phép đăng ký lịch nghỉ tối đa trong 2 ngày khác nhau.', 'error');
          return;
        }
      }

      const payload: CreateScheduleOverridePayload = {
        overrideDate: data.overrideDate,
        reason: data.reason,
        overrideType: overrideTypeNumber === 1,
        isAvailable: true,
        startTime: data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime,
        endTime: data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime,
      };

      if (editingOverride) {
        await scheduleService.updateScheduleOverride(editingOverride.id, payload);
        Swal.fire('Thành công!', 'Lịch linh hoạt đã được cập nhật.', 'success');
      } else {
        await scheduleService.createScheduleOverride(payload);
        Swal.fire('Thành công!', 'Lịch linh hoạt đã được thêm mới.', 'success');
      }
      onRefresh();
      setIsFormVisible(false);
      setEditingOverride(null);
    } catch (err: any) {
      let errorMessage = 'Không thể lưu lịch. Vui lòng kiểm tra lại thông tin.';

      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (typeof err.response.data === 'object' && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === 'object') {
          errorMessage = JSON.stringify(err.response.data);
        }

        switch (true) {
          case errorMessage.includes('Không thể cập nhật lịch ghi đè này vì đã có cuộc hẹn được đặt'):
            errorMessage = "Đã có cuộc hẹn trong khoảng thời gian này, không thể cập nhật!";
            break;
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

  const handleTimeSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSlot = timeSlots.find(slot => slot.startTime === e.target.value);
    if (selectedSlot) {
      setValue('startTime', selectedSlot.startTime);
      setValue('endTime', selectedSlot.endTime);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Quản lý lịch linh hoạt</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {!isFormVisible ? (
          <>
            <div className={styles.modalToolbar}>
              <button onClick={handleAddNew} className={styles.addNewBtn}>
                <Plus size={18} />
                Thêm mới
              </button>
            </div>
            <div className={styles.overrideListContainer}>
              {overrides.filter(o => o.isAvailable).length > 0 ? (
                overrides
                  .filter(o => o.isAvailable)
                  .sort((a, b) => {
                    const dateComparison = new Date(b.overrideDate).getTime() - new Date(a.overrideDate).getTime();
                    if (dateComparison !== 0) {
                      return dateComparison;
                    }
                    return b.startTime.localeCompare(a.startTime);
                  })
                  .map(override => (
                    <div key={override.id} className={`${styles.overrideListItem} ${override.overrideType ? styles.available : styles.unavailable}`}>
                      <div className={styles.overrideInfo}>
                        <div className={styles.overrideDate}>
                          <Calendar size={16} />
                          <span>{new Date(override.overrideDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className={styles.overrideTime}>
                          <Clock size={16} />
                          <span>{override.startTime.substring(0, 5)} - {override.endTime.substring(0, 5)}</span>
                        </div>
                        <span className={`${styles.overrideStatus} ${override.overrideType ? styles.statusAvailable : styles.statusUnavailable}`}>
                          {override.overrideType
                            ? `Tăng ca${override.reason ? ` - ${override.reason}` : ''}`
                            : `Nghỉ${override.reason ? ` - ${override.reason}` : ''}`}
                        </span>
                      </div>
                      <div className={styles.overrideActions}>
                        <button onClick={() => handleEdit(override)} className={`${styles.actionBtn} ${styles.editBtn}`} disabled={isBanned}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(override.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} disabled={isBanned}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className={styles.noOverrides}>
                  <Calendar size={48} />
                  <p>Chưa có lịch linh hoạt nào.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(processFormSubmit)} className={styles.overrideForm}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Calendar size={16} />
                  Ngày
                </label>
                <input 
                  type="date" 
                  {...register('overrideDate', { 
                    required: 'Ngày là bắt buộc',
                    validate: (value) => {
                      const overrideType = getValues('overrideType');
                      if (Number(overrideType) === 0) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const selectedDate = new Date(value);
                        selectedDate.setHours(0, 0, 0, 0);
                        const minDate = new Date(today);
                        minDate.setDate(today.getDate() + 2);
                        if (selectedDate < minDate) {
                          return 'Ngày nghỉ phải cách hôm nay ít nhất 2 ngày';
                        }
                      }
                      return true;
                    }
                  })} 
                  min={(() => {
                    const overrideType = getValues('overrideType');
                    if (Number(overrideType) === 0) {
                      const minDate = new Date();
                      minDate.setDate(minDate.getDate() + 2);
                      return minDate.toISOString().split('T')[0];
                    }
                    return new Date().toISOString().split('T')[0];
                  })()}
                  onChange={(e) => {
                    register('overrideDate').onChange(e);
                    const overrideType = getValues('overrideType');
                    if (Number(overrideType) === 0) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDate = new Date(e.target.value);
                      selectedDate.setHours(0, 0, 0, 0);
                      const minDate = new Date(today);
                      minDate.setDate(today.getDate() + 2);
                      if (selectedDate < minDate) {
                        Swal.fire({
                          title: 'Lỗi!',
                          html: `Ngày nghỉ phải cách hôm nay ít nhất 2 ngày. Ngày sớm nhất có thể chọn là <b>${minDate.toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</b>.`,
                          icon: 'warning',
                          confirmButtonText: 'Đã hiểu'
                        });
                        e.target.value = minDate.toISOString().split('T')[0];
                        setValue('overrideDate', minDate.toISOString().split('T')[0]);
                      }
                    }
                  }}
                  className={styles.formInput}
                />
                {errors.overrideDate && <p className={styles.errorText}>{errors.overrideDate.message}</p>}
                {Number(overrideType) === 0 && (
                  <p className={styles.formHint}>
                    <AlertCircle size={14} />
                    Ngày nghỉ phải cách hôm nay ít nhất 2 ngày
                  </p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Loại</label>
                <select 
                  {...register('overrideType', { required: 'Vui lòng chọn loại' })}
                  onChange={(e) => {
                    register('overrideType').onChange(e);
                    const overrideType = Number(e.target.value);
                    const dateInput = document.querySelector('input[name="overrideDate"]') as HTMLInputElement;
                    if (dateInput) {
                      if (overrideType === 0) {
                        const minDate = new Date();
                        minDate.setDate(minDate.getDate() + 2);
                        dateInput.min = minDate.toISOString().split('T')[0];
                        const currentDate = new Date(dateInput.value || minDate.toISOString().split('T')[0]);
                        if (currentDate < minDate) {
                          dateInput.value = minDate.toISOString().split('T')[0];
                          setValue('overrideDate', minDate.toISOString().split('T')[0]);
                        }
                      } else {
                        const today = new Date();
                        dateInput.min = today.toISOString().split('T')[0];
                      }
                    }
                  }}
                  className={styles.formSelect}
                >
                  <option value="1">Tăng ca</option>
                  <option value="0">Nghỉ</option>
                </select>
                {errors.overrideType && <p className={styles.errorText}>{errors.overrideType.message}</p>}
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>
                  <Clock size={16} />
                  Ca làm việc
                </label>
                <select
                  {...register('timeSlot', { required: 'Vui lòng chọn ca làm việc' })}
                  onChange={handleTimeSlotChange}
                  className={styles.formSelect}
                >
                  {timeSlots.map(slot => <option key={slot.startTime} value={slot.startTime}>{slot.label}</option>)}
                </select>
                {errors.timeSlot && <p className={styles.errorText}>{errors.timeSlot.message}</p>}
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Lý do</label>
                <input 
                  type="text" 
                  {...register('reason')} 
                  placeholder="VD: Tăng ca, Nghỉ phép,..." 
                  className={styles.formInput}
                />
                {errors.reason && <p className={styles.errorText}>{errors.reason.message as string}</p>}
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setIsFormVisible(false)} className={styles.cancelBtn}>
                Hủy
              </button>
              <button type="submit" className={styles.saveBtn} disabled={isBanned}>
                {editingOverride ? 'Cập nhật' : 'Lưu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FlexibleScheduleManager;
