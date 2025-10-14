import '../styles/home.css'

function HomePage() {
    return (
        <div>
            {/* Header */}
            <header>
                <div className="top-bar">
                    <div className="logo">
                        MEDIX
                        <small style={{ textTransform: 'uppercase' }}>Hệ thống y tế thông minh ứng dụng AI</small>
                    </div>
                    <div className="search-bar">
                        <input type="text" placeholder="Chuyên khoa, triệu chứng, tên bác sĩ..." />
                        <button>🔍</button>
                    </div>
                    <div className="header-links">
                        <a href="#">Đăng nhập</a>
                        <a href="#">Đăng ký</a>
                    </div>
                </div>
            </header>
            <nav>
                <ul className="nav-menu" style={{ justifyContent: 'center' }}>
                    <li><a href="#">Trang chủ</a></li>
                    <li><a>|</a></li>
                    <li><a href="#">AI chẩn đoán</a></li>
                    <li><a>|</a></li>
                    <li><a href="#">Chuyên khoa</a></li>
                    <li><a>|</a></li>
                    <li><a href="#">Bác sĩ</a></li>
                    <li><a>|</a></li>
                    <li><a href="#">Bài viết sức khỏe</a></li>
                    <li><a>|</a></li>
                    <li><a href="#">Về chúng tôi</a></li>
                </ul>
            </nav>
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>CHĂM SÓC SỨC KHỎE TOÀN DIỆN<br />TIÊU CHUẨN QUỐC TẾ</h1>
                        <p>Đội ngũ giáo sư, bác sĩ đầu ngành – Công nghệ<br />AI tiên tiến – Dịch vụ chăm sóc cá nhân hóa</p>
                        <div className="features-box">
                            <div className="feature-item">
                                <span>🤖</span>
                                <div>
                                    <strong>AI chẩn đoán</strong><br />
                                    <small>Tư vấn và giải đáp các vấn đề của bạn</small>
                                </div>
                            </div>
                            <div className="feature-item">
                                <span>📅</span>
                                <div>
                                    <strong>Đặt lịch hẹn</strong><br />
                                    <small>Đặt lịch hẹn nhanh chóng, tiện lợi</small>
                                </div>
                            </div>
                            <div className="feature-item">
                                <span>👨‍⚕️</span>
                                <div>
                                    <strong>Tìm bác sĩ</strong><br />
                                    <small>Tìm chuyên gia nhanh chóng</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="carouselExampleAutoplaying" className="carousel slide" data-bs-ride="carousel">
                        <div className="carousel-inner">
                            <div className="carousel-item active">
                                <img src="https://4kwallpapers.com/images/wallpapers/manchester-united-7680x4320-17569.jpg"
                                    className="d-block w-100 carousel-img" alt="..." />
                            </div>
                            <div className="carousel-item">
                                <img src="https://pbs.twimg.com/media/Gpi8M8QWwAAP6x8?format=jpg&name=4096x4096" className="d-block w-100 carousel-img" alt="..." />
                            </div>
                            <div className="carousel-item">
                                <img src="https://img.goodfon.com/original/1920x1200/0/c2/sebastian-vettel-wallpaper-f1.jpg" className="d-block w-100 carousel-img" alt="..." />
                            </div>
                        </div>
                        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true" />
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true" />
                            <span className="visually-hidden">Next</span>
                        </button>
                    </div>
                </div>
            </section>
            {/* Why Choose Section */}
            <section className="why-choose">
                <h2>TẠI SAO NÊN CHỌN MEDIX</h2>
                <div className="why-content">
                    <div className="doctor-image">
                        <img src="/images/why-choose-doctor.png" alt="Doctor" />
                    </div>
                    <div className="benefits">
                        <div className="benefit-item">
                            <img src="/images/why-choose-1.png" className="icon" />
                            <h3>Chuyên gia hàng đầu</h3>
                            <p>MEDIX quy tụ đội ngũ chuyên gia, bác sĩ, dược sĩ và điều dưỡng có trình độ chuyên môn cao, tay
                                nghề giỏi, tận tâm và chuyên nghiệp. Luôn đặt người bệnh làm trung tâm, Medix cam kết đem đến
                                dịch vụ chăm sóc sức khỏe tốt cho khách hàng.</p>
                        </div>
                        <div className="benefit-item">
                            <img src="/images/why-choose-2.png" className="icon" />
                            <h3>Chất lượng quốc tế</h3>
                            <p>Hệ thống Y tế MEDIX được quản lý và vận hành dưới sự giám sát của những nhà quản lý y tế giàu
                                kinh nghiệm, cùng với sự hỗ trợ của phương tiện kỹ thuật hiện đại, nhằm đảm bảo cung cấp dịch vụ
                                chăm sóc sức khỏe toàn diện và hiệu quả.</p>
                        </div>
                        <div className="benefit-item">
                            <img src="/images/why-choose-3.png" className="icon" />
                            <h3>Nghiên cứu &amp; Đổi mới</h3>
                            <p>MEDIX liên tục thúc đẩy y học hàn lâm dựa trên nghiên cứu có phương pháp và sự phát triển y tế
                                được chia sẻ từ quan hệ đối tác toàn cầu với các hệ thống chăm sóc sức khỏe hàng đầu thế giới
                                nhằm cung cấp các phương pháp điều trị mang tính cách mạng và sáng tạo cho tiêu chuẩn chăm sóc
                                bệnh nhân tốt nhất.</p>
                        </div>
                        <div className="benefit-item">
                            <img src="/images/why-choose-1.png" className="icon" />
                            <h3>Công nghệ tiên tiến</h3>
                            <p>MEDIX cung cấp cơ sở vật chất hạng nhất và dịch vụ 5 sao bằng cách sử dụng các công nghệ tiên
                                tiến được quản lý bởi các bác sĩ lâm sàng lành nghề để đảm bảo dịch vụ chăm sóc sức khỏe toàn
                                diện và hiệu quả cao
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            {/* AI Section */}
            <section className="ai-section">
                <div className="ai-content">
                    <div className="ai-badge">CÔNG NGHỆ AI</div>
                    <div className="ai-features">
                        <div className="ai-robot">
                            <div className="robot-circle">
                                <div className="robot-icon">
                                    <img src="/images/medix-logo.png" />
                                </div>
                                <div className="status-indicator" />
                            </div>
                        </div>
                        <div className="ai-text">
                            <p>Hệ thống AI của chúng tôi có khả năng phân tích triệu chứng, đưa ra các tư vấn y tế ban đầu, hỗ
                                trợ đặt lịch khám và theo dõi sức khỏe liên tục. Công nghệ AI giúp tối ưu hóa quy trình chăm sóc
                                sức khỏe, tiết kiệm thời gian và nâng cao chất lượng dịch vụ.</p>
                        </div>
                    </div>
                    <div className="ai-features">
                        <div className="ai-text">
                            <p>Hệ thống AI của chúng tôi có khả năng phân tích triệu chứng, đưa ra các tư vấn y tế ban đầu, hỗ
                                trợ đặt lịch khám và theo dõi sức khỏe liên tục. Công nghệ AI giúp tối ưu hóa quy trình chăm sóc
                                sức khỏe, tiết kiệm thời gian và nâng cao chất lượng dịch vụ.</p>
                        </div>
                        <div className="ai-robot">
                            <div className="robot-circle">
                                <div className="robot-icon">
                                    <img src="/images/ai-95-percent.png" />
                                </div>
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <span><i> Tỉ lệ chuẩn xác của công cụ chẩn đoán AI MEDIX – được ghi nhận tính đến tháng 11 năm
                                    2025</i></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Steps Section */}
            <section className="steps">
                <h2>HƯỚNG DẪN SỬ DỤNG: 3 BƯỚC ĐƠN GIẢN</h2>
                <div className="steps-container">
                    <div className="step">
                        <div className="step-circle">01</div>
                        <div className="step-icon">⏰</div>
                        <h3>STEP 1</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar risus blandit et varius quam
                            sagittis. Fusce rutrum odio vitae magna.</p>
                    </div>
                    <div className="step">
                        <div className="step-circle">02</div>
                        <div className="step-icon">⭐</div>
                        <h3>STEP 2</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar risus blandit et varius quam
                            sagittis. Fusce rutrum odio vitae magna.</p>
                    </div>
                    <div className="step">
                        <div className="step-circle">03</div>
                        <div className="step-icon">💡</div>
                        <h3>STEP 3</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pulvinar risus blandit et varius quam
                            sagittis. Fusce rutrum odio vitae magna.</p>
                    </div>
                </div>
            </section>
            {/* Doctors Section */}
            <section className="doctors">
                <h2>ĐỘI NGŨ BÁC SĨ CỦA CHÚNG TÔI</h2>
                <div className="doctors-grid">
                    <div className="doctor-card">
                        <div className="doctor-photo" />
                        <h3>Hoàng Nam Thuận</h3>
                        <p className="specialty">Bác sĩ - Nội tổng quát</p>
                        <p className="specialty">10 năm kinh nghiệm</p>
                        <div className="rating">★★★★★</div>
                    </div>
                    <div className="doctor-card">
                        <div className="doctor-photo" />
                        <h3>Phạm Xuân Ân</h3>
                        <p className="specialty">Bác sĩ - Nhi khoa</p>
                        <p className="specialty">12 năm kinh nghiệm</p>
                        <div className="rating">★★★★★</div>
                    </div>
                    <div className="doctor-card">
                        <div className="doctor-photo" />
                        <h3>Hoàng Tiến Giáp</h3>
                        <p className="specialty">Bác sĩ - Sản phụ khoa</p>
                        <p className="specialty">8 năm kinh nghiệm</p>
                        <div className="rating">★★★★★</div>
                    </div>
                    <div className="doctor-card">
                        <div className="doctor-photo" />
                        <h3>Phạm Nhật Dũng</h3>
                        <p className="specialty">Bác sĩ - Tim mạch</p>
                        <p className="specialty">15 năm kinh nghiệm</p>
                        <div className="rating">★★★★★</div>
                    </div>
                </div>
                <div className="view-all">
                    <button className="btn-view-all">XEM TẤT CẢ</button>
                </div>
            </section>
            {/* Knowledge Section */}
            <section className="knowledge">
                <h2>KIẾN THỨC SỨC KHỎE HỮU ÍCH</h2>
                <div className="knowledge-grid">
                    <div className="knowledge-card">
                        <div className="knowledge-image" />
                        <div className="knowledge-content">
                            <h5>Phòng bệnh tốt hơn chữa bệnh</h5>
                            <p> Hãy chăm sóc sức khỏe của bạn từ hôm nay để có một tương lai khỏe
                                mạnh và hạnh phúc.</p>
                        </div>
                        <div className="knowledge-footer">
                            <p className="knowledge-date">📅14/06/2025</p>
                        </div>
                    </div>
                    <div className="knowledge-card">
                        <div className="knowledge-image" />
                        <div className="knowledge-content">
                            <h5>Phòng bệnh tốt hơn chữa bệnh</h5>
                            <p>Chăm sóc sức khỏe tim mạch: Bí quyết để giữ cho tim bạn luôn khỏe mạnh qua chế độ ăn uống và tập
                                luyện hợp lý.</p>
                        </div>
                        <div className="knowledge-footer">
                            <p className="knowledge-date">📅14/06/2025</p>
                        </div>
                    </div>
                    <div className="knowledge-card">
                        <div className="knowledge-image" />
                        <div className="knowledge-content">
                            <h5>Phòng bệnh tốt hơn chữa bệnh</h5>
                            <p>Dinh dưỡng cho sức khỏe: Những thực phẩm nên và không nên ăn để duy trì cơ thể khỏe mạnh.</p>
                        </div>
                        <div className="knowledge-footer">
                            <p className="knowledge-date">📅14/06/2025</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* Footer */}
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

            <div className="ai-bubble">
                <img src="/images/medix-logo-mirrored.jpg" alt="Chat" />
                <div className='status-indicator-sm'></div>
            </div>

        </div>
    )
}

export default HomePage;