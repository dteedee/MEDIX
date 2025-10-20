import React from 'react';

export const ManageDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manager Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Bác sĩ đang hoạt động</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">45</p>
          <p className="text-sm text-gray-500 mt-1">Trong ca làm việc</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Lịch hẹn hôm nay</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">128</p>
          <p className="text-sm text-gray-500 mt-1">Đã xác nhận: 98</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Đánh giá trung bình</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">4.8</p>
          <p className="text-sm text-gray-500 mt-1">Từ 324 đánh giá</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quản lý bác sĩ</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Dr. Nguyễn Văn A</h4>
                  <p className="text-sm text-gray-500">Nội khoa - Online</p>
                </div>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Online</span>
                  <button className="text-blue-600 text-sm">Xem</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Dr. Trần Thị B</h4>
                  <p className="text-sm text-gray-500">Tim mạch - Bận</p>
                </div>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Bận</span>
                  <button className="text-blue-600 text-sm">Xem</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Báo cáo gần đây</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="ml-3 text-sm text-gray-600">Báo cáo doanh thu tháng 10</span>
                <span className="ml-auto text-sm text-gray-400">2 giờ trước</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="ml-3 text-sm text-gray-600">Báo cáo hiệu suất bác sĩ</span>
                <span className="ml-auto text-sm text-gray-400">1 ngày trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
