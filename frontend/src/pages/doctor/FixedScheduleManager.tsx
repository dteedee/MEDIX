import React, { useState, FormEvent, useMemo } from 'react';
import { DoctorSchedule, CreateSchedulePayload } from '../../types/schedule';
import { scheduleService } from '../../services/scheduleService';
import Swal from 'sweetalert2';

interface FixedScheduleManagerProps {
  schedules: DoctorSchedule[];
  onClose: () => void;
  onRefresh: () => void;
}

const daysOfWeek = [
  { value: 1, label: 'Thứ Hai' }, { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' }, { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' }, { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật' },
];

const getDayLabel = (dayValue: number) => daysOfWeek.find(d => d.value === dayValue)?.label || 'Không xác định';

const FixedScheduleManager: React.FC<FixedScheduleManagerProps> = ({ schedules, onClose, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreateSchedulePayload>({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '12:00',
    isAvailable: true,
  });

  // Sắp xếp danh sách lịch theo thứ tự trong tuần (Thứ 2 -> Chủ Nhật)
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek; // Chuyển Chủ Nhật (0) thành 7 để xếp cuối
      const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
      return dayA - dayB;
    });
  }, [schedules]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'dayOfWeek' ? Number(value) : value,
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (formState.startTime >= formState.endTime) {
      Swal.fire('Lỗi!', 'Giờ bắt đầu phải trước giờ kết thúc.', 'error');
      return;
    }

    // Đảm bảo thời gian luôn có định dạng HH:mm:ss
    const payload: CreateSchedulePayload = {
      ...formState,
      startTime: `${formState.startTime}:00`,
      endTime: `${formState.endTime}:00`,
    };

    try {
      if (editingScheduleId) {
        // Truyền payload đã được định dạng
        await scheduleService.updateSchedule(editingScheduleId, payload);
        Swal.fire('Thành công!', 'Đã cập nhật lịch làm việc.', 'success');
      } else {
        await scheduleService.createSchedule(payload);
        Swal.fire('Thành công!', 'Đã thêm lịch làm việc mới.', 'success');
      }
      onRefresh();
      setEditingScheduleId(null);
      setIsAdding(false);
    } catch (err) {
      console.error("Error saving schedule:", err);
      Swal.fire('Thất bại!', 'Lưu lịch làm việc thất bại.', 'error');
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
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await scheduleService.deleteSchedule(scheduleId);
        Swal.fire('Đã xóa!', 'Lịch làm việc đã được xóa.', 'success');
        onRefresh();
      } catch (err) {
        console.error("Error deleting schedule:", err);
        Swal.fire('Thất bại!', 'Xóa lịch làm việc thất bại.', 'error');
      }
    }
  };

  const startEditing = (schedule: DoctorSchedule) => {
    setEditingScheduleId(schedule.id);
    setFormState({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.substring(0, 5), // "HH:mm:ss" -> "HH:mm"
      endTime: schedule.endTime.substring(0, 5),   // "HH:mm:ss" -> "HH:mm"
      isAvailable: schedule.isAvailable,
    });
  };

  const renderForm = () => (
    <form onSubmit={handleSave} className="p-4 bg-gray-100 rounded-lg mt-4">
      <h4 className="font-semibold mb-2">{editingScheduleId ? 'Chỉnh sửa lịch' : 'Thêm lịch mới'}</h4>
      <div className="grid grid-cols-2 gap-4">
        <select name="dayOfWeek" value={formState.dayOfWeek} onChange={handleInputChange} className="p-2 border rounded">
          {daysOfWeek.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
        </select>
        <div className="flex items-center">
          <input type="checkbox" id="isAvailable" name="isAvailable" checked={formState.isAvailable} onChange={handleInputChange} className="mr-2" />
          <label htmlFor="isAvailable">Sẵn sàng</label>
        </div>
        <input type="time" name="startTime" value={formState.startTime} onChange={handleInputChange} className="p-2 border rounded" />
        <input type="time" name="endTime" value={formState.endTime} onChange={handleInputChange} className="p-2 border rounded" />
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
        <button type="button" onClick={() => { setIsAdding(false); setEditingScheduleId(null); }} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Quản lý lịch làm việc cố định</h3>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {sortedSchedules.length > 0 ? (
            <ul className="space-y-3">
              {sortedSchedules.map(schedule => (
                editingScheduleId === schedule.id ? (
                  <li key={schedule.id}>{renderForm()}</li>
                ) : (
                  <li key={schedule.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{getDayLabel(schedule.dayOfWeek)}</p>
                      <p className="text-gray-600">{schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}</p>
                      <p className={`text-sm font-semibold ${schedule.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {schedule.isAvailable ? 'Sẵn sàng' : 'Không sẵn sàng'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(schedule)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Sửa</button>
                      <button onClick={() => handleDelete(schedule.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Xóa</button>
                    </div>
                  </li>
                )
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có lịch làm việc cố định nào.</p>
          )}

          {isAdding && !editingScheduleId && renderForm()}
        </div>

        {!isAdding && !editingScheduleId && (
          <div className="mt-6 border-t pt-4">
            <button onClick={() => {
              setIsAdding(true);
              setFormState({ dayOfWeek: 1, startTime: '08:00', endTime: '12:00', isAvailable: true });
            }} className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Đăng ký lịch khám cố định mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedScheduleManager;