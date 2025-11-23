import React, { useState, useEffect, useMemo } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment.types';
import { PageLoader } from '../../components/ui';
import styles from '../../styles/doctor/DoctorPatients.module.css';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  name: string;
  avatar: string;
  totalAppointments: number;
  lastVisit: string;
  firstVisit: string;
}

const DoctorPatients: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const now = new Date();
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        // API này sẽ lấy tất cả các cuộc hẹn của bác sĩ hiện tại
        const data = await appointmentService.getMyAppointmentsByDateRange("2020-01-01", "2030-12-31");
        setAppointments(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Không thể tải danh sách bệnh nhân. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const patients = useMemo<Patient[]>(() => {
    if (appointments.length === 0) return [];

    const patientMap = new Map<string, { appointments: Appointment[] }>();
    appointments.forEach(app => {
      // Chỉ xử lý các cuộc hẹn có patientID và chưa bị hủy
      if (app.patientID && app.statusCode !== 'CancelledByPatient' && app.statusCode !== 'CancelledByDoctor') {
        if (!patientMap.has(app.patientID)) {
          patientMap.set(app.patientID, { appointments: [] });
        }
        patientMap.get(app.patientID)!.appointments.push(app);
      }
    });
    
    const patientList: Patient[] = Array.from(patientMap.entries())
      .map(([patientId, data]) => {
        // Lọc ra các cuộc hẹn đã diễn ra trong quá khứ hoặc đang diễn ra
        const pastAppointments = data.appointments
          .filter(app => new Date(app.appointmentStartTime) <= now)
          .sort((a, b) => new Date(b.appointmentStartTime).getTime() - new Date(a.appointmentStartTime).getTime());

        // Nếu không có cuộc hẹn nào trong quá khứ, không hiển thị bệnh nhân này
        if (pastAppointments.length === 0) return null;

        const lastVisitAppointment = pastAppointments[0]; // Lần khám cuối cùng (gần nhất trong quá khứ)
        const firstVisitAppointment = pastAppointments[pastAppointments.length - 1]; // Lần khám đầu tiên

        return {
          id: patientId,
          name: lastVisitAppointment.patientName, // Lấy tên từ lần khám cuối
          avatar: `https://ui-avatars.com/api/?name=${lastVisitAppointment.patientName.replace(/\s/g, "+")}&background=random`,
          totalAppointments: pastAppointments.length, // Tổng số lần khám là số cuộc hẹn trong quá khứ
          lastVisit: new Date(lastVisitAppointment.appointmentStartTime).toLocaleDateString('vi-VN'),
          firstVisit: new Date(firstVisitAppointment.appointmentStartTime).toLocaleDateString('vi-VN'),
        };
      })
      .filter((patient): patient is Patient => patient !== null); // Lọc bỏ các bệnh nhân null




    return patientList.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [patients, searchTerm]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Danh sách bệnh nhân</h1>
        <p>Quản lý thông tin và lịch sử khám của các bệnh nhân.</p>
      </div>
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Tìm kiếm bệnh nhân..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={styles.patientList}>
        {filteredPatients.map(patient => (
          <div key={patient.id} className={styles.patientCard}>
            <img src={patient.avatar} alt={patient.name} className={styles.avatar} />
            <div className={styles.patientInfo}>
              <h3 className={styles.patientName}>{patient.name}</h3>
              <p>Lần khám cuối: {patient.lastVisit}</p>
              <p>Tổng số lần khám: {patient.totalAppointments}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorPatients;
