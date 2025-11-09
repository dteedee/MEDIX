import React, { useEffect, useState } from 'react';
import PlaceholderPage from './PlaceholderPage';
import { DoctorSalary } from '../../types/doctor.types';
import doctorSalaryService from '../../services/doctorSalaryService';
import styles from '../../styles/doctor/DoctorSalaries.module.css';
import { LoadingSpinner } from '../../components/ui';

const formatVietnameseMonthYear = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // getMonth() is 0-based
  const year = date.getFullYear();
  return `Tháng ${month}, năm ${year}`;
};

const formatDate_ddMMyyyy = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};


const DoctorWallet: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [salaries, setSalaries] = useState<DoctorSalary[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await doctorSalaryService.getSalaries();
        setSalaries(data);

        setPageLoading(false);
      } catch (error: any) {
        setError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    })();
  }, []);

  if (pageLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles["container"]}>

        {/* Salary list */}
        <div className={styles["salaries-section"]}>
          <h2 className={styles["section-title"]}>Lịch sử lương</h2>
          {error ? (
            <div className={styles.errorMessage}>
              <i className="bi bi-exclamation-triangle"></i>
              {error}
            </div>
          ) : (
            <div className={styles["salaries"]}>
              {salaries.map((item) => (
                <div
                  key={item.id}
                  className={styles["salaries-item"]}>
                  <div className={styles["salaries-dot"]} />
                  <div className={styles["salaries-date"]}>{formatVietnameseMonthYear(item.periodStartDate)}</div>
                  <div className={styles["salaries-detail"]}>
                    <div className={styles["salaries-row"]}>
                      <span className={styles["salaries-label"]}>Lương ròng:</span>
                      <span className={styles["salaries-value"]}>{item.netSalary} đ</span>
                    </div>
                    <div className={styles["salaries-row"]}>
                      <span className={styles["salaries-label"]}>Được trả vào:</span>
                      <span className={styles["salaries-value"]}>{formatDate_ddMMyyyy(item.paidAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div >
    </>
  );
};

export default DoctorWallet;
