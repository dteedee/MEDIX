import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Swal from 'sweetalert2';
import { ScheduleOverride, CreateScheduleOverridePayload, DoctorSchedule } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import { X, Plus, Edit, Trash2 } from 'lucide-react';
import '../../styles/doctor/FlexibleScheduleManager.css';

interface Props {
  schedules: DoctorSchedule[];
  overrides: ScheduleOverride[];
  onClose: () => void;
  initialDate?: string | null;
  onRefresh: () => void;
}

type FormInputs = Omit<CreateScheduleOverridePayload, 'overrideType'> & {
  // Thêm trường này vào form để dễ quản lý, không có trong payload gửi đi
  timeSlot: string;
  overrideType: number; // Trong form, overrideType là number (1 hoặc 0)
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
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingOverride, setEditingOverride] = useState<ScheduleOverride | null>(null);

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm<FormInputs>();

  useEffect(() => {
    // Khi modal được mở với một ngày cụ thể (từ việc click vào ngày trên lịch)
    // thì sẽ mở thẳng form thêm mới cho ngày đó.
    if (initialDate) {
      setEditingOverride(null);
      reset({
        overrideDate: initialDate,
        startTime: timeSlots[0].startTime,
        endTime: timeSlots[0].endTime,
        overrideType: 1,
        reason: '' // Để trống cho người dùng nhập
      });
      setIsFormVisible(true); // Hiển thị form
    }
  }, [initialDate, reset]);

  const handleAddNew = () => {
    setEditingOverride(null);
    reset({
      overrideDate: new Date().toISOString().split('T')[0], // Mặc định là ngày hôm nay
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
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await scheduleService.deleteScheduleOverride(overrideId);
        Swal.fire('Đã xóa!', 'Lịch linh hoạt đã được xóa.', 'success');
        onRefresh();
      } catch (err: any) {
        console.error('Failed to delete override:', err);
        let errorMessage = 'Không thể xóa lịch. Vui lòng thử lại.'; // Fallback

        if (err.response && err.response.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (typeof err.response.data === 'object') {
            // Xử lý lỗi từ ProblemDetails của ASP.NET Core
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
      // Chuyển đổi giá trị từ form (string) sang number
      const overrideTypeNumber = Number(data.overrideType);

      const payload: CreateScheduleOverridePayload = {
        overrideDate: data.overrideDate,
        reason: data.reason,
        overrideType: overrideTypeNumber === 1,
        isAvailable: true, // Lịch mới tạo/cập nhật luôn được coi là tồn tại
        // Đảm bảo thời gian luôn có định dạng HH:mm:ss
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
      console.error('Failed to save override:', err);
      let errorMessage = 'Không thể lưu lịch. Vui lòng kiểm tra lại thông tin.'; // Fallback

      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (typeof err.response.data === 'object') {
          // Xử lý lỗi từ ProblemDetails của ASP.NET Core
          errorMessage = err.response.data.details || err.response.data.detail || err.response.data.title || JSON.stringify(err.response.data);
          if (errorMessage.includes('Không thể cập nhật lịch ghi đè này vì đã có cuộc hẹn được đặt'))
          {
            errorMessage = "Đã có cuộc hẹn trong khoảng thời gian này, không thể cập nhật!";
          }
          if (errorMessage.includes('Bạn đã có ghi đè trong khung giờ'))
          {
            errorMessage = "Khung giờ này đã tồn tại một lịch linh hoạt khác. Vui lòng chọn thời gian khác.";
          }
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
                  .sort((a, b) => {
                    const dateComparison = new Date(b.overrideDate).getTime() - new Date(a.overrideDate).getTime();
                    if (dateComparison !== 0) {
                      return dateComparison;
                    }
                    return b.startTime.localeCompare(a.startTime);
                  })
                  .map(override => (
                    <div key={override.id} className="override-list-item">
                      <div className="override-info">
                        <span className="override-date">{new Date(override.overrideDate).toLocaleDateString('vi-VN')}</span>
                        <span className="override-time">{override.startTime.substring(0, 5)} - {override.endTime.substring(0, 5)}</span> 
                        <span className={`override-status ${override.overrideType ? 'available' : 'unavailable'}`}>
                          {override.isAvailable
                            ? `Tăng ca${override.reason ? ` - ${override.reason}` : ''}`
                            : `Nghỉ${override.reason ? ` - ${override.reason}` : ''}`}
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
                <input type="date" {...register('overrideDate', { required: 'Ngày là bắt buộc' })} min={new Date().toISOString().split('T')[0]}/>
                {errors.overrideDate && <p className="error-text">{errors.overrideDate.message}</p>}
              </div>
              <div className="form-group">
                <label>Loại</label>
                <select {...register('overrideType', { required: 'Vui lòng chọn loại' })}>
                  <option value="1">Tăng ca</option>
                  <option value="0">Nghỉ</option>
                </select>
                {errors.overrideType && <p className="error-text">{errors.overrideType.message}</p>}
              </div>
              <div className="form-group form-group-span-2">
                <label>Ca làm việc</label>
                <select
                  {...register('timeSlot', { required: 'Vui lòng chọn ca làm việc' })}
                  onChange={handleTimeSlotChange}
                >
                  {timeSlots.map(slot => <option key={slot.startTime} value={slot.startTime}>{slot.label}</option>)}
                </select>
                {errors.timeSlot && <p className="error-text">{errors.timeSlot.message}</p>}
              </div>
              <div className="form-group form-group-span-2">
                <label>Lý do</label>
                <input type="text" {...register('reason')} placeholder="VD: Tăng ca, Nghỉ phép,..." />
                {errors.reason && <p className="error-text">{errors.reason.message as string}</p>}
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