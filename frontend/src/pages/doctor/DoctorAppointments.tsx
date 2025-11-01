import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment.types';
import { PageLoader } from '../../components/ui';
import { Link } from 'react-router-dom';
import '../../styles/doctor/DoctorAppointments.css';

/**
 * Nhóm các cuộc hẹn theo tuần.
 * Mỗi tuần bắt đầu từ Thứ Hai.
 * @param appointments Danh sách các cuộc hẹn.
 * @returns Một đối tượng với key là chuỗi đại diện cho tuần và value là mảng các cuộc hẹn.
 */
const groupAppointmentsByWeek = (
  appointments: Appointment[]
): Record<string, Appointment[]> => {
  const getWeekIdentifier = (d: Date) => {
    const date = new Date(d);
    const day = date.getUTCDay();
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(date.setUTCDate(diff));
    monday.setUTCHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0]; 
  };

  const weeklyAppointments = new Map<string, Appointment[]>();

  appointments.forEach(appointment => {
    const weekId = getWeekIdentifier(new Date(appointment.appointmentStartTime));
    if (!weeklyAppointments.has(weekId)) {
      weeklyAppointments.set(weekId, []);
    }
    weeklyAppointments.get(weekId)!.push(appointment);
  });

  // Chuyển Map thành Object để dễ dàng sử dụng trong React
  return Object.fromEntries(
    Array.from(weeklyAppointments.entries()).sort().reverse() // Sắp xếp tuần mới nhất lên đầu
  );
};

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      const doctorId = user?.id;
      if (!doctorId) {
        setError("Không thể xác thực người dùng.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const startDate = new Date('2020-01-01').toISOString().split('T')[0];
        const endDate = new Date('2099-12-31').toISOString().split('T')[0];
        const data = await appointmentService.getMyAppointmentsByDateRange(startDate, endDate);
        setAppointments(data);
        setError(null);
      } catch (err) {
        setError("Không thể tải danh sách cuộc hẹn. Vui lòng thử lại sau.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAppointments();
    }
  }, [user?.id]);

  const groupedAppointments = useMemo(() => {
    const sortedAppointments = [...appointments].sort(
      (a, b) => new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime()
    );
    return groupAppointmentsByWeek(sortedAppointments);
  }, [appointments]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  const getWeekTitle = (weekId: string): string => {
    const startDate = new Date(weekId);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return `Tuần từ ${startDate.toLocaleDateString('vi-VN')} đến ${endDate.toLocaleDateString('vi-VN')}`;
  };

  const getStatusBadgeClass = (statusCode: string) => {
    const classMap: Record<string, string> = {
      'CONFIRMED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
    };
    return classMap[statusCode] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">Danh sách Lịch hẹn</h1>
      {Object.keys(groupedAppointments).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">Bạn không có cuộc hẹn nào.</p>
        </div>
      ) : (
        <div className="timeline-container">
          {Object.entries(groupedAppointments).map(([weekId, weeklyAppointments]) => (
            <div key={weekId} className="timeline-week-section">
              <div className="timeline-marker">
                <i className="bi bi-calendar-week"></i>
              </div>
              <h3 className="timeline-week-title">{getWeekTitle(weekId)}</h3>
              <div>
                {weeklyAppointments.map((appointment) => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-card-header">
                      <div className="font-semibold text-gray-800">{appointment.patientName}</div>
                      <Link to={`/app/doctor/medical-records/${appointment.id}`} className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
                        Xem hồ sơ
                      </Link>
                    </div>
                    <div className="appointment-card-body">
                      <div>
                        <div className="text-gray-500">Thời gian</div>
                        <div className="text-gray-900 font-medium">
                          {new Date(appointment.appointmentStartTime).toLocaleString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Trạng thái</div>
                        <div>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appointment.statusCode)}`}>
                            {appointment.statusDisplayName || appointment.statusCode}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Thanh toán</div>
                        <div>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.paymentStatusCode === 'PAID' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.paymentStatusCode}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tổng tiền</div>
                        <div className="text-gray-900 font-medium">
                          {appointment.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
