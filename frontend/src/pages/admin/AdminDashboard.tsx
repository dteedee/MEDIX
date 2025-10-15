import React from 'react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Tổng người dùng</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">1,234</p>
          <p className="text-sm text-green-600 mt-1">↗ +12% so với tháng trước</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Bác sĩ hoạt động</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">89</p>
          <p className="text-sm text-green-600 mt-1">↗ +5% so với tháng trước</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Cuộc hẹn hôm nay</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">156</p>
          <p className="text-sm text-yellow-600 mt-1">↗ +8% so với hôm qua</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Doanh thu tháng</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">₫45M</p>
          <p className="text-sm text-green-600 mt-1">↗ +15% so với tháng trước</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Hoạt động gần đây</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="ml-3 text-sm text-gray-600">Bác sĩ Nguyễn Văn A đã hoàn thành khám bệnh</span>
                <span className="ml-auto text-sm text-gray-400">5 phút trước</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="ml-3 text-sm text-gray-600">Bệnh nhân mới đăng ký tài khoản</span>
                <span className="ml-auto text-sm text-gray-400">10 phút trước</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="ml-3 text-sm text-gray-600">Cuộc hẹn được đặt lịch</span>
                <span className="ml-auto text-sm text-gray-400">15 phút trước</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Thao tác nhanh</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700">
                Quản lý người dùng
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-700">
                Duyệt bác sĩ mới
              </button>
              <button className="w-full text-left px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-700">
                Xem báo cáo
              </button>
              <button className="w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700">
                Cấu hình hệ thống
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
