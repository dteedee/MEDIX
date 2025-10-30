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
  const [isAdding, setIsAdding] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Mặc định chọn Thứ Hai
  const [formState, setFormState] = useState<CreateSchedulePayload>({
    dayOfWeek: 1,
    startTime: timeSlots[0].startTime,
    endTime: timeSlots[0].endTime,
    isAvailable: true,
  });

  // Lọc và sắp xếp lịch làm việc cho ngày được chọn
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

    // --- VALIDATION LOGIC ---

    // 1. Validate Start time < End time
    if (formState.startTime >= formState.endTime) {
      Swal.fire('Lỗi!', 'Giờ bắt đầu phải trước giờ kết thúc.', 'error');
      return;
    }

    const schedulesForDay = schedules.filter(s => s.dayOfWeek === formState.dayOfWeek && s.id !== editingScheduleId);

    // // 3. Validate maximum 2 schedules per day (only for new schedules)
    // if (!editingScheduleId && schedulesForDay.length >= 2) {
    //   Swal.fire('Lỗi!', `Mỗi ngày chỉ được đăng ký tối đa 2 ca làm việc. Ngày ${getDayLabel(formState.dayOfWeek)} đã đủ số ca.`, 'error');
    //   return;
    // }

    // 4. Validate for overlapping schedules
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
    // --- END VALIDATION ---

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
    } catch (err: any) {
      console.error("Error saving schedule:", err);

      let errorMessage = 'Lưu lịch làm việc thất bại.'; // Fallback mặc định
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          // Xử lý trường hợp backend trả về chuỗi thuần túy
          errorMessage = err.response.data;
        } else if (typeof err.response.data === 'object') {
          // Xử lý trường hợp backend trả về đối tượng JSON (ví dụ: ProblemDetails)
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
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await scheduleService.deleteSchedule(scheduleId);
        Swal.fire('Đã xóa!', 'Lịch làm việc đã được xóa.', 'success');
        onRefresh();
      } catch (err: any) {
        console.error("Error deleting schedule:", err);

        let errorMessage = 'Xóa lịch làm việc thất bại.'; // Fallback mặc định
        if (err.response && err.response.data) {
          if (typeof err.response.data === 'string') {
            // Xử lý trường hợp backend trả về chuỗi thuần túy
            errorMessage = err.response.data;
          } else if (typeof err.response.data === 'object') {
            // Xử lý trường hợp backend trả về đối tượng JSON
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
      startTime: schedule.startTime.substring(0, 5), // "HH:mm:ss" -> "HH:mm"
      endTime: schedule.endTime.substring(0, 5),   // "HH:mm:ss" -> "HH:mm"
      isAvailable: schedule.isAvailable,
    });
  };

  const renderForm = () => (
    <form onSubmit={handleSave} className="p-4 bg-gray-100 rounded-lg mt-4">
      <h4 className="font-semibold mb-2">{editingScheduleId ? 'Chỉnh sửa lịch' : 'Thêm lịch mới'}</h4>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="font-medium text-gray-700">
          Ngày: <span className="font-bold text-blue-600">{getDayLabel(formState.dayOfWeek)}</span>
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="isAvailable" name="isAvailable" checked={formState.isAvailable} onChange={handleInputChange} className="mr-2" />
          <label htmlFor="isAvailable">Sẵn sàng</label>
        </div>
        <select name="timeSlot" value={formState.startTime} onChange={handleTimeSlotChange} className="p-2 border rounded col-span-2">
          {timeSlots.map(slot => <option key={slot.startTime} value={slot.startTime}>{slot.label}</option>)}
        </select>
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
        
        {/* Thanh chọn ngày trong tuần */}
        <div className="flex border-b mb-4">
          {daysOfWeek.map(day => (
            <button
              key={day.value}
              onClick={() => { setSelectedDay(day.value); setIsAdding(false); setEditingScheduleId(null); }}
              className={`flex-1 py-2 text-sm font-medium ${selectedDay === day.value ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {day.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-grow px-1">
          {schedulesForSelectedDay.length > 0 ? (
            <ul className="space-y-3">
              {schedulesForSelectedDay.map(schedule => (
                editingScheduleId === schedule.id ? (
                  <li key={schedule.id}>{renderForm()}</li>
                ) : (
                  <li key={schedule.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-lg">{schedule.startTime.substring(0, 5)} - {schedule.endTime.substring(0, 5)}</p>
                      <p className={`text-sm font-semibold ${schedule.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {schedule.isAvailable ? 'Sẵn sàng' : 'Không sẵn sàng'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(schedule)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">Sửa</button>
                      <button onClick={() => handleDelete(schedule.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Xóa</button>
                    </div>
                  </li>
                )
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có lịch làm việc cho ngày này.</p>
          )}

          {isAdding && !editingScheduleId && renderForm()}
          {!isAdding && !editingScheduleId && (
            <button onClick={() => {
              setIsAdding(true);
              setFormState({ dayOfWeek: selectedDay, startTime: timeSlots[0].startTime, endTime: timeSlots[0].endTime, isAvailable: true });
            }} className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Thêm ca làm việc cho {getDayLabel(selectedDay)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedScheduleManager;