import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Swal from 'sweetalert2';
import { ScheduleOverride, CreateScheduleOverridePayload } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import { X, Plus, Edit, Trash2 } from 'lucide-react';
import '../../styles/FlexibleScheduleManager.css';

interface Props {
  overrides: ScheduleOverride[];
  onClose: () => void;
  onRefresh: () => void;
}

type FormInputs = CreateScheduleOverridePayload;

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

const FlexibleScheduleManager: React.FC<Props> = ({ overrides, onClose, onRefresh }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingOverride, setEditingOverride] = useState<ScheduleOverride | null>(null);

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm<FormInputs>();

  const handleAddNew = () => {
    setEditingOverride(null);
    reset({
      overrideDate: '',
      startTime: '',
      endTime: '',
      isAvailable: true,
      reason: ''
    });
    setIsFormVisible(true);
  };

  const handleEdit = (override: ScheduleOverride) => {
    setEditingOverride(override);
    setValue('overrideDate', override.overrideDate);
    setValue('startTime', override.startTime.substring(0, 5));
    setValue('endTime', override.endTime.substring(0, 5));
    setValue('isAvailable', override.isAvailable);
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
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await scheduleService.deleteScheduleOverride(overrideId);
        Swal.fire('Đã xóa!', 'Lịch linh hoạt đã được xóa.', 'success');
        onRefresh();
      } catch (error) {
        console.error('Failed to delete override:', error);
        Swal.fire('Lỗi!', 'Không thể xóa lịch. Vui lòng thử lại.', 'error');
      }
    }
  };

  const processFormSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      const payload: CreateScheduleOverridePayload = {
        ...data, // isAvailable, overrideDate, reason
        // Đảm bảo thời gian luôn có định dạng HH:mm:ss
        startTime: data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime,
        endTime: data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime,
        isAvailable: data.isAvailable === true || (data.isAvailable as any) === 'true', // Đảm bảo isAvailable là boolean
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
    } catch (error) {
      console.error('Failed to save override:', error);
      Swal.fire('Lỗi!', 'Không thể lưu lịch. Vui lòng kiểm tra lại thông tin.', 'error');
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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Quản lý lịch linh hoạt</h2>
          <button onClick={onClose} className="close-button"><X size={24} /></button>
        </div>

        {!isFormVisible ? (
          <>
            <div className="modal-toolbar">
              <button onClick={handleAddNew} className="add-new-btn">
                <Plus size={16} /> Thêm mới
              </button>
            </div>
            <div className="override-list-container">
              {overrides.length > 0 ? (
                overrides
                  .sort((a, b) => new Date(b.overrideDate).getTime() - new Date(a.overrideDate).getTime())
                  .map(override => (
                    <div key={override.id} className="override-list-item">
                      <div className="override-info">
                        <span className="override-date">{new Date(override.overrideDate).toLocaleDateString('vi-VN')}</span>
                        <span className="override-time">{override.startTime.substring(0, 5)} - {override.endTime.substring(0, 5)}</span>
                        <span className={`override-status ${override.isAvailable ? 'available' : 'unavailable'}`}>
                          {override.isAvailable ? 'Tăng ca' : 'Nghỉ'}
                        </span>
                      </div>
                      <div className="override-actions">
                        <button onClick={() => handleEdit(override)} className="action-btn edit"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(override.id)} className="action-btn delete"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="no-overrides">Chưa có lịch linh hoạt nào.</p>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(processFormSubmit)} className="override-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Ngày</label>
                <input type="date" {...register('overrideDate', { required: 'Ngày là bắt buộc' })} />
                {errors.overrideDate && <p className="error-text">{errors.overrideDate.message}</p>}
              </div>
              <div className="form-group">
                <label>Loại</label>
                <input type="text" {...register('reason', { required: 'Loại/Lý do là bắt buộc' })} placeholder="VD: Tăng ca, Nghỉ ốm..." />
                {errors.reason && <p className="error-text">{errors.reason.message}</p>}
                {/* Giữ trường isAvailable ẩn để form hoạt động đúng, mặc định là true (Tăng ca) */}
                <input type="hidden" {...register('isAvailable')} value="true" />
              </div>
              <div className="form-group form-group-span-2">
                <label>Ca làm việc</label>
                <select
                  {...register('startTime', { required: 'Vui lòng chọn ca làm việc' })}
                  onChange={handleTimeSlotChange}
                >
                  {timeSlots.map(slot => <option key={slot.startTime} value={slot.startTime}>{slot.label}</option>)}
                </select>
                {errors.startTime && <p className="error-text">{errors.startTime.message}</p>}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setIsFormVisible(false)} className="cancel-btn">Hủy</button>
              <button type="submit" className="save-btn">{editingOverride ? 'Cập nhật' : 'Lưu'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FlexibleScheduleManager;