"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import doctorDashboardService from "../../services/doctorDashboardService"
import { appointmentService } from "../../services/appointmentService"
import { Appointment } from "../../types/appointment.types"
import styles from "../../styles/doctor/DoctorDashboard.module.css"
import modalStyles from "../../styles/patient/PatientAppointments.module.css"
import { Link } from "react-router-dom"
import { PageLoader } from "../../components/ui"

// --- NEW TYPE DEFINITIONS TO MATCH THE API RESPONSE ---

interface DashboardSummary {
  todayAppointments: number
  todayRevenue: number
  monthRevenue: number
  totalRevenue: number
  averageRating: number
}

interface RegularSchedule {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface ScheduleOverride {
  overrideDate: string
  startTime: string
  endTime: string
  isAvailable: boolean
  overrideType: boolean // true: Tăng ca, false: Nghỉ
  reason: string
}

interface DashboardSchedule {
  regular: RegularSchedule[]
  overrides: ScheduleOverride[]
}

interface DashboardSubscription {
  name: string
  features: string
  monthlyFee: number
}

interface DashboardWallet {
  balance: number
}

interface DashboardSalary {
  periodStartDate: string
  periodEndDate: string
  netSalary: number
  status: string
}

interface DashboardReviewItem {
  rating: number
  comment: string
  patientName: string
  createdAt: string
}

interface DashboardReview {
  averageRating: number
  recent: DashboardReviewItem[]
}

interface DoctorDashboardData {
  summary: DashboardSummary
  schedule: DashboardSchedule
  subscription: DashboardSubscription | null
  wallet: DashboardWallet | null
  salary: DashboardSalary | null
  reviews: DashboardReview
}

// --- NEW TYPE DEFINITION FOR COMBINED SCHEDULE SLOTS ---
type TodayScheduleSlot = (RegularSchedule & { type: "fixed" }) | (ScheduleOverride & { type: "override" })

interface UpcomingAppointment {
  id: string
  patientName: string
  patientAvatar?: string
  appointmentTime: string
  appointmentDate: string
  serviceType: string
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Tách trạng thái loading cho từng phần để có trải nghiệm người dùng tốt hơn
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  // Format balance
  const formatBalance = (balance: number, currency: string = 'VND') => {
    const formatted = new Intl.NumberFormat('vi-VN').format(balance)
    return `${formatted} ${currency}`
  }

  const now = new Date()

  const upcomingAppointments = useMemo(() => {
    // Lọc các cuộc hẹn chưa bị hủy
    const nonCancelledAppointments = appointments.filter(apt => 
      apt.statusCode !== 'CancelledByPatient' && apt.statusCode !== 'CancelledByDoctor' && apt.statusCode !== 'NoShow'
    );
    return nonCancelledAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStartTime)
      const isUpcoming = apt.statusCode === 'Confirmed' || apt.statusCode === 'OnProgressing'
      return aptDate >= now && isUpcoming
    }).sort((a, b) => 
      new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime()
    )
  }, [appointments, now])
  
  const todayAppointments = useMemo(() => {
    return upcomingAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStartTime)
      return aptDate.toDateString() === now.toDateString()
    })
  }, [upcomingAppointments, now])

  const completedAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => 
      apt.statusCode === 'Completed' || 
      (new Date(apt.appointmentStartTime) < now && 
       apt.statusCode !== 'CancelledByPatient' && apt.statusCode !== 'CancelledByDoctor' && apt.statusCode !== 'NoShow')
    );
  }, [appointments])

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStartTime)
      return aptDate >= thisMonthStart
    })
  }, [appointments, thisMonthStart])

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const lastMonthAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStartTime)
      return aptDate >= lastMonthStart && aptDate <= lastMonthEnd
    })
  }, [appointments, lastMonthStart, lastMonthEnd])

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatTime = (dateString: string): string => {
    // Chỉ lấy phần HH:mm từ chuỗi "HH:mm:ss"
    if (typeof dateString === 'string' && dateString.includes(':')) {
      return dateString.substring(0, 5);
    }
    return 'Invalid Time';
  }

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime) return ''
    const start = new Date(startTime)
    const startFormatted = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    
    if (endTime) {
      const end = new Date(endTime)
      const endFormatted = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      return `${startFormatted} - ${endFormatted}`
    }
    
    return startFormatted
  }

  const getTimeUntil = (dateString: string): string => {
    const date = new Date(dateString)
    const diff = date.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (diff > 0) { // Kiểm tra nếu thời gian hẹn lớn hơn thời gian hiện tại
      if (days > 0) return `${days} ngày nữa`;
      if (hours > 0) return `${hours} giờ nữa`;
      return 'Sắp diễn ra';
    } else return ''; // Trả về chuỗi trống nếu không còn "Sắp diễn ra" nữa
  };

  const getAppointmentStatus = (apt: Appointment): 'upcoming' | 'completed' | 'cancelled' => {
    if (apt.statusCode === 'Completed') {
      return 'completed'
    } else if (
      apt.statusCode === 'CancelledByPatient' || 
      apt.statusCode === 'CancelledByDoctor' || 
      apt.statusCode === 'NoShow'
    ) {
      return 'cancelled'
    }
    return 'upcoming'
  }

  const getStatusConfig = (status: string, startTime?: string, endTime?: string) => {
    const currentTime = new Date()
    const appointmentStartTime = startTime ? new Date(startTime) : null
    const appointmentEndTime = endTime ? new Date(endTime) : null

    if (status === 'completed') {
      return { 
        label: 'Hoàn thành', 
        icon: 'bi-check-circle-fill',
        color: '#10b981'
      }
    }
    
    if (status === 'cancelled') {
      return { 
        label: 'Đã hủy', 
        icon: 'bi-x-circle-fill',
        color: '#ef4444'
      }
    }

    // Upcoming status
    if (appointmentStartTime && appointmentEndTime) {
      if (currentTime >= appointmentStartTime && currentTime <= appointmentEndTime) {
        return { 
          label: 'Đang diễn ra', 
          icon: 'bi-clock-history',
          color: '#3b82f6'
        }
      }
      if (currentTime < appointmentStartTime) {
        return { 
          label: 'Sắp diễn ra', 
          icon: 'bi-clock-history',
          color: '#f59e0b'
        }
      }
    }

    return { 
      label: 'Sắp diễn ra', 
      icon: 'bi-clock-history',
      color: '#f59e0b'
    }
  }

  const getPaymentStatusLabel = (statusCode?: string): string => {
    if (!statusCode) return 'Chưa thanh toán'

    const statusMap: { [key: string]: string } = {
      'Paid': 'Đã thanh toán',
      'Unpaid': 'Chưa thanh toán',
      'Pending': 'Đang chờ thanh toán',
      'Failed': 'Thanh toán thất bại',
      'Refunded': 'Đã hoàn tiền',
      'Cancelled': 'Đã hủy'
    }
    
    return statusMap[statusCode] || statusCode
  }

  const getPaymentStatusIcon = (statusCode?: string): string => {
    if (!statusCode) return 'bi-x-circle'
    
    const iconMap: { [key: string]: string } = {
      'Paid': 'bi-check-circle-fill',
      'Unpaid': 'bi-x-circle',
      'Pending': 'bi-clock-history',
      'Failed': 'bi-exclamation-triangle-fill',
      'Refunded': 'bi-arrow-counterclockwise',
      'Cancelled': 'bi-x-circle-fill'
    }
    
    return iconMap[statusCode] || 'bi-info-circle'
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsDashboardLoading(true)
      setIsAppointmentsLoading(true)
      setDashboardError(null)
      setAppointmentsError(null)

      // Fetch new dashboard data and upcoming appointments concurrently
      try {
        const [dashboardResult, appointmentsResult] = await Promise.allSettled([
          doctorDashboardService.getDashboard(),
          appointmentService.getMyAppointmentsByDateRange("2020-01-01", "2030-12-31"),
        ])

        // Handle Dashboard API result
        if (dashboardResult.status === "fulfilled") {
          setDashboardData(dashboardResult.value)
        } else {
          console.error("Error fetching dashboard data:", dashboardResult.reason)
          setDashboardError("Không thể tải dữ liệu tổng quan.")
        }
        setIsDashboardLoading(false)

        // Handle Appointments API result
        if (appointmentsResult.status === "fulfilled") {
          const allAppointments = appointmentsResult.value
          setAppointments(allAppointments)
        } else {
          console.error("Error fetching appointments:", appointmentsResult.reason)
          setAppointmentsError("Không tải được lịch hẹn.")
        }
        setIsAppointmentsLoading(false)
      } catch (err) {
        console.error("General error fetching data:", err)
        setDashboardError("Đã xảy ra lỗi không xác định.")
        setIsDashboardLoading(false)
        setIsAppointmentsLoading(false)
      }
    }

    fetchDashboardData()
  }, []) // ✅ Bỏ [user] để chỉ fetch data một lần khi component được mount

  // Combine and sort today's schedule
  const todaySchedule: TodayScheduleSlot[] = React.useMemo(() => {
    if (!dashboardData) return []

    const { regular, overrides } = dashboardData.schedule

    const visibleFixedSlots: TodayScheduleSlot[] = regular
      .filter(
        (fixedSlot) =>
          !overrides.some(
            (overrideSlot) =>
              !overrideSlot.overrideType && // It's a "Nghỉ" override
              overrideSlot.startTime < fixedSlot.endTime &&
              overrideSlot.endTime > fixedSlot.startTime,
          ),
      )
      .map((s) => ({ ...s, type: "fixed" }))

    const visibleOverrideSlots: TodayScheduleSlot[] = overrides.map((o) => ({ ...o, type: "override" }))

    return [...visibleFixedSlots, ...visibleOverrideSlots].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [dashboardData]) // ✅ Chỉ tính toán lại khi dashboardData thay đổi

  if (isDashboardLoading && isAppointmentsLoading) {
    return <PageLoader />
  }

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeContent}>
          <div className={styles.greetingSection}>
            <span className={styles.greetingIcon}>
              {now.getHours() < 12 ? '🌅' : now.getHours() < 18 ? '☀️' : '🌙'}
            </span>
            <div>
              <h1 className={styles.greeting}>{getGreeting()}</h1>
              <p className={styles.userName}>{user?.fullName || 'Bác sĩ'}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.walletCard} onClick={() => window.location.href = '/app/doctor/wallet'}>
              <div className={styles.walletIcon}>
                <i className="bi bi-wallet2"></i>
              </div>
              <div className={styles.walletInfo}>
                <span className={styles.walletLabel}>Số dư ví</span>
                {isDashboardLoading ? (
                  <span className={styles.walletAmount}>...</span>
                ) : dashboardData?.wallet ? (
                  <span className={styles.walletAmount}>
                    {formatBalance(dashboardData.wallet.balance, '₫')}
                  </span>
                ) : (
                  <span className={styles.walletAmount}>0 ₫</span>
                )}
              </div>
              <button className={styles.addMoneyBtn} onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/app/doctor/wallet'
              }}>
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
            <div className={styles.dateCard}>
              <i className="bi bi-calendar-event"></i>
              <div>
                <span className={styles.dateLabel}>Hôm nay</span>
                <span className={styles.dateValue}>
                  {now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        {dashboardError ? (
          <div className={`${styles.statCard} ${styles.errorCard}`}>{dashboardError}</div>
        ) : (
          <>
          {dashboardData ? (
            <>
              <div className={styles.statCard} onClick={() => navigate('/app/doctor/appointments')}>
                <div className={styles.statIconWrapper}>
                  <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <i className="bi bi-calendar-check"></i>
                  </div>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Lịch hẹn sắp tới</span>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValue}>{upcomingAppointments.length}</span>
                    {todayAppointments.length > 0 && (
                      <span className={styles.statBadge}>
                        <i className="bi bi-clock"></i>
                        {todayAppointments.length} hôm nay
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.statCard} onClick={() => navigate('/app/doctor/appointments')}>
                <div className={styles.statIconWrapper}>
                  <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <i className="bi bi-check-circle"></i>
                  </div>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Đã hoàn thành</span>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValue}>{completedAppointments.length}</span>
                    <span className={styles.statSubtext}>lịch khám</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard} onClick={() => navigate('/app/doctor/wallet')}>
                <div className={styles.statIconWrapper}>
                  <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <i className="bi bi-cash-coin"></i>
                  </div>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Doanh thu hôm nay</span>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValue}>
                      {new Intl.NumberFormat('vi-VN').format(dashboardData.summary.todayRevenue)}
                    </span>
                    <span className={styles.statSubtext}>₫</span>
                  </div>
                </div>
              </div>

              <div className={styles.statCard} onClick={() => navigate('/app/doctor/wallet')}>
                <div className={styles.statIconWrapper}>
                  <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                    <i className="bi bi-wallet2"></i>
                  </div>
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Doanh thu tháng</span>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValue}>
                      {new Intl.NumberFormat('vi-VN').format(dashboardData.summary.monthRevenue)}
                    </span>
                    <span className={styles.statSubtext}>₫</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`${styles.statCard} ${styles.loadingCard}`}>
                <div className={styles.skeleton} style={{ width: "80%", height: "20px" }}></div>
                <div className={styles.skeleton} style={{ width: "50%", height: "24px", marginTop: "8px" }}></div>
              </div>
            ))
          )}
          </>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Today's Schedule - Most Important */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-calendar-week"></i>
                <h2>Lịch làm việc hôm nay</h2>
              </div>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/app/doctor/schedule')}
              >
                Quản lý
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            {todaySchedule.length > 0 ? (
              <div className={styles.recordsList}>
                {todaySchedule.map((slot, index) => {
                  let statusText = ""
                  let statusClass = ""

                  if (slot.type === "fixed") {
                    statusText = "Lịch cố định"
                    statusClass = styles.statusFixed
                  } else if (slot.type === "override") {
                    statusText = slot.overrideType ? "Tăng ca" : "Nghỉ"
                    statusClass = slot.overrideType ? styles.statusOvertime : styles.statusOff
                  }

                  return (
                    <div 
                      key={index} 
                      className={styles.recordItem}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className={styles.recordIcon}>
                        <i className="bi bi-clock"></i>
                      </div>
                      <div className={styles.recordInfo}>
                        <h5>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</h5>
                        <p className={`${styles.scheduleStatus} ${statusClass}`}>{statusText}</p>
                        {slot.type === "override" && slot.reason && (
                          <span className={styles.recordDate}>
                            <i className="bi bi-info-circle"></i>
                            {slot.reason}
                          </span>
                        )}
                      </div>
                      <i className="bi bi-chevron-right"></i>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-calendar-x"></i>
                </div>
                <p>Không có lịch làm việc nào hôm nay</p>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-calendar-heart"></i>
                <h2>Lịch hẹn sắp tới</h2>
              </div>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/app/doctor/appointments')}
              >
                Xem tất cả
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            {isAppointmentsLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang tải...</p>
              </div>
            ) : appointmentsError ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <p>{appointmentsError}</p>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className={styles.appointmentsList}>
                {upcomingAppointments.slice(0, 3).map((apt, index) => {
                  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=667eea&color=fff`

                  return (
                    <div 
                      key={apt.id} 
                      className={styles.appointmentItem}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => {
                        setSelectedAppointment(apt)
                        setShowDetailModal(true)
                      }}
                    >
                      <div className={styles.appointmentLeft}>
                        <div className={styles.doctorAvatarLarge}>
                          <img 
                            src={avatarUrl}
                            alt={apt.patientName}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=667eea&color=fff`
                            }}
                          />
                          <div className={styles.onlineBadge}></div>
                        </div>
                        <div className={styles.appointmentDetails}>
                          <h4>{apt.patientName}</h4>
                          <p className={styles.specialty}>Bệnh nhân</p>
                          <div className={styles.appointmentMeta}>
                            <span className={styles.metaItem}>
                              <i className="bi bi-clock"></i>
                              {formatTime(apt.appointmentStartTime)}
                            </span>
                            <span className={styles.metaItem}>
                              <i className="bi bi-calendar3"></i>
                              {formatDate(apt.appointmentStartTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.appointmentRight}>
                        <div className={styles.timeUntil}>
                          <i className="bi bi-hourglass-split"></i>
                          {getTimeUntil(apt.appointmentStartTime)}
                        </div>
                        <button 
                          className={styles.viewDetailsBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAppointment(apt)
                            setShowDetailModal(true)
                          }}
                        >
                          <i className="bi bi-arrow-right-circle"></i>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-calendar-x"></i>
                </div>
                <h3>Chưa có lịch hẹn</h3>
                <p>Chưa có lịch hẹn nào sắp tới</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Quick Actions */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-lightning-charge"></i>
                <h2>Thao tác nhanh</h2>
              </div>
            </div>
            
            <div className={styles.quickActions}>
              <button 
                className={styles.actionCard}
                onClick={() => navigate('/app/doctor/appointments')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <i className="bi bi-calendar-check"></i>
                </div>
                <span>Lịch hẹn</span>
              </button>

              <button 
                className={styles.actionCard}
                onClick={() => navigate('/app/doctor/patients')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <i className="bi bi-people"></i>
                </div>
                <span>Bệnh nhân</span>
              </button>

              <button 
                className={styles.actionCard}
                onClick={() => navigate('/app/doctor/wallet')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <i className="bi bi-wallet2"></i>
                </div>
                <span>Doanh thu</span>
              </button>

              <button 
                className={styles.actionCard}
                onClick={() => navigate('/app/doctor/profile')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <i className="bi bi-person-circle"></i>
                </div>
                <span>Hồ sơ</span>
              </button>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-clock-history"></i>
                <h2>Đánh giá gần đây</h2>
              </div>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/app/doctor/feedback')}
              >
                Xem tất cả
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            {dashboardData && dashboardData.reviews.recent.length > 0 ? (
              <div className={styles.recordsList}>
                {dashboardData.reviews.recent.slice(0, 4).map((review, index) => (
                  <div 
                    key={index} 
                    className={styles.recordItem}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate('/app/doctor/feedback')}
                  >
                    <div className={styles.recordIcon}>
                      <i className="bi bi-star-fill"></i>
                    </div>
                    <div className={styles.recordInfo}>
                      <h5>{review.patientName}</h5>
                      <p>{review.comment || "Bệnh nhân không để lại bình luận."}</p>
                      <span className={styles.recordDate}>
                        <i className="bi bi-calendar3"></i>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <i className="bi bi-chevron-right"></i>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-chat-dots"></i>
                </div>
                <p>Chưa có đánh giá nào</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (() => {
        const appointmentStatus = getAppointmentStatus(selectedAppointment)
        const statusConfig = getStatusConfig(
          appointmentStatus,
          selectedAppointment.appointmentStartTime,
          selectedAppointment.appointmentEndTime
        )
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.patientName)}&background=667eea&color=fff`

        const formatDetailDate = (dateString: string) => {
          const date = new Date(dateString)
          return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        }

        return (
          <div className={modalStyles.modalOverlay} onClick={() => setShowDetailModal(false)}>
            <div className={modalStyles.detailModal} onClick={(e) => e.stopPropagation()}>
              <button className={modalStyles.closeModalBtn} onClick={() => setShowDetailModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>

              <div className={modalStyles.modalHeader}>
                <div className={modalStyles.modalDoctorInfo}>
                  <div className={modalStyles.modalAvatarWrapper}>
                    <img 
                      src={avatarUrl} 
                      alt={selectedAppointment.patientName}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.patientName)}&background=667eea&color=fff`
                      }}
                    />
                  </div>
                  <div className={modalStyles.modalDoctorDetails}>
                    <h2 className={modalStyles.modalDoctorName}>{selectedAppointment.patientName}</h2>
                    <div className={modalStyles.modalDoctorMeta}>
                      <span className={modalStyles.modalSpecialty}>
                        <i className="bi bi-person-fill"></i>
                        Bệnh nhân
                      </span>
                    </div>
                  </div>
                </div>
                <div className={modalStyles.modalStatus} style={{ background: statusConfig.color }}>
                  <i className={statusConfig.icon}></i>
                  {statusConfig.label}
                </div>
              </div>

              <div className={modalStyles.modalBody}>
                <div className={modalStyles.detailSection}>
                  <h4 className={modalStyles.sectionTitle}>
                    <i className="bi bi-calendar-event"></i>
                    Thông tin lịch hẹn
                  </h4>
                  <div className={modalStyles.detailGrid}>
                    <div className={modalStyles.detailCard}>
                      <div className={modalStyles.detailCardLabel}>NGÀY KHÁM</div>
                      <div className={modalStyles.detailCardValue}>{formatDetailDate(selectedAppointment.appointmentStartTime)}</div>
                    </div>
                    <div className={modalStyles.detailCard}>
                      <div className={modalStyles.detailCardLabel}>GIỜ KHÁM</div>
                      <div className={modalStyles.detailCardValue}>
                        {selectedAppointment.appointmentStartTime && selectedAppointment.appointmentEndTime
                          ? formatTimeRange(selectedAppointment.appointmentStartTime, selectedAppointment.appointmentEndTime)
                          : formatTime(selectedAppointment.appointmentStartTime)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={modalStyles.detailSection}>
                  <h4 className={modalStyles.sectionTitle}>
                    <i className="bi bi-credit-card"></i>
                    Thông tin thanh toán
                  </h4>
                  <div className={modalStyles.paymentDetails}>
                    <div className={modalStyles.paymentRow}>
                      <span className={modalStyles.paymentLabel}>Phí khám bệnh</span>
                      <span className={modalStyles.paymentAmount}>{formatCurrency(selectedAppointment.consultationFee)}</span>
                    </div>
                    {selectedAppointment.platformFee > 0 && (
                      <>
                        <div className={modalStyles.paymentRow}>
                          <span className={modalStyles.paymentLabel}>Phí nền tảng</span>
                          <span className={modalStyles.paymentAmount}>{formatCurrency(selectedAppointment.platformFee)}</span>
                        </div>
                        <div className={modalStyles.paymentDivider}></div>
                        <div className={modalStyles.paymentRow}>
                          <span className={modalStyles.totalLabel}>Tổng cộng</span>
                          <span className={modalStyles.totalValue}>{formatCurrency(selectedAppointment.totalAmount)}</span>
                        </div>
                      </>
                    )}
                    {selectedAppointment.paymentStatusCode && (
                      <div className={`${modalStyles.paymentStatus} ${modalStyles[`paymentStatus${selectedAppointment.paymentStatusCode}`] || ''}`}>
                        <i className={`bi ${getPaymentStatusIcon(selectedAppointment.paymentStatusCode)}`}></i>
                        <span>Trạng thái: {getPaymentStatusLabel(selectedAppointment.paymentStatusCode)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={modalStyles.modalFooter}>
                {selectedAppointment.statusCode === 'Completed' && (
                  <button 
                    className={modalStyles.modalEmrBtn}
                    onClick={() => {
                      setShowDetailModal(false)
                      navigate(`/app/doctor/medical-records/${selectedAppointment.id}`)
                    }}
                  >
                    <i className="bi bi-file-text"></i>
                    Xem hồ sơ bệnh án
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default DoctorDashboard
