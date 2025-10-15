import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header with Search */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">MEDIX</Link>
            <p className="text-blue-100">HỆ THỐNG Y TẾ THÔNG MINH ỨNG DỤNG AI</p>
            <div className="flex space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="bg-transparent border border-white px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition">
                    Đăng Nhập
                  </Link>
                  <Link to="/patient-register" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition">
                    Đăng Ký
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex space-x-8">
              <Link to="/specialties" className="text-gray-700 hover:text-blue-600 font-medium">CHUYÊN KHOA</Link>
              <Link to="/symptoms" className="text-gray-700 hover:text-blue-600 font-medium">TRIỆU CHỨNG</Link>
              <Link to="/consultations" className="text-gray-700 hover:text-blue-600 font-medium">TƯ VẤN</Link>
              <Link to="/booking" className="text-gray-700 hover:text-blue-600 font-medium">ĐẶT LỊCH</Link>
              <Link to="/services" className="text-gray-700 hover:text-blue-600 font-medium">DỊCH VỤ KHÁC</Link>
              <Link to="/hospitals" className="text-gray-700 hover:text-blue-600 font-medium">BỆH VIỆN</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              CHĂM SÓC SỨC KHỎE TOÀN DIỆN<br />
              TIÊU CHUẨN QUỐC TẾ
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Đội ngũ bác sĩ hàng đầu - Công nghệ AI tiên tiến - Dịch vụ chăm sóc sức khỏe cá nhân hóa
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Chuyên khoa, Triệu chứng, Tên bác sĩ"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
              
              <div className="flex justify-center space-x-6 mt-6">
                <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm hover:bg-white/30 transition">
                  🫀 Tim mạch
                </button>
                <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm hover:bg-white/30 transition">
                  🧠 Thần kinh
                </button>
                <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm hover:bg-white/30 transition">
                  👁️ Mắt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose MEDIX Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              TẠI SAO NÊN CHỌN MEDIX
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Chuyên gia hàng đầu</h3>
                  <p className="text-gray-600 text-sm">Đội ngũ bác sĩ giàu kinh nghiệm với chứng chỉ quốc tế</p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Chăm sóc nhanh về</h3>
                  <p className="text-gray-600 text-sm">Kết nối tức thì với bác sĩ chỉ trong vài phút</p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nghiêm túc & bảo mật</h3>
                  <p className="text-gray-600 text-sm">Thông tin y tế được bảo mật tuyệt đối theo chuẩn quốc tế</p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Công nghệ tiên tiến</h3>
                  <p className="text-gray-600 text-sm">AI hỗ trợ chẩn đoán và tư vấn sức khỏe thông minh</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <img 
                src="/api/placeholder/500/600" 
                alt="Medical professional" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Technology Section */}
      <div className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              CÔNG NGHỆ AI
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-4">MEDIX AI</h3>
                  <p className="text-gray-600 text-center">
                    Hệ thống AI y tế tiên tiến, hỗ trợ chẩn đoán và đưa ra lời khuyên sức khỏe cá nhân hóa.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">95%</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Độ chính xác cao</h4>
                      <p className="text-gray-600 text-sm">AI được đào tạo từ hàng triệu ca bệnh thực tế</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 italic">
                      "Medix AI giúp tôi phát hiện sớm các dấu hiệu bất thường, 
                      từ đó có biện pháp điều trị kịp thời và hiệu quả."
                    </p>
                    <p className="text-sm text-gray-500 mt-2">- Bác sĩ Nguyễn Văn A, Bệnh viện Chợ Rẫy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              HƯỚNG DẪN SỬ DỤNG: 3 BƯỚC ĐƠN GIẢN
            </h2>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">01</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">STEP 1<br />Đăng ký tài khoản</h3>
                <p className="text-gray-600">
                  Tạo tài khoản miễn phí với thông tin cá nhân và y tế cơ bản. 
                  Quá trình đăng ký nhanh chóng và bảo mật.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">02</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">STEP 2<br />Tìm kiếm bác sĩ</h3>
                <p className="text-gray-600">
                  Sử dụng AI để tìm kiếm bác sĩ phù hợp theo chuyên khoa, 
                  triệu chứng hoặc vị trí địa lý.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">03</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">STEP 3<br />Đặt lịch và khám</h3>
                <p className="text-gray-600">
                  Đặt lịch hẹn trực tuyến hoặc tại phòng khám. 
                  Nhận tư vấn và điều trị từ các chuyên gia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Doctors Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ĐỘI NGŨ BÁC SĨ CỦA CHÚNG TÔI
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((doctor) => (
              <div key={doctor} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Hoàng Nam Thăng</h3>
                  <p className="text-blue-600 font-medium mb-2">Thạc sĩ - Bác sĩ</p>
                  <p className="text-gray-600 text-sm mb-4">
                    Chuyên khoa Tim mạch<br />
                    15+ năm kinh nghiệm
                  </p>
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {'★★★★★'.split('').map((star, i) => (
                        <span key={i}>{star}</span>
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm ml-2">(4.9)</span>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                    Đặt lịch khám
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              XEM TẤT CẢ
            </button>
          </div>
        </div>
      </div>

      {/* Health Knowledge Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              KIẾN THỨC SỨC KHỎE HỮU ÍCH
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((article) => (
              <div key={article} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 leading-tight">
                    Những điều cần biết về bệnh cao huyết áp ở người trẻ tuổi
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Cao huyết áp không còn chỉ là bệnh của người già. Ngày càng nhiều người trẻ mắc phải...
                  </p>
                  <Link to="/articles" className="text-blue-600 font-medium hover:underline">
                    Đọc thêm →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">MEDIX</h3>
              <p className="text-blue-100 text-sm mb-4">
                HỆ THỐNG Y TẾ THÔNG MINH ỨNG DỤNG AI
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition">
                  <span>f</span>
                </a>
                <a href="#" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition">
                  <span>📷</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">DỊCH VỤ</h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><Link to="/booking" className="hover:text-white">Đặt khám sức khỏe</Link></li>
                <li><Link to="/ai-consultation" className="hover:text-white">AI Tư vấn</Link></li>
                <li><Link to="/pharmacy" className="hover:text-white">Nhà thuốc</Link></li>
                <li><Link to="/health-check" className="hover:text-white">Khám sức khỏe</Link></li>
                <li><Link to="/emergency" className="hover:text-white">Khám khẩn cấp</Link></li>
                <li><Link to="/follow-up" className="hover:text-white">Khám tái khám</Link></li>
                <li><Link to="/consultation" className="hover:text-white">Đặt lịch tư vấn</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">LIÊN HỆ VỚI CHÚNG TÔI</h4>
              <div className="text-sm text-blue-100 space-y-2">
                <p>Email: contact@medix.com</p>
                <p>Điện thoại: 1900-xxxx</p>
                <p>Địa chỉ: 123 Đường ABC, TP.HCM</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">THÔNG TIN</h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><Link to="/about" className="hover:text-white">Về chúng tôi</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Chính sách bảo mật</Link></li>
                <li><Link to="/terms" className="hover:text-white">Điều khoản sử dụng</Link></li>
                <li><Link to="/help" className="hover:text-white">Trợ giúp</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-500 mt-8 pt-8 text-center text-blue-100 text-sm">
            <p>&copy; 2024 MEDIX. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};