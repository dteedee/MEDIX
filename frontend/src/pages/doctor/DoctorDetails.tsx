import { useParams, useSearchParams, useNavigate } from "react-router-dom";

import styles from '../../styles/doctor/doctor-details.module.css'
import { useEffect, useState } from "react";
import doctorService from "../../services/doctorService";
import { DoctorProfileDto } from "../../types/doctor.types";
import {Header } from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import paymentService from "../../services/paymentService";

function DoctorDetails() {
    const [profileData, setProfileData] = useState<DoctorProfileDto>();
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    
    // Booking states
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showPaymentButton, setShowPaymentButton] = useState(false);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);

    const { username } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Function to check if user is logged in
    const checkUserLogin = () => {
        const accessToken = localStorage.getItem('accessToken');
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        const userData = localStorage.getItem('userData');
        
        // Check if token exists and is not expired
        if (accessToken && tokenExpiration) {
            const expirationTime = parseInt(tokenExpiration);
            if (Date.now() < expirationTime) {
                // Also check if user data exists
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        return user && user.role; // User is logged in and has role
                    } catch (error) {
                        console.error("Error parsing user data:", error);
                        return false;
                    }
                }
            }
        }
        
        return false; // User is not logged in or token is expired
    };

    // Function to handle booking confirmation with login check
    const handleBookingConfirm = () => {
        if (!profileData || !selectedDate || !selectedTimeSlot) return;
        
        // Check if user is logged in
        if (!checkUserLogin()) {
            // User is not logged in, show alert and redirect to login page
            alert("Bạn cần đăng nhập để đặt lịch hẹn với bác sĩ. Vui lòng đăng nhập để tiếp tục.");
            navigate('/login');
            return;
        }
        
        // Check if user is a patient (only patients can book appointments)
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
        
        // User is logged in and is a patient, proceed with booking
        console.log("User is logged in as patient, proceeding with booking...");
        
        // Show payment button after confirmation
        setShowPaymentButton(true);
    };

    // Function to create payment link using service
    const handleCreatePaymentLink = async () => {
        if (!profileData || !selectedDate || !selectedTimeSlot) return;
        
        setIsCreatingPayment(true);
        
        try {
            // Tạo ItemData cho việc khám bác sĩ
            const itemData = paymentService.createDoctorConsultationItem(
                profileData.fullName,
                profileData.consulationFee || 200000
            );

            // Gọi service để tạo link thanh toán
            console.log('Creating payment link with itemData:', itemData);
            const result = await paymentService.createPaymentLink(itemData);
            console.log('Payment result:', result);

            if (result.success && result.checkoutUrl) {
                console.log('Redirecting to checkout URL:', result.checkoutUrl);
                
                // Chuyển hướng trực tiếp đến trang thanh toán PayOS
                paymentService.redirectToPayment(result.checkoutUrl);
            } else {
                console.error('Payment failed:', result.error);
                alert(result.error || 'Có lỗi xảy ra khi tạo link thanh toán.');
            }
        } catch (error) {
            console.error('Error creating payment link:', error);
            alert('Có lỗi xảy ra khi tạo link thanh toán. Vui lòng thử lại.');
        }
        
        setIsCreatingPayment(false);
    };

    // Helper function to convert JavaScript dayOfWeek to backend dayOfWeek
    // JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // Backend: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
    // 
    // Mapping:
    // JS 0 (Sunday) -> Backend 7 (Sunday)
    // JS 1 (Monday) -> Backend 1 (Monday)
    // JS 2 (Tuesday) -> Backend 2 (Tuesday)
    // JS 3 (Wednesday) -> Backend 3 (Wednesday)
    // JS 4 (Thursday) -> Backend 4 (Thursday)
    // JS 5 (Friday) -> Backend 5 (Friday)
    // JS 6 (Saturday) -> Backend 6 (Saturday)
    const convertDayOfWeek = (jsDayOfWeek: number): number => {
        return jsDayOfWeek === 0 ? 7 : jsDayOfWeek; // Sunday = 7, others stay the same
    };

    // Get available time slots based on doctor's schedule
    const getAvailableTimeSlots = (date: Date): string[] => {
        if (!profileData?.schedules) return [];
        
        const backendDayOfWeek = convertDayOfWeek(date.getDay());
        
        const doctorSchedules = profileData.schedules.filter(schedule => 
            schedule.dayOfWeek === backendDayOfWeek && schedule.isAvailable
        );
        
        if (doctorSchedules.length === 0) return [];
        
        // Generate time slots based on doctor's schedule
        // Each schedule represents a separate consultation session (ca khám)
        const timeSlots: string[] = [];
        
        doctorSchedules.forEach(schedule => {
            // Each schedule is a complete consultation session
            // startTime and endTime represent the full duration of one ca khám
            const startTime = schedule.startTime.slice(0, 5); // Remove seconds, keep HH:MM
            const endTime = schedule.endTime.slice(0, 5); // Remove seconds, keep HH:MM
            
            // Add this complete consultation session as one time slot
            timeSlots.push(`${startTime} - ${endTime}`);
        });
        
        return timeSlots;
    };

    const isDateAvailable = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if date is not in the past
        if (date < today) return false;
        
        // Check if doctor has schedule for this day of week
        if (!profileData?.schedules) return false;
        
        const backendDayOfWeek = convertDayOfWeek(date.getDay());
        
        const hasSchedule = profileData.schedules.some(schedule => 
            schedule.dayOfWeek === backendDayOfWeek && schedule.isAvailable
        );
        
        return hasSchedule;
    };

    const handleDateSelect = (date: Date | null) => {
        setSelectedDate(date);
        setSelectedTimeSlot(null);
        setShowPaymentButton(false); // Reset payment button when date changes
        setIsCreatingPayment(false); // Reset loading state
        if (date) {
            const slots = getAvailableTimeSlots(date);
            setAvailableTimeSlots(slots);
        } else {
            setAvailableTimeSlots([]);
        }
    };

    const handleTimeSlotSelect = (timeSlot: string) => {
        setSelectedTimeSlot(timeSlot);
        setShowPaymentButton(false); // Reset payment button when time slot changes
        setIsCreatingPayment(false); // Reset loading state
    };

    // Calculate consultation duration from selected time slot
    const getConsultationDuration = (timeSlot: string): string => {
        if (!timeSlot || !profileData?.schedules) return "30 phút";
        
        // Extract start and end times from timeSlot (format: "08:00 - 10:00")
        const [startTime, endTime] = timeSlot.split(' - ');
        
        if (!startTime || !endTime) return "30 phút";
        
        // Convert to Date objects for calculation
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        
        // Calculate difference in minutes
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        
        // Convert to hours and minutes
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

    const BioTab = () => <p>{profileData?.biography}</p>
    
    const BookingTab = () => (
        <div className={styles["booking-container"]}>
            <h3 className={styles["booking-title"]}>Đặt lịch hẹn</h3>
            
            <div className={styles["booking-layout"]}>
                {/* Calendar Section */}
                <div className={styles["calendar-section"]}>
                    <div className={styles["calendar-header"]}>
                        <button 
                            className={styles["calendar-nav"]}
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        >
                            ←
                        </button>
                        <h4 className={styles["calendar-month"]}>
                            {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button 
                            className={styles["calendar-nav"]}
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        >
                            →
                        </button>
                    </div>
                    
                    <div className={styles["calendar-grid"]}>
                        <div className={styles["calendar-weekdays"]}>
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                <div key={day} className={styles["weekday"]}>{day}</div>
                            ))}
                        </div>
                        
                        <div className={styles["calendar-dates"]}>
                            {Array.from({ length: 35 }, (_, i) => {
                                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - 6);
                                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                                const isAvailable = isDateAvailable(date);
                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                
                                return (
                                    <button
                                        key={i}
                                        className={`${styles["calendar-date"]} ${
                                            !isCurrentMonth ? styles["other-month"] : ''
                                        } ${
                                            !isAvailable ? styles["unavailable"] : ''
                                        } ${
                                            isSelected ? styles["selected"] : ''
                                        }`}
                                        onClick={() => isAvailable && handleDateSelect(date)}
                                        disabled={!isAvailable}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {/* Time Slots Section */}
                <div className={styles["timeslots-section"]}>
                    <div className={styles["timeslots-header"]}>
                        <div className={styles["legend"]}>
                            <div className={styles["legend-item"]}>
                                <div className={`${styles["legend-dot"]} ${styles["available"]}`}></div>
                                <span>Có lịch trống, có thể đặt lịch</span>
                            </div>
                            <div className={styles["legend-item"]}>
                                <div className={`${styles["legend-dot"]} ${styles["unavailable"]}`}></div>
                                <span>Không có lịch trống</span>
                            </div>
                        </div>
                        <p className={styles["slots-info"]}>Các ca khám có sẵn trong ngày</p>
                    </div>
                    
                    {selectedDate ? (
                        <div className={styles["timeslots-grid"]}>
                            {availableTimeSlots.map((slot, index) => (
                                <button
                                    key={index}
                                    className={`${styles["timeslot"]} ${
                                        selectedTimeSlot === slot ? styles["selected"] : ''
                                    }`}
                                    onClick={() => handleTimeSlotSelect(slot)}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className={styles["no-date-selected"]}>
                            <p>Vui lòng chọn ngày để xem các ca khám có sẵn</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Additional Form Fields */}
            {selectedDate && selectedTimeSlot && (
                <div className={styles["booking-form"]}>
                    <div className={styles["selected-info"]}>
                        <h4>Thông tin đặt lịch</h4>
                        <p><strong>Ngày:</strong> {selectedDate.toLocaleDateString('vi-VN')}</p>
                        <p><strong>Giờ:</strong> {selectedTimeSlot}</p>
                    </div>
                    
                    <div className={styles["booking-info"]}>
                        <div className={styles["price-info"]}>
                            <span className={styles["price-label"]}>Phí khám:</span>
                            <span className={styles["price-value"]}>
                                {profileData?.consulationFee ? 
                                    `${profileData.consulationFee.toLocaleString('vi-VN')} VNĐ` : 
                                    'Liên hệ để biết giá'
                                }
                            </span>
                        </div>
                        <div className={styles["duration-info"]}>
                            <span className={styles["duration-label"]}>Thời gian khám:</span>
                            <span className={styles["duration-value"]}>{getConsultationDuration(selectedTimeSlot)}</span>
                        </div>
                    </div>
                    
                    <button 
                        className={styles["booking-button"]}
                        onClick={handleBookingConfirm}
                    >
                        XÁC NHẬN
                    </button>
                    
                    {/* Payment Button - chỉ hiển thị sau khi bấm XÁC NHẬN */}
                    {showPaymentButton && (
                        <div style={{ marginTop: "10px" }}>
                            <button 
                                id="create-payment-link-btn"
                                onClick={handleCreatePaymentLink}
                                disabled={isCreatingPayment}
                                style={{
                                    backgroundColor: isCreatingPayment ? "#6c757d" : "#28a745",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 20px",
                                    borderRadius: "4px",
                                    cursor: isCreatingPayment ? "not-allowed" : "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    width: "100%"
                                }}
                            >
                                {isCreatingPayment ? "Đang tạo link thanh toán..." : "Tạo Link thanh toán"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
    
    const RatingTab = () =>
        <div>
            <div className={styles["overview-header"]}>
                <h3 className={styles["overview-title"]}>Tổng quan:</h3>
                <div className={styles["overall-rating"]}>
                    <span className={styles["stars"]}>
                        {'★'.repeat(Math.round(profileData?.averageRating ?? 0)) +
                            '☆'.repeat(5 - Math.round(profileData?.averageRating ?? 0))}
                    </span>
                    <span className={styles["rating-number"]}>{profileData?.averageRating}/5</span>
                </div>
            </div>
            <h4 className={styles["rating-breakdown-title"]}>Chi tiết lượt đánh giá</h4>
            <div className={styles["rating-bar-group"]}>
                {profileData?.ratingByStar && (
                    <div className={styles["rating-bar-group"]}>
                        {profileData.ratingByStar.map((count: number, index: number) => {
                            const star = index + 1;
                            const totalRatings = profileData.ratingByStar.reduce((sum, c) => sum + c, 0);
                            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                            return (
                                <div className={styles["rating-bar-item"]} key={star}>
                                    <span className={styles["rating-label"]}>{star} ★</span>
                                    <div className={styles["rating-bar-container"]}>
                                        <div
                                            className={styles["rating-bar-fill"]}
                                            style={{ width: `${percentage.toFixed(1)}%` }}
                                        />
                                    </div>
                                    <span className={styles["rating-count-text"]}>({count}) Đánh giá</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className={styles["reviews-section"]}>
                <h4 className={styles["reviews-title"]}>Nhận xét về bác sĩ</h4>
                {profileData?.reviews.map((review) => (
                    <div className={styles["review-item"]}>
                        <div className={styles["review-header"]}>
                            <span className={styles["review-stars"]}>
                                {'★'.repeat(Math.round(review.rating)) +
                                    '☆'.repeat(5 - Math.round(review.rating))}
                            </span>
                            <span className={styles["review-date"]}>{review.date}</span>
                        </div>
                        <p className={styles["review-text"]}>{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>

    const tabContents = [<BioTab />, <BookingTab />, <RatingTab />];

    // Check for tab parameter in URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'booking') {
            setActiveTabIndex(1); // Set to booking tab (index 1)
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await doctorService.getDoctorProfile(username);
                setProfileData(data);
                console.log(data);
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            }
        }
        fetchProfile();
    }, []);

    return (
        <div>
            <div className={styles["breadcrumb"]}>
                <a href="#">Trang chủ</a> / <a href="#">Bác sĩ</a> / <span>Chi Tiết Bác Sĩ</span>
            </div>
            {/* Main Content */}
            <div className={styles["container"]}>
                <h1 className={styles["page-title"]}>Chi Tiết Bác Sĩ</h1>
                {/* Doctor Profile */}
                <div className={styles["doctor-profile"]}>
                    <img className={styles["doctor-image"]} src={profileData?.avatarUrl} />
                    <div className={styles["doctor-info"]}>
                        <h3>Bác sĩ</h3>
                        <h2 className={styles["doctor-name"]}>{profileData?.fullName}</h2>
                        <div className={styles["rating-section"]}>
                            <span className={styles["stars"]}>
                                {'★'.repeat(Math.round(profileData?.averageRating ?? 0)) +
                                    '☆'.repeat(5 - Math.round(profileData?.averageRating ?? 0))}
                            </span>
                            <span className={styles["rating-number"]}>{profileData?.averageRating}/5</span>
                            <span className={styles["rating-count"]}>({profileData?.numberOfReviews} khách hàng đánh giá)</span>
                        </div>
                        <div className={styles["info-row"]}>
                            <span className={styles["info-label"]}>Chuyên khoa:</span>
                            <span className={styles["info-value"]}>{profileData?.specialization}</span>
                        </div>
                        <div className={styles["info-row"]}>
                            <span className={styles["info-label"]}>Trình độ học vấn:</span>
                            <span className={styles["info-value"]}>{profileData?.education}</span>
                        </div>
                    </div>
                </div>

                <div className={styles["tabs"]}>
                    <div className={styles["tab-buttons"]}>
                        {['Giới thiệu', 'Đặt lịch', 'Đánh giá'].map((label, i) => {
                            return <button
                                key={i}
                                className={`${styles['tab-btn']} ${activeTabIndex === i ? styles['active'] : ''}`}
                                onClick={() => setActiveTabIndex(i)}>
                                {label}
                            </button>
                        })}
                    </div>
                    <div className={styles["tab-content"]}>
                        {tabContents[activeTabIndex]}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DoctorDetails;