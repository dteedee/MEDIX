import { useEffect, useState } from 'react';
import '../styles/home.module.css'
import { HomeMetadata } from '../types/home.types';
import HeaderTest from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HomeService from '../services/homeService';

function HomePage() {

    //get home page details
    const [homeMetadata, setHomeMetadata] = useState<HomeMetadata>();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const data = await HomeService.getHomeMetadata();
                setHomeMetadata(data);
            } catch (error) {
                console.error('Failed to fetch home metadata:', error);
            }
        };

        fetchMetadata();
    }, [])

    //handle doctors sliding
    const [currentIndex, setCurrentIndex] = useState(0);
    const doctorsPerPage = 4;

    const visibleDoctors = homeMetadata?.displayedDoctors.slice(
        currentIndex,
        currentIndex + doctorsPerPage
    );

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(prev - doctorsPerPage, 0));
    };

    const handleNext = () => {
        if (homeMetadata?.displayedDoctors) {
            setCurrentIndex((prev) =>
                Math.min(prev + doctorsPerPage, homeMetadata.displayedDoctors.length - doctorsPerPage)
            );
        }
    };


    return (
        <div>
            <HeaderTest />
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
                            {homeMetadata?.bannerUrls.map((bannerUrl, index) => (
                                <div className={`carousel-item${index === 0 ? ' active' : ''}`} key={index}>
                                    <img
                                        src={bannerUrl}
                                        className="d-block w-100 carousel-img"
                                        alt={`Banner ${index + 1}`}
                                    />
                                </div>
                            ))}
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
                <div className="doctor-carousel-container">
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="doctor-nav-button">←</button>

                    <div className="doctors-grid">
                        {visibleDoctors?.map((doctor) => (
                            <div className="doctor-card">
                                <div className="doctor-photo">
                                    <img className='doctor-photo' src={doctor.avatarUrl}></img>
                                </div>
                                <h3>{doctor.fullName}</h3>
                                <p className="specialty">Bác sĩ - {doctor.specializationName}</p>
                                <p className="specialty">{doctor.yearsOfExperience} năm kinh nghiệm</p>
                                <div className="rating">
                                    {'★'.repeat(Math.round(doctor.averageRating)) + '☆'.repeat(5 - Math.round(doctor.averageRating))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex + doctorsPerPage >= homeMetadata?.displayedDoctors.length}
                        className="doctor-nav-button">
                        →
                    </button>

                </div>
                <div className="view-all">
                    <button className="btn-view-all">XEM TẤT CẢ</button>
                </div>
            </section>
            {/* Knowledge Section */}
            <section className="knowledge">
                <h2>KIẾN THỨC SỨC KHỎE HỮU ÍCH</h2>
                <div className="knowledge-grid">
                    {homeMetadata?.articles.map((article) => (
                        <div className="knowledge-card">
                            <img className="knowledge-image" src={article.thumbnailUrl} />
                            <div className="knowledge-content">
                                <h5>{article.title}</h5>
                                <p> {article.summary}</p>
                            </div>
                            <div className="knowledge-footer">
                                <p className="knowledge-date">📅{article.publishedAt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />

            <div className="ai-bubble">
                <img src="/images/medix-logo-mirrored.jpg" alt="Chat" />
                <div className='status-indicator-sm'></div>
            </div>

        </div>
    )
}

export default HomePage;