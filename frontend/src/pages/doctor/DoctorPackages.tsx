import React from 'react';
import PlaceholderPage from './PlaceholderPage';

const DoctorPackages: React.FC = () => {
  return (
    <PlaceholderPage
      title="Gói dịch vụ"
      description="Quản lý các gói dịch vụ y tế mà bạn cung cấp."
      icon="bi-box"
      features={[
        'Tạo và chỉnh sửa gói dịch vụ',
        'Thiết lập giá cả và điều kiện',
        'Quản lý đăng ký gói dịch vụ',
        'Theo dõi hiệu quả từng gói',
        'Tích hợp với hệ thống thanh toán'
      ]}
    />
  );
};

export default DoctorPackages;
