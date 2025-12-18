import { useParams, useSearchParams, useNavigate, useLocation, Link } from "react-router-dom";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import doctorService from "../../services/doctorService";
import { DoctorProfileDto, ServiceTierWithPaginatedDoctorsDto, DoctorTypeDegreeDto, DoctorInTier, PaginationParams, DoctorQueryParameters } from "../../types/doctor.types";
import { Header } from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import paymentService from "../../services/paymentService";
import promotionService from "../../services/promotionService";
import { appointmentService } from "../../services/appointmentService";
import { PromotionDto, UserPromotionDto } from "../../types/promotion.types";
import { CreateAppointmentDto } from "../../types/appointment.types";
import styles from '../../styles/doctor/doctor-details.module.css';
import bookingStyles from '../../styles/patient/DoctorBookingList.module.css';
import homeStyles from '../../styles/public/home.module.css';
import DoctorRegistrationFormService from "../../services/doctorRegistrationFormService";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";

const normalizeAdminResponse = (response?: string | null) => {
    if (!response) return null;
    const trimmed = response.trim();
    if (/^thanks for your feedback!?$/i.test(trimmed)) {
        return 'Cảm ơn bạn đã chia sẻ phản hồi với MEDIX!';
    }
    return response;
};

function DoctorDetails() {
    const { showToast } = useToast();
    const [profileData, setProfileData] = useState<DoctorProfileDto>();
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);    
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
        display: string;
        type: 'regular' | 'override';
        reason?: string;
        id?: string;
        startTime: string;
        endTime: string;
    } | null>(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{
        display: string;
        type: 'regular' | 'override';
        reason?: string;
        id?: string;
        startTime: string;
        endTime: string;
    }>>([]);
    const [chiefComplaint, setChiefComplaint] = useState<string>('');
    const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState<string>('');
    const calendarSectionRef = useRef<HTMLDivElement>(null);
    const timeslotsSectionRef = useRef<HTMLDivElement>(null);
    const bookingConfirmationRef = useRef<HTMLDivElement>(null);
    const getAvailableDates = (): Date[] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = convertDayOfWeek(today.getDay());
        const isSunday = dayOfWeek === 7;
        const isFriday = dayOfWeek === 4;
        const isSaturday = dayOfWeek === 6;
        const dates: Date[] = [];
        if (isSunday) {
            dates.push(new Date(today));
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + 1); 
            for (let i = 0; i < 7; i++) {
                const date = new Date(nextMonday);
                date.setDate(nextMonday.getDate() + i);
                dates.push(date);
            }
        } else if (isFriday) {
            for (let i = 0; i < 3; i++) { 
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                dates.push(date);
            }
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + 3); 
            for (let i = 0; i < 7; i++) {
                const date = new Date(nextMonday);
                date.setDate(nextMonday.getDate() + i);
                dates.push(date);
            }
        } else if (isSaturday) {
            for (let i = 0; i < 2; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                dates.push(date);
            }
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + 2); 
            for (let i = 0; i < 7; i++) {
                const date = new Date(nextMonday);
                date.setDate(nextMonday.getDate() + i);
                dates.push(date);
            }
        } else {
            const daysUntilSunday = 8 - dayOfWeek; 
            for (let i = 0; i < daysUntilSunday; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                dates.push(date);
            }
        }
        return dates;
    };
    const [showPaymentButton, setShowPaymentButton] = useState(false);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);
    const [promotionCode, setPromotionCode] = useState<string>('');
    const [appliedPromotion, setAppliedPromotion] = useState<PromotionDto | null>(null);
    const [appliedUserPromotion, setAppliedUserPromotion] = useState<UserPromotionDto | null>(null);
    const [promotionError, setPromotionError] = useState<string>('');
    const [isCheckingPromotion, setIsCheckingPromotion] = useState(false);
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [availablePromotions, setAvailablePromotions] = useState<UserPromotionDto[]>([]);
    const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);

    const { username } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const routeState = (location && (location as any).state) as { doctorId?: string; fullName?: string; userName?: string } | null;
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
                        return false;
                    }
                }
            }
        }
        return false;
    };
    const handleBookingConfirm = async () => {
        if (!profileData || !selectedDate || !selectedTimeSlot) return;
        
        if (!chiefComplaint || !chiefComplaint.trim()) {
            showToast("Vui lòng nhập lý do khám trước khi đặt lịch hẹn.", 'warning');
            return;
        }
        if (!historyOfPresentIllness || !historyOfPresentIllness.trim()) {
            showToast("Vui lòng nhập quá trình bệnh lý diễn biến trước khi đặt lịch hẹn.", 'warning');
            return;
        }
        
        if (!checkUserLogin()) {
            showToast("Bạn cần đăng nhập để đặt lịch hẹn với bác sĩ. Vui lòng đăng nhập để tiếp tục.", 'warning');
            navigate('/login');
            return;
        }
        
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.role !== 'Patient') {
                    showToast("Chỉ có bệnh nhân mới có thể đặt lịch hẹn với bác sĩ.", 'error');
                    return;
                }
            } catch (error) {
                showToast("Có lỗi xảy ra khi xác thực thông tin người dùng.", 'error');
                return;
            }
        }
        setShowConfirmModal(true);
    };
    const handleConfirmedBooking = async () => {
        if (!profileData || !selectedDate || !selectedTimeSlot) return;
        
        if (!chiefComplaint || !chiefComplaint.trim()) {
            showToast("Vui lòng nhập lý do khám trước khi đặt lịch hẹn.", 'warning');
            setShowConfirmModal(false);
            return;
        }
        if (!historyOfPresentIllness || !historyOfPresentIllness.trim()) {
            showToast("Vui lòng nhập quá trình bệnh lý diễn biến trước khi đặt lịch hẹn.", 'warning');
            setShowConfirmModal(false);
            return;
        }
        
        setShowConfirmModal(false);
        setIsCreatingPayment(true);
        try {
            const displayTime = selectedTimeSlot.display;
            const timeParts = displayTime.split(' - ');
            if (timeParts.length !== 2) {
                showToast('Định dạng giờ không hợp lệ', 'error');
                setIsCreatingPayment(false);
                return;
            }
            const [startTime, endTime] = timeParts;
            const appointmentStart = new Date(selectedDate);
            const startTimeParts = startTime.trim().split(':');
            const startHour = parseInt(startTimeParts[0], 10);
            const startMinute = parseInt(startTimeParts[1], 10);
            appointmentStart.setHours(startHour, startMinute, 0, 0);
            const appointmentEnd = new Date(selectedDate);
            const endTimeParts = endTime.trim().split(':');
            const endHour = parseInt(endTimeParts[0], 10);
            const endMinute = parseInt(endTimeParts[1], 10);
            appointmentEnd.setHours(endHour, endMinute, 0, 0);
            const durationMinutes = Math.round((appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60));
            const formatToISOStringWithTimezone = (date: Date): string => {
                const pad = (num: number) => num.toString().padStart(2, '0');
                const year = date.getFullYear();
                const month = pad(date.getMonth() + 1);
                const day = pad(date.getDate());
                const hours = pad(date.getHours());
                const minutes = pad(date.getMinutes());
                const seconds = pad(date.getSeconds());
                const timezoneOffset = -date.getTimezoneOffset();
                const offsetSign = timezoneOffset >= 0 ? '+' : '-';
                const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
                const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
            };
            const consultationFee = profileData.consulationFee || 0;
            const finalPrice = calculateFinalPrice();
            const discountAmount = appliedPromotion ? (consultationFee - finalPrice) : 0;
            const platformFee = 0; 
            const totalAmount = finalPrice + platformFee;
            const appointmentDto: CreateAppointmentDto = {
                doctorId: profileData.doctorID,
                appointmentStartTime: formatToISOStringWithTimezone(appointmentStart),
                appointmentEndTime: formatToISOStringWithTimezone(appointmentEnd),
                durationMinutes: durationMinutes,
                consultationFee: consultationFee,
                platformFee: platformFee,
                discountAmount: discountAmount,
                totalAmount: totalAmount,
                chiefComplaint: chiefComplaint.trim(),
                historyOfPresentIllness: historyOfPresentIllness.trim(),
                userPromotionID: appliedUserPromotion?.id,
                promotionCode: appliedUserPromotion ? undefined : (appliedPromotion ? promotionCode : undefined),
            };
            const createdAppointment = await appointmentService.createAppointment(appointmentDto);
            setShowSuccessModal(true);
        } catch (error: any) {
            let errorMessage = 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
                // Kiểm tra nếu lỗi là không đủ tiền
                if (errorMessage === 'Tài khoản của quý khách không đủ tiền') {
                    setShowInsufficientBalanceModal(true);
                    return;
                }
            } else if (error.response?.status === 400) {
                errorMessage = 'Thông tin đặt lịch không hợp lệ. Vui lòng kiểm tra lại.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                navigate('/login');
            }
            showToast(errorMessage, 'error');
        } finally {
            setIsCreatingPayment(false);
        }
    };
    const handleApplyPromotion = async () => {
        if (!promotionCode.trim()) {
            setPromotionError('Vui lòng nhập mã khuyến mãi');
            return;
        }

        setIsCheckingPromotion(true);
        setPromotionError('');
        try {
            const promotion = await promotionService.getPromotionByCode(promotionCode.trim());
            if (!promotion) {
                const errorMessage = 'Mã khuyến mãi không tồn tại';
                setPromotionError(errorMessage);
                showToast(errorMessage, 'error');
                setAppliedPromotion(null);
                return;
            }
            if (!promotion.isActive) {
                const errorMessage = 'Mã khuyến mãi đã hết hạn hoặc không còn hiệu lực';
                setPromotionError(errorMessage);
                showToast(errorMessage, 'error');
                setAppliedPromotion(null);
                return;
            }
            const now = new Date();
            const startDate = new Date(promotion.startDate);
            const endDate = new Date(promotion.endDate);
            if (now < startDate || now > endDate) {
                const errorMessage = 'Mã khuyến mãi không trong thời gian sử dụng';
                setPromotionError(errorMessage);
                showToast(errorMessage, 'error');
                setAppliedPromotion(null);
                return;
            }
            if (promotion.maxUsage && promotion.usedCount >= promotion.maxUsage) {
                const errorMessage = 'Mã khuyến mãi đã hết lượt sử dụng';
                setPromotionError(errorMessage);
                showToast(errorMessage, 'error');
                setAppliedPromotion(null);
                return;
            }
            setAppliedPromotion(promotion);
            setPromotionError('');
            showToast('Áp dụng mã khuyến mãi thành công!', 'success');
        } catch (error: any) {
            let errorMessage = 'Có lỗi xảy ra khi kiểm tra mã khuyến mãi';
            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || error.response.data || 'Mã khuyến mãi không hợp lệ';
            } else if (error.response?.status === 404) {
                errorMessage = 'Mã khuyến mãi không tồn tại';
            }
            setPromotionError(errorMessage);
            showToast(errorMessage, 'error');
            setAppliedPromotion(null);
        } finally {
            setIsCheckingPromotion(false);
        }
    };
    const handleOpenPromotionModal = async () => {
        setShowPromotionModal(true);
        setIsLoadingPromotions(true);
        setAvailablePromotions([]);

        try {
            const userPromotions = await promotionService.getUserActivePromotions();
            const validPromotions = userPromotions.filter(up => {
                if (!up.promotion) {
                    return false;
                }
                return true;
            });
            setAvailablePromotions(validPromotions);
        } catch (error) {
            setAvailablePromotions([]);
        } finally {
            setIsLoadingPromotions(false);
        }
    };
    const handleSelectPromotion = (userPromotion: UserPromotionDto) => {
        if (!userPromotion.promotion) {
            setPromotionError('Mã khuyến mãi không hợp lệ');
            return;
        }
        setAppliedPromotion(userPromotion.promotion);
        setAppliedUserPromotion(userPromotion); 
        setPromotionCode(userPromotion.promotion.code);
        setPromotionError('');
        setShowPromotionModal(false);
    };
    const formatCurrencyCompact = (value: number): string => {
        const amount = value || 0;
        const abs = Math.abs(amount);

        if (abs >= 1_000_000_000) {
            const compact = amount / 1_000_000_000;
            const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
            return `${text}B VND`;
        }

        if (abs >= 1_000_000) {
            const compact = amount / 1_000_000;
            const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
            return `${text}M VND`;
        }

        if (abs >= 1_000) {
            const compact = amount / 1_000;
            const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
            return `${text}K VND`;
        }

        return `${amount.toLocaleString('vi-VN')} VND`;
    };

    const calculateFinalPrice = (): number => {
        if (!profileData?.consulationFee) return 0;
        const basePrice = Number(profileData.consulationFee);
        if (!appliedPromotion) return basePrice;

        if (appliedPromotion.discountType === 'Percentage') {
            const discount = (basePrice * appliedPromotion.discountValue) / 100;
            return basePrice - discount;
        } else if (appliedPromotion.discountType === 'FixedAmount') {
            return Math.max(0, basePrice - appliedPromotion.discountValue);
        }

        return basePrice;
    };
    const handleCreatePaymentLink = async () => {
        if (!profileData || !selectedDate || !selectedTimeSlot) return;
        setIsCreatingPayment(true);
        try {
            const finalPrice = calculateFinalPrice();
            const displayTime = selectedTimeSlot.display;
            const timeParts = displayTime.split(' - ');
            if (timeParts.length !== 2) {
                showToast('Định dạng giờ không hợp lệ', 'error');
                setIsCreatingPayment(false);
                return;
            }
            const [startTime, endTime] = timeParts;
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth(); 
            const day = selectedDate.getDate();
            
            const appointmentStart = new Date(year, month, day);
            const startTimeParts = startTime.trim().split(':');
            const startHour = parseInt(startTimeParts[0], 10);
            const startMinute = parseInt(startTimeParts[1], 10);
            if (isNaN(startHour) || isNaN(startMinute)) {
                showToast(`Lỗi parse giờ bắt đầu: "${startTime}"`, 'error');
                setIsCreatingPayment(false);
                return;
            }
            appointmentStart.setHours(startHour, startMinute, 0, 0);
            const appointmentEnd = new Date(year, month, day);
            const endTimeParts = endTime.trim().split(':');
            const endHour = parseInt(endTimeParts[0], 10);
            const endMinute = parseInt(endTimeParts[1], 10);
            if (isNaN(endHour) || isNaN(endMinute)) {
                showToast(`Lỗi parse giờ kết thúc: "${endTime}"`, 'error');
                setIsCreatingPayment(false);
                return;
            }
            appointmentEnd.setHours(endHour, endMinute, 0, 0);
            const formatLocalDateTime = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            };
            const appointmentStartStr = formatLocalDateTime(appointmentStart);
            const appointmentEndStr = formatLocalDateTime(appointmentEnd);

            const itemData = paymentService.createDoctorConsultationItem(
                profileData.fullName,
                finalPrice,
                profileData.doctorID, 
                appointmentStartStr, 
                appointmentEndStr, 
                appliedPromotion?.code 
            );
            const result = await paymentService.createPaymentLink(itemData);

            if (result.success && result.checkoutUrl) {
                paymentService.redirectToPayment(result.checkoutUrl);
            } else {
                showToast(result.error || 'Có lỗi xảy ra khi tạo link thanh toán.', 'error');
            }
        } catch (error) {
            showToast('Có lỗi xảy ra khi tạo link thanh toán. Vui lòng thử lại.', 'error');
        }
        setIsCreatingPayment(false);
    };

    const convertDayOfWeek = (jsDayOfWeek: number): number => {
        return jsDayOfWeek === 0 ? 7 : jsDayOfWeek;
    };

    const formatDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const normalizeDateString = (dateStr: string): string => {
        if (dateStr.includes('T')) {
            return dateStr.split('T')[0];
        }
        return dateStr;
    };

    const isTimeSlotOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
        return start1 < end2 && end1 > start2;
    };
    const isTimeSlotWithin = (innerStart: string, innerEnd: string, outerStart: string, outerEnd: string): boolean => {
        return innerStart >= outerStart && innerEnd <= outerEnd;
    };

    const getAvailableTimeSlots = (date: Date): Array<{
        display: string;
        type: 'regular' | 'override';
        reason?: string;
        id?: string;
        startTime: string;
        endTime: string;
    }> => {
        if (!profileData?.schedules) return [];
        
        // Verificar se o médico está aceitando agendamentos
        if (profileData.isAcceptingAppointments === false) {
            return [];
        }
        
        // Verificar se a data está no intervalo de banimento
        if (profileData.startDateBan && profileData.endDateBan) {
            const dateString = formatDateString(date);
            const normalizedStartBan = normalizeDateString(profileData.startDateBan);
            const normalizedEndBan = normalizeDateString(profileData.endDateBan);
            
            // Se a data estiver entre startDateBan e endDateBan, não mostrar horários
            if (dateString >= normalizedStartBan && dateString <= normalizedEndBan) {
                return [];
            }
        }
        
        const backendDayOfWeek = convertDayOfWeek(date.getDay());
        const dateString = formatDateString(date);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const overridesForDate = profileData.scheduleOverride?.filter(override => {
            const normalizedOverrideDate = normalizeDateString(override.overrideDate);
            return normalizedOverrideDate === dateString;
        }) || [];
        const workingOverrides = overridesForDate.filter(override => {
            const overrideTypeValue = override.overrideType === true || (override.overrideType as any) === 'true';
            const result = overrideTypeValue && override.isAvailable;
            return result;
        });
        const nonWorkingOverrides = overridesForDate.filter(override => {
            const overrideTypeValue = override.overrideType === false || 
                                     (override.overrideType as any) === 'false' || 
                                     override.overrideType === null ||
                                     override.overrideType === undefined ||
                                     (override.overrideType as any) === 0;
            return overrideTypeValue;
        });
        const regularSchedules = profileData.schedules.filter(schedule => 
            schedule.dayOfWeek === backendDayOfWeek && schedule.isAvailable
        );
        const allTimeSlots: Array<{
            startTime: string;
            endTime: string;
            type: 'regular' | 'override';
            reason?: string;
            id?: string; 
        }> = [];
        regularSchedules.forEach(schedule => {
            const startTime = schedule.startTime.slice(0, 5);
            const endTime = schedule.endTime.slice(0, 5);
            const isBlockedByNonWorking = nonWorkingOverrides.some(override => {
                const overrideStart = override.startTime.slice(0, 5);
                const overrideEnd = override.endTime.slice(0, 5);
                const overlaps = isTimeSlotOverlap(startTime, endTime, overrideStart, overrideEnd);
                return overlaps;
            });
            const isReplacedByWorking = workingOverrides.some(override => {
                const overrideStart = override.startTime.slice(0, 5);
                const overrideEnd = override.endTime.slice(0, 5);
                return isTimeSlotOverlap(startTime, endTime, overrideStart, overrideEnd);
            });
            if (!isBlockedByNonWorking && !isReplacedByWorking) {
                allTimeSlots.push({
                    startTime,
                    endTime,
                    type: 'regular',
                    id: `regular_${schedule.id || `${schedule.dayOfWeek}_${startTime}`}`
                });
            }
        });
        workingOverrides.forEach(override => {
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
        allTimeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        const availableSlots = allTimeSlots.filter(slot => {
            if (isToday) {
                const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                const scheduleStartTime = new Date();
                scheduleStartTime.setHours(startHour, startMinute, 0, 0);
                return now < scheduleStartTime;
            }
            return true;
        });
        const bookedAppointments = profileData.appointmentBookedDtos || [];
        const availableSlotsNotBooked = availableSlots.filter(slot => {
            const isBooked = bookedAppointments.some(booked => {
                if (!booked.startTime || !booked.endTime) return false;
                const bookedStart = new Date(booked.startTime);
                const bookedEnd = new Date(booked.endTime);
                const bookedDateString = formatDateString(bookedStart);
                if (bookedDateString !== dateString) return false;
                const bookedStartTime = `${String(bookedStart.getHours()).padStart(2, '0')}:${String(bookedStart.getMinutes()).padStart(2, '0')}`;
                const bookedEndTime = `${String(bookedEnd.getHours()).padStart(2, '0')}:${String(bookedEnd.getMinutes()).padStart(2, '0')}`;
                const overlaps = isTimeSlotOverlap(slot.startTime, slot.endTime, bookedStartTime, bookedEndTime);
                return overlaps;
            });
            return !isBooked;
        });
        return availableSlotsNotBooked.map(slot => {
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
        const availableSlots = getAvailableTimeSlots(date);
        return availableSlots.length > 0;
    };

    const handleDateSelect = (date: Date | null) => {
        setSelectedDate(date);
        setSelectedTimeSlot(null);
        setShowPaymentButton(false);
        setIsCreatingPayment(false);
        if (date) {
            const slots = getAvailableTimeSlots(date);
            setAvailableTimeSlots(slots);
            setTimeout(() => {
                if (timeslotsSectionRef.current) {
                    timeslotsSectionRef.current.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }, 100);
        } else {
            setAvailableTimeSlots([]);
        }
    };

    const handleTimeSlotSelect = (slot: {
        display: string;
        type: 'regular' | 'override';
        reason?: string;
        id?: string;
        startTime: string;
        endTime: string;
    }) => {
        setSelectedTimeSlot(slot);
        setShowPaymentButton(false);
        setIsCreatingPayment(false);
        setTimeout(() => {
            if (bookingConfirmationRef.current) {
                bookingConfirmationRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 100);
    };

    const getConsultationDuration = (timeSlot: string, selectedDate?: Date): string => {
        if (!timeSlot || !profileData) return "30 phút";
        const [startTime, endTime] = timeSlot.split(' - ');
        if (!startTime || !endTime) return "30 phút";
        const slotMetadata = availableTimeSlots.find(slot => slot.display === timeSlot);
        if (slotMetadata?.type === 'override' && selectedDate) {
            const dateString = formatDateString(selectedDate);
            const override = profileData.scheduleOverride?.find(override => {
                const normalizedOverrideDate = normalizeDateString(override.overrideDate);
                if (normalizedOverrideDate !== dateString) return false;
                if (override.overrideType === false) return false; 
                const overrideStart = override.startTime.slice(0, 5);
                const overrideEnd = override.endTime.slice(0, 5);
                return overrideStart === startTime && overrideEnd === endTime;
            });
            
            if (override) {
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

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'booking') {
            setActiveTabIndex(1);
            setTimeout(() => {
                if (calendarSectionRef.current) {
                    calendarSectionRef.current.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }, 200);
        }
    }, [searchParams]);

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

    useEffect(() => {
        const t = setTimeout(() => setPriceRange(tempPriceRange), 400);
        return () => clearTimeout(t);
    }, [tempPriceRange]);
    useEffect(() => {
        const doLoad = async () => {
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
    }, [profileData, selectedEducationCode, selectedSpecializationCode, priceRange]);

    const relatedDoctors = useMemo(() => {
        if (!profileData || !tiersData?.length) return [] as DoctorInTier[];
        const all = tiersData.flatMap(t => t.doctors?.items || []);
        const currentId = (profileData as any)?.doctorID || (profileData as any)?.doctorId;
        const currentSpec = profileData.specialization;
        const list = all.filter(d => {
            const sameSpec = (d.specialization || '').toLowerCase() === (currentSpec || '').toLowerCase();
            const notSelf = d.doctorId !== currentId;
            return sameSpec && notSelf;
        });
        return list.slice(0, 6);
    }, [profileData, tiersData]);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const key = routeState?.doctorId || username;
            try {
                setLoading(true);
                const data = await doctorService.getDoctorProfile(username);
                setProfileData(data);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [username, routeState?.doctorId, routeState?.fullName, routeState?.userName]);

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
            
            <nav className={homeStyles["navbar"]}>
                <ul className={homeStyles["nav-menu"]}>
                    <li>
                        <Link to="/" className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}>
                            {t('nav.home')}
                        </Link>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <Link to="/ai-chat" className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}>
                            {t('nav.ai-diagnosis')}
                        </Link>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <Link to="/specialties" className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}>
                            {t('nav.specialties')}
                        </Link>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <Link to="/doctors" className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}>
                            {t('nav.doctors')}
                        </Link>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <Link to="/articles" className={`${homeStyles["nav-link"]} ${location.pathname === '/articles' ? homeStyles["active"] : ''}`}>
                            {t('nav.health-articles')}
                        </Link>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <Link to="/about" className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}>
                            {t('nav.about')}
                        </Link>
                    </li>
                </ul>
            </nav>

            <div className={styles.container}>
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
                                                        const rawExp: unknown = profileData.yearsOfExperience ?? 
                                                                               profileData.experience ?? 
                                                                               (profileData as any)?.experiece;
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
                                                    {profileData.consulationFee && profileData.consulationFee > 0
                                                        ? formatCurrencyCompact(Number(profileData.consulationFee))
                                                        : 'Liên hệ'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className={styles.bookNowButton}
                                        onClick={() => {
                                            setActiveTabIndex(1);
                                            setTimeout(() => {
                                                if (calendarSectionRef.current) {
                                                    calendarSectionRef.current.scrollIntoView({ 
                                                        behavior: 'smooth', 
                                                        block: 'center' 
                                                    });
                                                }
                                            }, 100);
                                        }}
                                    >
                                        <i className="bi bi-calendar-check-fill"></i>
                                        Đặt lịch khám ngay
                                    </button>
                                </div>
                            </div>
                        </div>

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
                                    onClick={() => {
                                        setActiveTabIndex(1);
                                        setTimeout(() => {
                                            if (calendarSectionRef.current) {
                                                calendarSectionRef.current.scrollIntoView({ 
                                                    behavior: 'smooth', 
                                                    block: 'center' 
                                                });
                                            }
                                        }, 100);
                                    }}
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
                                        <div ref={calendarSectionRef} className={styles.calendarSection}>
                                            <div className={styles.sectionHeader}>
                                                <div className={styles.sectionHeaderContent}>
                                                    <div className={styles.sectionIconWrapper}>
                                                        <i className="bi bi-calendar3"></i>
                                                    </div>
                                                    <div>
                                                        <h3>Chọn ngày khám</h3>
                                                        <p className={styles.sectionSubtitle}>Chọn ngày phù hợp với lịch của bạn</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.calendarContainer}>
                                                    {(() => {
                                                        const availableDates = getAvailableDates();
                                                        if (availableDates.length === 0) return null;
                                                        const firstDate = availableDates[0];
                                                        const monthName = firstDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
                                                        const lastDate = availableDates[availableDates.length - 1];
                                                        const hasTwoMonths = firstDate.getMonth() !== lastDate.getMonth();
                                                        return (
                                                            <>
                                                                <div className={styles.calendarMonthHeader}>
                                                                    <h4 className={styles.calendarMonthTitle}>
                                                                        {hasTwoMonths 
                                                                            ? `${firstDate.toLocaleDateString('vi-VN', { month: 'long' })} - ${lastDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`
                                                                            : monthName
                                                                        }
                                                                    </h4>
                                                                </div>
                                                                <div className={styles.calendarWeekdays}>
                                                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                                                        <div key={day} className={styles.weekdayHeader}>{day}</div>
                                                                    ))}
                                                                </div>
                                                                <div className={styles.calendarDatesGrid}>
                                                                    {(() => {
                                                                        const weekGroups: { [weekKey: string]: Date[] } = {};
                                                                        availableDates.forEach(date => {
                                                                            const dayOfWeek = convertDayOfWeek(date.getDay());
                                                                            const mondayOfWeek = new Date(date);
                                                                            mondayOfWeek.setDate(date.getDate() - (dayOfWeek - 1));
                                                                            mondayOfWeek.setHours(0, 0, 0, 0);
                                                                            const weekKey = mondayOfWeek.toISOString().split('T')[0];
                                                                            if (!weekGroups[weekKey]) {
                                                                                weekGroups[weekKey] = [];
                                                                            }
                                                                            weekGroups[weekKey].push(date);
                                                                        });
                                                                        const sortedWeekKeys = Object.keys(weekGroups).sort();
                                                                        return sortedWeekKeys.map((weekKey, weekIndex) => {
                                                                            const weekDates = weekGroups[weekKey];
                                                                            const row: (Date | null)[] = new Array(7).fill(null);
                                                                            weekDates.forEach(date => {
                                                                                const dayOfWeek = convertDayOfWeek(date.getDay());
                                                                                const columnIndex = dayOfWeek - 1; // 0 = Monday, 6 = Sunday
                                                                                row[columnIndex] = date;
                                                                            });
                                                                            
                                                                            return (
                                                                                <React.Fragment key={weekKey}>
                                                                                    {row.map((date, colIndex) => {
                                                                                        if (!date) {
                                                                                            return <div key={colIndex} className={styles.calendarDateCellEmpty}></div>;
                                                                                        }
                                                                                        const today = new Date();
                                                                                        today.setHours(0, 0, 0, 0);
                                                                                        const dateOnly = new Date(date);
                                                                                        dateOnly.setHours(0, 0, 0, 0);
                                                                                        const isToday = dateOnly.getTime() === today.getTime();
                                                                                        const isAvailable = isDateAvailable(date);
                                                                                        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                                                                        
                                                                                        return (
                                                                                            <button
                                                                                                key={`${weekKey}-${colIndex}`}
                                                                                                className={`${styles.calendarDateCell} ${!isAvailable ? styles.unavailable : ''} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
                                                                                                onClick={() => isAvailable && handleDateSelect(date)}
                                                                                                disabled={!isAvailable}
                                                                                                title={date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                                                            >
                                                                                                {isToday && <div className={styles.todayRing}></div>}
                                                                                                <span className={styles.dateNumber}>{date.getDate()}</span>
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </React.Fragment>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        
                                        {/* Step 2: Select Time (only shown after date is selected) */}
                                        {selectedDate && (
                                            <div ref={timeslotsSectionRef} className={styles.timeslotsSection}>
                                                <div className={styles.sectionHeader}>
                                                    <div className={styles.sectionHeaderContent}>
                                                        <div className={styles.sectionIconWrapper}>
                                                            <i className="bi bi-clock"></i>
                                                        </div>
                                                        <div>
                                                            <h3>Chọn giờ khám</h3>
                                                            <p className={styles.sectionSubtitle}>Chọn thời gian phù hợp với bạn</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={styles.timeslotsContainer}>
                                                    {availableTimeSlots.length > 0 ? (
                                                        <>
                                                            {(() => {
                                                                const morningSlots = availableTimeSlots.filter(slot => {
                                                                    let hour = 0;
                                                                    if (slot.startTime) {
                                                                        hour = parseInt(slot.startTime.split(':')[0], 10);
                                                                    } else if (slot.display) {
                                                                        const timeMatch = slot.display.match(/^(\d{1,2}):\d{2}/);
                                                                        if (timeMatch) {
                                                                            hour = parseInt(timeMatch[1], 10);
                                                                        }
                                                                    }
                                                                    return hour < 12;
                                                                });
                                                                const afternoonSlots = availableTimeSlots.filter(slot => {
                                                                    let hour = 0;
                                                                    if (slot.startTime) {
                                                                        hour = parseInt(slot.startTime.split(':')[0], 10);
                                                                    } else if (slot.display) {
                                                                        const timeMatch = slot.display.match(/^(\d{1,2}):\d{2}/);
                                                                        if (timeMatch) {
                                                                            hour = parseInt(timeMatch[1], 10);
                                                                        }
                                                                    }
                                                                    return hour >= 12;
                                                                });
                                                                return (
                                                                    <>
                                                                        {morningSlots.length > 0 && (
                                                                            <div className={styles.timeSlotGroup}>
                                                                                <div className={styles.timeSlotGroupHeader}>
                                                                                    <div className={styles.timeSlotGroupIcon}>
                                                                                        <i className="bi bi-sunrise"></i>
                                                                                    </div>
                                                                                    <div className={styles.timeSlotGroupContent}>
                                                                                        <h4 className={styles.timeSlotGroupTitle}>Buổi sáng</h4>
                                                                                        <p className={styles.timeSlotGroupSubtitle}>{morningSlots.length} ca khám</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className={styles.timeslotsGrid}>
                                                                                    {morningSlots.map((slot, index) => {
                                                                                        const isSelected = selectedTimeSlot?.id === slot.id;
                                                                                        return (
                                                                                            <button
                                                                                                key={index}
                                                                                                className={`${styles.timeslot} ${isSelected ? styles.selected : ''}`}
                                                                                                onClick={() => handleTimeSlotSelect(slot)}
                                                                                            >
                                                                                                <div className={styles.timeslotContent}>
                                                                                                    <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-clock-fill'}`}></i>
                                                                                                    <span className={styles.timeText}>{slot.display}</span>
                                                                                                </div>
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {afternoonSlots.length > 0 && (
                                                                            <div className={styles.timeSlotGroup}>
                                                                                <div className={styles.timeSlotGroupHeader}>
                                                                                    <div className={styles.timeSlotGroupIcon}>
                                                                                        <i className="bi bi-sunset"></i>
                                                                                    </div>
                                                                                    <div className={styles.timeSlotGroupContent}>
                                                                                        <h4 className={styles.timeSlotGroupTitle}>Buổi chiều</h4>
                                                                                        <p className={styles.timeSlotGroupSubtitle}>{afternoonSlots.length} ca khám</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className={styles.timeslotsGrid}>
                                                                                    {afternoonSlots.map((slot, index) => {
                                                                                        const isSelected = selectedTimeSlot?.id === slot.id;
                                                                                        return (
                                                                                            <button
                                                                                                key={index}
                                                                                                className={`${styles.timeslot} ${isSelected ? styles.selected : ''}`}
                                                                                                onClick={() => handleTimeSlotSelect(slot)}
                                                                                            >
                                                                                                <div className={styles.timeslotContent}>
                                                                                                    <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-clock-fill'}`}></i>
                                                                                                    <span className={styles.timeText}>{slot.display}</span>
                                                                                                </div>
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </>
                                                    ) : (
                                                        <div className={styles.noSlotsMessage}>
                                                            <div className={styles.noSlotsIcon}>
                                                                <i className="bi bi-calendar-x"></i>
                                                            </div>
                                                            <h4>Không có ca khám</h4>
                                                            <p>Bác sĩ không có ca khám nào trong ngày này. Vui lòng chọn ngày khác.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {selectedDate && selectedTimeSlot && (
                                            <div ref={bookingConfirmationRef} className={styles.bookingConfirmation}>
                                                <div className={styles.bookingSummary}>
                                                    <div className={styles.summaryHeader}>
                                                        <div className={styles.summaryHeaderContent}>
                                                            <div className={styles.summaryIconWrapper}>
                                                                <i className="bi bi-clipboard-check-fill"></i>
                                                            </div>
                                                            <div>
                                                                <h3>Thông tin đặt lịch</h3>
                                                                <p className={styles.summarySubtitle}>Kiểm tra và xác nhận thông tin trước khi đặt lịch</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className={styles.summaryCards}>
                                                        <div className={styles.summaryCard}>
                                                            <div className={styles.summaryCardAvatar}>
                                                                {profileData.avatarUrl ? (
                                                                    <img src={profileData.avatarUrl} alt={profileData.fullName} />
                                                                ) : (
                                                                    <i className="bi bi-person-circle"></i>
                                                                )}
                                                            </div>
                                                            <div className={styles.summaryCardContent}>
                                                                <span className={styles.summaryLabel}>Bác sĩ</span>
                                                                <span className={styles.summaryValue}>{profileData.fullName}</span>
                                                            </div>
                                                        </div>
                                                        <div className={styles.summaryCard}>
                                                            <div className={styles.summaryCardIcon}>
                                                                <i className="bi bi-mortarboard-fill"></i>
                                                            </div>
                                                            <div className={styles.summaryCardContent}>
                                                                <span className={styles.summaryLabel}>Trình độ</span>
                                                                <span className={styles.summaryValue}>
                                                                    {profileData.education || 'Chưa cập nhật'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={styles.summaryCard}>
                                                            <div className={styles.summaryCardIcon}>
                                                                <i className="bi bi-calendar-event"></i>
                                                            </div>
                                                            <div className={styles.summaryCardContent}>
                                                                <span className={styles.summaryLabel}>Ngày khám</span>
                                                                <span className={styles.summaryValue}>
                                                                    {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={styles.summaryCard}>
                                                            <div className={styles.summaryCardIcon}>
                                                                <i className="bi bi-clock-history"></i>
                                                            </div>
                                                            <div className={styles.summaryCardContent}>
                                                                <span className={styles.summaryLabel}>Giờ khám</span>
                                                                <span className={styles.summaryValue}>{selectedTimeSlot.display}</span>
                                                            </div>
                                                        </div>
                                                        <div className={styles.summaryCard}>
                                                            <div className={styles.summaryCardIcon}>
                                                                <i className="bi bi-hourglass-split"></i>
                                                            </div>
                                                            <div className={styles.summaryCardContent}>
                                                                <span className={styles.summaryLabel}>Thời gian khám</span>
                                                                <span className={styles.summaryValue}>{getConsultationDuration(selectedTimeSlot.display, selectedDate)}</span>
                                                            </div>
                                                        </div>
                                                        <div className={styles.summaryCard}>
                                                            <div className={styles.summaryCardIcon}>
                                                                <i className="bi bi-currency-dollar"></i>
                                                            </div>
                                                            <div className={styles.summaryCardContent}>
                                                                <span className={styles.summaryLabel}>Phí khám</span>
                                                                <span className={styles.summaryPrice}>
                                                                    {profileData.consulationFee != null && profileData.consulationFee !== undefined
                                                                        ? formatCurrencyCompact(Number(profileData.consulationFee))
                                                                        : 'Liên hệ'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Promotion Code Input */}
                                                    <div className={styles.promotionCodeSection}>
                                                        <div className={styles.promotionLabelRow}>
                                                            <label htmlFor="promotionCode" className={styles.promotionLabel}>
                                                                <i className="bi bi-tag-fill"></i>
                                                                Mã khuyến mãi (nếu có)
                                                            </label>
                                                            <button
                                                                type="button"
                                                                className={styles.selectPromoButton}
                                                                onClick={handleOpenPromotionModal}
                                                                title="Chọn mã khuyến mãi"
                                                            >
                                                                <i className="bi bi-list-ul"></i>
                                                                Chọn mã
                                                            </button>
                                                        </div>
                                                        <div className={styles.promotionInputGroup}>
                                                            <input
                                                                type="text"
                                                                id="promotionCode"
                                                                className={`${styles.promotionInput} ${promotionError ? styles.promotionInputError : ''} ${appliedPromotion ? styles.promotionInputSuccess : ''}`}
                                                                placeholder="Nhập mã khuyến mãi"
                                                                value={promotionCode}
                                                                onChange={(e) => {
                                                                    setPromotionCode(e.target.value.toUpperCase());
                                                                    setPromotionError('');
                                                                    setAppliedPromotion(null);
                                                                    setAppliedUserPromotion(null);
                                                                }}
                                                                disabled={isCheckingPromotion || !!appliedPromotion}
                                                            />
                                                            <button
                                                                type="button"
                                                                className={styles.applyPromoButton}
                                                                onClick={handleApplyPromotion}
                                                                disabled={isCheckingPromotion || !promotionCode.trim() || !!appliedPromotion}
                                                            >
                                                                {isCheckingPromotion ? (
                                                                    <div className={styles.buttonSpinner}></div>
                                                                ) : (
                                                                    'Áp dụng'
                                                                )}
                                                            </button>
                                                        </div>
                                                        {promotionError && (
                                                            <div className={styles.promotionError}>
                                                                <i className="bi bi-exclamation-circle"></i>
                                                                <span>{promotionError}</span>
                                                            </div>
                                                        )}
                                                        {appliedPromotion && (
                                                            <div className={styles.promotionSuccess}>
                                                                <div className={styles.promotionSuccessHeader}>
                                                                    <i className="bi bi-check-circle-fill"></i>
                                                                    <span className={styles.promotionSuccessTitle}>Áp dụng thành công!</span>
                                                                </div>
                                                                <div className={styles.promotionDetails}>
                                                                    <p className={styles.promotionName}>{appliedPromotion.name}</p>
                                                                    {appliedPromotion.description && (
                                                                        <p className={styles.promotionDescription}>{appliedPromotion.description}</p>
                                                                    )}
                                                                    <p className={styles.promotionDiscount}>
                                                                        Giảm: {appliedPromotion.discountType === 'Percentage' 
                                                                            ? `${appliedPromotion.discountValue}%`
                                                                            : formatCurrencyCompact(appliedPromotion.discountValue)}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    className={styles.removePromoButton}
                                                                    style={{ marginTop: 8 }}
                                                                    onClick={() => {
                                                                        setAppliedPromotion(null);
                                                                        setAppliedUserPromotion(null);
                                                                        setPromotionCode('');
                                                                        setPromotionError('');
                                                                    }}
                                                                >
                                                                    Bỏ áp dụng mã khuyến mãi
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={styles.medicalInfoSection}>
                                                        <h4 className={styles.medicalInfoTitle}>
                                                            <i className="bi bi-file-medical-fill"></i>
                                                            Thông tin y tế
                                                        </h4>
                                                        
                                                        <div className={styles.formGroup}>
                                                            <label htmlFor="chiefComplaint" className={styles.formLabel}>
                                                                <i className="bi bi-clipboard-pulse"></i>
                                                                Lý do khám <span className={styles.required}>*</span>
                                                            </label>
                                                            <textarea
                                                                id="chiefComplaint"
                                                                className={styles.formTextarea}
                                                                placeholder="Mô tả triệu chứng hoặc lý do bạn muốn khám bệnh..."
                                                                value={chiefComplaint}
                                                                onChange={(e) => setChiefComplaint(e.target.value)}
                                                                rows={3}
                                                                required
                                                            />
                                                            <p className={styles.formHint}>
                                                                Ví dụ: Đau đầu, sốt cao, ho khan, đau bụng...
                                                            </p>
                                                        </div>
                                                        
                                                        <div className={styles.formGroup}>
                                                            <label htmlFor="historyOfPresentIllness" className={styles.formLabel}>
                                                                <i className="bi bi-clock-history"></i>
                                                                Quá trình bệnh lý diễn biến <span className={styles.required}>*</span>
                                                            </label>
                                                            <textarea
                                                                id="historyOfPresentIllness"
                                                                className={styles.formTextarea}
                                                                placeholder="Mô tả quá trình bệnh diễn biến, khi nào bắt đầu, có dấu hiệu gì..."
                                                                value={historyOfPresentIllness}
                                                                onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                                                                rows={4}
                                                            />
                                                            <p className={styles.formHint}>
                                                                Ví dụ: Bắt đầu đau đầu từ 3 ngày trước, ban đầu nhẹ nhưng ngày càng tăng...
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {appliedPromotion && profileData.consulationFee && (
                                                        <div className={styles.finalPriceSection}>
                                                            <div className={styles.priceBreakdown}>
                                                                <div className={styles.priceRow}>
                                                                    <span className={styles.priceLabel}>Phí khám gốc:</span>
                                                                    <span className={styles.priceValue}>
                                                                        {formatCurrencyCompact(Number(profileData.consulationFee))}
                                                                    </span>
                                                                </div>
                                                                <div className={styles.priceRow}>
                                                                    <span className={styles.priceLabel}>Giảm giá:</span>
                                                                    <span className={styles.discountValue}>
                                                                        -{formatCurrencyCompact(Number(profileData.consulationFee) - calculateFinalPrice())}
                                                                    </span>
                                                                </div>
                                                                <div className={styles.priceRowTotal}>
                                                                    <span className={styles.priceLabelTotal}>Tổng thanh toán:</span>
                                                                    <span className={styles.priceValueTotal}>
                                                                        {formatCurrencyCompact(calculateFinalPrice())}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <button 
                                                        className={styles.confirmButton} 
                                                        onClick={handleBookingConfirm}
                                                        disabled={isCreatingPayment}
                                                    >
                                                        {isCreatingPayment ? (
                                                            <>
                                                                <div className={styles.buttonSpinner}></div>
                                                                Đang đặt lịch...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-check-circle-fill"></i>
                                                                Xác nhận đặt lịch
                                                            </>
                                                        )}
                                                    </button>
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
                                                    {profileData.reviews.map((review, index) => {
                                                        const adminResponse = normalizeAdminResponse(review.adminResponse);
                                                        const patientDisplayName = review.patientName || (review as any).PatientName || 'Ẩn danh';
                                                        const avatarSrc = review.patientAvatar || (review as any).PatientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(patientDisplayName)}&background=667eea&color=fff&size=128&bold=true`;
                                                        return (
                                                            <div className={styles.reviewCard} key={index}>
                                                            <div className={styles.reviewHeader}>
                                                                <div className={styles.reviewerAvatar}>
                                                                    <img 
                                                                        src={avatarSrc}
                                                                        alt={patientDisplayName}
                                                                        onError={(e) => {
                                                                            const target = e.currentTarget;
                                                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientDisplayName)}&background=667eea&color=fff&size=128&bold=true`;
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className={styles.reviewerInfo}>
                                                                    <span className={styles.reviewerName}>{patientDisplayName}</span>
                                                                    <div className={styles.reviewRating}>
                                                                        {renderStars(review.rating)}
                                                                        <span className={styles.reviewDate}>{review.date}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className={styles.reviewText}>{review.comment}</p>
                                                            {adminResponse && (
                                                                <div className={styles.adminReplyBlock}>
                                                                    <span className={styles.adminReplyLabel}>Phản hồi từ MEDIX</span>
                                                                    <p className={styles.adminReplyText}>{adminResponse}</p>
                                                                </div>
                                                            )}
                                                            </div>
                                                        );
                                                    })}
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
            {showConfirmModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.confirmModal}>
                        <div className={styles.confirmModalHeader}>
                            <div className={styles.confirmModalIcon}>
                                <i className="bi bi-clipboard-check-fill"></i>
                            </div>
                            <h3>Xác nhận đặt lịch khám</h3>
                            <button 
                                className={styles.confirmModalClose}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        
                        <div className={styles.confirmModalBody}>
                            <div className={styles.confirmModalInfo}>
                                <div className={styles.confirmInfoRow}>
                                    <div className={styles.confirmInfoLabel}>
                                        <i className="bi bi-person-circle"></i>
                                        Bác sĩ
                                    </div>
                                    <div className={styles.confirmInfoValue}>{profileData?.fullName}</div>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <div className={styles.confirmInfoLabel}>
                                        <i className="bi bi-mortarboard-fill"></i>
                                        Trình độ
                                    </div>
                                    <div className={styles.confirmInfoValue}>
                                        {profileData?.education || 'Chưa cập nhật'}
                                    </div>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <div className={styles.confirmInfoLabel}>
                                        <i className="bi bi-calendar-check"></i>
                                        Ngày khám
                                    </div>
                                    <div className={styles.confirmInfoValue}>
                                        {selectedDate?.toLocaleDateString('vi-VN', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <div className={styles.confirmInfoLabel}>
                                        <i className="bi bi-clock"></i>
                                        Giờ khám
                                    </div>
                                    <div className={styles.confirmInfoValue}>{selectedTimeSlot?.display}</div>
                                </div>
                                <div className={styles.confirmInfoRow}>
                                    <div className={styles.confirmInfoLabel}>
                                        <i className="bi bi-currency-dollar"></i>
                                        Phí khám
                                    </div>
                                    <div className={styles.confirmInfoValuePrice}>
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(calculateFinalPrice())}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.confirmModalNote}>
                                <i className="bi bi-info-circle-fill"></i>
                                <p>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Bạn có thể hủy lịch hẹn trong vòng 2 giờ trước giờ khám.</p>
                            </div>
                        </div>
                        
                        <div className={styles.confirmModalFooter}>
                            <button 
                                className={styles.confirmModalCancel}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                <i className="bi bi-x-circle"></i>
                                Hủy
                            </button>
                            <button 
                                className={styles.confirmModalConfirm}
                                onClick={handleConfirmedBooking}
                                disabled={isCreatingPayment}
                            >
                                {isCreatingPayment ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle-fill"></i>
                                        Xác nhận đặt lịch
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSuccessModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.successModal}>
                        <button 
                            className={styles.successCloseBtn}
                            onClick={() => {
                                setShowSuccessModal(false);
                                setIsCreatingPayment(false);
                                if (selectedTimeSlot) {
                                    setAvailableTimeSlots(prev => prev.filter(slot => slot.display !== selectedTimeSlot.display));
                                }
                                setSelectedTimeSlot(null);
                            }}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <div className={styles.successIcon}>
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h2>Đặt lịch thành công!</h2>
                        <p>Lịch hẹn của bạn đã được xác nhận</p>
                        <div className={styles.appointmentSummary}>
                            <div className={styles.summaryItem}>
                                <i className="bi bi-person-circle"></i>
                                <span>Bác sĩ {profileData?.fullName}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <i className="bi bi-calendar-check"></i>
                                <span>{selectedDate?.toLocaleDateString('vi-VN', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <i className="bi bi-clock"></i>
                                <span>{selectedTimeSlot?.display}</span>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.viewAppointmentsBtn}
                                onClick={() => navigate('/app/patient/appointments')}
                            >
                                <i className="bi bi-calendar2-check"></i>
                                Xem lịch hẹn của tôi
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showInsufficientBalanceModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.successModal}>
                        <button 
                            className={styles.successCloseBtn}
                            onClick={() => {
                                setShowInsufficientBalanceModal(false);
                                setIsCreatingPayment(false);
                            }}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <div className={styles.successIcon} style={{ color: '#dc3545' }}>
                            <i className="bi bi-exclamation-circle-fill"></i>
                        </div>
                        <h2>Số dư không đủ!</h2>
                        <p>Tài khoản của quý khách không đủ tiền để thực hiện giao dịch này.</p>
                        <div className={styles.appointmentSummary}>
                            <div className={styles.summaryItem}>
                                <i className="bi bi-cash-stack"></i>
                                <span>Số tiền cần thanh toán: {calculateFinalPrice().toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                        <p className={styles.emailNote}>
                            <i className="bi bi-info-circle"></i>
                            Vui lòng nạp thêm tiền vào ví để tiếp tục đặt lịch
                        </p>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.viewAppointmentsBtn}
                                onClick={() => navigate('/app/patient/finance')}
                            >
                                <i className="bi bi-wallet2"></i>
                                Nạp tiền ngay
                            </button>
                            <button 
                                className={styles.btnCancel}
                                onClick={() => {
                                    setShowInsufficientBalanceModal(false);
                                    setIsCreatingPayment(false);
                                }}
                                style={{ marginTop: '12px' }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showPromotionModal && (
                <div className={styles.modalOverlay} onClick={() => setShowPromotionModal(false)}>
                    <div className={styles.promotionModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.promotionModalHeader}>
                            <h3>
                                <i className="bi bi-tag-fill"></i>
                                Chọn mã khuyến mãi
                            </h3>
                            <button 
                                className={styles.modalCloseButton}
                                onClick={() => setShowPromotionModal(false)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        
                        <div className={styles.promotionModalContent}>
                            {isLoadingPromotions ? (
                                <div className={styles.promotionLoading}>
                                    <div className={styles.buttonSpinner}></div>
                                    <p>Đang tải danh sách mã khuyến mãi...</p>
                                </div>
                            ) : availablePromotions.length === 0 ? (
                                <div className={styles.promotionEmpty}>
                                    <i className="bi bi-inbox"></i>
                                    <p>Hiện tại không có mã khuyến mãi nào khả dụng</p>
                                </div>
                            ) : (
                                <div className={styles.promotionList}>
                                    {availablePromotions.map((userPromotion) => {
                                        const promotion = userPromotion.promotion;
                                        if (!promotion) return null;
                                        return (
                                            <div
                                                key={userPromotion.id}
                                                className={`${styles.promotionItem} ${appliedPromotion?.id === promotion.id ? styles.promotionItemSelected : ''}`}
                                                onClick={() => handleSelectPromotion(userPromotion)}
                                            >
                                                <div className={styles.promotionItemHeader}>
                                                    <div className={styles.promotionItemIcon}>
                                                        <i className="bi bi-tag-fill"></i>
                                                    </div>
                                                    <div className={styles.promotionItemInfo}>
                                                        <h4 className={styles.promotionItemName}>{promotion.name}</h4>
                                                        <p className={styles.promotionItemCode}>{promotion.code}</p>
                                                    </div>
                                                    <div className={styles.promotionItemDiscount}>
                                                        <span className={styles.discountBadge}>
                                                            {promotion.discountType === 'Percentage' 
                                                                ? `-${promotion.discountValue}%`
                                                                : `-${formatCurrencyCompact(promotion.discountValue)}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                {promotion.description && (
                                                    <p className={styles.promotionItemDescription}>{promotion.description}</p>
                                                )}
                                                <div className={styles.promotionItemFooter}>
                                                    <div className={styles.promotionItemDate}>
                                                        <i className="bi bi-calendar3"></i>
                                                        <span>
                                                            {new Date(promotion.startDate).toLocaleDateString('vi-VN')} - {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    {userPromotion.usedCount > 0 && (
                                                        <div className={styles.promotionItemUsage}>
                                                            <i className="bi bi-info-circle"></i>
                                                            <span>Đã dùng: {userPromotion.usedCount} lần</span>
                                                        </div>
                                                    )}
                                                    {appliedPromotion?.id === promotion.id && (
                                                        <div className={styles.promotionItemSelectedBadge}>
                                                            <i className="bi bi-check-circle-fill"></i>
                                                            Đã chọn
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.promotionModalFooter}>
                            <button 
                                className={styles.btnCancel}
                                onClick={() => setShowPromotionModal(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
}

export default DoctorDetails;