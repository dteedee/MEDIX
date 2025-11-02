import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import doctorService from '../../services/doctorService';
import DoctorRegistrationFormService from '../../services/doctorRegistrationFormService';
import { ServiceTierWithPaginatedDoctorsDto, DoctorInTier, PaginationParams, DoctorTypeDegreeDto, DoctorQueryParameters } from '../../types/doctor.types';
import { useLanguage } from '../../contexts/LanguageContext';
import homeStyles from '../../styles/public/home.module.css';
import styles from '../../styles/patient/DoctorBookingList.module.css';

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
}

const convertApiDoctorToDoctor = (apiDoctor: DoctorInTier, tierName: string): Doctor => {
  const rating = typeof apiDoctor.rating === 'number' ? apiDoctor.rating : parseFloat(String(apiDoctor.rating)) || 0;
  
  return {
    id: apiDoctor.doctorId,
    fullName: apiDoctor.doctorName,
    degree: apiDoctor.education,
    specialty: apiDoctor.specialization,
    experience: `${apiDoctor.experience}+ năm kinh nghiệm`,
    rating: Math.max(0, Math.min(5, rating)),
    reviewCount: 0, // API doesn't provide review count
    price: apiDoctor.price,
    tier: tierName as 'Basic' | 'Professional' | 'Premium' | 'VIP',
    bio: apiDoctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực y tế.',
    imageUrl: undefined
  };
};

type TierType = 'Basic' | 'Professional' | 'Premium' | 'VIP';

const DoctorBookingList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Active tier tab
  const [activeTier, setActiveTier] = useState<TierType>('Basic');

  // API data states
  const [tiersData, setTiersData] = useState<ServiceTierWithPaginatedDoctorsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Metadata states
  const [specializations, setSpecializations] = useState<{id: string, name: string}[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [educationTypes, setEducationTypes] = useState<DoctorTypeDegreeDto[]>([]);
  const [educationLoading, setEducationLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedEducationCode, setSelectedEducationCode] = useState<string>('all');
  const [selectedSpecializationCode, setSelectedSpecializationCode] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Pagination states for each tier
  const [basicPagination, setBasicPagination] = useState({ pageNumber: 1, pageSize: 8 });
  const [professionalPagination, setProfessionalPagination] = useState({ pageNumber: 1, pageSize: 8 });
  const [premiumPagination, setPremiumPagination] = useState({ pageNumber: 1, pageSize: 8 });
  const [vipPagination, setVipPagination] = useState({ pageNumber: 1, pageSize: 8 });

  // Load metadata
  const loadMetadata = async () => {
    try {
      setMetadataLoading(true);
      const metadata = await DoctorRegistrationFormService.getMetadata();
      setSpecializations(metadata.specializations.map(s => ({ id: s.id, name: s.name })));
    } catch (err: any) {
      console.error('Error loading metadata:', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  // Load education types
  const loadEducationTypes = async () => {
    try {
      setEducationLoading(true);
      const educationData = await doctorService.getEducationTypes();
      setEducationTypes(educationData);
    } catch (err: any) {
      console.error('Error loading education types:', err);
    } finally {
      setEducationLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Debounce effect for price fields
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMinPrice(minPriceInput);
      setMaxPrice(maxPriceInput);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [minPriceInput, maxPriceInput]);

  // Load data from API for each tier
  const loadTierData = async (tierName: string, paginationParams: PaginationParams) => {
    try {
      const queryParams: DoctorQueryParameters = {
        ...paginationParams,
        educationCode: selectedEducationCode === 'all' ? undefined : selectedEducationCode,
        specializationCode: selectedSpecializationCode === 'all' ? undefined : selectedSpecializationCode,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
      };
      
      const data = await doctorService.getDoctorsGroupedByTier(queryParams);
      const tierData = data.find(t => t.name === tierName);
      return tierData;
    } catch (err: any) {
      console.error(`Error loading ${tierName} data:`, err);
      throw err;
    }
  };

  // Load metadata on component mount
  useEffect(() => {
    loadMetadata();
    loadEducationTypes();
  }, []);

  // Load all tiers data
  useEffect(() => {
    const loadAllTiersData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [basicData, professionalData, premiumData, vipData] = await Promise.all([
          loadTierData('Basic', basicPagination),
          loadTierData('Professional', professionalPagination),
          loadTierData('Premium', premiumPagination),
          loadTierData('VIP', vipPagination)
        ]);

        const allTiersData = [basicData, professionalData, premiumData, vipData].filter(
          (tier): tier is ServiceTierWithPaginatedDoctorsDto => tier !== undefined
        );
        setTiersData(allTiersData);
      } catch (err: any) {
        console.error('Error loading tiers data:', err);
        setError(err.message || 'Lỗi khi tải dữ liệu bác sĩ');
      } finally {
        setLoading(false);
      }
    };

    loadAllTiersData();
  }, [basicPagination, professionalPagination, premiumPagination, vipPagination, selectedEducationCode, selectedSpecializationCode, minPrice, maxPrice]);

  // Convert API data to doctors by tier with search filtering
  const getDoctorsByTier = (tierName: string): Doctor[] => {
    const tier = tiersData.find(t => t.name === tierName);
    if (!tier || !tier.doctors || !tier.doctors.items) return [];
    
    let doctors = tier.doctors.items.map(doctor => convertApiDoctorToDoctor(doctor, tierName));
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase().trim();
      doctors = doctors.filter(doctor => 
        doctor.fullName.toLowerCase().includes(searchLower) ||
        doctor.specialty.toLowerCase().includes(searchLower) ||
        doctor.degree.toLowerCase().includes(searchLower) ||
        doctor.bio.toLowerCase().includes(searchLower)
      );
    }
    
    return doctors;
  };

  // Get pagination info for each tier
  const getTierPaginationInfo = (tierName: string) => {
    const tier = tiersData.find(t => t.name === tierName);
    if (!tier || !tier.doctors) return { totalPages: 0, totalCount: 0 };
    return {
      totalPages: tier.doctors.totalPages,
      totalCount: tier.doctors.totalCount
    };
  };

  // Get current tier's doctors and pagination
  const currentDoctors = useMemo(() => getDoctorsByTier(activeTier), [tiersData, activeTier]);
  const currentPagination = useMemo(() => {
    switch (activeTier) {
      case 'Basic': return basicPagination;
      case 'Professional': return professionalPagination;
      case 'Premium': return premiumPagination;
      case 'VIP': return vipPagination;
    }
  }, [activeTier, basicPagination, professionalPagination, premiumPagination, vipPagination]);

  const currentPaginationInfo = useMemo(() => getTierPaginationInfo(activeTier), [tiersData, activeTier]);

  // Format helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ/phút';
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
      <div className={styles.ratingStars}>
        {[...Array(fullStars)].map((_, index) => (
          <span key={`full-${index}`} className={styles.starIcon}>⭐</span>
        ))}
        {hasHalfStar && (
          <span className={styles.starIcon} style={{ opacity: 0.5 }}>⭐</span>
        )}
        {[...Array(emptyStars)].map((_, index) => (
          <span key={`empty-${index}`} className={styles.starIconEmpty}>⭐</span>
        ))}
      </div>
    );
  };

  // Handlers
  const handleBooking = (doctorId: string) => {
    navigate(`/doctor/details/${doctorId}?tab=booking`);
  };

  const handleDoctorCardClick = (doctorId: string) => {
    navigate(`/doctor/details/${doctorId}`);
  };

  const handlePageChange = (page: number) => {
    switch (activeTier) {
      case 'Basic':
        setBasicPagination(prev => ({ ...prev, pageNumber: page }));
        break;
      case 'Professional':
        setProfessionalPagination(prev => ({ ...prev, pageNumber: page }));
        break;
      case 'Premium':
        setPremiumPagination(prev => ({ ...prev, pageNumber: page }));
        break;
      case 'VIP':
        setVipPagination(prev => ({ ...prev, pageNumber: page }));
        break;
    }
  };

  const handleEducationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEducationCode(event.target.value);
    resetPagination();
  };

  const handleSpecializationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecializationCode(event.target.value);
    resetPagination();
  };

  const handleMinPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinPriceInput(event.target.value);
  };

  const handleMaxPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPriceInput(event.target.value);
  };

  const resetFilters = () => {
    setSelectedEducationCode('all');
    setSelectedSpecializationCode('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    resetPagination();
  };

  const resetPagination = () => {
    setBasicPagination(prev => ({ ...prev, pageNumber: 1 }));
    setProfessionalPagination(prev => ({ ...prev, pageNumber: 1 }));
    setPremiumPagination(prev => ({ ...prev, pageNumber: 1 }));
    setVipPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  // Render doctor card
  const renderDoctorCard = (doctor: Doctor) => {
    const getTierClass = (tier: string) => {
      switch (tier) {
        case 'Basic': return styles.doctorCardBasic;
        case 'Professional': return styles.doctorCardProfessional;
        case 'Premium': return styles.doctorCardPremium;
        case 'VIP': return styles.doctorCardVip;
        default: return styles.doctorCardBasic;
      }
    };

    const getEducationBadgeClass = (tier: string) => {
      switch (tier) {
        case 'Basic': return styles.educationBadgeBasic;
        case 'Professional': return styles.educationBadgeProfessional;
        case 'Premium': return styles.educationBadgePremium;
        case 'VIP': return styles.educationBadgeVip;
        default: return styles.educationBadgeBasic;
      }
    };

    const getBookingButtonClass = (tier: string) => {
      switch (tier) {
        case 'Basic': return styles.bookingButtonBasic;
        case 'Professional': return styles.bookingButtonProfessional;
        case 'Premium': return styles.bookingButtonPremium;
        case 'VIP': return styles.bookingButtonVip;
        default: return styles.bookingButtonBasic;
      }
    };

    return (
      <div
        key={doctor.id}
        className={`${styles.doctorCard} ${getTierClass(doctor.tier)}`}
        onClick={() => handleDoctorCardClick(doctor.id)}
      >
        {/* Education Badge */}
        <div className={`${styles.educationBadge} ${getEducationBadgeClass(doctor.tier)}`}>
          {doctor.degree}
        </div>

        {/* Avatar */}
        <div className={styles.doctorAvatar}>
          <svg className={styles.doctorAvatarIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>

        {/* Doctor Info */}
        <div className={styles.doctorInfo}>
          <h3 className={styles.doctorName}>{doctor.fullName}</h3>
          <p className={styles.doctorSpecialty}>
            <i className={`bi bi-hospital ${styles.doctorSpecialtyIcon}`}></i>
            {doctor.specialty}
          </p>
          <p className={styles.doctorExperience}>
            <i className={`bi bi-clock-history ${styles.doctorExperienceIcon}`}></i>
            {doctor.experience}
          </p>
        </div>

        {/* Rating */}
        <div className={styles.doctorRating}>
          {renderStars(doctor.rating)}
          <span className={styles.ratingText}>({formatRating(doctor.rating)})</span>
          {doctor.reviewCount > 0 && (
            <span className={styles.reviewCount}>• {doctor.reviewCount} đánh giá</span>
          )}
        </div>

        {/* Price */}
        <div className={styles.doctorPrice}>
          <div className={styles.priceValue}>
            <i className={`bi bi-currency-dollar ${styles.priceIcon}`}></i>
            {formatPrice(doctor.price)}
          </div>
        </div>

        {/* Additional Details */}
        <div className={styles.doctorDetails}>
          <div className={styles.doctorDetailItem}>
            <i className={`bi bi-award ${styles.doctorDetailIcon}`}></i>
            <span className={styles.doctorDetailLabel}>Học vị:</span>
            <span>{doctor.degree}</span>
          </div>
          <div className={styles.doctorDetailItem}>
            <i className={`bi bi-clock-history ${styles.doctorDetailIcon}`}></i>
            <span className={styles.doctorDetailLabel}>Kinh nghiệm:</span>
            <span>{doctor.experience}</span>
          </div>
          {doctor.reviewCount === 0 && (
            <div className={styles.doctorDetailItem}>
              <i className={`bi bi-info-circle ${styles.doctorDetailIcon}`}></i>
              <span style={{ fontStyle: 'italic', color: '#9CA3AF' }}>Chưa có đánh giá</span>
            </div>
          )}
        </div>

        {/* Bio */}
        <p className={styles.doctorBio}>{doctor.bio}</p>

        {/* Booking Button */}
        <button
          className={`${styles.bookingButton} ${getBookingButtonClass(doctor.tier)}`}
          onClick={(e) => {
            e.stopPropagation();
            handleBooking(doctor.id);
          }}
        >
          <i className="bi bi-calendar-check"></i>
          Đặt Lịch Ngay
        </button>
      </div>
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (currentPaginationInfo.totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        {[...Array(currentPaginationInfo.totalPages)].map((_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`${styles.paginationButton} ${
              currentPagination.pageNumber === index + 1 ? styles.paginationButtonActive : ''
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <nav className={homeStyles["navbar"]}>
          <ul className={homeStyles["nav-menu"]}>
            <li>
              <a
                onClick={() => navigate('/')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}
              >
                {t('nav.home')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/ai-chat')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}
              >
                {t('nav.ai-diagnosis')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/specialties')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}
              >
                {t('nav.specialties')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/doctors')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}
              >
                {t('nav.doctors')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/app/articles')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/app/articles' ? homeStyles["active"] : ''}`}
              >
                {t('nav.health-articles')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/about')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}
              >
                {t('nav.about')}
              </a>
            </li>
          </ul>
        </nav>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingSpinner}></div>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>Đang tải dữ liệu bác sĩ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.pageContainer}>
        <nav className={homeStyles["navbar"]}>
          <ul className={homeStyles["nav-menu"]}>
            <li>
              <a
                onClick={() => navigate('/')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}
              >
                {t('nav.home')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/ai-chat')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}
              >
                {t('nav.ai-diagnosis')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/specialties')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}
              >
                {t('nav.specialties')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/doctors')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}
              >
                {t('nav.doctors')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/app/articles')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/app/articles' ? homeStyles["active"] : ''}`}
              >
                {t('nav.health-articles')}
              </a>
            </li>
            <li><span>|</span></li>
            <li>
              <a
                onClick={() => navigate('/about')}
                className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}
              >
                {t('nav.about')}
              </a>
            </li>
          </ul>
        </nav>
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Lỗi khi tải dữ liệu</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get tier names in Vietnamese
  const getTierNameVi = (tier: TierType): string => {
    switch (tier) {
      case 'Basic': return 'Cơ bản';
      case 'Professional': return 'Chuyên nghiệp';
      case 'Premium': return 'Cao cấp';
      case 'VIP': return 'VIP';
    }
  };

  // Get tier descriptions
  const getTierDescription = (tier: TierType) => {
    switch (tier) {
      case 'Basic':
        return 'Gói cơ bản cho bác sĩ mới với giá cả phù hợp';
      case 'Professional':
        return 'Gói chuyên nghiệp với nhiều tính năng hỗ trợ';
      case 'Premium':
        return 'Gói cao cấp với ưu tiên hiển thị và hỗ trợ chuyên biệt';
      case 'VIP':
        return 'Gói VIP đặc biệt với khả năng hiển thị tối đa và quản lý riêng biệt';
    }
  };

  const getTierTitleClass = (tier: TierType) => {
    switch (tier) {
      case 'Basic': return styles.tierTitleBasic;
      case 'Professional': return styles.tierTitleProfessional;
      case 'Premium': return styles.tierTitlePremium;
      case 'VIP': return styles.tierTitleVip;
    }
  };

  const getTierDescriptionClass = (tier: TierType) => {
    switch (tier) {
      case 'Basic': return styles.tierDescriptionBasic;
      case 'Professional': return styles.tierDescriptionProfessional;
      case 'Premium': return styles.tierDescriptionPremium;
      case 'VIP': return styles.tierDescriptionVip;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Navbar */}
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li>
            <a
              onClick={() => navigate('/')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}
            >
              {t('nav.home')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/ai-chat')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}
            >
              {t('nav.ai-diagnosis')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/specialties')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}
            >
              {t('nav.specialties')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/doctors')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}
            >
              {t('nav.doctors')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/app/articles')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/app/articles' ? homeStyles["active"] : ''}`}
            >
              {t('nav.health-articles')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/about')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}
            >
              {t('nav.about')}
            </a>
          </li>
        </ul>
      </nav>

      <div className={styles.contentWrapper}>
        {/* Header */}
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Danh Sách Bác Sĩ Được Đề Xuất</h1>
          <p className={styles.pageSubtitle}>Tìm và đặt lịch khám với các bác sĩ chuyên nghiệp</p>
        </div>

        {/* Notification Banner */}
        {!isAuthenticated && (
          <div className={styles.notificationBanner}>
            <div className={styles.notificationContent}>
              <span className={styles.notificationIcon}>ℹ️</span>
              <span className={styles.notificationText}>
                Bạn đang xem danh sách bác sĩ với tư cách khách. <strong>Đăng nhập để đặt lịch khám!</strong>
              </span>
            </div>
            <button onClick={() => navigate('/login')} className={styles.notificationButton}>
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className={styles.filterSection}>
          {/* Search Bar */}
          <div className={styles.searchBar}>
            <div className={styles.searchInputWrapper}>
              <i className={`bi bi-search ${styles.searchIcon}`}></i>
              <input
                type="text"
                placeholder="Tìm kiếm bác sĩ theo tên, chuyên khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={styles.searchClearButton}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`${styles.filterToggleButton} ${showAdvancedFilters ? styles.filterToggleButtonActive : ''}`}
            >
              <i className={`bi ${showAdvancedFilters ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              Bộ lọc nâng cao
            </button>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showAdvancedFilters && (
            <div className={styles.advancedFilters}>
              <div className={styles.filterGrid}>
                {/* Học vị filter */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <i className="bi bi-mortarboard"></i>
                    Học vị
                  </label>
                  <select
                    value={selectedEducationCode}
                    onChange={handleEducationChange}
                    className={styles.filterSelect}
                  >
                    <option value="all">Tất cả học vị</option>
                    {educationLoading ? (
                      <option disabled>Đang tải...</option>
                    ) : (
                      educationTypes.map((education) => (
                        <option key={education.code} value={education.code}>
                          {education.description}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Chuyên khoa filter */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <i className="bi bi-hospital"></i>
                    Chuyên khoa
                  </label>
                  <select
                    value={selectedSpecializationCode}
                    onChange={handleSpecializationChange}
                    className={styles.filterSelect}
                    disabled={metadataLoading}
                  >
                    {metadataLoading ? (
                      <option value="all">Đang tải...</option>
                    ) : (
                      <>
                        <option value="all">Tất cả chuyên khoa</option>
                        {specializations.map(spec => (
                          <option key={spec.id} value={spec.id}>
                            {spec.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Mức giá filter */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    <i className="bi bi-currency-dollar"></i>
                    Mức giá (VNĐ/phút)
                  </label>
                  <div className={styles.filterPriceGroup}>
                    <input
                      type="number"
                      placeholder="Từ"
                      value={minPriceInput}
                      onChange={handleMinPriceChange}
                      className={`${styles.filterInput} ${styles.filterPriceInput}`}
                    />
                    <span className={styles.filterPriceSeparator}>đến</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      value={maxPriceInput}
                      onChange={handleMaxPriceChange}
                      className={`${styles.filterInput} ${styles.filterPriceInput}`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.filterActions}>
                  <button className={`${styles.filterButton} ${styles.filterButtonSecondary}`} onClick={resetFilters}>
                    <i className="bi bi-arrow-clockwise"></i>
                    Đặt lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tier Tabs */}
        <div className={styles.tierTabs}>
          <button
            className={`${styles.tierTab} ${styles.tierTabBasic} ${activeTier === 'Basic' ? styles.tierTabBasicActive : ''}`}
            onClick={() => setActiveTier('Basic')}
          >
            GÓI {getTierNameVi('Basic').toUpperCase()}
          </button>
          <button
            className={`${styles.tierTab} ${styles.tierTabProfessional} ${activeTier === 'Professional' ? styles.tierTabProfessionalActive : ''}`}
            onClick={() => setActiveTier('Professional')}
          >
            GÓI {getTierNameVi('Professional').toUpperCase()}
          </button>
          <button
            className={`${styles.tierTab} ${styles.tierTabPremium} ${activeTier === 'Premium' ? styles.tierTabPremiumActive : ''}`}
            onClick={() => setActiveTier('Premium')}
          >
            GÓI {getTierNameVi('Premium').toUpperCase()}
          </button>
          <button
            className={`${styles.tierTab} ${styles.tierTabVip} ${activeTier === 'VIP' ? styles.tierTabVipActive : ''}`}
            onClick={() => setActiveTier('VIP')}
          >
            GÓI {getTierNameVi('VIP').toUpperCase()}
          </button>
        </div>

        {/* Tier Section */}
        <div className={styles.tierSection}>
          {/* Tier Header */}
          <div className={styles.tierHeader} style={{ borderLeftColor: activeTier === 'Basic' ? '#6B7280' : activeTier === 'Professional' ? '#0EA5E9' : activeTier === 'Premium' ? '#F59E0B' : '#EC4899' }}>
            <h2 className={`${styles.tierTitle} ${getTierTitleClass(activeTier)}`}>
              GÓI {getTierNameVi(activeTier).toUpperCase()}
            </h2>
            <p className={`${styles.tierDescription} ${getTierDescriptionClass(activeTier)}`}>
              {getTierDescription(activeTier)}
            </p>
          </div>

          {/* Doctors Grid */}
          {currentDoctors.length > 0 ? (
            <>
              <div className={styles.doctorsGrid}>
                {currentDoctors.map((doctor) => renderDoctorCard(doctor))}
              </div>
              {renderPagination()}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <p className={styles.emptyText}>Không tìm thấy bác sĩ nào với bộ lọc hiện tại</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorBookingList;
