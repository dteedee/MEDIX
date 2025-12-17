
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import doctorService from '../../services/doctorService';
import DoctorRegistrationFormService from '../../services/doctorRegistrationFormService';
import { ServiceTierWithPaginatedDoctorsDto, DoctorInTier, PaginationParams, DoctorTypeDegreeDto, DoctorQueryParameters, EducationGroupWithPaginatedDoctorsDto, DoctorInEducation } from '../../types/doctor.types';
import { useLanguage } from '../../contexts/LanguageContext';
import homeStyles from '../../styles/public/home.module.css';
import styles from '../../styles/patient/DoctorBookingList.module.css';
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

const convertEducationDoctorToDoctor = (
  apiDoctor: DoctorInEducation,
  avatarUrlMap?: Record<string, string>,
  statisticsMap?: Record<string, { totalCases: number; successRate: number; responseTime: string }>
): Doctor => {
  const rating = typeof apiDoctor.rating === 'number' ? apiDoctor.rating : parseFloat(String(apiDoctor.rating)) || 0;
  const experience = typeof apiDoctor.experience === 'number' ? apiDoctor.experience : parseInt(String(apiDoctor.experience)) || 0;

  const imageUrl = apiDoctor.avatarUrl || avatarUrlMap?.[apiDoctor.doctorId] || undefined;

  const stats = statisticsMap?.[apiDoctor.doctorId];
  const totalCases = stats?.totalCases ?? 0;
  const successRate = stats?.successRate ?? 0;
  const responseTime = stats?.responseTime ?? 'N/A';
  const totalDone = apiDoctor.totalDone ?? 0;
  const totalAppointments = apiDoctor.totalAppointments ?? 0;
  const successPercentage = apiDoctor.successPercentage ?? 0;
  const totalReviews = apiDoctor.totalReviews ?? 0;

  return {
    id: apiDoctor.doctorId,
    fullName: apiDoctor.doctorName,
    degree: apiDoctor.education,
    specialty: apiDoctor.specialization,
    experience: `${experience}`,
    rating: Math.max(0, Math.min(5, rating)),
    reviewCount: 0, // Not provided in education API
    price: apiDoctor.price,
    tier: 'Basic' as 'Basic' | 'Professional' | 'Premium' | 'VIP', // Default tier
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

type DegreeTab = 'Cử nhân y khoa' | 'Thạc sĩ y khoa' | 'Tiến sĩ y khoa' | 'Phó giáo sư' | 'Giáo sư';

const getEducationCodeFromDegree = (degree: DegreeTab): string => {
  switch (degree) {
    case 'Cử nhân y khoa': return 'BC';
    case 'Thạc sĩ y khoa': return 'MS';
    case 'Tiến sĩ y khoa': return 'DR';
    case 'Phó giáo sư': return 'AP';
    case 'Giáo sư': return 'PR';
    default: return 'BC';
  }
};

const getDegreeFromEducationName = (educationName: string): DegreeTab => {
  switch (educationName) {
    case 'Cử nhân Y khoa': return 'Cử nhân y khoa';
    case 'Thạc sĩ Y khoa': return 'Thạc sĩ y khoa';
    case 'Tiến sĩ Y khoa': return 'Tiến sĩ y khoa';
    case 'Phó giáo sư': return 'Phó giáo sư';
    case 'Giáo sư': return 'Giáo sư';
    default: return 'Cử nhân y khoa';
  }
};

const getDegreeFromEducationCode = (code: string): DegreeTab | null => {
  switch (code) {
    case 'BC': return 'Cử nhân y khoa';
    case 'MS': return 'Thạc sĩ y khoa';
    case 'DR': return 'Tiến sĩ y khoa';
    case 'AP': return 'Phó giáo sư';
    case 'PR': return 'Giáo sư';
    default: return null;
  }
};

const DoctorBookingList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const degreeTabs: DegreeTab[] = useMemo(() => [
    'Cử nhân y khoa',
    'Thạc sĩ y khoa',
    'Tiến sĩ y khoa',
    'Phó giáo sư',
    'Giáo sư'
  ], []);

  const degreeColorSchemes = useMemo(() => ({
    'Cử nhân y khoa': { accent: '#3b82f6', light: 'rgba(59,130,246,0.12)' },
    'Thạc sĩ y khoa': { accent: '#10b981', light: 'rgba(16,185,129,0.12)' },
    'Tiến sĩ y khoa': { accent: '#f59e0b', light: 'rgba(245,158,11,0.12)' },
    'Phó giáo sư': { accent: '#8b5cf6', light: 'rgba(139,92,246,0.12)' },
    'Giáo sư': { accent: '#ef4444', light: 'rgba(239,68,68,0.12)' }
  } as Record<DegreeTab, { accent: string; light: string }>), []);

  const degreeIcons = useMemo(() => ({
    'Cử nhân y khoa': 'bi-mortarboard',
    'Thạc sĩ y khoa': 'bi-mortarboard-fill',
    'Tiến sĩ y khoa': 'bi-journal-bookmark-fill',
    'Phó giáo sư': 'bi-award',
    'Giáo sư': 'bi-award-fill'
  } as Record<DegreeTab, string>), []);

  const [activeDegree, setActiveDegree] = useState<DegreeTab>('Cử nhân y khoa');
  const [tiersData, setTiersData] = useState<ServiceTierWithPaginatedDoctorsDto[]>([]);
  const [educationGroupsData, setEducationGroupsData] = useState<EducationGroupWithPaginatedDoctorsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorAvatars, setDoctorAvatars] = useState<Record<string, string>>({});
  const [doctorStatistics, setDoctorStatistics] = useState<Record<string, {
    totalCases: number;
    successRate: number;
    responseTime: string;
  }>>({});

  const [specializations, setSpecializations] = useState<{ id: string, name: string }[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [educationTypes, setEducationTypes] = useState<DoctorTypeDegreeDto[]>([]);
  const [educationLoading, setEducationLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [selectedEducationCode, setSelectedEducationCode] = useState<string>('all');
  const [selectedSpecializationCode, setSelectedSpecializationCode] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000]);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 3000000]);

  const [bachelorPagination, setBachelorPagination] = useState({ pageNumber: 1, pageSize: 9 });
  const [masterPagination, setMasterPagination] = useState({ pageNumber: 1, pageSize: 9 });
  const [phdPagination, setPhdPagination] = useState({ pageNumber: 1, pageSize: 9 });
  const [associateProfPagination, setAssociateProfPagination] = useState({ pageNumber: 1, pageSize: 9 });
  const [profPagination, setProfPagination] = useState({ pageNumber: 1, pageSize: 9 });

  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);
  const loadRequestIdRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

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

  const normalizeSearchText = useCallback((str: string | null | undefined) => {
    if (!str || typeof str !== 'string') return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const doctorMatchesSearch = useCallback((doctor: DoctorInTier, searchTerms: string[]): boolean => {
    if (!doctor || searchTerms.length === 0) return false;

    const convertedDoctor = convertApiDoctorToDoctor(doctor, 'Basic', doctorAvatars, doctorStatistics);
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

  useEffect(() => {
    if (!debouncedSearch || !debouncedSearch.trim() || tiersData.length === 0) return;

    const searchNormalized = normalizeSearchText(debouncedSearch);
    if (!searchNormalized) return;

    const searchTerms = searchNormalized.split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length === 0) return;

    const allDoctors = tiersData.flatMap(t => t.doctors?.items || []);
    const resultsByDegree: Partial<Record<DegreeTab, boolean>> = {};
    degreeTabs.forEach(tab => {
      const has = allDoctors.some(d => doctorMatchesSearch(d, searchTerms));
      if (has) resultsByDegree[tab] = true;
    });
    const first = degreeTabs.find(tab => resultsByDegree[tab]);
    if (first && first !== activeDegree) setActiveDegree(first);
  }, [debouncedSearch, tiersData, activeDegree, normalizeSearchText, doctorMatchesSearch, degreeTabs]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPriceRange(tempPriceRange);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [tempPriceRange]);

  const loadEducationData = useCallback(async () => {
    const queryParams: DoctorQueryParameters = {
      pageNumber: 1,
      pageSize: 50, // Load more doctors per group
      specializationCode: selectedSpecializationCode === 'all' ? undefined : selectedSpecializationCode,
      minPrice: priceRange[0],
      maxPrice: priceRange[1]
    };

    const data = await doctorService.getDoctorsGroupedByEducation(queryParams);
    return data;
  }, [selectedSpecializationCode, priceRange]);

  useEffect(() => {
    if (initialLoadDoneRef.current || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    const currentRequestId = `${Date.now()}-${Math.random()}`;
    loadRequestIdRef.current = currentRequestId;

    const loadData = async () => {
      if (!mountedRef.current || loadRequestIdRef.current !== currentRequestId) {
        isLoadingRef.current = false;
        return;
      }

      initialLoadDoneRef.current = true;

      try {
        setLoading(true);
        setError(null);

        const educationGroupsData = await loadEducationData();

        if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
          setEducationGroupsData(educationGroupsData);

          const allDoctors = educationGroupsData.flatMap(group => group.doctors?.items || []);
          const doctorsNeedingAvatar = allDoctors.filter(doctor =>
            !doctor.avatarUrl && doctor.doctorId
          );
          const doctorsNeedingStats = allDoctors.filter(doctor =>
            doctor.doctorId && (doctor.totalCases === undefined || doctor.successRate === undefined || doctor.averageResponseTime === undefined)
          );

          if (doctorsNeedingAvatar.length > 0) {
            Promise.all(
              doctorsNeedingAvatar.slice(0, 20).map(async (doctor) => {
                try {
                  const profile = await doctorService.getDoctorProfile(doctor.doctorId);
                  if (profile.avatarUrl) {
                    return { doctorId: doctor.doctorId, avatarUrl: profile.avatarUrl };
                  }
                } catch (error) {
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

          if (doctorsNeedingStats.length > 0) {
            Promise.all(
              doctorsNeedingStats.slice(0, 20).map(async (doctor) => {
                try {
                  const stats = await doctorService.getStatistics(doctor.doctorId);
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
          setError(err.message || 'Lỗi khi tải dữ liệu bác sĩ');
          setLoading(false);
          isLoadingRef.current = false;
          loadRequestIdRef.current = null;
        }
      }
    };

    const timeoutId = setTimeout(loadData, 50);

    return () => {
      clearTimeout(timeoutId);
      if (loadRequestIdRef.current === currentRequestId) {
        isLoadingRef.current = false;
        loadRequestIdRef.current = null;
      }
    };
  }, []); // Only run once on mount

  useEffect(() => {
    if (!initialLoadDoneRef.current || isLoadingRef.current) {
      return;
    }

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    const currentRequestId = `${Date.now()}-${Math.random()}`;
    loadRequestIdRef.current = currentRequestId;
    isLoadingRef.current = true;

    loadingTimeoutRef.current = setTimeout(async () => {
      if (loadRequestIdRef.current !== currentRequestId || !mountedRef.current) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const educationGroupsData = await loadEducationData();

        if (mountedRef.current && loadRequestIdRef.current === currentRequestId) {
          setEducationGroupsData(educationGroupsData);

          const allDoctors = educationGroupsData.flatMap(group => group.doctors?.items || []);
          const doctorsNeedingAvatar = allDoctors.filter(doctor =>
            !doctor.avatarUrl && doctor.doctorId
          );
          const doctorsNeedingStats = allDoctors.filter(doctor =>
            doctor.doctorId && (doctor.totalCases === undefined || doctor.successRate === undefined || doctor.averageResponseTime === undefined)
          );

          if (doctorsNeedingAvatar.length > 0) {
            Promise.all(
              doctorsNeedingAvatar.slice(0, 20).map(async (doctor) => {
                try {
                  const profile = await doctorService.getDoctorProfile(doctor.doctorId);
                  if (profile.avatarUrl) {
                    return { doctorId: doctor.doctorId, avatarUrl: profile.avatarUrl };
                  }
                } catch (error) {
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

          if (doctorsNeedingStats.length > 0) {
            Promise.all(
              doctorsNeedingStats.slice(0, 20).map(async (doctor) => {
                try {
                  const stats = await doctorService.getStatistics(doctor.doctorId);
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
  }, [selectedSpecializationCode, priceRange, loadEducationData]);

  const searchDoctorsAcrossAllDegrees = (searchTerm: string): { degree: DegreeTab; doctors: Doctor[] }[] => {
    if (!searchTerm.trim()) return [];

    const searchNormalized = normalizeSearchText(searchTerm);
    const searchTerms = searchNormalized.split(/\s+/).filter(term => term.length > 0);

    const allDoctors = tiersData.flatMap(t => t.doctors?.items || []);
    const converted = allDoctors.map(d => convertApiDoctorToDoctor(d, 'Basic', doctorAvatars, doctorStatistics));

    const filtered = converted.filter(doctor => {
      if (doctor.isAcceptingAppointments === false) return false;

      const nameNormalized = normalizeSearchText(doctor.fullName);
      const specialtyNormalized = normalizeSearchText(doctor.specialty);
      const degreeNormalized = normalizeSearchText(doctor.degree);
      const bioNormalized = normalizeSearchText(doctor.bio || '');

      return searchTerms.every(term =>
        nameNormalized.includes(term) ||
        specialtyNormalized.includes(term) ||
        degreeNormalized.includes(term) ||
        bioNormalized.includes(term)
      );
    });

    const results: { degree: DegreeTab; doctors: Doctor[] }[] = [];
    degreeTabs.forEach(tab => {
      const group = filtered.filter(d => d.degree === tab);
      if (group.length > 0) results.push({ degree: tab, doctors: group });
    });
    return results;
  };

  const getDoctorsByDegree = useCallback((degree: DegreeTab): Doctor[] => {
    const educationGroup = educationGroupsData.find(group =>
      getDegreeFromEducationName(group.education) === degree
    );

    if (!educationGroup || !educationGroup.doctors?.items) {
      return [];
    }

    const allConverted = educationGroup.doctors.items.map(d =>
      convertEducationDoctorToDoctor(d, doctorAvatars, doctorStatistics)
    );

          let doctors = allConverted.filter(doctor => doctor.isAcceptingAppointments !== false);
    
        return doctors;
        }, [educationGroupsData, doctorAvatars, doctorStatistics]);
      
        const getAllDoctors = useCallback((): Doctor[] => {
          if (!educationGroupsData) return [];
          const allDoctorsFromGroups = educationGroupsData.flatMap(group => group.doctors?.items || []);
          const convertedDoctors = allDoctorsFromGroups.map(d =>
            convertEducationDoctorToDoctor(d, doctorAvatars, doctorStatistics)
          );
          return convertedDoctors.filter(doctor => doctor.isAcceptingAppointments !== false);
        }, [educationGroupsData, doctorAvatars, doctorStatistics]);
      
        const searchResults = useMemo(() => {
          const trimmedSearch = debouncedSearch.trim();
          if (!trimmedSearch) return [];
      
          const allDocs = getAllDoctors();
          const searchNormalized = normalizeSearchText(trimmedSearch);
          const searchTerms = searchNormalized.split(/\s+/).filter(term => term.length > 0);
      
          if (searchTerms.length === 0) return [];
      
          return allDocs.filter(doctor => {
            const nameNormalized = normalizeSearchText(doctor.fullName);
            return searchTerms.every(term => nameNormalized.includes(term));
          });
        }, [debouncedSearch, getAllDoctors, normalizeSearchText]);
      
        const getDegreePaginationInfo = (degree: DegreeTab) => {
    const doctors = getDoctorsByDegree(degree);
    const pageSize = 9;
    const totalCount = doctors.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    return { totalPages, totalCount };
  };

  const currentDoctors = useMemo(() => getDoctorsByDegree(activeDegree), [getDoctorsByDegree, activeDegree]);
  const currentPagination = useMemo(() => {
    switch (activeDegree) {
      case 'Cử nhân y khoa': return bachelorPagination;
      case 'Thạc sĩ y khoa': return masterPagination;
      case 'Tiến sĩ y khoa': return phdPagination;
      case 'Phó giáo sư': return associateProfPagination;
      case 'Giáo sư': return profPagination;
    }
  }, [activeDegree, bachelorPagination, masterPagination, phdPagination, associateProfPagination, profPagination]);

  const currentPaginationInfo = useMemo(() => getDegreePaginationInfo(activeDegree), [educationGroupsData, activeDegree, getDoctorsByDegree]);

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
    switch (activeDegree) {
      case 'Cử nhân y khoa':
        setBachelorPagination(prev => ({ ...prev, pageNumber: page }));
        break;
      case 'Thạc sĩ y khoa':
        setMasterPagination(prev => ({ ...prev, pageNumber: page }));
        break;
      case 'Tiến sĩ y khoa':
        setPhdPagination(prev => ({ ...prev, pageNumber: page }));
        break;
      case 'Phó giáo sư':
        setAssociateProfPagination(prev => ({ ...prev, pageNumber: page }));
        break;
      case 'Giáo sư':
        setProfPagination(prev => ({ ...prev, pageNumber: page }));
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
    setBachelorPagination(prev => ({ ...prev, pageNumber: 1 }));
    setMasterPagination(prev => ({ ...prev, pageNumber: 1 }));
    setPhdPagination(prev => ({ ...prev, pageNumber: 1 }));
    setAssociateProfPagination(prev => ({ ...prev, pageNumber: 1 }));
    setProfPagination(prev => ({ ...prev, pageNumber: 1 }));
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

    const totalDone = doctor.totalDone || 0; // Số ca đã thực hiện
    const totalAppointments = doctor.totalAppointments || 0; // Tổng số lịch hẹn
    const successPercentage = doctor.successPercentage
      ? Math.round(doctor.successPercentage)
      : (doctor.successRate || 0); // Fallback to successRate if successPercentage not available
    const totalReviews = doctor.totalReviews || 0; // Tổng số đánh giá
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
              <i className="bi bi-clipboard-check"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{totalDone.toLocaleString('vi-VN')}</div>
              <div className={styles.statLabel}>Ca đã thực hiện</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="bi bi-check-circle"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{successPercentage}%</div>
              <div className={styles.statLabel}>Thành công</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="bi bi-chat-left-text"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{totalReviews.toLocaleString('vi-VN')}</div>
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
            className={`${styles.paginationButton} ${currentPagination.pageNumber === page ? styles.paginationActive : ''
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
            <Link to="/doctors" className={`${homeStyles["nav-link"]} ${homeStyles["active"]}`}>
              {t('nav.doctors')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/articles" className={homeStyles["nav-link"]}>
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
              <Link to="/doctors" className={`${homeStyles["nav-link"]} ${homeStyles["active"]}`}>
                {t('nav.doctors')}
              </Link>
            </li>
            <li><span>|</span></li>
            <li>
              <Link to="/articles" className={homeStyles["nav-link"]}>
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
            <Link to="/doctors" className={`${homeStyles["nav-link"]} ${homeStyles["active"]}`}>
              {t('nav.doctors')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/articles" className={homeStyles["nav-link"]}>
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
          <aside className={styles.filterSidebar} style={{ width: 260, minWidth: 240 }}>
            <div className={styles.sidebarHeader}>
              <i className="bi bi-funnel-fill"></i>
              <h3>Bộ lọc tìm kiếm</h3>
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
                  placeholder="Tìm kiếm bác sĩ theo tên..."
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

            {debouncedSearch.trim().length > 0 ? (
              // Search results view
              <>
                {searchResults.length > 0 ? (
                  <>
                    <div className={styles.resultsInfo}>
                      <i className="bi bi-search"></i>
                      Tìm thấy <strong>{searchResults.length}</strong> bác sĩ với từ khóa "<strong>{debouncedSearch}</strong>"
                    </div>
                    <div className={styles.doctorsGrid}>
                      {searchResults.map((doctor) => renderDoctorCard(doctor))}
                    </div>
                    {/* Optional: Add pagination for search results if needed in the future */}
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <i className="bi bi-search"></i>
                    <h3>Không tìm thấy bác sĩ</h3>
                    <p>Không có bác sĩ nào có tên phù hợp với từ khóa "<strong>{debouncedSearch}</strong>"</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.tierTabs}>
                  {degreeTabs.map(tab => {
                    const count = getDoctorsByDegree(tab).length;
                    const scheme = degreeColorSchemes[tab];
                    const isActive = activeDegree === tab;
                    return (
                      <button
                        key={tab}
                        className={`${styles.tierTab} ${isActive ? styles.active : ''}`}
                        onClick={() => setActiveDegree(tab)}
                        aria-pressed={isActive}
                        title={`${tab} • ${count} bác sĩ`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: `1px solid ${isActive ? scheme.accent : '#e5e7eb'}`,
                          background: isActive ? scheme.light : 'white',
                          boxShadow: isActive ? `0 4px 14px ${scheme.light}` : 'none',
                          transform: isActive ? 'translateY(-1px)' : 'none',
                          transition: 'all 160ms ease-in-out',
                          whiteSpace: 'nowrap',
                          padding: '10px 14px'
                        }}
                      >
                        <i className={`bi ${degreeIcons[tab]}`} style={{ color: scheme.accent, fontSize: 18 }}></i>
                        <span style={{ color: isActive ? scheme.accent : '#111827', fontWeight: isActive ? 600 : 500 }}>{tab}</span>
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 12,
                            lineHeight: 1,
                            background: scheme.light,
                            color: scheme.accent,
                            borderRadius: 9999,
                            padding: '4px 8px',
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {currentDoctors.length > 0 ? (
                  <>
                    <div className={styles.resultsInfo}>
                      <i className="bi bi-people-fill"></i>
                      Tìm thấy <strong>{currentPaginationInfo.totalCount}</strong> bác sĩ cho {activeDegree}
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
              </>
            )}
          </div>
        </div>
      </div>
      <BackToTopButton />
      <ChatbotBubble />
    </div>
  );
};

export default DoctorBookingList;
