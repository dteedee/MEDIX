import React from 'react';
import PlaceholderPage from './PlaceholderPage';

const DoctorAppointments: React.FC = () => {
  return (
    <PlaceholderPage
      title="Lịch hẹn"
      description="Quản lý và theo dõi các cuộc hẹn với bệnh nhân của bạn."
      icon="bi-calendar-check"
      features={[
        'Xem danh sách lịch hẹn theo ngày/tuần/tháng',
        'Cập nhật trạng thái lịch hẹn',
        'Ghi chú và đánh giá sau khám',
        'Thông báo nhắc nhở tự động',
        'Tích hợp với lịch cá nhân'
      ]}
    />
  );
};

export default DoctorAppointments;
