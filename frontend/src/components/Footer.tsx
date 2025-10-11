import React from 'react';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <img src="/logo.png" alt="MEDIX" className="footer-logo-image" />
            <span className="footer-logo-text">MEDIX</span>
          </div>
          <p className="footer-description">
            Nền tảng y tế số hàng đầu Việt Nam
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Dịch vụ</h3>
          <ul className="footer-links">
            <li><a href="#">Khám bệnh trực tuyến</a></li>
            <li><a href="#">Đặt lịch khám</a></li>
            <li><a href="#">Tư vấn y tế</a></li>
            <li><a href="#">Hồ sơ sức khỏe</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Hỗ trợ</h3>
          <ul className="footer-links">
            <li><a href="#">Trung tâm trợ giúp</a></li>
            <li><a href="#">Liên hệ</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Kết nối với chúng tôi</h3>
          <div className="social-links">
            <a href="#" className="social-link">
              <span className="social-icon">📘</span>
            </a>
            <a href="#" className="social-link">
              <span className="social-icon">📷</span>
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 MEDIX. All rights reserved.</p>
      </div>
    </footer>
  );
}