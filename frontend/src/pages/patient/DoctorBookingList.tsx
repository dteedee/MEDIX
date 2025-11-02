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

const convertApiDoctorToDoctor = (
  apiDoctor: DoctorInTier, 
  tierName: string, 
  avatarUrlMap?: Record<string, string>,
  statisticsMap?: Record<string, { totalCases: number; successRate: number; responseTime: string }>
): Doctor => {
  const rating = typeof apiDoctor.rating === 'number' ? apiDoctor.rating : parseFloat(String(apiDoctor.rating)) || 0;
  const experience = typeof apiDoctor.experience === 'number' ? apiDoctor.experience : parseInt(String(apiDoctor.experience)) || 0;
  
  // Check if avatarUrl is in API response (even if not in TypeScript interface)
  // Or get from avatarUrlMap if fetched separately
  const imageUrl = (apiDoctor as any).avatarUrl || avatarUrlMap?.[apiDoctor.doctorId] || undefined;
  
  // Get statistics from API response or from separately fetched statistics map
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
  
  // Validate tierName to prevent crash from invalid UUIDs or null values
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
  const [doctorStatistics, setDoctorStatistics] = useState<Record<string, {
    totalCases: number;
    successRate: number;
    responseTime: string;
  }>>({});
  
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
  const isLoadingRef = useRef(false);
  const loadRequestIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

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
      isLoadingRef.current = false;
      loadRequestIdRef.current = null;
      initialLoadDoneRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  // Helper function to normalize Vietnamese text for search
  const normalizeSearchText = useCallback((str: string | null | undefined) => {
    if (!str || typeof str !== 'string') return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Helper function to check if doctor matches search
  const doctorMatchesSearch = useCallback((doctor: DoctorInTier, searchTerms: string[], tierName?: string): boolean => {
    if (!doctor || searchTerms.length === 0) return false;
    
    const convertedDoctor = convertApiDoctorToDoctor(doctor, tierName || 'Basic', doctorAvatars, doctorStatistics);
    const nameNormalized = normalizeSearchText(convertedDoctor?.fullName);
    const specialtyNormalized = normalizeSearchText(convertedDoctor?.specialty);
    const degreeNormalized = normalizeSearchText(convertedDoctor?.degree);
    const bioNormalized = normalizeSearchText(convertedDoctor?.bio);
    
    return searchTerms.every(term => 
      nameNormalized.includes(term) ||
      specialtyNormalized.includes(term) ||
      degreeNormalized.includes(term) ||
      bioNormalized.includes(term)
    );
  }, [normalizeSearchText, doctorAvatars, doctorStatistics]);

  // Auto-switch to tier with search results
  useEffect(() => {
    // Không làm gì nếu chưa có data hoặc chưa nhập gì
    if (!debouncedSearch || !debouncedSearch.trim() || tiersData.length === 0) return;

    const searchNormalized = normalizeSearchText(debouncedSearch);
    if (!searchNormalized) return;
    
    const searchTerms = searchNormalized.split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length === 0) return;

    const tiersWithResults: TierType[] = [];

    // Tìm các tier có kết quả
    for (const tier of tiersData) {
      if (!tier?.name || !tier?.doctors?.items?.length) continue;

      const hasMatch = tier.doctors.items.some((doctor) =>
        doctorMatchesSearch(doctor, searchTerms, tier.name)
      );

      if (hasMatch) tiersWithResults.push(tier.name as TierType);
    }

    // 1️⃣ Nếu KHÔNG tìm thấy ở tier nào → GIỮ nguyên tier hiện tại
    if (tiersWithResults.length === 0) {
      return;
    }

    // 2️⃣ Nếu tier hiện tại CÓ kết quả → KHÔNG chuyển tier
    if (tiersWithResults.includes(activeTier)) {
      return;
    }

    // 3️⃣ Nếu tier hiện tại KHÔNG có kết quả → CHUYỂN sang tier đầu tiên có kết quả
    const firstTierWithResults = tiersWithResults[0];
    if (firstTierWithResults && firstTierWithResults !== activeTier) {
      setActiveTier(firstTierWithResults);
    }
  }, [debouncedSearch, tiersData, activeTier, normalizeSearchText, doctorMatchesSearch]);

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

  // Initial load only once on mount
  useEffect(() => {
    // Only load if hasn't loaded yet
    if (initialLoadDoneRef.current || isLoadingRef.current) {
      return;
    }
    
    initialLoadDoneRef.current = true;
    const currentRequestId = `${Date.now()}-${Math.random()}`;
    loadRequestIdRef.current = currentRequestId;
    isLoadingRef.current = true;

    const loadData = async () => {
      if (!mountedRef.current || loadRequestIdRef.current !== currentRequestId) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const [basicData, professionalData, premiumData, vipData] = await Promise.all([
          loadTierData('Basic', basicPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('Professional', professionalPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('Premium', premiumPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('VIP', vipPagination, selectedEducationCode, selectedSpecializationCode, priceRange)
        ]);

        if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
          const allTiersData = [basicData, professionalData, premiumData, vipData].filter(
            (tier): tier is ServiceTierWithPaginatedDoctorsDto => tier !== undefined
          );
          setTiersData(allTiersData);
          
          // Load avatars and statistics for doctors that don't have them in the response
          const allDoctors = allTiersData.flatMap(tier => tier.doctors?.items || []);
          const doctorsNeedingAvatar = allDoctors.filter(doctor => 
            !(doctor as any).avatarUrl && doctor.doctorId
          );
          const doctorsNeedingStats = allDoctors.filter(doctor => 
            doctor.doctorId && (doctor.totalCases === undefined || doctor.successRate === undefined || doctor.averageResponseTime === undefined)
          );
          
          // Fetch avatars in parallel
          if (doctorsNeedingAvatar.length > 0) {
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
              if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
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

          // Fetch statistics in parallel
          if (doctorsNeedingStats.length > 0) {
            Promise.all(
              doctorsNeedingStats.slice(0, 20).map(async (doctor) => {
                try {
                  const stats = await doctorService.getStatistics(doctor.doctorId);
                  // Map API response to our format
                  const totalCases = stats.totalCases || stats.totalAppointments || 0;
                  const successfulCases = stats.successfulCases || stats.completedCases || stats.completedAppointments || 0;
                  const successRate = totalCases > 0 ? Math.round((successfulCases / totalCases) * 100) : 0;
                  const responseTimeMinutes = stats.averageResponseTime || stats.responseTime || 0;
                  const responseTime = responseTimeMinutes > 0 
                    ? (responseTimeMinutes < 60 ? `${Math.round(responseTimeMinutes)} phút` : '1 giờ')
                    : 'N/A';
                  
                  return {
                    doctorId: doctor.doctorId,
                    totalCases,
                    successRate,
                    responseTime
                  };
                } catch (error) {
                  console.log(`Could not fetch statistics for doctor ${doctor.doctorId}:`, error);
                  return null;
                }
              })
            ).then(results => {
              if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
                const newStats: Record<string, { totalCases: number; successRate: number; responseTime: string }> = {};
                results.forEach(result => {
                  if (result) {
                    newStats[result.doctorId] = {
                      totalCases: result.totalCases,
                      successRate: result.successRate,
                      responseTime: result.responseTime
                    };
                  }
                });
                setDoctorStatistics(prev => ({ ...prev, ...newStats }));
              }
            });
          }
          
          setLoading(false);
          isLoadingRef.current = false;
          loadRequestIdRef.current = null;
        }
      } catch (err: any) {
        if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
          console.error('Error loading tiers data:', err);
          setError(err.message || 'Lỗi khi tải dữ liệu bác sĩ');
          setLoading(false);
          isLoadingRef.current = false;
          loadRequestIdRef.current = null;
        }
      }
    };

    // Small delay to batch and let StrictMode settle
    const timeoutId = setTimeout(loadData, 50);
    
    return () => {
      clearTimeout(timeoutId);
      if (loadRequestIdRef.current === currentRequestId) {
        isLoadingRef.current = false;
        loadRequestIdRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Reload when filters/pagination change (after initial load)
  useEffect(() => {
    // Skip if initial load hasn't completed yet
    if (!initialLoadDoneRef.current || isLoadingRef.current) {
      return;
    }
    
    // Clear any pending timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    const currentRequestId = `${Date.now()}-${Math.random()}`;
    loadRequestIdRef.current = currentRequestId;
    isLoadingRef.current = true;

    // Debounce reload to prevent rapid-fire requests
    loadingTimeoutRef.current = setTimeout(async () => {
      if (loadRequestIdRef.current !== currentRequestId || !mountedRef.current) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const [basicData, professionalData, premiumData, vipData] = await Promise.all([
          loadTierData('Basic', basicPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('Professional', professionalPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('Premium', premiumPagination, selectedEducationCode, selectedSpecializationCode, priceRange),
          loadTierData('VIP', vipPagination, selectedEducationCode, selectedSpecializationCode, priceRange)
        ]);

        if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
          const allTiersData = [basicData, professionalData, premiumData, vipData].filter(
            (tier): tier is ServiceTierWithPaginatedDoctorsDto => tier !== undefined
          );
          setTiersData(allTiersData);
          
          // Load avatars and statistics for doctors that don't have them in the response
          const allDoctors = allTiersData.flatMap(tier => tier.doctors?.items || []);
          const doctorsNeedingAvatar = allDoctors.filter(doctor => 
            !(doctor as any).avatarUrl && doctor.doctorId
          );
          const doctorsNeedingStats = allDoctors.filter(doctor => 
            doctor.doctorId && (doctor.totalCases === undefined || doctor.successRate === undefined || doctor.averageResponseTime === undefined)
          );
          
          // Fetch avatars in parallel
          if (doctorsNeedingAvatar.length > 0) {
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
              if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
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

          // Fetch statistics in parallel
          if (doctorsNeedingStats.length > 0) {
            Promise.all(
              doctorsNeedingStats.slice(0, 20).map(async (doctor) => {
                try {
                  const stats = await doctorService.getStatistics(doctor.doctorId);
                  // Map API response to our format
                  const totalCases = stats.totalCases || stats.totalAppointments || 0;
                  const successfulCases = stats.successfulCases || stats.completedCases || stats.completedAppointments || 0;
                  const successRate = totalCases > 0 ? Math.round((successfulCases / totalCases) * 100) : 0;
                  const responseTimeMinutes = stats.averageResponseTime || stats.responseTime || 0;
                  const responseTime = responseTimeMinutes > 0 
                    ? (responseTimeMinutes < 60 ? `${Math.round(responseTimeMinutes)} phút` : '1 giờ')
                    : 'N/A';
                  
                  return {
                    doctorId: doctor.doctorId,
                    totalCases,
                    successRate,
                    responseTime
                  };
                } catch (error) {
                  console.log(`Could not fetch statistics for doctor ${doctor.doctorId}:`, error);
                  return null;
                }
              })
            ).then(results => {
              if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
                const newStats: Record<string, { totalCases: number; successRate: number; responseTime: string }> = {};
                results.forEach(result => {
                  if (result) {
                    newStats[result.doctorId] = {
                      totalCases: result.totalCases,
                      successRate: result.successRate,
                      responseTime: result.responseTime
                    };
                  }
                });
                setDoctorStatistics(prev => ({ ...prev, ...newStats }));
              }
            });
          }
          
          setLoading(false);
          isLoadingRef.current = false;
          loadRequestIdRef.current = null;
        }
      } catch (err: any) {
        if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
          console.error('Error loading tiers data:', err);
          setError(err.message || 'Lỗi khi tải dữ liệu bác sĩ');
          setLoading(false);
          isLoadingRef.current = false;
          loadRequestIdRef.current = null;
        }
      }
    }, 200); // Debounce for filter changes

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (loadRequestIdRef.current === currentRequestId) {
        isLoadingRef.current = false;
        loadRequestIdRef.current = null;
      }
    };
  }, [basicPagination, professionalPagination, premiumPagination, vipPagination, selectedEducationCode, selectedSpecializationCode, priceRange, loadTierData]);

  // Search doctors across all tiers
  const searchDoctorsAcrossAllTiers = (searchTerm: string): { tier: TierType; doctors: Doctor[] }[] => {
    if (!searchTerm.trim()) return [];
    
    const searchNormalized = normalizeSearchText(searchTerm);
    const searchTerms = searchNormalized.split(/\s+/).filter(term => term.length > 0);
    
    const results: { tier: TierType; doctors: Doctor[] }[] = [];
    
    tiersData.forEach(tier => {
      if (!tier.doctors || !tier.doctors.items) return;
      
      const doctors = tier.doctors.items
        .map(doctor => convertApiDoctorToDoctor(doctor, tier.name, doctorAvatars, doctorStatistics))
        .filter(doctor => {
          const nameNormalized = normalizeSearchText(doctor.fullName);
          const specialtyNormalized = normalizeSearchText(doctor.specialty);
          const degreeNormalized = normalizeSearchText(doctor.degree);
          const bioNormalized = normalizeSearchText(doctor.bio || '');
          
          // Check if all search terms appear in any field
          return searchTerms.every(term => 
            nameNormalized.includes(term) ||
            specialtyNormalized.includes(term) ||
            degreeNormalized.includes(term) ||
            bioNormalized.includes(term)
          );
        });
      
      if (doctors.length > 0) {
        results.push({ tier: tier.name as TierType, doctors });
      }
    });
    
    return results;
  };

  const getDoctorsByTier = useCallback((tierName: string): Doctor[] => {
    const tier = tiersData.find(t => t.name === tierName);
    if (!tier || !tier.doctors || !tier.doctors.items) return [];
    
    let doctors = tier.doctors.items.map(doctor => convertApiDoctorToDoctor(doctor, tierName, doctorAvatars, doctorStatistics));
    
    if (debouncedSearch && debouncedSearch.trim()) {
      const searchNormalized = normalizeSearchText(debouncedSearch);
      if (!searchNormalized) return doctors;
      
      const searchTerms = searchNormalized.split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        doctors = doctors.filter(doctor => {
          if (!doctor) return false;
          
          const nameNormalized = normalizeSearchText(doctor.fullName);
          const specialtyNormalized = normalizeSearchText(doctor.specialty);
          const degreeNormalized = normalizeSearchText(doctor.degree);
          const bioNormalized = normalizeSearchText(doctor.bio);
          
          // Check if all search terms appear in any field
          return searchTerms.every(term => 
            nameNormalized.includes(term) ||
            specialtyNormalized.includes(term) ||
            degreeNormalized.includes(term) ||
            bioNormalized.includes(term)
          );
        });
      }
    }
    
    return doctors;
  }, [tiersData, debouncedSearch, doctorAvatars, doctorStatistics, normalizeSearchText]);

  const getTierPaginationInfo = (tierName: string) => {
    const tier = tiersData.find(t => t.name === tierName);
    if (!tier || !tier.doctors) return { totalPages: 0, totalCount: 0 };
    return {
      totalPages: tier.doctors.totalPages,
      totalCount: tier.doctors.totalCount
    };
  };

  const currentDoctors = useMemo(() => getDoctorsByTier(activeTier), [getDoctorsByTier, activeTier]);
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
        {/* Avatar */}
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
          <span className={styles.priceLabel}>Giá</span>
          <span className={styles.priceValue}>{formatPrice(doctor.price)}</span>
          <span className={styles.priceUnit}>/lần hẹn</span>
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
                Mức giá (VNĐ/lần hẹn)
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