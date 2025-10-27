import React from 'react';
import PlaceholderPage from './PlaceholderPage';

const DoctorWallet: React.FC = () => {
  return (
    <PlaceholderPage
      title="Ví & doanh thu"
      description="Theo dõi thu nhập và quản lý tài chính cá nhân."
      icon="bi-wallet2"
      features={[
        'Xem doanh thu theo ngày/tuần/tháng',
        'Lịch sử giao dịch chi tiết',
        'Rút tiền về tài khoản ngân hàng',
        'Thống kê thu nhập và xu hướng',
        'Báo cáo thuế tự động'
      ]}
    />
  );
};

export default DoctorWallet;
