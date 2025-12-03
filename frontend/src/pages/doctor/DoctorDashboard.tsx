"use client"

import React, { useState, useEffect, useMemo } from "react"
import serviceTierService from "../../services/serviceTierService"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import doctorDashboardService from "../../services/doctorDashboardService"
import { appointmentService } from "../../services/appointmentService"
import { Appointment } from "../../types/appointment.types"
import { TierListPresenter } from "../../types/serviceTier.types"
import styles from "../../styles/doctor/DoctorDashboard.module.css"
import modalStyles from "../../styles/patient/PatientAppointments.module.css"
import { Link } from "react-router-dom"
import { PageLoader } from "../../components/ui"
import notificationService from "../../services/notificationService"
import { NotificationMetadata, NotificationDto } from "../../types/notification.types"

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
  overrideType: boolean 
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

type TodayScheduleSlot = (RegularSchedule & { type: "fixed" }) | (ScheduleOverride & { type: "override" })

interface UpcomingAppointment {
  id: string
  patientName: string
  patientAvatar?: string
  appointmentTime: string
  appointmentDate: string
  serviceType: string
}

const DOCTOR_READ_NOTIFICATIONS_KEY = "medix_doctor_read_notifications_v1"

const getNotificationKey = (notification: NotificationDto) =>
  `${notification.title}-${notification.message}-${notification.createdAt}-${notification.type}`

const getReadNotificationKeys = (): Set<string> => {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(DOCTOR_READ_NOTIFICATIONS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed as string[])
  } catch {
    return new Set()
  }
}

const addReadNotificationKeys = (keys: string[]) => {
  if (typeof window === "undefined" || !keys.length) return
  try {
    const existing = getReadNotificationKeys()
    keys.forEach(key => existing.add(key))
    localStorage.setItem(DOCTOR_READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(existing)))
  } catch {
  }
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null)
  const [tiersData, setTiersData] = useState<TierListPresenter | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [notificationMetadata, setNotificationMetadata] = useState<NotificationMetadata | null>(null)
  const [notificationList, setNotificationList] = useState<NotificationDto[]>([])
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true)
  const [dashboardUnreadCount, setDashboardUnreadCount] = useState<number>(0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

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

    return `${amount.toLocaleString('vi-VN')} VND`;
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  const formatBalance = (balance: number, currency: string = 'VND') => {
    const formatted = new Intl.NumberFormat('vi-VN').format(balance)
    return `${formatted} ${currency}`
  }

  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60_000)

    return () => clearInterval(timer)
  }, [])

  const upcomingAppointments = useMemo(() => {
    const nonCancelledAppointments = appointments.filter(apt => 
      apt.statusCode !== 'CancelledByPatient' && apt.statusCode !== 'CancelledByDoctor' && apt.statusCode !== 'NoShow'
    );
    return nonCancelledAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStartTime)
      const isUpcoming = apt.statusCode === 'Confirmed' || apt.statusCode === 'OnProgressing'
      return aptDate >= currentTime && isUpcoming
    }).sort((a, b) => 
      new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime()
    )
  }, [appointments, currentTime])
  
  const todayAppointments = useMemo(() => {
    return upcomingAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStartTime)
      return aptDate.toDateString() === currentTime.toDateString()
    })
  }, [upcomingAppointments, currentTime])

  const completedAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => 
      apt.statusCode === 'Completed' || 
      (new Date(apt.appointmentStartTime) < now && 
       apt.statusCode !== 'CancelledByPatient' && apt.statusCode !== 'CancelledByDoctor' && apt.statusCode !== 'NoShow')
    );
  }, [appointments])

  const thisMonthStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1)
  const thisMonthAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStartTime)
      return aptDate >= thisMonthStart
    })
  }, [appointments, thisMonthStart])

  const lastMonthStart = new Date(currentTime.getFullYear(), currentTime.getMonth() - 1, 1)
  const lastMonthEnd = new Date(currentTime.getFullYear(), currentTime.getMonth(), 0)
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
    if (typeof dateString === 'string' && dateString.includes(':')) {
      return dateString.substring(0, 5);
    }
    return 'Invalid Time';
  }

  const formatScheduleHourRange = (startTime: string, endTime: string): string => {
    const start = formatTime(startTime)
    const [endHourRaw, endMinuteRaw] = formatTime(endTime).split(':').map(Number)

    if (Number.isNaN(endHourRaw) || Number.isNaN(endMinuteRaw)) return `${start} - ${formatTime(endTime)}`

    const endHourDisplay = endMinuteRaw > 0 ? endHourRaw + 1 : endHourRaw
    const endDisplay = `${String(endHourDisplay).padStart(2, '0')}:00`

    return `${start} - ${endDisplay}`
  }

  const formatNotificationTime = (dateString: string): string => {
    const notificationDate = new Date(dateString)
    if (Number.isNaN(notificationDate.getTime())) return ''

    const day = String(notificationDate.getDate()).padStart(2, '0')
    const month = String(notificationDate.getMonth() + 1).padStart(2, '0')
    const year = notificationDate.getFullYear()
    const hours = String(notificationDate.getHours()).padStart(2, '0')
    const minutes = String(notificationDate.getMinutes()).padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatMessageDates = (message?: string): string => {
    if (!message) return ''
    const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/g
    return message.replace(dateRegex, (_, month, day, year) => {
      const parsedDay = String(Number(day)).padStart(2, '0')
      const parsedMonth = String(Number(month)).padStart(2, '0')
      return `${parsedDay}/${parsedMonth}/${year}`
    })
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

  const getTimeUntil = (target: string | Date): string => {
    const targetDate = typeof target === "string" ? new Date(target) : target
    const now = new Date()
    const diff = targetDate.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (diff > 0) {
      if (days > 0) return `${days} ngày nữa`;
      if (hours > 0) return `${hours} giờ nữa`;
      return 'Sắp diễn ra';
    } else return '';
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

  const getNotificationIconClass = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      'ScheduleRegistration': 'bi-calendar-check-fill',
      'ScheduleRegistrationFailed': 'bi-calendar-x-fill',
      'ScheduleUpdated': 'bi-calendar-check-fill',
      'ScheduleUpdateFailed': 'bi-calendar-x-fill',
      'ScheduleDeleted': 'bi-calendar-minus-fill',
      'ScheduleDeleteFailed': 'bi-calendar-x-fill',
      'ScheduleOverride': 'bi-calendar-plus-fill',
      'ScheduleOverrideFailed': 'bi-calendar-x-fill',
      'ScheduleOverrideUpdated': 'bi-calendar-check-fill',
      'ScheduleOverrideUpdateFailed': 'bi-calendar-x-fill',
      'ScheduleOverrideDeleted': 'bi-calendar-minus-fill',
      'ScheduleOverrideDeleteFailed': 'bi-calendar-x-fill',
      'Appointment': 'bi-calendar-event-fill',
      'Payment': 'bi-credit-card-fill',
      'System': 'bi-bell-fill',
      'default': 'bi-info-circle-fill'
    }
    return iconMap[type] || iconMap['default']
  }

  const getNotificationTypeColor = (type: string): string => {
    const colorMap: { [key: string]: string } = {
      'ScheduleRegistration': '#10b981',
      'ScheduleRegistrationFailed': '#ef4444',
      'ScheduleUpdated': '#10b981',
      'ScheduleUpdateFailed': '#ef4444',
      'ScheduleDeleted': '#3b82f6',
      'ScheduleDeleteFailed': '#ef4444',
      'ScheduleOverride': '#10b981',
      'ScheduleOverrideFailed': '#ef4444',
      'ScheduleOverrideUpdated': '#10b981',
      'ScheduleOverrideUpdateFailed': '#ef4444',
      'ScheduleOverrideDeleted': '#3b82f6',
      'ScheduleOverrideDeleteFailed': '#ef4444',
      'Appointment': '#3b82f6',
      'Payment': '#f59e0b',
      'System': '#667eea',
      'default': '#64748b'
    }
    return colorMap[type] || colorMap['default']
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsDashboardLoading(true)
      setIsAppointmentsLoading(true)
      setIsNotificationsLoading(true)
      setDashboardError(null)
      setAppointmentsError(null)

      try {
        const [dashboardResult, appointmentsResult, tiersResult, notificationsResult] = await Promise.allSettled([
          doctorDashboardService.getDashboard(),
          appointmentService.getMyAppointmentsByDateRange("2020-01-01", "2030-12-31"),
          serviceTierService.getDisplayedList(),
          notificationService.getMetadata(),
        ])

        if (dashboardResult.status === "fulfilled") {
          setDashboardData(dashboardResult.value)
        } else {
          setDashboardError("Không thể tải dữ liệu tổng quan.")
        }
        setIsDashboardLoading(false)

        if (tiersResult.status === "fulfilled") {
          setTiersData(tiersResult.value)
        } else {
        }

        if (appointmentsResult.status === "fulfilled") {
          const allAppointments = appointmentsResult.value
          setAppointments(allAppointments)
          setAppointments(appointmentsResult.value)
        } else {
          setAppointmentsError("Không tải được lịch hẹn.")
        }

        if (tiersResult.status === "fulfilled") {
          setTiersData(tiersResult.value)
        } else {
        }
        
        if (notificationsResult.status === "fulfilled") {
          const readKeys = getReadNotificationKeys()
          const list = notificationsResult.value.notifications || []
          const sorted = [...list].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          const limited = sorted.slice(0, 5)
          const unread = limited.filter(n => !readKeys.has(getNotificationKey(n))).length

          setNotificationMetadata({
            ...notificationsResult.value,
            isAllRead: unread === 0
          })
          setNotificationList(limited)
          setDashboardUnreadCount(unread)
        } else {
        }
        setIsNotificationsLoading(false)
        setIsAppointmentsLoading(false)
      } catch (err) {
        setDashboardError("Đã xảy ra lỗi không xác định.")
        setIsDashboardLoading(false)
        setIsAppointmentsLoading(false)
        setIsNotificationsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
  }, [dashboardData])

  const todayScheduleSummary = React.useMemo(() => {
    if (!todaySchedule.length) {
      return {
        hasSchedule: false,
        hasRemainingShift: false,
        totalShifts: 0,
        overtimeShifts: 0,
        firstStart: "",
        lastEnd: "",
        nextShift: null as TodayScheduleSlot | null,
        totalWorkingMinutes: 0,
        remainingShifts: 0,
      }
    }

    const sorted = [...todaySchedule].sort((a, b) => a.startTime.localeCompare(b.startTime))
    const totalShifts = sorted.length
    const overtimeShifts = sorted.filter((s) => s.type === "override" && (s as any).overrideType).length
    const firstStart = sorted[0]?.startTime ?? ""
    const lastEnd = sorted[sorted.length - 1]?.endTime ?? ""

    const todayDateStr = currentTime.toDateString()
    const nowMs = currentTime.getTime()

    const upcomingShift = sorted.find((slot) => {
      const start = new Date(`${todayDateStr} ${slot.startTime}`)
      return start.getTime() > nowMs
    })

    const ongoingShift = sorted.find((slot) => {
      const start = new Date(`${todayDateStr} ${slot.startTime}`)
      const end = new Date(`${todayDateStr} ${slot.endTime}`)
      return nowMs >= start.getTime() && nowMs <= end.getTime()
    })

    const lastEndDate = new Date(`${todayDateStr} ${lastEnd}`)

    const nextShift = upcomingShift || ongoingShift || null
    const hasRemainingShift = !!upcomingShift || !!ongoingShift || nowMs <= lastEndDate.getTime()

    const totalWorkingMinutes = totalShifts * 60

    const remainingShifts = sorted.filter((slot) => {
      const start = new Date(`${todayDateStr} ${slot.startTime}`)
      return start.getTime() > nowMs
    }).length

    return {
      hasSchedule: true,
        hasRemainingShift,
      totalShifts,
      overtimeShifts,
      firstStart,
      lastEnd,
      nextShift,
        totalWorkingMinutes,
        remainingShifts,
    }
  }, [todaySchedule, currentTime])

  const handleMarkAllNotificationsRead = () => {
    const keys = notificationList.map(getNotificationKey)
    addReadNotificationKeys(keys)
    setDashboardUnreadCount(0)
    setNotificationMetadata(prev => prev ? { ...prev, isAllRead: true } : prev)
  }

  const handleNotificationClick = (index: number) => {
    const target = notificationList[index]
    if (!target) return

    const key = getNotificationKey(target)
    const readKeys = getReadNotificationKeys()
    if (readKeys.has(key)) return

    addReadNotificationKeys([key])
    const newUnread = notificationList.filter(n => !getReadNotificationKeys().has(getNotificationKey(n))).length
    setDashboardUnreadCount(newUnread)
    setNotificationMetadata(prevMeta => prevMeta ? { ...prevMeta, isAllRead: newUnread === 0 } : prevMeta)
  }

  if (isDashboardLoading && isAppointmentsLoading) {
    return <PageLoader />
  }

  return (
    <div className={styles.container}>
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeContent}>
          <div className={styles.greetingSection}>
            <span className={styles.greetingIcon}>
              {currentTime.getHours() < 12 ? '🌅' : currentTime.getHours() < 18 ? '☀️' : '🌙'}
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
                    {formatCurrencyCompact(dashboardData.wallet.balance)}
                  </span>
                ) : (
                  <span className={styles.walletAmount}>0 VND</span>
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
                  {currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
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
                      {formatCurrencyCompact(dashboardData.summary.todayRevenue)}
                    </span>
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
                      {formatCurrencyCompact(dashboardData.summary.monthRevenue)}
                    </span>
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

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={`${styles.sectionCard} ${styles.scheduleCard}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-calendar-week"></i>
                <h2>Tổng quan lịch làm việc hôm nay</h2>
              </div>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/app/doctor/schedule')}
              >
                Xem lịch chi tiết
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            {todayScheduleSummary.hasSchedule ? (
              <>
                <div className={styles.scheduleOverview}>
                  <div className={styles.scheduleStatusChip}>
                    <span className={styles.statusDot}></span>
                    <span>
                      {currentTime.getHours() >= 7 && currentTime.getHours() <= 22
                        ? "Hôm nay bạn có lịch làm việc"
                        : "Hôm nay vẫn có lịch làm việc"}
                    </span>
                  </div>

                  <div className={styles.scheduleRange}>
                    <span className={styles.scheduleRangeLabel}>Khung giờ làm việc</span>
                    <div className={styles.scheduleRangeValue}>
                      {formatScheduleHourRange(todayScheduleSummary.firstStart, todayScheduleSummary.lastEnd)}
                    </div>
                  </div>
                  <div className={styles.scheduleOverviewStats}>
                    <div className={styles.scheduleStat}>
                      <span className={styles.scheduleStatLabel}>Tổng số ca</span>
                      <span className={styles.scheduleStatValue}>
                        {todayScheduleSummary.totalShifts}
                      </span>
                    </div>
                    <div className={styles.scheduleStat}>
                      <span className={styles.scheduleStatLabel}>Ca lịch cố định</span>
                      <span className={styles.scheduleStatValue}>
                        {todayScheduleSummary.totalShifts - todayScheduleSummary.overtimeShifts}
                      </span>
                    </div>
                    <div className={styles.scheduleStat}>
                      <span className={styles.scheduleStatLabel}>Ca tăng ca</span>
                      <span className={styles.scheduleStatValue}>
                        {todayScheduleSummary.overtimeShifts}
                      </span>
                    </div>
                    <div className={styles.scheduleStat}>
                      <span className={styles.scheduleStatLabel}>Tổng thời gian làm việc</span>
                      <span className={styles.scheduleStatValue}>
                        {Math.floor(todayScheduleSummary.totalWorkingMinutes / 60)}h{" "}
                        {todayScheduleSummary.totalWorkingMinutes % 60}p
                      </span>
                    </div>
                  </div>

                  <div className={styles.scheduleSummaryChips}>
                    <span className={styles.scheduleChip}>
                      <i className="bi bi-activity"></i>
                      {todayScheduleSummary.hasRemainingShift
                        ? `${todayScheduleSummary.remainingShifts} ca còn lại trong ngày`
                        : "Bạn đã hoàn thành toàn bộ ca làm việc hôm nay"}
                    </span>
                    <span className={styles.scheduleChipMuted}>
                      <i className="bi bi-info-circle"></i>
                      <span>
                        Lịch cố định, tăng ca và nghỉ được quản lý tại trang{" "}
                        <button
                          className={styles.inlineLinkButton}
                          onClick={() => navigate("/app/doctor/schedule")}
                        >
                          Lịch làm việc
                        </button>
                        .
                      </span>
                    </span>
                      </div>
                </div>

                {todayScheduleSummary.nextShift && todayScheduleSummary.hasRemainingShift && (
                  <div className={styles.nextShiftCard}>
                    <div className={styles.nextShiftHeader}>
                      <span className={styles.nextShiftLabel}>Ca sắp tới</span>
                      <span className={styles.nextShiftTime}>
                        {formatScheduleHourRange(
                          todayScheduleSummary.nextShift.startTime,
                          todayScheduleSummary.nextShift.endTime
                        )}
                      </span>
                    </div>
                    <div className={styles.nextShiftBody}>
                      <div className={styles.nextShiftMeta}>
                        <span className={styles.nextShiftMetaItem}>
                          <i className="bi bi-clock-history"></i>
                          {getTimeUntil(
                            new Date(
                              `${currentTime.toDateString()} ${todayScheduleSummary.nextShift.startTime}`,
                            ),
                          ) || "Đã diễn ra"}
                        </span>
                        {todayScheduleSummary.nextShift.type === "override" && (
                          <span
                            className={`${styles.scheduleStatus} ${
                              todayScheduleSummary.nextShift.overrideType
                                ? styles.statusOvertime
                                : styles.statusOff
                            }`}
                          >
                            {todayScheduleSummary.nextShift.overrideType ? "Tăng ca" : "Nghỉ"}
                          </span>
                        )}
                        {todayScheduleSummary.nextShift.type === "fixed" && (
                          <span className={`${styles.scheduleStatus} ${styles.statusFixed}`}>
                            Lịch cố định
                          </span>
                        )}
                      </div>
                      {todayScheduleSummary.nextShift.type === "override" &&
                        todayScheduleSummary.nextShift.reason && (
                          <p className={styles.nextShiftNote}>
                            <i className="bi bi-info-circle"></i>
                            {todayScheduleSummary.nextShift.reason}
                          </p>
                        )}
                    </div>
              </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-calendar-x"></i>
                </div>
                <p>Hôm nay bạn không có lịch làm việc nào.</p>
              </div>
            )}
          </div>

          <div className={`${styles.sectionCard} ${styles.upcomingCard}`}>
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

          {/* Recent Reviews - cùng cột với lịch hẹn sắp tới */}
          <div className={`${styles.sectionCard} ${styles.reviewsCard}`}>
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

        <div className={styles.rightColumn}>
          <div className={`${styles.sectionCard} ${styles.notificationCard}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-bell"></i>
                <h2>Thông báo</h2>
              </div>
              <div className={styles.notificationHeaderActions}>
                {notificationList.length > 0 && (
                  <button
                    className={styles.notificationActionBtn}
                    onClick={handleMarkAllNotificationsRead}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              {dashboardUnreadCount > 0 && (
                <span className={styles.notificationBadge}></span>
              )}
              </div>
            </div>
            
            {isNotificationsLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang tải...</p>
              </div>
            ) : notificationList.length > 0 ? (
              <div className={styles.notificationsList}>
                {notificationList.slice(0, 5).map((notification, index) => (
                  <div 
                    key={index} 
                    className={styles.notificationItem}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleNotificationClick(index)}
                  >
                    <div 
                      className={styles.notificationIcon}
                      style={{ color: getNotificationTypeColor(notification.type) }}
                    >
                      <i className={`bi ${getNotificationIconClass(notification.type)}`}></i>
                    </div>
                    <div className={styles.notificationContent}>
                      <h5 className={styles.notificationTitle}>{notification.title}</h5>
                      <p className={styles.notificationMessage}>{formatMessageDates(notification.message)}</p>
                      <span className={styles.notificationTime}>
                        <i className="bi bi-clock"></i>
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                    {!getReadNotificationKeys().has(getNotificationKey(notification)) && (
                      <span className={styles.notificationUnreadDot}></span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-bell-slash"></i>
                </div>
                <p>Chưa có thông báo nào</p>
              </div>
            )}
          </div>

          <div className={`${styles.sectionCard} ${styles.packagesCard}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-gem"></i>
                <h2>Gói dịch vụ</h2>
              </div>
              <button
                className={styles.viewAllLink}
                onClick={() => navigate('/app/doctor/packages')}
              >
                {dashboardData?.subscription ? 'Quản lý gói' : 'Nâng cấp'}
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            {isDashboardLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
              </div>
            ) : tiersData?.currentTierId && tiersData.list.find(tier => tier.id === tiersData.currentTierId) ? (
              (() => {
                const currentTier = tiersData.list.find(tier => tier.id === tiersData.currentTierId);
                if (!currentTier) return null;

                const currentTierIndex = tiersData.list.findIndex(tier => tier.id === tiersData.currentTierId);

                const getPackageTheme = (idx: number) => {
                  if (idx < 0) return 'themeBlue'; // Default theme
                  if (idx === 0) return 'themeBlue'
                  if (idx === 1) return 'themeGreen'
                  return 'themeGold'
                }

                const themeClass = currentTierIndex !== -1 ? getPackageTheme(currentTierIndex) : 'themeBlue'

                const isActive = tiersData.currentSubscriptionActive;
                
                return (
              <div 
                className={`${styles.subscriptionInfo} ${styles[themeClass]}`}
                onClick={() => navigate('/app/doctor/packages')}
              >
                <div className={styles.subscriptionHeader}>
                  <div className={`${styles.subscriptionIcon} ${styles[`${themeClass}Icon`]}`}>
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <div className={styles.subscriptionDetails}>
                    <h4 className={`${styles.subscriptionName} ${styles[`${themeClass}Name`]}`}>
                      Gói {currentTier.name}
                    </h4>
                    <span className={`${styles.subscriptionStatus} ${isActive ? styles.statusActive : styles.statusCancelled}`}>
                      {isActive ? 'Đang hoạt động' : 'Đã hủy'}
                    </span>
                  </div>
                </div>
                <ul className={styles.featuresList}>
                  {((): string[] => {
                    try {
                      if (!currentTier.features) return [];
                      const features = JSON.parse(currentTier.features || '[]');
                      return Array.isArray(features) ? features.slice(0, 3) : [];
                    } catch {
                      return [];
                    }
                  })().map((feature, index) => (
                    <li key={index}>
                      <i className="bi bi-check-circle-fill"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
                )
              })()
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-box-seam"></i>
                </div>
                <h3>Chưa đăng ký gói</h3>
                <p>Nâng cấp để nhận nhiều quyền lợi hơn.</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`${styles.sectionCard} ${styles.quickActionsCard}`}>
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
                      <span className={modalStyles.paymentAmount}>{formatCurrencyCompact(selectedAppointment.consultationFee)}</span>
                    </div>
                    {selectedAppointment.platformFee > 0 && (
                      <>
                        <div className={modalStyles.paymentRow}>
                          <span className={modalStyles.paymentLabel}>Phí nền tảng</span>
                          <span className={modalStyles.paymentAmount}>{formatCurrencyCompact(selectedAppointment.platformFee)}</span>
                        </div>
                        <div className={modalStyles.paymentDivider}></div>
                        <div className={modalStyles.paymentRow}>
                          <span className={modalStyles.totalLabel}>Tổng cộng</span>
                          <span className={modalStyles.totalValue}>{formatCurrencyCompact(selectedAppointment.totalAmount)}</span>
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
                {selectedAppointment.statusCode !== 'CancelledByPatient' && selectedAppointment.statusCode !== 'CancelledByDoctor' && selectedAppointment.statusCode !== 'NoShow' && (
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

