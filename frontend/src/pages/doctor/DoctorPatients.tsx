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
      if (app.patientID) { // Chỉ xử lý các cuộc hẹn có patientID
        if (!patientMap.has(app.patientID)) {
          patientMap.set(app.patientID, { appointments: [] });
        }
        patientMap.get(app.patientID)!.appointments.push(app);
      }
    });

    const patientList: Patient[] = Array.from(patientMap.entries()).map(([patientId, data]) => {
      const sortedAppointments = data.appointments.sort((a, b) => new Date(b.appointmentStartTime).getTime() - new Date(a.appointmentStartTime).getTime());
      const latestAppointment = sortedAppointments[0];
      const firstAppointment = sortedAppointments[sortedAppointments.length - 1];

      return {
        id: patientId,
        name: latestAppointment.patientName,
        avatar: `https://ui-avatars.com/api/?name=${latestAppointment.patientName.replace(/\s/g, "+")}&background=random`,
        totalAppointments: data.appointments.length,
        lastVisit: new Date(latestAppointment.appointmentStartTime).toLocaleDateString('vi-VN'),
        firstVisit: new Date(firstAppointment.appointmentStartTime).toLocaleDateString('vi-VN'),
      };
    });

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
