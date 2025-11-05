import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import doctorService from "../../services/doctorService";
import { DoctorProfileDto, ServiceTierWithPaginatedDoctorsDto, DoctorTypeDegreeDto, DoctorInTier, PaginationParams, DoctorQueryParameters } from "../../types/doctor.types";
import { Header } from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import paymentService from "../../services/paymentService";
import styles from '../../styles/doctor/doctor-details.module.css';
import bookingStyles from '../../styles/patient/DoctorBookingList.module.css';
import DoctorRegistrationFormService from "../../services/doctorRegistrationFormService";

function DoctorDetails() {
    const [profileData, setProfileData] = useState<DoctorProfileDto>();
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Booking states
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{
        display: string;
        type: 'regular' | 'override';
        reason?: string;
        id?: string;
        startTime: string;
        endTime: string;
    }>>([]);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [showPaymentButton, setShowPaymentButton] = useState(false);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);

    const { username } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Sidebar filter states (reuse logic from DoctorBookingList)
    const [tiersData, setTiersData] = useState<ServiceTierWithPaginatedDoctorsDto[]>([]);
    const [specializations, setSpecializations] = useState<{ id: string; name: string }[]>([]);
    const [educationTypes, setEducationTypes] = useState<DoctorTypeDegreeDto[]>([]);
    const [metadataLoading, setMetadataLoading] = useState(true);
    const [educationLoading, setEducationLoading] = useState(true);
    const [selectedEducationCode, setSelectedEducationCode] = useState<string>('all');
    const [selectedSpecializationCode, setSelectedSpecializationCode] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000]);
    const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 3000000]);
    const [sidebarLoading, setSidebarLoading] = useState<boolean>(false);

    const initialSidebarLoadDoneRef = useRef(false);
    const isSidebarLoadingRef = useRef(false);
    const sidebarRequestIdRef = useRef<string | null>(null);

    // Function to check if user is logged in
    const checkUserLogin = () => {
        const accessToken = localStorage.getItem('accessToken');
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        const userData = localStorage.getItem('userData');
        
        if (accessToken && tokenExpiration) {
            const expirationTime = parseInt(tokenExpiration);
            if (Date.now() < expirationTime) {
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        return user && user.role;
                    } catch (error) {
                        console.error("Error parsing user data:", error);
                        return false;
                    }
                }
            }
        }
        return false;
    };

    // Function to handle booking confirmation with login check
    const handleBookingConfirm = () => {
        if (!profileData || !selectedDate || !selectedTimeSlot) return;
        
        if (!checkUserLogin()) {
            alert("Bạn cần đăng nhập để đặt lịch hẹn với bác sĩ. Vui lòng đăng nhập để tiếp tục.");
            navigate('/login');
            return;
        }
        
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.role !== 'Patient') {
                    alert("Chỉ có bệnh nhân mới có thể đặt lịch hẹn với bác sĩ.");
                    return;
                }
            } catch (error) {
                console.error("Error parsing user data:", error);
                alert("Có lỗi xảy ra khi xác thực thông tin người dùng.");
                return;
            }
        }
        
        setShowPaymentButton(true);
    };

    // Function to create payment link using service
    const handleCreatePaymentLink = async () => {
        if (!profileData || !selectedDate || !selectedTimeSlot) return;
        
        setIsCreatingPayment(true);
        
        try {
            const rawPrice: unknown = profileData.consultationFee ?? profileData.price;
            const normalizedPrice = Number(rawPrice);
            const finalPrice = Number.isFinite(normalizedPrice) && normalizedPrice > 0 ? normalizedPrice : 200000;

            const itemData = paymentService.createDoctorConsultationItem(
                profileData.fullName,
                finalPrice
            );

            const result = await paymentService.createPaymentLink(itemData);

            if (result.success && result.checkoutUrl) {
                paymentService.redirectToPayment(result.checkoutUrl);
            } else {
                alert(result.error || 'Có lỗi xảy ra khi tạo link thanh toán.');
            }
        } catch (error) {
            console.error('Error creating payment link:', error);
            alert('Có lỗi xảy ra khi tạo link thanh toán. Vui lòng thử lại.');
        }
        
        setIsCreatingPayment(false);
    };

    const convertDayOfWeek = (jsDayOfWeek: number): number => {
        return jsDayOfWeek === 0 ? 7 : jsDayOfWeek;
    };

    // Helper function to format date as YYYY-MM-DD without timezone issues
    const formatDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper function to normalize date strings from backend
    const normalizeDateString = (dateStr: string): string => {
        // Handle different possible formats from backend
        if (dateStr.includes('T')) {
            // If it's ISO format with time, extract just the date part
            return dateStr.split('T')[0];
        }
        return dateStr;
    };

    // Helper function to check if two time slots overlap
    const isTimeSlotOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
        return start1 < end2 && end1 > start2;
    };

    // Get available time slots based on doctor's schedule and overrides
    const getAvailableTimeSlots = (date: Date): Array<{
        display: string;
        type: 'regular' | 'override';
        reason?: string;
        id?: string;
        startTime: string;
        endTime: string;
    }> => {
        if (!profileData?.schedules) return [];
        
        const backendDayOfWeek = convertDayOfWeek(date.getDay());
        const dateString = formatDateString(date);
        
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        // Get all overrides for this specific date
        const overridesForDate = profileData.scheduleOverride?.filter(override => {
            const normalizedOverrideDate = normalizeDateString(override.overrideDate);
            return normalizedOverrideDate === dateString && override.isAvailable;
        }) || [];
        
        // Get regular schedules for this day of week
        const regularSchedules = profileData.schedules.filter(schedule => 
            schedule.dayOfWeek === backendDayOfWeek && schedule.isAvailable
        );
        
        // Combine all time slots
        const allTimeSlots: Array<{
            startTime: string;
            endTime: string;
            type: 'regular' | 'override';
            reason?: string;
            id?: string; // Add ID to distinguish slots
        }> = [];
        
        // Add regular schedules first
        regularSchedules.forEach(schedule => {
            const startTime = schedule.startTime.slice(0, 5);
            const endTime = schedule.endTime.slice(0, 5);
            
            // Check if this regular schedule is overridden by any override
            const isOverridden = overridesForDate.some(override => {
                const overrideStart = override.startTime.slice(0, 5);
                const overrideEnd = override.endTime.slice(0, 5);
                return isTimeSlotOverlap(startTime, endTime, overrideStart, overrideEnd);
            });
            
            // Only add if not overridden
            if (!isOverridden) {
                allTimeSlots.push({
                    startTime,
                    endTime,
                    type: 'regular',
                    id: `regular_${schedule.id || `${schedule.dayOfWeek}_${startTime}`}`
                });
            }
        });
        
        // Add override schedules
        overridesForDate.forEach(override => {
            const startTime = override.startTime.slice(0, 5);
            const endTime = override.endTime.slice(0, 5);
            
            allTimeSlots.push({
                startTime,
                endTime,
                type: 'override',
                reason: override.reason,
                id: `override_${override.id}`
            });
        });
        
        // Sort by start time
        allTimeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        // Filter out past time slots if it's today
        const availableSlots = allTimeSlots.filter(slot => {
            if (isToday) {
                const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                const scheduleStartTime = new Date();
                scheduleStartTime.setHours(startHour, startMinute, 0, 0);
                return now < scheduleStartTime;
            }
            return true;
        });
        
        // Format time slots and return with metadata
        return availableSlots.map(slot => {
            return {
                display: `${slot.startTime} - ${slot.endTime}`,
                type: slot.type,
                reason: slot.reason,
                id: slot.id,
                startTime: slot.startTime,
                endTime: slot.endTime
            };
        });
    };

    const isDateAvailable = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) return false;
        
        if (!profileData?.schedules) return false;
        
        const dateString = formatDateString(date);
        const backendDayOfWeek = convertDayOfWeek(date.getDay());
        
        // Check if there are any available overrides for this specific date
        const availableOverrides = profileData.scheduleOverride?.filter(override => {
            const normalizedOverrideDate = normalizeDateString(override.overrideDate);
            return normalizedOverrideDate === dateString && override.isAvailable;
        }) || [];
        
        // Check if there are regular schedules for this day
        const regularSchedules = profileData.schedules.filter(schedule => 
            schedule.dayOfWeek === backendDayOfWeek && schedule.isAvailable
        );
        
        // Check if any regular schedule is not overridden by unavailable overrides
        const hasAvailableRegularSchedule = regularSchedules.some(schedule => {
            const startTime = schedule.startTime.slice(0, 5);
            const endTime = schedule.endTime.slice(0, 5);
            
            // Check if this regular schedule is made unavailable by any override
            const isOverriddenUnavailable = profileData.scheduleOverride?.some(override => {
                const normalizedOverrideDate = normalizeDateString(override.overrideDate);
                if (normalizedOverrideDate !== dateString) return false;
                if (override.isAvailable) return false; // Available overrides don't block regular schedules
                
                const overrideStart = override.startTime.slice(0, 5);
                const overrideEnd = override.endTime.slice(0, 5);
                return isTimeSlotOverlap(startTime, endTime, overrideStart, overrideEnd);
            });
            
            return !isOverriddenUnavailable;
        });
        
        // Date is available if there are available overrides OR available regular schedules
        return availableOverrides.length > 0 || hasAvailableRegularSchedule;
    };

    const handleDateSelect = (date: Date | null) => {
        setSelectedDate(date);
        setSelectedTimeSlot(null);
        setShowPaymentButton(false);
        setIsCreatingPayment(false);
        if (date) {
            const slots = getAvailableTimeSlots(date);
            setAvailableTimeSlots(slots);
        } else {
            setAvailableTimeSlots([]);
        }
    };

    const handleTimeSlotSelect = (timeSlot: string) => {
        setSelectedTimeSlot(timeSlot);
        setShowPaymentButton(false);
        setIsCreatingPayment(false);
    };

    // Calculate consultation duration from selected time slot
    const getConsultationDuration = (timeSlot: string, selectedDate?: Date): string => {
        if (!timeSlot || !profileData) return "30 phút";
        
        // timeSlot is now just the display string like "07:00 - 08:30"
        const [startTime, endTime] = timeSlot.split(' - ');
        
        if (!startTime || !endTime) return "30 phút";
        
        // Find the corresponding slot metadata to check if it's override
        const slotMetadata = availableTimeSlots.find(slot => slot.display === timeSlot);
        
        if (slotMetadata?.type === 'override' && selectedDate) {
            // For override slots, get duration from database
            const dateString = formatDateString(selectedDate);
            const override = profileData.scheduleOverride?.find(override => {
                const normalizedOverrideDate = normalizeDateString(override.overrideDate);
                if (normalizedOverrideDate !== dateString) return false;
                
                const overrideStart = override.startTime.slice(0, 5);
                const overrideEnd = override.endTime.slice(0, 5);
                return overrideStart === startTime && overrideEnd === endTime;
            });
            
            if (override) {
                // Calculate duration from database times
                const dbStart = new Date(`2000-01-01T${override.startTime}`);
                const dbEnd = new Date(`2000-01-01T${override.endTime}`);
                
                const diffMs = dbEnd.getTime() - dbStart.getTime();
                const diffMinutes = Math.round(diffMs / (1000 * 60));
                
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                
                if (hours > 0 && minutes > 0) {
                    return `${hours} giờ ${minutes} phút`;
                } else if (hours > 0) {
                    return `${hours} giờ`;
                } else {
                    return `${minutes} phút`;
                }
            }
        }
        
        // For regular slots or if override not found, calculate from display time
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        
        if (hours > 0 && minutes > 0) {
            return `${hours} giờ ${minutes} phút`;
        } else if (hours > 0) {
            return `${hours} giờ`;
        } else {
            return `${minutes} phút`;
        }
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

    // Check for tab parameter in URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'booking') {
            setActiveTabIndex(1);
        }
    }, [searchParams]);

    // Load metadata for filters
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [metadata, eduTypes] = await Promise.all([
                    DoctorRegistrationFormService.getMetadata(),
                    doctorService.getEducationTypes()
                ]);
                setSpecializations(metadata.specializations.map((s: any) => ({ id: s.id, name: s.name })));
                setEducationTypes(eduTypes);
            } catch (e) {
                console.error('Load metadata error:', e);
            } finally {
                setMetadataLoading(false);
                setEducationLoading(false);
            }
        };
        loadInitial();
    }, []);

    const loadTierData = useCallback(async (paginationParams: PaginationParams, educationCode: string, specializationCode: string, price: [number, number]) => {
        const queryParams: DoctorQueryParameters = {
            ...paginationParams,
            educationCode: educationCode === 'all' ? undefined : educationCode,
            specializationCode: specializationCode === 'all' ? undefined : specializationCode,
            minPrice: price[0],
            maxPrice: price[1]
        };
        const data = await doctorService.getDoctorsGroupedByTier(queryParams);
        return data;
    }, []);

    // Debounce temp price changes
    useEffect(() => {
        const t = setTimeout(() => setPriceRange(tempPriceRange), 400);
        return () => clearTimeout(t);
    }, [tempPriceRange]);

    // Initial + reactive load for sidebar doctor data
    useEffect(() => {
        const doLoad = async () => {
            // Avoid loading before profileData is ready (to determine relatedness)
            if (!profileData) return;

            if (isSidebarLoadingRef.current) return;
            isSidebarLoadingRef.current = true;
            const reqId = `${Date.now()}-${Math.random()}`;
            sidebarRequestIdRef.current = reqId;
            setSidebarLoading(true);
            try {
                const data = await loadTierData({ pageNumber: 1, pageSize: 12 }, selectedEducationCode, selectedSpecializationCode, priceRange);
                if (sidebarRequestIdRef.current === reqId) {
                    setTiersData(data);
                }
            } catch (e) {
                console.error('Load sidebar tiers error:', e);
            } finally {
                if (sidebarRequestIdRef.current === reqId) {
                    setSidebarLoading(false);
                    isSidebarLoadingRef.current = false;
                    initialSidebarLoadDoneRef.current = true;
                    sidebarRequestIdRef.current = null;
                }
            }
        };
        doLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileData, selectedEducationCode, selectedSpecializationCode, priceRange]);

    const relatedDoctors = useMemo(() => {
        if (!profileData || !tiersData?.length) return [] as DoctorInTier[];
        const all = tiersData.flatMap(t => t.doctors?.items || []);
        const currentId = (profileData as any)?.doctorID || (profileData as any)?.doctorId;
        const currentSpec = profileData.specialization;
        // same specialization, exclude current, has price
        const list = all.filter(d => {
            const sameSpec = (d.specialization || '').toLowerCase() === (currentSpec || '').toLowerCase();
            const notSelf = d.doctorId !== currentId;
            return sameSpec && notSelf;
        });
        // pick top 6
        return list.slice(0, 6);
    }, [profileData, tiersData]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await doctorService.getDoctorProfile(username);
                setProfileData(data);
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [username]);

    if (loading) {
        return (
            <div>
                <Header />
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Đang tải thông tin bác sĩ...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div>
                <Header />
                <div className={styles.errorContainer}>
                    <i className="bi bi-exclamation-triangle"></i>
                    <h2>Không tìm thấy thông tin bác sĩ</h2>
                    <button onClick={() => navigate('/doctors')} className={styles.backButton}>
                        <i className="bi bi-arrow-left"></i>
                        Quay lại danh sách
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <Header />
            
            <div className={styles.breadcrumb}>
                <button onClick={() => navigate('/')} className={styles.breadcrumbLink}>
                    <i className="bi bi-house-door"></i>
                    Trang chủ
                </button>
                <i className="bi bi-chevron-right"></i>
                <button onClick={() => navigate('/doctors')} className={styles.breadcrumbLink}>
                    Bác sĩ
                </button>
                <i className="bi bi-chevron-right"></i>
                <span className={styles.breadcrumbCurrent}>{profileData.fullName}</span>
            </div>

            <div className={styles.container}>
                {/* Two-column layout is rendered below (sidebar + main content) */}
                
                {/* Sidebar (left) with Filters and Related Doctors AND Main content on the right are rendered below */}
                {/* Sidebar (left) with Filters and Related Doctors */}
                <div className={bookingStyles.mainLayout} style={{ marginTop: 24 }}>
                    <aside className={bookingStyles.filterSidebar}>
                        <div className={bookingStyles.sidebarHeader}>
                            <i className="bi bi-funnel-fill"></i>
                            <h3>Bộ lọc</h3>
                        </div>

                        <div className={bookingStyles.filterGroup}>
                            <label className={bookingStyles.filterLabel}>
                                <i className="bi bi-mortarboard-fill"></i>
                                Học vị
                            </label>
                            <select
                                value={selectedEducationCode}
                                onChange={(e) => setSelectedEducationCode(e.target.value)}
                                className={bookingStyles.filterSelect}
                                disabled={educationLoading}
                            >
                                <option value="all">Tất cả học vị</option>
                                {educationTypes.map((education) => (
                                    <option key={education.code} value={education.code}>
                                        {education.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={bookingStyles.filterGroup}>
                            <label className={bookingStyles.filterLabel}>
                                <i className="bi bi-hospital-fill"></i>
                                Chuyên khoa
                            </label>
                            <select
                                value={selectedSpecializationCode}
                                onChange={(e) => setSelectedSpecializationCode(e.target.value)}
                                className={bookingStyles.filterSelect}
                                disabled={metadataLoading}
                            >
                                <option value="all">Tất cả chuyên khoa</option>
                                {specializations.map((spec) => (
                                    <option key={spec.id} value={spec.id}>
                                        {spec.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={bookingStyles.filterGroup}>
                            <label className={bookingStyles.filterLabel}>
                                <i className="bi bi-currency-dollar"></i>
                                Mức giá (VNĐ/lần hẹn)
                            </label>
                            <div className={bookingStyles.priceRangeDisplay}>
                                <span>{new Intl.NumberFormat('vi-VN').format(tempPriceRange[0])}</span>
                                <span>-</span>
                                <span>{new Intl.NumberFormat('vi-VN').format(tempPriceRange[1])}</span>
                            </div>
                            <div className={bookingStyles.priceSliderContainer}>
                                <div
                                    className={bookingStyles.priceTrack}
                                    style={{
                                        '--min': `${(tempPriceRange[0] / 3000000) * 100}%`,
                                        '--max': `${(tempPriceRange[1] / 3000000) * 100}%`,
                                    } as React.CSSProperties}
                                ></div>
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
                                    className={`${bookingStyles.rangeThumb} ${bookingStyles.thumbMin}`}
                                />
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
                                    className={`${bookingStyles.rangeThumb} ${bookingStyles.thumbMax}`}
                                />
                            </div>
                        </div>

                        {/* Related Doctors in Sidebar */}
                        <div className={bookingStyles.sidebarHeader} style={{ marginTop: 16 }}>
                            <i className="bi bi-people"></i>
                            <h3>Bác sĩ liên quan</h3>
                        </div>
                        {sidebarLoading ? (
                            <div className={bookingStyles.loadingContainer}>
                                <div className={bookingStyles.loadingSpinner}></div>
                                <p>Đang tải bác sĩ liên quan...</p>
                            </div>
                        ) : relatedDoctors.length === 0 ? (
                            <div className={bookingStyles.emptyState}>
                                <i className="bi bi-search"></i>
                                <h3>Không tìm thấy bác sĩ liên quan</h3>
                                <p>Điều chỉnh bộ lọc để xem thêm kết quả</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {relatedDoctors.map((d) => {
                                    const price = Number((d as any).price ?? (d as any).consultationFee ?? 0);
                                    const imageUrl = (d as any).avatarUrl ? (d as any).avatarUrl : undefined;
                                    return (
                                        <button
                                            key={d.doctorId}
                                            onClick={() => navigate(`/doctor/details/${d.doctorId}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                width: '100%',
                                                background: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: 12,
                                                padding: 8,
                                                textAlign: 'left',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flex: '0 0 56px' }}>
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={d.doctorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="bi bi-person-fill"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{d.doctorName}</div>
                                                <div style={{ fontSize: 12, color: '#6b7280' }}>{d.education} · {d.specialization}</div>
                                                <div style={{ fontSize: 13, color: '#111827' }}>{price > 0 ? new Intl.NumberFormat('vi-VN').format(price) + 'đ' : 'Liên hệ'}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </aside>

                    <div className={bookingStyles.mainContent}>
                        {/* Hero Section - Doctor Profile Card */}
                        <div className={styles.heroSection}>
                            <div className={styles.doctorProfileCard}>
                                <div className={styles.profileLeft}>
                                    <div className={styles.avatarWrapper}>
                                        {profileData.avatarUrl ? (
                                            <img src={profileData.avatarUrl} alt={profileData.fullName} className={styles.doctorAvatar} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                <i className="bi bi-person-fill"></i>
                                            </div>
                                        )}
                                        <div className={styles.verifiedBadge}>
                                            <i className="bi bi-patch-check-fill"></i>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.profileRight}>
                                    <div className={styles.doctorHeader}>
                                        <div className={styles.titleSection}>
                                            <span className={styles.doctorLabel}>Bác sĩ</span>
                                            <h1 className={styles.doctorName}>{profileData.fullName}</h1>
                                        </div>
                                        <div className={styles.ratingSection}>
                                            {renderStars(profileData.averageRating || 0)}
                                            <div className={styles.ratingInfo}>
                                                <span className={styles.ratingNumber}>{formatRating(profileData.averageRating || 0)}</span>
                                                <span className={styles.ratingDivider}>·</span>
                                                <span className={styles.reviewCount}>{profileData.numberOfReviews || 0} đánh giá</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoCard}>
                                            <div className={styles.infoIcon}>
                                                <i className="bi bi-hospital"></i>
                                            </div>
                                            <div className={styles.infoContent}>
                                                <span className={styles.infoLabel}>Chuyên khoa</span>
                                                <span className={styles.infoValue}>{profileData.specialization}</span>
                                            </div>
                                        </div>

                                        <div className={styles.infoCard}>
                                            <div className={styles.infoIcon}>
                                                <i className="bi bi-mortarboard-fill"></i>
                                            </div>
                                            <div className={styles.infoContent}>
                                                <span className={styles.infoLabel}>Trình độ học vấn</span>
                                                <span className={styles.infoValue}>{profileData.education}</span>
                                            </div>
                                        </div>

                                        <div className={styles.infoCard}>
                                            <div className={styles.infoIcon}>
                                                <i className="bi bi-award-fill"></i>
                                            </div>
                                            <div className={styles.infoContent}>
                                                <span className={styles.infoLabel}>Kinh nghiệm</span>
                                                <span className={styles.infoValue}>
                                                    {(() => {
                                                        const rawExp: unknown = profileData.yearsOfExperience ?? (profileData as any)?.experience;
                                                        const value = Number(rawExp);
                                                        if (Number.isFinite(value) && value > 0) {
                                                            return `${value} năm`;
                                                        }
                                                        if (typeof rawExp === 'string' && rawExp.trim()) {
                                                            return rawExp;
                                                        }
                                                        return 'N/A';
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.infoCard}>
                                            <div className={styles.infoIcon}>
                                                <i className="bi bi-currency-dollar"></i>
                                            </div>
                                            <div className={styles.infoContent}>
                                                <span className={styles.infoLabel}>Phí khám</span>
                                                <span className={styles.infoPriceValue}>
                                                    {(() => {
                                                        const rawPrice: unknown = profileData.consultationFee ?? profileData.price;
                                                        const value = Number(rawPrice);
                                                        return Number.isFinite(value) && value > 0
                                                            ? `${value.toLocaleString('vi-VN')}đ`
                                                            : 'Liên hệ';
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        className={styles.bookNowButton}
                                        onClick={() => setActiveTabIndex(1)}
                                    >
                                        <i className="bi bi-calendar-check-fill"></i>
                                        Đặt lịch khám ngay
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Section */}
                        <div className={styles.tabsSection}>
                            <div className={styles.tabButtons}>
                                <button
                                    className={`${styles.tabButton} ${activeTabIndex === 0 ? styles.active : ''}`}
                                    onClick={() => setActiveTabIndex(0)}
                                >
                                    <i className="bi bi-person-lines-fill"></i>
                                    Giới thiệu
                                </button>
                                <button
                                    className={`${styles.tabButton} ${activeTabIndex === 1 ? styles.active : ''}`}
                                    onClick={() => setActiveTabIndex(1)}
                                >
                                    <i className="bi bi-calendar-event"></i>
                                    Đặt lịch khám
                                </button>
                                <button
                                    className={`${styles.tabButton} ${activeTabIndex === 2 ? styles.active : ''}`}
                                    onClick={() => setActiveTabIndex(2)}
                                >
                                    <i className="bi bi-star-fill"></i>
                                    Đánh giá ({profileData.numberOfReviews || 0})
                                </button>
                            </div>

                            <div className={styles.tabContent}>
                                {activeTabIndex === 0 && (
                                    <div className={styles.bioTab}>
                                        <div className={styles.bioCard}>
                                            <h3 className={styles.sectionTitle}>
                                                <i className="bi bi-info-circle-fill"></i>
                                                Về bác sĩ
                                            </h3>
                                            <p className={styles.bioText}>
                                                {profileData.biography || 'Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực y tế.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTabIndex === 1 && (
                                    <div className={styles.bookingTab}>
                                        <div className={styles.bookingLayout}>
                                            <div className={styles.calendarSection}>
                                                <div className={styles.sectionHeader}>
                                                    <h3>
                                                        <i className="bi bi-calendar3"></i>
                                                        Chọn ngày khám
                                                    </h3>
                                                </div>
                                                <div className={styles.calendarContainer}>
                                                    <div className={styles.calendarHeader}>
                                                        <button 
                                                            className={styles.calendarNav}
                                                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                                        >
                                                            <i className="bi bi-chevron-left"></i>
                                                        </button>
                                                        <h4 className={styles.calendarMonth}>
                                                            {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                                        </h4>
                                                        <button 
                                                            className={styles.calendarNav}
                                                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                                        >
                                                            <i className="bi bi-chevron-right"></i>
                                                        </button>
                                                    </div>
                                                    <div className={styles.calendarGrid}>
                                                        <div className={styles.calendarWeekdays}>
                                                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                                                <div key={day} className={styles.weekday}>{day}</div>
                                                            ))}
                                                        </div>
                                                        <div className={styles.calendarDates}>
                                                            {(() => {
                                                                // Get first day of the month
                                                                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                                                                
                                                                // Convert Sunday (0) to 7 for Monday-based week
                                                                const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
                                                                
                                                                // Calculate start date (Monday of the week containing first day)
                                                                const startDate = new Date(firstDay);
                                                                startDate.setDate(firstDay.getDate() - (firstDayOfWeek - 1));
                                                                
                                                                // Generate 42 days (6 weeks) for calendar grid
                                                                return Array.from({ length: 42 }, (_, i) => {
                                                                    const date = new Date(startDate);
                                                                    date.setDate(startDate.getDate() + i);
                                                                    
                                                                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                                                                    const isAvailable = isDateAvailable(date);
                                                                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                                                    const isToday = new Date().toDateString() === date.toDateString();
                                                                    
                                                                    // Check if this date has an override
                                                                    const dateString = formatDateString(date);
                                                                    const hasOverride = profileData?.scheduleOverride?.some(override => {
                                                                        const normalizedOverrideDate = normalizeDateString(override.overrideDate);
                                                                        return normalizedOverrideDate === dateString;
                                                                    });
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={i}
                                                                            className={`${styles.calendarDate} ${!isCurrentMonth ? styles.otherMonth : ''} ${!isAvailable ? styles.unavailable : ''} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''} ${hasOverride ? styles.hasOverride : ''}`}
                                                                            onClick={() => isAvailable && handleDateSelect(date)}
                                                                            disabled={!isAvailable}
                                                                        >
                                                                            {date.getDate()}
                                                                            {hasOverride && (
                                                                                <span className={styles.overrideIndicator}>
                                                                                    <i className="bi bi-star-fill"></i>
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Calendar Legend */}
                                                    <div className={styles.calendarLegend}>
                                                        <div className={styles.legendItem}>
                                                            <div className={`${styles.legendColor} ${styles.todayLegend}`}></div>
                                                            <span>Hôm nay</span>
                                                        </div>
                                                        <div className={styles.legendItem}>
                                                            <div className={`${styles.legendColor} ${styles.overrideLegend}`}>
                                                                <i className="bi bi-star-fill"></i>
                                                            </div>
                                                            <span>Có lịch bổ sung</span>
                                                        </div>
                                                        <div className={styles.legendItem}>
                                                            <div className={`${styles.legendColor} ${styles.unavailableLegend}`}></div>
                                                            <span>Không khả dụng</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Time Slot Legend */}
                                                    <div className={styles.timeSlotLegend}>
                                                        <div className={styles.legendTitle}>Chú thích khung giờ:</div>
                                                        <div className={styles.legendItem}>
                                                            <i className="bi bi-clock-fill" style={{ color: '#475569' }}></i>
                                                            <span>Lịch thường</span>
                                                        </div>
                                                        <div className={styles.legendItem}>
                                                            <i className="bi bi-star-fill" style={{ color: '#f59e0b' }}></i>
                                                            <span>Lịch bổ sung</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.timeslotsSection}>
                                                <div className={styles.sectionHeader}>
                                                    <h3>
                                                        <i className="bi bi-clock"></i>
                                                        Chọn giờ khám
                                                    </h3>
                                                </div>
                                                {selectedDate ? (
                                                    <div className={styles.timeslotsContainer}>
                                                        <div className={styles.selectedDateInfo}>
                                                            <i className="bi bi-calendar-check"></i>
                                                            <span>{selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                        </div>
                                                        
                                                        {availableTimeSlots.length > 0 ? (
                                                            <div className={styles.timeslotsGrid}>
                                                                {availableTimeSlots.map((slot, index) => {
                                                                    const isOverrideSlot = slot.type === 'override';
                                                                    const isSelected = selectedTimeSlot === slot.display;
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={index}
                                                                            className={`${styles.timeslot} ${isSelected ? styles.selected : ''} ${isOverrideSlot ? styles.overrideSlot : styles.regularSlot}`}
                                                                            onClick={() => handleTimeSlotSelect(slot.display)}
                                                                        >
                                                                            <i className={`bi ${isOverrideSlot ? 'bi-star-fill' : 'bi-clock-fill'}`}></i>
                                                                            <span className={styles.timeText}>{slot.display}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className={styles.noSlotsMessage}>
                                                                <i className="bi bi-exclamation-circle"></i>
                                                                <p>Không có ca khám nào trong ngày này</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={styles.noDateSelected}>
                                                        <i className="bi bi-calendar-x"></i>
                                                        <p>Vui lòng chọn ngày để xem các ca khám có sẵn</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedDate && selectedTimeSlot && (
                                            <div className={styles.bookingConfirmation}>
                                                <div className={styles.bookingSummary}>
                                                    <h3>
                                                        <i className="bi bi-clipboard-check"></i>
                                                        Thông tin đặt lịch
                                                    </h3>
                                                    <div className={styles.summaryGrid}>
                                                        <div className={styles.summaryItem}>
                                                            <span className={styles.summaryLabel}>Ngày khám</span>
                                                            <span className={styles.summaryValue}>{selectedDate.toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <div className={styles.summaryItem}>
                                                            <span className={styles.summaryLabel}>Giờ khám</span>
                                                            <span className={styles.summaryValue}>{selectedTimeSlot}</span>
                                                        </div>
                                                        <div className={styles.summaryItem}>
                                                            <span className={styles.summaryLabel}>Thời gian khám</span>
                                                            <span className={styles.summaryValue}>{getConsultationDuration(selectedTimeSlot, selectedDate)}</span>
                                                        </div>
                                                        <div className={styles.summaryItem}>
                                                            <span className={styles.summaryLabel}>Phí khám</span>
                                                            <span className={styles.summaryPrice}>
                                                                {(() => {
                                                                    const rawPrice: unknown = profileData.consultationFee ?? profileData.price;
                                                                    const value = Number(rawPrice);
                                                                    return Number.isFinite(value) && value > 0
                                                                        ? `${value.toLocaleString('vi-VN')}đ`
                                                                        : 'Liên hệ';
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!showPaymentButton ? (
                                                        <button className={styles.confirmButton} onClick={handleBookingConfirm}>
                                                            <i className="bi bi-check-circle-fill"></i>
                                                            Xác nhận đặt lịch
                                                        </button>
                                                    ) : (
                                                        <button className={styles.paymentButton} onClick={handleCreatePaymentLink} disabled={isCreatingPayment}>
                                                            {isCreatingPayment ? (
                                                                <>
                                                                    <div className={styles.buttonSpinner}></div>
                                                                    Đang tạo link thanh toán...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bi bi-credit-card-fill"></i>
                                                                    Thanh toán ngay
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTabIndex === 2 && (
                                    <div className={styles.ratingTab}>
                                        <div className={styles.ratingOverview}>
                                            <div className={styles.overallRating}>
                                                <div className={styles.ratingScore}>
                                                    <span className={styles.ratingNumber}>{formatRating(profileData.averageRating || 0)}</span>
                                                    <span className={styles.ratingMax}>/5.0</span>
                                                </div>
                                                {renderStars(profileData.averageRating || 0)}
                                                <p className={styles.totalReviews}>Dựa trên {profileData.numberOfReviews || 0} đánh giá</p>
                                            </div>
                                            <div className={styles.ratingBreakdown}>
                                                {profileData?.ratingByStar && (
                                                    <>
                                                        {profileData.ratingByStar.map((count: number, index: number) => {
                                                            const star = index + 1;
                                                            const totalRatings = profileData.ratingByStar.reduce((sum, c) => sum + c, 0);
                                                            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                                                            return (
                                                                <div className={styles.ratingBarItem} key={star}>
                                                                    <span className={styles.starLabel}>{star} <i className="bi bi-star-fill"></i></span>
                                                                    <div className={styles.ratingBarContainer}>
                                                                        <div className={styles.ratingBarFill} style={{ width: `${percentage}%` }} />
                                                                    </div>
                                                                    <span className={styles.ratingCount}>{count}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.reviewsSection}>
                                            <h3 className={styles.reviewsTitle}>
                                                <i className="bi bi-chat-square-text"></i>
                                                Nhận xét từ bệnh nhân
                                            </h3>
                                            {profileData.reviews && profileData.reviews.length > 0 ? (
                                                <div className={styles.reviewsList}>
                                                    {profileData.reviews.map((review, index) => (
                                                        <div className={styles.reviewCard} key={index}>
                                                            <div className={styles.reviewHeader}>
                                                                <div className={styles.reviewerAvatar}>
                                                                    <i className="bi bi-person-circle"></i>
                                                                </div>
                                                                <div className={styles.reviewerInfo}>
                                                                    <span className={styles.reviewerName}>Bệnh nhân</span>
                                                                    <div className={styles.reviewRating}>
                                                                        {renderStars(review.rating)}
                                                                        <span className={styles.reviewDate}>{review.date}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className={styles.reviewText}>{review.comment}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className={styles.noReviews}>
                                                    <i className="bi bi-chat-square-dots"></i>
                                                    <p>Chưa có đánh giá nào</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}

export default DoctorDetails;