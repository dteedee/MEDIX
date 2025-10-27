import React from 'react';
import PlaceholderPage from './PlaceholderPage';

const DoctorPatients: React.FC = () => {
  return (
    <PlaceholderPage
      title="Bệnh nhân"
      description="Quản lý thông tin và lịch sử khám của các bệnh nhân."
      icon="bi-people"
      features={[
        'Danh sách bệnh nhân đã khám',
        'Lịch sử khám bệnh chi tiết',
        'Hồ sơ bệnh án điện tử',
        'Tìm kiếm và lọc bệnh nhân',
        'Thống kê và báo cáo'
      ]}
    />
  );
};

export default DoctorPatients;
