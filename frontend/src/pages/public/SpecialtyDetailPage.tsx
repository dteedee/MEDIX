import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import specializationService, { SpecializationDetailDto } from '../../services/specializationService';
import doctorService from '../../services/doctorService';
import { DoctorInTier, ServiceTierWithPaginatedDoctorsDto, DoctorQueryParameters } from '../../types/doctor.types';
import homeStyles from '../../styles/public/home.module.css';
import styles from '../../styles/public/specialty.module.css';
import doctorBookingStyles from '../../styles/patient/DoctorBookingList.module.css';
import ChatbotBubble from '../../components/ChatbotBubble';
import BackToTopButton from '../../components/BackToTopButton';

interface Doctor {
  id: string;
  fullName: string;
  degree: string;
  specialty: string;
  experience: string;
  rating: number;
  reviewCount: number;
  price: number;
  tier: 'Basic' | 'Professional' | 'Premium' | 'VIP';
  bio: string;
  imageUrl?: string;
  isAcceptingAppointments?: boolean;
  totalDone?: number;
  totalAppointments?: number;
  successPercentage?: number;
  totalReviews?: number;
  totalCases?: number;
  successRate?: number;
  responseTime?: string;
}

type TabType = 'overview' | 'services' | 'technology' | 'doctors';

const SpecialtyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [specialization, setSpecialization] = useState<SpecializationDetailDto | null>(null);
  const [tiersData, setTiersData] = useState<ServiceTierWithPaginatedDoctorsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [doctorAvatars, setDoctorAvatars] = useState<Record<string, string>>({});
  const [doctorStatistics, setDoctorStatistics] = useState<Record<string, {
    totalCases: number;
    successRate: number;
    responseTime: string;
  }>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      loadSpecialization();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'doctors' && specialization) {
      loadDoctors();
    }
  }, [activeTab, specialization]);

  const loadSpecialization = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id) return;
      const data = await specializationService.getById(id);
      setSpecialization(data);
    } catch (err: any) {
      setError('Không thể tải thông tin chuyên khoa. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const convertApiDoctorToDoctor = (
    apiDoctor: DoctorInTier, 
    tierName: string, 
    avatarUrlMap?: Record<string, string>,
    statisticsMap?: Record<string, { totalCases: number; successRate: number; responseTime: string }>
  ): Doctor => {
    const rating = typeof apiDoctor.rating === 'number' ? apiDoctor.rating : parseFloat(String(apiDoctor.rating)) || 0;
    const experience = typeof apiDoctor.experience === 'number' ? apiDoctor.experience : parseInt(String(apiDoctor.experience)) || 0;
    
    const imageUrl = (apiDoctor as any).avatarUrl || avatarUrlMap?.[apiDoctor.doctorId] || undefined;
    
    const stats = statisticsMap?.[apiDoctor.doctorId] || 
      (apiDoctor.totalCases !== undefined ? {
        totalCases: apiDoctor.totalCases,
        successRate: apiDoctor.successRate || (apiDoctor.successfulCases && apiDoctor.totalCases > 0 
          ? Math.round((apiDoctor.successfulCases / apiDoctor.totalCases) * 100) 
          : 0),
        responseTime: apiDoctor.averageResponseTime 
          ? (apiDoctor.averageResponseTime < 60 ? `${Math.round(apiDoctor.averageResponseTime)} phút` : '1 giờ')
          : 'N/A'
      } : undefined);
    
    const totalCases = stats?.totalCases ?? 0;
    const successRate = stats?.successRate ?? 0;
    const responseTime = stats?.responseTime ?? 'N/A';
    const reviewCount = apiDoctor.reviewCount || (typeof (apiDoctor as any).numberOfReviews === 'number' ? (apiDoctor as any).numberOfReviews : 0);
    const totalDone = apiDoctor.totalDone ?? 0;
    const totalAppointments = apiDoctor.totalAppointments ?? 0;
    const successPercentage = apiDoctor.successPercentage ?? 0;
    const totalReviews = apiDoctor.totalReviews ?? 0;
    
    const safeTier =
      tierName === 'Basic' || tierName === 'Professional' || tierName === 'Premium' || tierName === 'VIP'
        ? tierName
        : 'Basic';
    
    return {
      id: apiDoctor.doctorId,
      fullName: apiDoctor.doctorName,
      degree: apiDoctor.education,
      specialty: apiDoctor.specialization,
      experience: `${experience}`,
      rating: Math.max(0, Math.min(5, rating)),
      reviewCount,
      price: apiDoctor.price,
      tier: safeTier as 'Basic' | 'Professional' | 'Premium' | 'VIP',
      bio: apiDoctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực y tế.',
      imageUrl,
      isAcceptingAppointments: apiDoctor.isAcceptingAppointments ?? true,
      totalDone,
      totalAppointments,
      successPercentage,
      totalReviews,
      totalCases,
      successRate,
      responseTime
    };
  };

  const loadDoctors = async () => {
    try {
      setDoctorsLoading(true);
      if (!specialization) return;
      
      const queryParams: DoctorQueryParameters = {
        specializationCode: specialization.id, // Backend parses this as Guid
        pageNumber: 1,
        pageSize: 100
      };
      
      const data = await doctorService.getDoctorsGroupedByTier(queryParams);
      setTiersData(data);
      
      const allDoctors = data.flatMap(tier => tier.doctors?.items || []);
      const avatarPromises = allDoctors.map(async (doctor) => {
        try {
          const profile = await doctorService.getDoctorProfile(doctor.doctorId);
          return { id: doctor.doctorId, avatarUrl: profile.avatarUrl || '' };
        } catch {
          return { id: doctor.doctorId, avatarUrl: '' };
        }
      });
      
      const avatarResults = await Promise.all(avatarPromises);
      const avatarMap: Record<string, string> = {};
      avatarResults.forEach(r => {
        if (r.avatarUrl) avatarMap[r.id] = r.avatarUrl;
      });
      setDoctorAvatars(avatarMap);
      
    } catch (err: any) {
    } finally {
      setDoctorsLoading(false);
    }
  };

  const doctors = useMemo(() => {
    const allDoctors: Doctor[] = [];
    tiersData.forEach(tier => {
      if (tier.doctors && tier.doctors.items) {
        tier.doctors.items.forEach(apiDoctor => {
          if (apiDoctor.isAcceptingAppointments !== false) {
            const doctor = convertApiDoctorToDoctor(apiDoctor, tier.name, doctorAvatars, doctorStatistics);
            allDoctors.push(doctor);
          }
        });
      }
    });
    return allDoctors;
  }, [tiersData, doctorAvatars, doctorStatistics]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const formatRating = (rating: number) => {
    const numRating = typeof rating === 'number' ? rating : parseFloat(String(rating)) || 0;
    return Math.max(0, Math.min(5, numRating)).toFixed(1);
  };

  const renderStars = (rating: number) => {
    const normalizedRating = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className={doctorBookingStyles.ratingStars}>
        {[...Array(fullStars)].map((_, index) => (
          <i key={`full-${index}`} className={`bi bi-star-fill ${doctorBookingStyles.starFilled}`}></i>
        ))}
        {hasHalfStar && (
          <i className={`bi bi-star-half ${doctorBookingStyles.starHalf}`}></i>
        )}
        {[...Array(emptyStars)].map((_, index) => (
          <i key={`empty-${index}`} className={`bi bi-star ${doctorBookingStyles.starEmpty}`}></i>
        ))}
      </div>
    );
  };

  const handleBooking = (doctorId: string) => {
    navigate(`/doctor/details/${doctorId}?tab=booking`);
  };

  const handleDoctorCardClick = (doctorId: string) => {
    navigate(`/doctor/details/${doctorId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  if (error || !specialization) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Chuyên khoa không tồn tại'}</div>
        <Link to="/specialties" className={styles.backButton}>
          Quay lại danh sách chuyên khoa
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Bar */}
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li>
            <Link to="/" className={homeStyles["nav-link"]}>
              {t('nav.home')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/ai-chat" className={homeStyles["nav-link"]}>
              {t('nav.ai-diagnosis')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/specialties" className={homeStyles["nav-link"]}>
              {t('nav.specialties')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/doctors" className={homeStyles["nav-link"]}>
              {t('nav.doctors')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/app/articles" className={homeStyles["nav-link"]}>
              {t('nav.health-articles')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/about" className={homeStyles["nav-link"]}>
              {t('nav.about')}
            </Link>
          </li>
        </ul>
      </nav>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <Link to="/">Trang chủ</Link> / <Link to="/specialties">Chuyên khoa</Link> / <span>{specialization.name}</span>
          </div>

          {/* Header */}
          <div className={styles.detailHeader}>
            <div className={styles.headerImage}>
              {specialization.imageUrl ? (
                <img src={specialization.imageUrl} alt={specialization.name} />
              ) : (
                <div className={styles.placeholderImageLarge}>
                  <i className="bi bi-hospital"></i>
                </div>
              )}
            </div>
            <div className={styles.headerContent}>
              <h1>{specialization.name.toUpperCase()}</h1>
              <div className={styles.headerStats}>
                <span className={styles.statItem}>
                  <i className="bi bi-people"></i>
                  {specialization.doctorCount} bác sĩ
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'services' ? styles.active : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Dịch vụ
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'technology' ? styles.active : ''}`}
              onClick={() => setActiveTab('technology')}
            >
              Công nghệ
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'doctors' ? styles.active : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              Danh sách bác sĩ
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'overview' && (
              <div className={styles.overviewSection}>
                <h2>Giới thiệu về {specialization.name}</h2>
                <div className={styles.overviewText}>
                  {specialization.overview || specialization.description ? (
                    <div dangerouslySetInnerHTML={{ __html: specialization.overview || specialization.description || '' }} />
                  ) : (
                    <>
                      <div className={styles.introCard}>
                        <div className={styles.introIcon}>
                          <i className="bi bi-hospital"></i>
                        </div>
                        <div className={styles.introContent}>
                          <h3>Chuyên khoa {specialization.name}</h3>
                          <p>
                            {specialization.name} là một trong những chuyên khoa quan trọng của hệ thống y tế MEDIX. 
                            Với đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo chuyên sâu và trang thiết bị hiện đại, 
                            chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao, an toàn và hiệu quả cho bệnh nhân.
                          </p>
                        </div>
                      </div>
                      
                      <div className={styles.highlightsGrid}>
                        <div className={styles.highlightCard}>
                          <div className={styles.highlightIcon}>
                            <i className="bi bi-people-fill"></i>
                          </div>
                          <h4>Đội ngũ chuyên nghiệp</h4>
                          <p>Với {specialization.doctorCount} bác sĩ có trình độ chuyên môn cao, nhiều năm kinh nghiệm</p>
                        </div>
                        <div className={styles.highlightCard}>
                          <div className={styles.highlightIcon}>
                            <i className="bi bi-award-fill"></i>
                          </div>
                          <h4>Chất lượng hàng đầu</h4>
                          <p>Tuân thủ các tiêu chuẩn y tế quốc tế, đảm bảo an toàn và hiệu quả điều trị</p>
                        </div>
                        <div className={styles.highlightCard}>
                          <div className={styles.highlightIcon}>
                            <i className="bi bi-clock-history"></i>
                          </div>
                          <h4>Hỗ trợ 24/7</h4>
                          <p>Dịch vụ tư vấn và đặt lịch hẹn trực tuyến, hỗ trợ bệnh nhân mọi lúc mọi nơi</p>
                        </div>
                        <div className={styles.highlightCard}>
                          <div className={styles.highlightIcon}>
                            <i className="bi bi-shield-check"></i>
                          </div>
                          <h4>Bảo mật thông tin</h4>
                          <p>Hệ thống bảo mật cao, mã hóa dữ liệu y tế theo chuẩn quốc tế</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className={styles.servicesSection}>
                <h2>Dịch vụ {specialization.name}</h2>
                {specialization.services ? (
                  <div className={styles.servicesText} dangerouslySetInnerHTML={{ __html: specialization.services }} />
                ) : (
                  <div className={styles.servicesContent}>
                    <div className={styles.servicesIntro}>
                      <p>
                        Chuyên khoa <strong>{specialization.name}</strong> của MEDIX cung cấp đầy đủ các dịch vụ y tế 
                        chuyên sâu, từ khám chẩn đoán đến điều trị và theo dõi, đảm bảo chăm sóc toàn diện cho bệnh nhân.
                      </p>
                    </div>
                    
                    <div className={styles.servicesGrid}>
                      <div className={styles.serviceCard}>
                        <div className={styles.serviceIcon}>
                          <i className="bi bi-clipboard-pulse"></i>
                        </div>
                        <h3>Khám và tư vấn chuyên khoa</h3>
                        <ul>
                          <li>Khám lâm sàng chi tiết</li>
                          <li>Tư vấn chuyên sâu về bệnh lý</li>
                          <li>Đánh giá tình trạng sức khỏe</li>
                          <li>Lập kế hoạch điều trị cá nhân hóa</li>
                        </ul>
                      </div>
                      
                      <div className={styles.serviceCard}>
                        <div className={styles.serviceIcon}>
                          <i className="bi bi-heart-pulse"></i>
                        </div>
                        <h3>Chẩn đoán và điều trị</h3>
                        <ul>
                          <li>Chẩn đoán chính xác bằng công nghệ hiện đại</li>
                          <li>Điều trị theo phác đồ chuẩn quốc tế</li>
                          <li>Theo dõi tiến triển bệnh</li>
                          <li>Điều chỉnh phác đồ khi cần thiết</li>
                        </ul>
                      </div>
                      
                      <div className={styles.serviceCard}>
                        <div className={styles.serviceIcon}>
                          <i className="bi bi-file-earmark-medical"></i>
                        </div>
                        <h3>Quản lý hồ sơ bệnh án</h3>
                        <ul>
                          <li>Hồ sơ bệnh án điện tử (EMR)</li>
                          <li>Lưu trữ lịch sử khám bệnh</li>
                          <li>Tra cứu kết quả xét nghiệm</li>
                          <li>Chia sẻ thông tin với bác sĩ khác</li>
                        </ul>
                      </div>
                      
                      <div className={styles.serviceCard}>
                        <div className={styles.serviceIcon}>
                          <i className="bi bi-calendar-check"></i>
                        </div>
                        <h3>Đặt lịch hẹn trực tuyến</h3>
                        <ul>
                          <li>Đặt lịch hẹn 24/7 qua website/app</li>
                          <li>Chọn bác sĩ và thời gian phù hợp</li>
                          <li>Nhận thông báo nhắc nhở tự động</li>
                          <li>Hủy hoặc đổi lịch dễ dàng</li>
                        </ul>
                      </div>
                      
                      <div className={styles.serviceCard}>
                        <div className={styles.serviceIcon}>
                          <i className="bi bi-chat-dots"></i>
                        </div>
                        <h3>Tư vấn sức khỏe</h3>
                        <ul>
                          <li>Tư vấn phòng ngừa bệnh tật</li>
                          <li>Hướng dẫn chăm sóc sức khỏe</li>
                          <li>Tư vấn dinh dưỡng và lối sống</li>
                          <li>Giải đáp thắc mắc về sức khỏe</li>
                        </ul>
                      </div>
                      
                      <div className={styles.serviceCard}>
                        <div className={styles.serviceIcon}>
                          <i className="bi bi-phone-vibrate"></i>
                        </div>
                        <h3>Hỗ trợ và theo dõi</h3>
                        <ul>
                          <li>Nhắc nhở uống thuốc</li>
                          <li>Theo dõi sau điều trị</li>
                          <li>Hỗ trợ khẩn cấp 24/7</li>
                          <li>Tư vấn từ xa qua video call</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'technology' && (
              <div className={styles.technologySection}>
                <h2>Công nghệ và trang thiết bị</h2>
                {specialization.technology ? (
                  <div className={styles.technologyText} dangerouslySetInnerHTML={{ __html: specialization.technology }} />
                ) : (
                  <div className={styles.technologyContent}>
                    <div className={styles.techIntro}>
                      <p>
                        Chuyên khoa <strong>{specialization.name}</strong> được trang bị hệ thống công nghệ và 
                        thiết bị y tế hiện đại nhất, đảm bảo chẩn đoán chính xác và điều trị hiệu quả.
                      </p>
                    </div>
                    
                    <div className={styles.techCategories}>
                      <div className={styles.techCategory}>
                        <div className={styles.techCategoryHeader}>
                          <i className="bi bi-robot"></i>
                          <h3>Công nghệ AI và Chẩn đoán</h3>
                        </div>
                        <div className={styles.techItems}>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Hệ thống AI chẩn đoán với độ chính xác 95%</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Phân tích hình ảnh y tế bằng AI</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Hỗ trợ quyết định lâm sàng thông minh</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Dự đoán nguy cơ bệnh tật</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.techCategory}>
                        <div className={styles.techCategoryHeader}>
                          <i className="bi bi-cpu"></i>
                          <h3>Thiết bị Y tế Hiện đại</h3>
                        </div>
                        <div className={styles.techItems}>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Máy siêu âm, X-quang, CT, MRI thế hệ mới</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Thiết bị xét nghiệm tự động</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Máy monitor theo dõi bệnh nhân</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Thiết bị phẫu thuật nội soi tiên tiến</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.techCategory}>
                        <div className={styles.techCategoryHeader}>
                          <i className="bi bi-cloud"></i>
                          <h3>Hệ thống Quản lý Điện tử</h3>
                        </div>
                        <div className={styles.techItems}>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Hệ thống EMR (Hồ sơ bệnh án điện tử)</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Quản lý lịch hẹn tự động</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Hệ thống nhắc nhở thông minh</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Kết nối liên thông giữa các khoa</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.techCategory}>
                        <div className={styles.techCategoryHeader}>
                          <i className="bi bi-shield-lock"></i>
                          <h3>Bảo mật và An toàn</h3>
                        </div>
                        <div className={styles.techItems}>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Mã hóa dữ liệu AES-256</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Tuân thủ chuẩn HIPAA và ISO 27001</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Backup dữ liệu tự động</span>
                          </div>
                          <div className={styles.techItem}>
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Xác thực đa yếu tố (2FA/MFA)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className={styles.doctorsSection}>
                <h2>Danh sách bác sĩ {specialization.name}</h2>
                {doctorsLoading ? (
                  <div className={styles.loading}>Đang tải danh sách bác sĩ...</div>
                ) : doctors.length === 0 ? (
                  <div className={styles.noDoctors}>
                    <p>Hiện tại chưa có bác sĩ nào trong chuyên khoa này.</p>
                    <Link to="/doctors" className={styles.viewAllDoctors}>
                      Xem tất cả bác sĩ
                    </Link>
                  </div>
                ) : (
                  <div className={`${doctorBookingStyles.doctorsGrid} ${styles.doctorsGridWrapper}`}>
                    {doctors.map((doctor) => {
                      const totalDone = doctor.totalDone ?? 0;
                      const successPercentage = doctor.successPercentage ?? 0;
                      const totalReviews = doctor.totalReviews ?? 0;
                      
                      const tierClassMap: Record<string, string> = {
                        'Basic': doctorBookingStyles.tierBasic,
                        'Professional': doctorBookingStyles.tierProfessional,
                        'Premium': doctorBookingStyles.tierPremium,
                        'VIP': doctorBookingStyles.tierVip
                      };
                      const tierClass = tierClassMap[doctor.tier] || doctorBookingStyles.tierBasic;
                      
                      return (
                        <div
                          key={doctor.id}
                          className={`${doctorBookingStyles.doctorCard} ${tierClass}`}
                          onClick={() => handleDoctorCardClick(doctor.id)}
                        >
                          {/* Card Top Section */}
                          <div className={doctorBookingStyles.cardTopSection}>
                            {/* Doctor Avatar */}
                            <div className={doctorBookingStyles.doctorAvatar}>
                              {doctor.imageUrl ? (
                                <img src={doctor.imageUrl} alt={doctor.fullName} />
                              ) : (
                                <div className={doctorBookingStyles.avatarPlaceholder}>
                                  <i className="bi bi-person"></i>
                                </div>
                              )}
                            </div>

                            {/* Doctor Header */}
                            <div className={doctorBookingStyles.doctorHeader}>
                              <h3 className={doctorBookingStyles.doctorName}>{doctor.fullName}</h3>
                              <div className={doctorBookingStyles.doctorDegree}>
                                <i className="bi bi-mortarboard-fill"></i>
                                {doctor.degree}
                              </div>
                            </div>

                            {/* Specialty and Experience */}
                            <div className={doctorBookingStyles.doctorSpecialty}>
                              <i className="bi bi-hospital"></i>
                              <span>{doctor.specialty}</span>
                            </div>

                            {/* Key Stats for Patients */}
                            <div className={doctorBookingStyles.doctorStats}>
                              <div className={doctorBookingStyles.statItem}>
                                <div className={doctorBookingStyles.statIcon}>
                                  <i className="bi bi-clipboard-check"></i>
                                </div>
                                <div className={doctorBookingStyles.statContent}>
                                  <div className={doctorBookingStyles.statValue}>{totalDone.toLocaleString('vi-VN')}</div>
                                  <div className={doctorBookingStyles.statLabel}>Ca đã thực hiện</div>
                                </div>
                              </div>
                              <div className={doctorBookingStyles.statItem}>
                                <div className={doctorBookingStyles.statIcon}>
                                  <i className="bi bi-check-circle"></i>
                                </div>
                                <div className={doctorBookingStyles.statContent}>
                                  <div className={doctorBookingStyles.statValue}>{successPercentage}%</div>
                                  <div className={doctorBookingStyles.statLabel}>Thành công</div>
                                </div>
                              </div>
                              <div className={doctorBookingStyles.statItem}>
                                <div className={doctorBookingStyles.statIcon}>
                                  <i className="bi bi-chat-left-text"></i>
                                </div>
                                <div className={doctorBookingStyles.statContent}>
                                  <div className={doctorBookingStyles.statValue}>{totalReviews.toLocaleString('vi-VN')}</div>
                                  <div className={doctorBookingStyles.statLabel}>Phản hồi</div>
                                </div>
                              </div>
                            </div>

                            {/* Rating and Reviews */}
                            {doctor.reviewCount > 0 && (
                              <div className={doctorBookingStyles.ratingSection}>
                                <div className={doctorBookingStyles.ratingStars}>
                                  {renderStars(doctor.rating)}
                                </div>
                                <div className={doctorBookingStyles.ratingInfo}>
                                  <span className={doctorBookingStyles.ratingNumber}>{formatRating(doctor.rating)}</span>
                                  <span className={doctorBookingStyles.ratingText}>· {doctor.reviewCount} đánh giá</span>
                                </div>
                              </div>
                            )}

                            {/* Price */}
                            <div className={doctorBookingStyles.priceSection}>
                              <span className={doctorBookingStyles.priceLabel}>Giá</span>
                              <span className={doctorBookingStyles.priceValue}>{formatPrice(doctor.price)}</span>
                              <span className={doctorBookingStyles.priceUnit}>/lần hẹn</span>
                            </div>

                            {/* Booking Button */}
                            <button
                              className={doctorBookingStyles.bookingButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBooking(doctor.id);
                              }}
                            >
                              <i className="bi bi-calendar-check"></i>
                              Đặt lịch ngay
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <BackToTopButton />
      <ChatbotBubble />
    </div>
  );
};

export default SpecialtyDetailPage;

