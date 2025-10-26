import React, { useState, useEffect, FormEvent } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { DoctorSchedule } from '../../types/schedule';
import { format } from 'date-fns';

const ScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    scheduleDate: '',
    startTime: '08:00',
    endTime: '17:00',
    consultationFee: 150000,
  });

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await scheduleService.getMySchedules();
      // Sắp xếp lịch theo ngày gần nhất trước
      const sortedData = data.sort((a, b) => new Date(b.scheduleDate).getTime() - new Date(a.scheduleDate).getTime());
      setSchedules(sortedData);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách lịch làm việc. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formState.scheduleDate || !formState.startTime || !formState.endTime) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      await scheduleService.createSchedule({
        ...formState,
        consultationFee: Number(formState.consultationFee),
      });
      // Reset form and refetch schedules
      setFormState({
        scheduleDate: '',
        startTime: '08:00',
        endTime: '17:00',
        consultationFee: 150000,
      });
      fetchSchedules();
    } catch (err) {
      setError('Tạo lịch làm việc thất bại. Vui lòng thử lại.');
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Quản lý Lịch làm việc</h1>

      {/* Form to add new schedule */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Thêm Lịch Mới</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700">Ngày làm việc</label>
              <input type="date" id="scheduleDate" name="scheduleDate" value={formState.scheduleDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700">Phí tư vấn (VND)</label>
              <input type="number" id="consultationFee" name="consultationFee" value={formState.consultationFee} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Giờ bắt đầu</label>
              <input type="time" id="startTime" name="startTime" value={formState.startTime} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Giờ kết thúc</label>
              <input type="time" id="endTime" name="endTime" value={formState.endTime} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Thêm Lịch
          </button>
        </form>
      </div>

      {/* List of existing schedules */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Danh sách Lịch đã tạo</h2>
        {isLoading ? (
          <p>Đang tải...</p>
        ) : schedules.length === 0 ? (
          <p className="text-gray-500">Chưa có lịch làm việc nào.</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium text-indigo-600 truncate">
                        Ngày: {format(new Date(schedule.scheduleDate), 'dd/MM/yyyy')}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {schedule.isAvailable ? 'Còn trống' : 'Đã kín'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Thời gian: {schedule.startTime} - {schedule.endTime}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>Phí: {schedule.consultationFee.toLocaleString('vi-VN')} VND</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement;
