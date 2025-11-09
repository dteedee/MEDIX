"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import doctorDashboardService from "../../services/doctorDashboardService"
import { appointmentService } from "../../services/appointmentService"
import styles from "../../styles/doctor/DoctorDashboard.module.css"
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
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])

  // Tách trạng thái loading cho từng phần để có trải nghiệm người dùng tốt hơn
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  // Helper to format time from "HH:mm:ss" to "HH:mm"
  const formatTime = (time: string) => time.substring(0, 5)

  const getRelativeDate = (date: Date): string => {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    if (checkDate.getTime() === today.getTime()) {
      return "Hôm nay"
    }
    if (checkDate.getTime() === tomorrow.getTime()) {
      return "Ngày mai"
    }
    return date.toLocaleDateString("vi-VN")
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
          const upcoming = allAppointments
            .filter((app) => new Date(app.appointmentStartTime) > new Date())
            .sort((a, b) => new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime())
            .slice(0, 5) // Limit to 5 upcoming appointments
            .map((app) => {
              const appDate = new Date(app.appointmentStartTime)
              return {
                id: app.id,
                patientName: app.patientName,
                appointmentTime: appDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
                appointmentDate: getRelativeDate(appDate),
                serviceType: "Khám bệnh",
              }
            })
          setUpcomingAppointments(upcoming)
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            <span className={styles.waveEmoji}>👋</span>
            Chào mừng trở lại, <strong>{user?.fullName || "Bác sĩ"}</strong>!
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {dashboardError ? (
        <div className={`${styles.card} ${styles.errorCard}`}>{dashboardError}</div>
      ) : (
        <div className={styles.statsGrid}>
          {dashboardData ? (
            <>
              <div className={`${styles.statCard} ${styles.statCard1}`}>
                <div className={styles.statIcon}>
                  <i className="bi bi-cash-coin"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Doanh thu hôm nay</div>
                  <div className={styles.statValue}>{formatCurrency(dashboardData.summary.todayRevenue)}</div>
                </div>
                <div className={styles.statBg}>
                  <i className="bi bi-cash-coin"></i>
                </div>
              </div>

              <div className={`${styles.statCard} ${styles.statCard2}`}>
                <div className={styles.statIcon}>
                  <i className="bi bi-wallet2"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Doanh thu tháng</div>
                  <div className={styles.statValue}>{formatCurrency(dashboardData.summary.monthRevenue)}</div>
                </div>
                <div className={styles.statBg}>
                  <i className="bi bi-wallet2"></i>
                </div>
              </div>

              <div className={`${styles.statCard} ${styles.statCard5}`}>
                <div className={styles.statIcon}>
                  <i className="bi bi-gem"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Tổng doanh thu</div>
                  <div className={styles.statValue}>{formatCurrency(dashboardData.summary.totalRevenue)}</div>
                </div>
                <div className={styles.statBg}>
                  <i className="bi bi-gem"></i>
                </div>
              </div>

              <div className={`${styles.statCard} ${styles.statCard3}`}>
                <div className={styles.statIcon}>
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Lịch hẹn hôm nay</div>
                  <div className={styles.statValue}>{dashboardData.summary.todayAppointments}</div>
                </div>
                <div className={styles.statBg}>
                  <i className="bi bi-calendar-check"></i>
                </div>
              </div>

              {dashboardData.wallet && (
                <div className={`${styles.statCard} ${styles.statCard6}`}>
                  <div className={styles.statIcon}>
                    <i className="bi bi-wallet-fill"></i>
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Số dư ví</div>
                    <div className={styles.statValue}>{formatCurrency(dashboardData.wallet.balance)}</div>
                  </div>
                  <div className={styles.statBg}>
                    <i className="bi bi-wallet-fill"></i>
                  </div>
                </div>
              )}

              <div className={`${styles.statCard} ${styles.statCard4}`}>
                <div className={styles.statIcon}>
                  <i className="bi bi-star-half"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Đánh giá TB</div>
                  <div className={styles.statValue}>{dashboardData.summary.averageRating.toFixed(1)}</div>
                </div>
                <div className={styles.statBg}>
                  <i className="bi bi-star-half"></i>
                </div>
              </div>
            </>
          ) : (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`${styles.statCard} ${styles.loadingCard}`}>
                <div className={styles.skeleton} style={{ width: "80%", height: "20px" }}></div>
                <div className={styles.skeleton} style={{ width: "50%", height: "24px", marginTop: "8px" }}></div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Upcoming Appointments */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-calendar-check"></i>
            </div>
            <h3 className={styles.cardTitle}>Lịch hẹn sắp tới</h3>
            <Link to="/app/doctor/appointments" className={styles.viewAllBtn}>
              Xem tất cả
            </Link>
          </div>
          <div className={styles.appointmentsList}>
            {appointmentsError ? (
              <div className={styles.emptyList}>
                <i className="bi bi-exclamation-circle-fill"></i>
                <p>{appointmentsError}</p>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <Link
                  to={`/app/doctor/medical-records/${appointment.id}`}
                  key={appointment.id}
                  className={styles.appointmentItem}
                >
                  <div className={styles.patientInfo}>
                    <div className={styles.patientAvatar}>
                      <img
                        src={
                          appointment.patientAvatar ||
                          `https://ui-avatars.com/api/?name=${appointment.patientName.replace(/\s/g, "+")}&background=667eea&color=fff`
                        }
                        alt={appointment.patientName}
                      />
                    </div>
                    <div className={styles.patientDetails}>
                      <div className={styles.patientName}>{appointment.patientName}</div>
                      <div className={styles.serviceType}>{appointment.serviceType}</div>
                    </div>
                  </div>
                  <div className={styles.appointmentTime}>
                    <div className={styles.timeText}>{appointment.appointmentTime}</div>
                    <div className={styles.dateText}>{appointment.appointmentDate}</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyList}>
                <i className="bi bi-calendar-x-fill"></i>
                <p>Không có lịch hẹn nào sắp tới.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className={`${styles.card} ${styles.recentReviewsCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-chat-quote-fill"></i>
            </div>
            <h3 className={styles.cardTitle}>Đánh giá gần đây</h3>
            <Link to="/app/doctor/feedback" className={styles.viewAllBtn}>
              Xem tất cả <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          <div className={styles.reviewsList}>
            {dashboardData && dashboardData.reviews.recent.length > 0 ? (
              dashboardData.reviews.recent.map((review, index) => (
                <div key={index} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.patientInfo}>
                      <div className={styles.patientAvatar}>
                        <i className="bi bi-person-fill"></i>
                      </div>
                      <span className={styles.patientName}>{review.patientName}</span>
                    </div>
                    <div className={styles.reviewMeta}>
                      <div className={styles.stars}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star-fill ${i < review.rating ? styles.starFilled : styles.starEmpty}`}
                          ></i>
                        ))}
                      </div>
                      <span className={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  <div className={styles.reviewBody}>
                    <p className={styles.comment}>{review.comment || "Bệnh nhân không để lại bình luận."}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyList}>
                <i className="bi bi-chat-dots-fill"></i>
                <p>Chưa có đánh giá nào.</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className={`${styles.card} ${styles.todayScheduleCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Lịch làm việc hôm nay</h3>
            <Link to="/app/doctor/schedule" className={styles.viewAllBtn}>
              Quản lý
            </Link>
          </div>
          <div className={styles.scheduleList}>
            {todaySchedule.length > 0 ? (
              todaySchedule.map((slot, index) => {
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
                  <div key={index} className={styles.scheduleItem}>
                    <span className={styles.scheduleTime}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                    <span className={`${styles.scheduleStatus} ${statusClass}`}>{statusText}</span>
                    {slot.type === "override" && slot.reason && (
                      <span className={styles.scheduleReason}>({slot.reason})</span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className={styles.emptyList}>
                <i className="bi bi-calendar-x-fill"></i>
                <p>Không có lịch làm việc nào hôm nay.</p>
              </div>
            )}
          </div>
        </div>

        {/* Other Info Cards */}
        <div className={styles.otherInfoGrid}>
          {!isDashboardLoading && dashboardData?.subscription && (
            <div className={`${styles.card} ${styles.infoCard}`}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Gói dịch vụ</h3>
              </div>
              <div className={styles.infoCardContent}>
                <div className={`${styles.infoBadge} ${styles.subscriptionBadge}`}>
                  {dashboardData.subscription.name}
                </div>
                <p className={styles.infoText}>Phí: {formatCurrency(dashboardData.subscription.monthlyFee)}/tháng</p>
                <Link to="/app/doctor/packages" className={styles.infoLink}>
                  Nâng cấp
                </Link>
              </div>
            </div>
          )}
          {!isDashboardLoading && dashboardData?.salary && (
            <div className={`${styles.card} ${styles.infoCard}`}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Lương gần nhất</h3>
              </div>
              <div className={styles.infoCardContent}>
                <div
                  className={`${styles.infoBadge} ${dashboardData.salary.status === "Paid" ? styles.salaryPaid : styles.salaryPending}`}
                >
                  {dashboardData.salary.status}
                </div>
                <p className={styles.infoText}>{formatCurrency(dashboardData.salary.netSalary)}</p>
                <span className={styles.infoSubtext}>
                  Kỳ: {new Date(dashboardData.salary.periodStartDate).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(dashboardData.salary.periodEndDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={`${styles.card} ${styles.quickActionsCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thao tác nhanh</h3>
          </div>
          <div className={styles.quickActionsGrid}>
            <Link to="/app/doctor/appointments" className={styles.actionItem}>
              <i className="bi bi-calendar-week"></i>
              <span>Lịch hẹn</span>
            </Link>
            <Link to="/app/doctor/patients" className={styles.actionItem}>
              <i className="bi bi-people"></i>
              <span>Bệnh nhân</span>
            </Link>
            <Link to="/app/doctor/wallet" className={styles.actionItem}>
              <i className="bi bi-wallet"></i>
              <span>Doanh thu</span>
            </Link>
            <Link to="/app/doctor/profile" className={styles.actionItem}>
              <i className="bi bi-person-circle"></i>
              <span>Hồ sơ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
