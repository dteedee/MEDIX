import React from 'react';
import PlaceholderPage from './PlaceholderPage';

const DoctorFeedback: React.FC = () => {
  return (
    <PlaceholderPage
      title="Phản hồi"
      description="Xem và quản lý phản hồi từ bệnh nhân về dịch vụ của bạn."
      icon="bi-chat-dots"
      features={[
        'Xem đánh giá và nhận xét từ bệnh nhân',
        'Phản hồi lại các đánh giá',
        'Thống kê điểm đánh giá trung bình',
        'Theo dõi xu hướng hài lòng',
        'Xuất báo cáo phản hồi'
      ]}
    />
  );
};

export default DoctorFeedback;
