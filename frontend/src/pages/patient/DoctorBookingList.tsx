import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  totalCases?: number;
  successRate?: number;
  responseTime?: string;
}

const convertApiDoctorToDoctor = (apiDoctor: DoctorInTier, tierName: string, avatarUrlMap?: Record<string, string>): Doctor => {
  const rating = typeof apiDoctor.rating === 'number' ? apiDoctor.rating : parseFloat(String(apiDoctor.rating)) || 0;
  const experience = typeof apiDoctor.experience === 'number' ? apiDoctor.experience : parseInt(String(apiDoctor.experience)) || 0;
  
  // Check if avatarUrl is in API response (even if not in TypeScript interface)
  // Or get from avatarUrlMap if fetched separately
  const imageUrl = (apiDoctor as any).avatarUrl || avatarUrlMap?.[apiDoctor.doctorId] || undefined;
  
  // Calculate mock stats based on experience and rating (for demo)
  // These should ideally come from API in production
  const totalCases = Math.max(0, experience * 50 + Math.floor(Math.random() * 200));
  const successRate = Math.max(85, Math.min(99, 85 + (rating * 2.5) + Math.floor(Math.random() * 5)));
  const responseTimeMinutes = Math.max(5, Math.min(60, 30 - (rating * 5) + Math.floor(Math.random() * 10)));
  const responseTime = responseTimeMinutes < 60 ? `${responseTimeMinutes} phút` : '1 giờ';
  
  return {
    id: apiDoctor.doctorId,
    fullName: apiDoctor.doctorName,
    degree: apiDoctor.education,
    specialty: apiDoctor.specialization,
    experience: `${experience}`,
    rating: Math.max(0, Math.min(5, rating)),
    reviewCount: Math.floor(totalCases * 0.3), // Estimate review count as 30% of cases
    price: apiDoctor.price,
    tier: tierName as 'Basic' | 'Professional' | 'Premium' | 'VIP',
    bio: apiDoctor.bio || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực y tế.',
    imageUrl,
    totalCases,
    successRate,
    responseTime
  };
};

type TierType = 'Basic' | 'Professional' | 'Premium' | 'VIP';

const DoctorBookingList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [activeTier, setActiveTier] = useState<TierType>('Basic');
  const [tiersData, setTiersData] = useState<ServiceTierWithPaginatedDoctorsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorAvatars, setDoctorAvatars] = useState<Record<string, string>>({});
  
  const [specializations, setSpecializations] = useState<{id: string, name: string}[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [educationTypes, setEducationTypes] = useState<DoctorTypeDegreeDto[]>([]);
  const [educationLoading, setEducationLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [selectedEducationCode, setSelectedEducationCode] = useState<string>('all');
  const [selectedSpecializationCode, setSelectedSpecializationCode] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000]);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 3000000]);

  const [basicPagination, setBasicPagination] = useState({ pageNumber: 1, pageSize: 9 });
  const [professionalPagination, setProfessionalPagination] = useState({ pageNumber: 1, pageSize: 9 });
  const [premiumPagination, setPremiumPagination] = useState({ pageNumber: 1, pageSize: 9 });
  const [vipPagination, setVipPagination] = useState({ pageNumber: 1, pageSize: 9 });

  // Refs to prevent double loading
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load metadata and education types only once on mount
  useEffect(() => {
    mountedRef.current = true;
    const loadInitialData = async () => {
      try {
        const [metadata, educationData] = await Promise.all([
          DoctorRegistrationFormService.getMetadata(),
          doctorService.getEducationTypes()
        ]);
        if (mountedRef.current) {
          setSpecializations(metadata.specializations.map(s => ({ id: s.id, name: s.name })));
          setEducationTypes(educationData);
          setMetadataLoading(false);
          setEducationLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        if (mountedRef.current) {
          setMetadataLoading(false);
          setEducationLoading(false);
        }
      }
    };
    loadInitialData();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Debounce price range
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPriceRange(tempPriceRange);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [tempPriceRange]);

  // Memoize loadTierData
  const loadTierData = useCallback(async (tierName: string, paginationParams: PaginationParams, educationCode: string, specializationCode: string, priceRange: [number, number]) => {
    const queryParams: DoctorQueryParameters = {
      ...paginationParams,
      educationCode: educationCode === 'all' ? undefined : educationCode,
      specializationCode: specializationCode === 'all' ? undefined : specializationCode,
      minPrice: priceRange[0],
      maxPrice: priceRange[1]
    };
    
    const data = await doctorService.getDoctorsGroupedByTier(queryParams);
    return data.find(t => t.name === tierName);
  }, []);

  // Load all tiers data - optimized
  useEffect(() => {
    // Clear any pending timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce the actual loading to prevent rapid-fire requests
    loadingTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [basicData, professionalData, premiumData, vipData] = await Promise.all([
          loadTierData('Basic', basicPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('Professional', professionalPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('Premium', premiumPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('VIP', vipPagination, selectedEducationCode, selectedSpecializationCode, priceRange)
        ]);

        if (mountedRef.current) {
          const allTiersData = [basicData, professionalData, premiumData, vipData].filter(
            (tier): tier is ServiceTierWithPaginatedDoctorsDto => tier !== undefined
          );
          setTiersData(allTiersData);
          
          // Load avatars for doctors that don't have avatarUrl in the response
          const allDoctors = allTiersData.flatMap(tier => tier.doctors?.items || []);
          const doctorsNeedingAvatar = allDoctors.filter(doctor => 
            !(doctor as any).avatarUrl && doctor.doctorId
          );
          
          if (doctorsNeedingAvatar.length > 0) {
            // Fetch avatars in parallel (limit to avoid too many requests)
            Promise.all(
              doctorsNeedingAvatar.slice(0, 20).map(async (doctor) => {
                try {
                  const profile = await doctorService.getDoctorProfile(doctor.doctorId);
                  if (profile.avatarUrl) {
                    return { doctorId: doctor.doctorId, avatarUrl: profile.avatarUrl };
                  }
                } catch (error) {
                  console.log(`Could not fetch avatar for doctor ${doctor.doctorId}:`, error);
                }
                return null;
              })
            ).then(results => {
              if (mountedRef.current) {
                const newAvatars: Record<string, string> = {};
                results.forEach(result => {
                  if (result && result.avatarUrl) {
                    newAvatars[result.doctorId] = result.avatarUrl;
                  }
                });
                setDoctorAvatars(prev => ({ ...prev, ...newAvatars }));
              }
            });
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        if (mountedRef.current) {
          console.error('Error loading tiers data:', err);
          setError(err.message || 'Lỗi khi tải dữ liệu bác sĩ');
          setLoading(false);
        }
      }
    }, 150); // Small delay to batch rapid changes

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [basicPagination, professionalPagination, premiumPagination, vipPagination, selectedEducationCode, selectedSpecializationCode, priceRange, loadTierData]);

  const getDoctorsByTier = (tierName: string): Doctor[] => {
    const tier = tiersData.find(t => t.name === tierName);
    if (!tier || !tier.doctors || !tier.doctors.items) return [];
    
    let doctors = tier.doctors.items.map(doctor => convertApiDoctorToDoctor(doctor, tierName, doctorAvatars));
    
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

  const getTierPaginationInfo = (tierName: string) => {
    const tier = tiersData.find(t => t.name === tierName);
    if (!tier || !tier.doctors) return { totalPages: 0, totalCount: 0 };
    return {
      totalPages: tier.doctors.totalPages,
      totalCount: tier.doctors.totalCount
    };
  };

  const currentDoctors = useMemo(() => getDoctorsByTier(activeTier), [tiersData, activeTier, debouncedSearch]);
  const currentPagination = useMemo(() => {
    switch (activeTier) {
      case 'Basic': return basicPagination;
      case 'Professional': return professionalPagination;
      case 'Premium': return premiumPagination;
      case 'VIP': return vipPagination;
    }
  }, [activeTier, basicPagination, professionalPagination, premiumPagination, vipPagination]);

  const currentPaginationInfo = useMemo(() => getTierPaginationInfo(activeTier), [tiersData, activeTier]);

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
      <div className={styles.ratingStars}>
        {[...Array(fullStars)].map((_, index) => (
          <i key={`full-${index}`} className={`bi bi-star-fill ${styles.starFilled}`}></i>
        ))}
        {hasHalfStar && (
          <i className={`bi bi-star-half ${styles.starHalf}`}></i>
        )}
        {[...Array(emptyStars)].map((_, index) => (
          <i key={`empty-${index}`} className={`bi bi-star ${styles.starEmpty}`}></i>
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSelectedEducationCode('all');
    setSelectedSpecializationCode('all');
    setTempPriceRange([0, 3000000]);
    setPriceRange([0, 3000000]);
    resetPagination();
  };

  const resetPagination = () => {
    setBasicPagination(prev => ({ ...prev, pageNumber: 1 }));
    setProfessionalPagination(prev => ({ ...prev, pageNumber: 1 }));
    setPremiumPagination(prev => ({ ...prev, pageNumber: 1 }));
    setVipPagination(prev => ({ ...prev, pageNumber: 1 }));
  };

  const renderDoctorCard = (doctor: Doctor) => {
    const getTierClass = (tier: string) => {
      switch (tier) {
        case 'Basic': return styles.tierBasic;
        case 'Professional': return styles.tierProfessional;
        case 'Premium': return styles.tierPremium;
        case 'VIP': return styles.tierVip;
        default: return styles.tierBasic;
      }
    };

    // Calculate stats for display
    const totalCases = doctor.totalCases || 0;
    const successRate = doctor.successRate || 0;
    const responseTime = doctor.responseTime || 'N/A';

    return (
      <div
        key={doctor.id}
        className={`${styles.doctorCard} ${getTierClass(doctor.tier)}`}
        onClick={() => handleDoctorCardClick(doctor.id)}
      >
        {/* Avatar and Tier Badge */}
        <div className={styles.cardTopSection}>
          <div className={styles.doctorAvatar}>
            {doctor.imageUrl ? (
              <img src={doctor.imageUrl} alt={doctor.fullName} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <i className="bi bi-person-fill"></i>
              </div>
            )}
          </div>
          <div className={styles.tierBadge}>
            <i className="bi bi-award-fill"></i>
            {doctor.tier}
          </div>
        </div>

        {/* Doctor Name and Degree */}
        <div className={styles.doctorHeader}>
          <h3 className={styles.doctorName}>{doctor.fullName}</h3>
          <div className={styles.doctorDegree}>
            <i className="bi bi-mortarboard-fill"></i>
            {doctor.degree}
          </div>
        </div>

        {/* Specialty and Experience */}
        <div className={styles.doctorSpecialty}>
          <i className="bi bi-hospital"></i>
          <span>{doctor.specialty}</span>
        </div>

        {/* Key Stats for Patients */}
        <div className={styles.doctorStats}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="bi bi-people"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{totalCases.toLocaleString('vi-VN')}</div>
              <div className={styles.statLabel}>Ca đã khám</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="bi bi-check-circle"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{successRate}%</div>
              <div className={styles.statLabel}>Thành công</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="bi bi-clock"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{responseTime}</div>
              <div className={styles.statLabel}>Phản hồi</div>
            </div>
          </div>
        </div>

        {/* Rating and Reviews */}
        {doctor.reviewCount > 0 && (
          <div className={styles.ratingSection}>
            <div className={styles.ratingStars}>
              {renderStars(doctor.rating)}
            </div>
            <div className={styles.ratingInfo}>
              <span className={styles.ratingNumber}>{formatRating(doctor.rating)}</span>
              <span className={styles.ratingText}>· {doctor.reviewCount} đánh giá</span>
            </div>
          </div>
        )}

        {/* Price */}
        <div className={styles.priceSection}>
          <span className={styles.priceLabel}>Từ</span>
          <span className={styles.priceValue}>{formatPrice(doctor.price)}</span>
          <span className={styles.priceUnit}>/phút</span>
        </div>

        {/* Booking Button */}
        <button
          className={styles.bookingButton}
          onClick={(e) => {
            e.stopPropagation();
            handleBooking(doctor.id);
          }}
        >
          <i className="bi bi-calendar-check"></i>
          Đặt lịch ngay
        </button>
      </div>
    );
  };

  const renderPagination = () => {
    if (currentPaginationInfo.totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPagination.pageNumber - Math.floor(maxVisible / 2));
    let endPage = Math.min(currentPaginationInfo.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(currentPagination.pageNumber - 1)}
          disabled={currentPagination.pageNumber === 1}
          className={styles.paginationArrow}
        >
          <i className="bi bi-chevron-left"></i>
        </button>

        {startPage > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className={styles.paginationButton}>
              1
            </button>
            {startPage > 2 && <span className={styles.paginationEllipsis}>...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`${styles.paginationButton} ${
              currentPagination.pageNumber === page ? styles.paginationActive : ''
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < currentPaginationInfo.totalPages && (
          <>
            {endPage < currentPaginationInfo.totalPages - 1 && <span className={styles.paginationEllipsis}>...</span>}
            <button 
              onClick={() => handlePageChange(currentPaginationInfo.totalPages)} 
              className={styles.paginationButton}
            >
              {currentPaginationInfo.totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPagination.pageNumber + 1)}
          disabled={currentPagination.pageNumber >= currentPaginationInfo.totalPages}
          className={styles.paginationArrow}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <nav className={homeStyles["navbar"]}>
          <ul className={homeStyles["nav-menu"]}>
            <li><a onClick={() => navigate('/')} className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}>{t('nav.home')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/ai-chat')} className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}>{t('nav.ai-diagnosis')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/specialties')} className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}>{t('nav.specialties')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/doctors')} className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}>{t('nav.doctors')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/app/articles')} className={`${homeStyles["nav-link"]} ${location.pathname === '/app/articles' ? homeStyles["active"] : ''}`}>{t('nav.health-articles')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/about')} className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}>{t('nav.about')}</a></li>
          </ul>
        </nav>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải danh sách bác sĩ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <nav className={homeStyles["navbar"]}>
          <ul className={homeStyles["nav-menu"]}>
            <li><a onClick={() => navigate('/')} className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}>{t('nav.home')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/ai-chat')} className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}>{t('nav.ai-diagnosis')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/specialties')} className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}>{t('nav.specialties')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/doctors')} className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}>{t('nav.doctors')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/app/articles')} className={`${homeStyles["nav-link"]} ${location.pathname === '/app/articles' ? homeStyles["active"] : ''}`}>{t('nav.health-articles')}</a></li>
            <li><span>|</span></li>
            <li><a onClick={() => navigate('/about')} className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}>{t('nav.about')}</a></li>
          </ul>
        </nav>
        <div className={styles.errorContainer}>
          <i className="bi bi-exclamation-triangle"></i>
          <h2>Lỗi khi tải dữ liệu</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            <i className="bi bi-arrow-clockwise"></i>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li><a onClick={() => navigate('/')} className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}>{t('nav.home')}</a></li>
          <li><span>|</span></li>
          <li><a onClick={() => navigate('/ai-chat')} className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}>{t('nav.ai-diagnosis')}</a></li>
          <li><span>|</span></li>
          <li><a onClick={() => navigate('/specialties')} className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}>{t('nav.specialties')}</a></li>
          <li><span>|</span></li>
          <li><a onClick={() => navigate('/doctors')} className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}>{t('nav.doctors')}</a></li>
          <li><span>|</span></li>
          <li><a onClick={() => navigate('/app/articles')} className={`${homeStyles["nav-link"]} ${location.pathname === '/app/articles' ? homeStyles["active"] : ''}`}>{t('nav.health-articles')}</a></li>
          <li><span>|</span></li>
          <li><a onClick={() => navigate('/about')} className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}>{t('nav.about')}</a></li>
        </ul>
      </nav>

      <div className={styles.contentWrapper}>
        {!isAuthenticated && (
          <div className={styles.guestBanner}>
            <div className={styles.bannerIcon}>
              <i className="bi bi-info-circle-fill"></i>
            </div>
            <div className={styles.bannerContent}>
              <p className={styles.bannerText}>Đăng nhập để đặt lịch khám với bác sĩ</p>
              <button onClick={() => navigate('/login')} className={styles.bannerButton}>
                Đăng nhập ngay
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        <div className={styles.mainLayout}>
          <aside className={styles.filterSidebar}>
            <div className={styles.sidebarHeader}>
              <i className="bi bi-funnel-fill"></i>
              <h3>Bộ lọc tìm kiếm</h3>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <i className="bi bi-mortarboard-fill"></i>
                Học vị
              </label>
              <select
                value={selectedEducationCode}
                onChange={(e) => {
                  setSelectedEducationCode(e.target.value);
                  resetPagination();
                }}
                className={styles.filterSelect}
              >
                <option value="all">Tất cả học vị</option>
                {educationTypes.map((education) => (
                  <option key={education.code} value={education.code}>
                    {education.description}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <i className="bi bi-hospital-fill"></i>
                Chuyên khoa
              </label>
              <select
                value={selectedSpecializationCode}
                onChange={(e) => {
                  setSelectedSpecializationCode(e.target.value);
                  resetPagination();
                }}
                className={styles.filterSelect}
                disabled={metadataLoading}
              >
                <option value="all">Tất cả chuyên khoa</option>
                {specializations.map(spec => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <i className="bi bi-currency-dollar"></i>
                Mức giá (VNĐ/phút)
              </label>
              <div className={styles.priceRangeDisplay}>
                <span>{new Intl.NumberFormat('vi-VN').format(tempPriceRange[0])}</span>
                <span>-</span>
                <span>{new Intl.NumberFormat('vi-VN').format(tempPriceRange[1])}</span>
              </div>
              <div className={styles.priceSliderContainer}>
                {/* Track nền */}
                <div
                  className={styles.priceTrack}
                  style={{
                    '--min': `${(tempPriceRange[0] / 3000000) * 100}%`,
                    '--max': `${(tempPriceRange[1] / 3000000) * 100}%`,
                  } as React.CSSProperties}
                ></div>
                {/* Slider Min */}
                <input
                  type="range"
                  min="0"
                  max="3000000"
                  step="100000"
                  value={tempPriceRange[0]}
                  onChange={(e) => {
                    const newMin = Number(e.target.value);
                    const minValue = Math.max(0, Math.min(newMin, tempPriceRange[1] - 100000));
                    setTempPriceRange([minValue, tempPriceRange[1]]);
                  }}
                  className={`${styles.rangeThumb} ${styles.thumbMin}`}
                />
                {/* Slider Max */}
                <input
                  type="range"
                  min="0"
                  max="3000000"
                  step="100000"
                  value={tempPriceRange[1]}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    const maxValue = Math.min(3000000, Math.max(newMax, tempPriceRange[0] + 100000));
                    setTempPriceRange([tempPriceRange[0], maxValue]);
                  }}
                  className={`${styles.rangeThumb} ${styles.thumbMax}`}
                />
              </div>
            </div>

            <button onClick={resetFilters} className={styles.resetButton}>
              <i className="bi bi-arrow-counterclockwise"></i>
              Đặt lại bộ lọc
            </button>
          </aside>

          <div className={styles.mainContent}>
            <div className={styles.searchSection}>
              <div className={styles.searchWrapper}>
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm bác sĩ theo tên, chuyên khoa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className={styles.clearButton}>
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>

            <div className={styles.tierTabs}>
              <button
                className={`${styles.tierTab} ${styles.tierTabBasic} ${activeTier === 'Basic' ? styles.active : ''}`}
                onClick={() => setActiveTier('Basic')}
              >
                <i className="bi bi-star"></i>
                Cơ bản
              </button>
              <button
                className={`${styles.tierTab} ${styles.tierTabProfessional} ${activeTier === 'Professional' ? styles.active : ''}`}
                onClick={() => setActiveTier('Professional')}
              >
                <i className="bi bi-star-fill"></i>
                Chuyên nghiệp
              </button>
              <button
                className={`${styles.tierTab} ${styles.tierTabPremium} ${activeTier === 'Premium' ? styles.active : ''}`}
                onClick={() => setActiveTier('Premium')}
              >
                <i className="bi bi-gem"></i>
                Cao cấp
              </button>
              <button
                className={`${styles.tierTab} ${styles.tierTabVip} ${activeTier === 'VIP' ? styles.active : ''}`}
                onClick={() => setActiveTier('VIP')}
              >
                <i className="bi bi-award-fill"></i>
                VIP
              </button>
            </div>

            {currentDoctors.length > 0 ? (
              <>
                <div className={styles.resultsInfo}>
                  <i className="bi bi-people-fill"></i>
                  Tìm thấy <strong>{currentPaginationInfo.totalCount}</strong> bác sĩ
                </div>

                <div className={styles.doctorsGrid}>
                  {currentDoctors.map((doctor) => renderDoctorCard(doctor))}
                </div>
                
                {renderPagination()}
              </>
            ) : (
              <div className={styles.emptyState}>
                <i className="bi bi-search"></i>
                <h3>Không tìm thấy bác sĩ</h3>
                <p>Không có bác sĩ nào phù hợp với tiêu chí tìm kiếm</p>
                <button onClick={resetFilters} className={styles.resetButton}>
                  Đặt lại bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorBookingList;