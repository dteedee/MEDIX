import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/home.module.css'
import { HomeMetadata } from '../types/home.types';
import Footer from '../components/layout/Footer';
import HomeService from '../services/homeService';
import {Header} from '../components/layout/Header';

function HomePage() {
    const navigate = useNavigate();

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
            <nav>
                <ul className={styles["nav-menu"]} style={{ justifyContent: 'center' }}>
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
            <section className={styles["hero"]}>
                <div className={styles["hero-content"]}>
                    <div className={styles["hero-text"]}>
                        <h1>CHĂM SÓC SỨC KHỎE TOÀN DIỆN<br />TIÊU CHUẨN QUỐC TẾ</h1>
                        <p>Đội ngũ giáo sư, bác sĩ đầu ngành – Công nghệ<br />AI tiên tiến – Dịch vụ chăm sóc cá nhân hóa</p>
                        <div className={styles["features-box"]}>
                            <div className={styles["feature-item"]}>
                                <div>
                                    <strong>AI chẩn đoán</strong><br />
                                    <small>Tư vấn và giải đáp các vấn đề của bạn</small>
                                </div>
                            </div>
                            <div className={styles["feature-item"]}>
                                <div>
                                    <strong>Đặt lịch hẹn</strong><br />
                                    <small>Đặt lịch hẹn nhanh chóng, tiện lợi</small>
                                </div>
                            </div>
                            <div className={styles["feature-item"]}>
                                <div>
                                    <strong>Tìm bác sĩ</strong><br />
                                    <small>Tìm chuyên gia nhanh chóng</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="carouselBanner" className="carousel slide" data-bs-ride="carousel">
                        <div className="carousel-inner">
                            {homeMetadata?.bannerUrls.map((bannerUrl, index) => (
                                <div className={`carousel-item${index === 0 ? ' active' : ''}`} key={index}>
                                    <img
                                        src={bannerUrl}
                                        className={`d-block w-100 ${styles['carousel-img']}`}
                                        alt={`Banner ${index + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                        <button className="carousel-control-prev" type="button" data-bs-target="#carouselBanner" data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true" />
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target="#carouselBanner" data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true" />
                            <span className="visually-hidden">Next</span>
                        </button>
                    </div>
                </div>
            </section>
            {/* Why Choose Section */}
            <section className={styles["why-choose"]}>
                <h2>TẠI SAO NÊN CHỌN MEDIX</h2>
                <div className={styles["why-content"]}>
                    <div className={styles["doctor-image"]}>
                        <img src="/images/why-choose-doctor.png" alt="Doctor" />
                    </div>
                    <div className={styles["benefits"]}>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-1.png" className={styles["icon"]} />
                            <h3>Chuyên gia hàng đầu</h3>
                            <p>MEDIX quy tụ đội ngũ chuyên gia, bác sĩ, dược sĩ và điều dưỡng có trình độ chuyên môn cao, tay
                                nghề giỏi, tận tâm và chuyên nghiệp. Luôn đặt người bệnh làm trung tâm, Medix cam kết đem đến
                                dịch vụ chăm sóc sức khỏe tốt cho khách hàng.</p>
                        </div>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-2.png" className={styles["icon"]} />
                            <h3>Chất lượng quốc tế</h3>
                            <p>Hệ thống Y tế MEDIX được quản lý và vận hành dưới sự giám sát của những nhà quản lý y tế giàu
                                kinh nghiệm, cùng với sự hỗ trợ của phương tiện kỹ thuật hiện đại, nhằm đảm bảo cung cấp dịch vụ
                                chăm sóc sức khỏe toàn diện và hiệu quả.</p>
                        </div>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-3.png" className={styles["icon"]} />
                            <h3>Nghiên cứu &amp; Đổi mới</h3>
                            <p>MEDIX liên tục thúc đẩy y học hàn lâm dựa trên nghiên cứu có phương pháp và sự phát triển y tế
                                được chia sẻ từ quan hệ đối tác toàn cầu với các hệ thống chăm sóc sức khỏe hàng đầu thế giới
                                nhằm cung cấp các phương pháp điều trị mang tính cách mạng và sáng tạo cho tiêu chuẩn chăm sóc
                                bệnh nhân tốt nhất.</p>
                        </div>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-1.png" className={styles["icon"]} />
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
            <section className={styles["ai-section"]}>
                <div className={styles["ai-content"]}>
                    <div className={styles["ai-badge"]}>CÔNG NGHỆ AI</div>
                    <div className={styles["ai-features"]}>
                        <div className={styles["ai-robot"]}>
                            <div className={styles["robot-circle"]}>
                                <div className={styles["robot-icon"]}>
                                    <img src="/images/medix-logo.png" />
                                </div>
                                <div className={styles["status-indicator"]} />
                            </div>
                        </div>
                        <div className={styles["ai-text"]}>
                            <p>Hệ thống AI của chúng tôi có khả năng phân tích triệu chứng, đưa ra các tư vấn y tế ban đầu, hỗ
                                trợ đặt lịch khám và theo dõi sức khỏe liên tục. Công nghệ AI giúp tối ưu hóa quy trình chăm sóc
                                sức khỏe, tiết kiệm thời gian và nâng cao chất lượng dịch vụ.</p>
                        </div>
                    </div>
                    <div className={styles["ai-features"]}>
                        <div className={styles["ai-text"]}>
                            <p>Hệ thống AI của chúng tôi có khả năng phân tích triệu chứng, đưa ra các tư vấn y tế ban đầu, hỗ
                                trợ đặt lịch khám và theo dõi sức khỏe liên tục. Công nghệ AI giúp tối ưu hóa quy trình chăm sóc
                                sức khỏe, tiết kiệm thời gian và nâng cao chất lượng dịch vụ.</p>
                        </div>
                        <div className={styles["ai-robot"]}>
                            <div className={styles["robot-circle"]}>
                                <div className={styles["robot-icon"]}>
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
            <section className={styles["steps"]}>
                <h2>HƯỚNG DẪN SỬ DỤNG: 3 BƯỚC ĐƠN GIẢN</h2>
                <div className={styles["steps-container"]}>
                    <div className={styles["step"]}>
                        <div className={styles["step-circle"]}>01</div>
                        <div className={styles["step-icon"]}>⏰</div>
                        <h3>Tra cứu triệu chứng với AI</h3>
                        <p>Bạn chỉ cần nhập các triệu chứng đang gặp phải — hệ thống AI sẽ phân tích và đưa ra gợi ý ban đầu về tình trạng sức khỏe, giúp bạn hiểu rõ hơn trước khi gặp bác sĩ.</p>
                    </div>
                    <div className={styles["step"]}>
                        <div className={styles["step-circle"]}>02</div>
                        <div className={styles["step-icon"]}>⭐</div>
                        <h3>Đăng ký tài khoản cá nhân</h3>
                        <p>Việc tạo tài khoản giúp bạn lưu trữ lịch sử khám bệnh, thông tin cá nhân và dễ dàng quản lý các cuộc hẹn trong tương lai. Quá trình đăng ký nhanh chóng, bảo mật và hoàn toàn miễn phí.</p>
                    </div>
                    <div className={styles["step"]}>
                        <div className={styles["step-circle"]}>03</div>
                        <div className={styles["step-icon"]}>💡</div>
                        <h3>Đặt lịch hẹn với bác sĩ chuyên khoa</h3>
                        <p>Sau khi có thông tin ban đầu, bạn có thể chọn bác sĩ phù hợp và đặt lịch khám trực tuyến ngay trên hệ thống. Lịch hẹn được xác nhận nhanh chóng, giúp bạn tiết kiệm thời gian và chủ động chăm sóc sức khỏe.</p>
                    </div>
                </div>
            </section>
            {/* Doctors Section */}
            <section className={styles["doctors"]}>
                <h2>ĐỘI NGŨ BÁC SĨ CỦA CHÚNG TÔI</h2>
                <div className={styles["doctor-carousel-container"]}>
                    <button onClick={handlePrev} disabled={currentIndex === 0} className={styles["doctor-nav-button"]}>←</button>

                    <div className={styles["doctors-grid"]}>
                        {visibleDoctors?.map((doctor, index) => (
                            <a key={`doctor-${doctor.userName}-${index}`} href={`/doctor/details/${doctor.userName}`} className={styles["doctor-card"]}>
                                <div className={styles["doctor-photo"]}>
                                    <img className={styles['doctor-photo']} src={doctor.avatarUrl}></img>
                                </div>
                                <h3>{doctor.fullName}</h3>
                                <p className={styles["specialty"]}>Bác sĩ - {doctor.specializationName}</p>
                                <p className={styles["specialty"]}>{doctor.yearsOfExperience} năm kinh nghiệm</p>
                                <div className={styles["rating"]}>
                                    {'★'.repeat(Math.round(doctor.averageRating)) + '☆'.repeat(5 - Math.round(doctor.averageRating))}
                                </div>
                            </a>
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex + doctorsPerPage >= (homeMetadata?.displayedDoctors?.length ?? 0)}
                        className={styles["doctor-nav-button"]}>
                        →
                    </button>

                </div>
                <div className={styles["view-all"]}>
                    <button 
                        className={styles["btn-view-all"]}
                        onClick={() => navigate('/doctors')}
                    >
                        XEM TẤT CẢ
                    </button>
                </div>
            </section >
            {/* Knowledge Section */}
            < section className={styles["knowledge"]} >
                <h2>KIẾN THỨC SỨC KHỎE HỮU ÍCH</h2>
                <div className={styles["knowledge-grid"]}>
                    {homeMetadata?.articles.map((article, index) => (
                        <div key={`/app/article-${article.title}-${index}`} className={styles["knowledge-card"]}>
                            <img className={styles["knowledge-image"]} src={article.thumbnailUrl} />
                            <div className={styles["knowledge-content"]}>
                                <h5>{article.title}</h5>
                                <p> {article.summary}</p>
                            </div>
                            <div className={styles["knowledge-footer"]}>
                                <p className={styles["knowledge-date"]}>📅{article.publishedAt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section >

            

            <div className={styles["ai-bubble"]}>
                <img src="/images/medix-logo-mirrored.jpg" alt="Chat" />
                <div className={styles['status-indicator-sm']}></div>
            </div>

        </div >
    )
}

export default HomePage;
