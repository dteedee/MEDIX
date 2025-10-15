import '../../styles/footer.css'

const Footer = () => {
    return (
        <footer>
            <div className="footer-content">
                <div className="footer-section">
                    <h3>MEDIX</h3>
                    <p style={{ fontSize: '13px', lineHeight: '1.8' }}>Hệ thống y tế hàng đầu Việt Nam với tiêu chuẩn quốc tế</p>
                    <div className="social-icons">
                        <div className="social-icon">f</div>
                        <div className="social-icon">in</div>
                    </div>
                </div>
                <div className="footer-section">
                    <h3>Về chúng tôi</h3>
                    <ul>
                        <li><a href="#">Trang chủ</a></li>
                        <li><a href="#">Về chúng tôi</a></li>
                        <li><a href="#">Bác sĩ</a></li>
                        <li><a href="#">Bài viết sức khỏe</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h3>Dịch vụ</h3>
                    <ul>
                        <li><a href="#">Gói khám sức khỏe</a></li>
                        <li><a href="#">AI chẩn đoán</a></li>
                        <li><a href="#">Đặt lịch hẹn</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h3>Liên hệ</h3>
                    <ul>
                        <li><a>Email: Chamsockhachhangmedix@gmail.com</a></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© 2025 MEDIX. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;