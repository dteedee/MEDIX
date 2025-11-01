import React, { useState, useEffect, useContext } from 'react';
import doctorService from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment.types';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import styles from '../../styles/doctor/DoctorSchedule.module.css';

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [week, setWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        return;
      }
      try {
        setLoading(true);

        // --- DEBUGGING --- 
        // 1. Log the doctor's profile details to see if it contains the ID
        try {
          const profileDetails = await doctorService.getDoctorProfileDetails();
          console.log("Doctor Profile Details:", profileDetails);
        } catch (e) {
          console.error("Could not fetch doctor profile details:", e);
        }

        // 2. Use a hardcoded ID to test rendering
        const HARDCODED_DOCTOR_ID = "7ABE2244-0D32-4ABE-A4EE-BD5BB67124D7";
        console.log("Fetching appointments for HARDCODED doctor ID:", HARDCODED_DOCTOR_ID);

        const data = await appointmentService.getAppointmentsByDoctorId(HARDCODED_DOCTOR_ID);
        // --- END DEBUGGING ---

        setAppointments(data);
        if (data.length > 0) {
          const firstAppointmentDate = parseISO(data[0].appointmentStartTime);
          setWeek(startOfWeek(firstAppointmentDate, { weekStartsOn: 1 }));
        }
        setError(null);
      } catch (err) {
        setError('Không thể tải lịch hẹn.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.id]);

  const handleNextWeek = () => {
    setWeek(addDays(week, 7));
  };

  const handlePreviousWeek = () => {
    setWeek(addDays(week, -7));
  };

  const renderWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(week, i);
      const dayAppointments = appointments.filter(app => 
        isSameDay(parseISO(app.appointmentStartTime), day)
      );

      days.push(
        <div key={i} className={styles.dayColumn}>
          <div className={styles.dayHeader}>
            {format(day, 'EEE')} <span className={styles.date}>{format(day, 'dd/MM')}</span>
          </div>
          <div className={styles.appointmentsList}>
            {dayAppointments.length > 0 ? (
              dayAppointments.map(app => (
                <div key={app.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentTime}>
                    {format(new Date(app.appointmentStartTime), 'HH:mm')} - {format(new Date(app.appointmentEndTime), 'HH:mm')}
                  </div>
                  <div className={styles.patientName}>{app.patientName}</div>
                  <div className={`${styles.status} ${styles[app.statusCode.toLowerCase()]}`}>
                    {app.statusCode}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noAppointments}>Không có lịch hẹn</div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải lịch làm việc...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lịch làm việc</h1>
        <div className={styles.navigation}>
          <button onClick={handlePreviousWeek}>Tuần trước</button>
          <span className={styles.weekRange}>
            {format(week, 'dd/MM/yyyy')} - {format(addDays(week, 6), 'dd/MM/yyyy')}
          </span>
          <button onClick={handleNextWeek}>Tuần sau</button>
        </div>
      </div>
      <div className={styles.scheduleGrid}>
        {renderWeekDays()}
      </div>
    </div>
  );
};

export default DoctorAppointments;