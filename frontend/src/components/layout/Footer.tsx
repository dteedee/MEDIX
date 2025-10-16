import React from 'react';
import { Link } from 'react-router-dom';
import './medix-footer.css';

const Footer = () => {
    return (
        <footer className="medix-footer">
            <div className="medix-footer__inner">
                <div className="medix-footer__section">
                    <h3>MEDIX</h3>
                    <p style={{ fontSize: '13px', lineHeight: '1.8' }}>Hệ thống y tế hàng đầu Việt Nam với tiêu chuẩn quốc tế</p>
                    <div className="medix-footer__social-icons">
                        {/* Sử dụng thẻ a cho các liên kết bên ngoài */}
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="medix-footer__social-icon">f</a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="medix-footer__social-icon">in</a>
                    </div>
                </div>
                <div className="medix-footer__section">
                    <h3>Về chúng tôi</h3>
                    <ul>
                        <li><Link to="/">Trang chủ</Link></li>
                        <li><Link to="/about-us">Về chúng tôi</Link></li>
                        <li><Link to="/doctors">Bác sĩ</Link></li>
                        <li><Link to="/health-articles">Bài viết sức khỏe</Link></li>
                    </ul>
                </div>
                <div className="medix-footer__section">
                    <h3>Dịch vụ</h3>
                    <ul>
                        <li><Link to="/health-packages">Gói khám sức khỏe</Link></li>
                        <li><Link to="/ai-diagnosis">AI chẩn đoán</Link></li>
                        <li><Link to="/appointments">Đặt lịch hẹn</Link></li>
                    </ul>
                </div>
                <div className="medix-footer__section">
                    <h3>Liên hệ</h3>
                    <ul>
                        {/* Thẻ a với mailto: để mở ứng dụng email */}
                        <li><a href="mailto:Chamsockhachhangmedix@gmail.com">Email: Chamsockhachhangmedix@gmail.com</a></li>
                    </ul>
                </div>
            </div>
            <div className="medix-footer__bottom">
                <p>© 2025 MEDIX. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;