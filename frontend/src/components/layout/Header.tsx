import styles from '../../styles/public/header.module.css'
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiClient } from '../../lib/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { NotificationDto, NotificationMetadata } from '../../types/notification.types';
import NotificationService from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { LanguageSwitcher } from '../LanguageSwitcher';

const HEADER_HIDDEN_NOTIFICATIONS_KEY = 'medix_header_hidden_notifications_v1'

const getNotificationKey = (notification: NotificationDto) =>
    `${notification.title}-${notification.message}-${notification.createdAt}-${notification.type}`

const getHiddenNotificationKeys = (): Set<string> => {
    if (typeof window === 'undefined') return new Set()
    try {
        const raw = localStorage.getItem(HEADER_HIDDEN_NOTIFICATIONS_KEY)
        if (!raw) return new Set()
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return new Set()
        return new Set(parsed as string[])
    } catch {
        return new Set()
    }
}

const addHiddenNotificationKeys = (keys: string[]) => {
    if (typeof window === 'undefined' || !keys.length) return
    try {
        const existing = getHiddenNotificationKeys()
        keys.forEach(key => existing.add(key))
        localStorage.setItem(HEADER_HIDDEN_NOTIFICATIONS_KEY, JSON.stringify(Array.from(existing)))
    } catch {
    }
}

const formatMessageDates = (message?: string): string => {
    if (!message) return ''
    const dateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g
    return message.replace(dateRegex, (_, month, day, year) => {
        const parsedDay = String(Number(day)).padStart(2, '0')
        const parsedMonth = String(Number(month)).padStart(2, '0')
        return `${parsedDay}/${parsedMonth}/${year}`
    })
}

const getNotificationTypeLabel = (type: string) => {
    switch (type) {
        case 'Appointment':
            return 'Lịch hẹn'
        case 'Payment':
            return 'Thanh toán'
        case 'System':
            return 'Hệ thống'
        case 'Reminder':
            return 'Nhắc nhở'
        case 'Marketing':
            return 'Khuyến mãi'
        default:
            return 'Thông báo'
    }
}

export const Header: React.FC = () => {
    const [notificationMetadata, setNotificationMetadata] = useState<NotificationMetadata>();
    const [notifications, setNotifications] = useState<NotificationDto[]>([])
    const [siteName, setSiteName] = useState('MEDIX');
    const [siteDescription, setSiteDescription] = useState('Hệ thống y tế thông minh ứng dụng AI');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const { user, logout } = useAuth();
    const { language, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        if (!user) {
            return;
        }
        
        const fetchMetadata = async () => {
            try {
                const data = await NotificationService.getMetadata();
                const hidden = getHiddenNotificationKeys()
                const filtered = (data.notifications || []).filter(
                    (notification) => !hidden.has(getNotificationKey(notification))
                )

                setNotifications(filtered)
                setNotificationMetadata({
                    ...data,
                    isAllRead: filtered.length === 0
                })
            } catch (error) {
                
            }
        }
        fetchMetadata();
    }, [user?.id]);

    useEffect(() => {
        const fetchSiteSettings = async () => {
            setLoadingSettings(true);
            try {
                const [nameRes, descRes] = await Promise.all([
                    apiClient.get('/SystemConfiguration/SiteName').catch(() => ({ data: { configValue: 'MEDIX' } })),
                    apiClient.get('/SystemConfiguration/SystemDescription').catch(() => ({ data: { configValue: 'Hệ thống y tế thông minh ứng dụng AI' } }))
                ]);
                setSiteName(nameRes.data.configValue);
                setSiteDescription(descRes.data.configValue);
            } catch (error) {
               
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSiteSettings();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getNotificationIconClass = (type: string): string => {
        switch (type) {
            case 'Appointment':
                return 'bi-calendar-event';
            case 'Payment':
                return 'bi-credit-card';
            case 'System':
                return 'bi-gear';
            case 'Reminder':
                return 'bi-alarm';
            case 'Marketing':
                return 'bi-megaphone';
            default:
                return 'bi-info-circle'; 
        }
    };

    const handleUserDropdownToggle = () => {
        setShowUserDropdown(!showUserDropdown);
    };

    const handleNotificationDismiss = (index: number) => {
        setNotifications((prev) => {
            const target = prev[index]
            if (target) addHiddenNotificationKeys([getNotificationKey(target)])
            const next = prev.filter((_, i) => i !== index)
            setNotificationMetadata((prevMeta) =>
                prevMeta ? { ...prevMeta, isAllRead: next.length === 0 } : prevMeta
            )
            return next
        })
    }

    const handleMarkAllNotificationsRead = () => {
        addHiddenNotificationKeys(notifications.map(getNotificationKey))
        setNotifications([])
        setNotificationMetadata((prevMeta) => prevMeta ? { ...prevMeta, isAllRead: true } : prevMeta)
    }

    const handleLogout = async () => {
        setShowUserDropdown(false);
        await logout();
        navigate('/login');
    };

    const handleProfileClick = () => {
        setShowUserDropdown(false);
        if (user?.role === "Admin") {
            navigate('/app/admin/profile');
        } else if (user?.role === "Manager") {
            navigate('/app/manager/profile');
        } else if (user?.role === "Doctor") {
            navigate('/app/doctor/profile/edit');
        } else {
            navigate('/app/patient/profile');
        }
    };

    const handleDashboardClick = () => {
        setShowUserDropdown(false);
        if (user?.role === "Admin") {
            navigate('/app/admin/dashboard');
        } else if (user?.role === "Manager") {
            navigate('/app/manager/dashboard');
        } else if (user?.role === "Doctor") {
            navigate('/app/doctor/dashboard');
        } else {
            navigate('/app/patient');
        }
    };

    return (
        <header>
            <div className={styles["top-bar"]}>
                <div className={styles["logo"]}>
                    <a href='/' className={styles["logo"]}>
                        {loadingSettings ? '...' : siteName}
                        <small style={{ textTransform: 'uppercase' }}>{loadingSettings ? '...' : siteDescription}</small>
                    </a>
                </div>
                {!isHomePage && (
                    <div className={styles["search-bar"]}>
                        <input type="text" placeholder={t('header.search.placeholder')} />
                        <button>🔍</button>
                    </div>
                )}
                <div className={styles["header-links"]}>
                    {user ? (
                        <>
                            {!isHomePage && (
                                <div className={styles['language-selector']}>
                                    <LanguageSwitcher />
                                </div>
                            )}

                            {/* Notifications */}
                            <div className={styles['notification-wrapper']}>
                                <button
                                    className={`${styles['notification-toggle']} ${!notificationMetadata?.isAllRead ? styles['notification-toggle-unread'] : ''}`}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <span className={styles['notification-ripple']}></span>
                                    <i className="bi bi-bell-fill"></i>
                                    {!notificationMetadata?.isAllRead && (
                                        <span className={styles['notification-dot']}>
                                            {notifications.length > 9 ? '9+' : notifications.length}
                                        </span>
                                    )}
                                </button>

                                <div className={`${styles['notification-dropdown']} dropdown-menu dropdown-menu-start`}>
                                    <div className={styles['notification-header']}>
                                        <div className={styles['notification-title-block']}>
                                            <span>{t('header.notifications')}</span>
                                            <small>{notifications.length} mới</small>
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                className={styles['mark-all-btn']}
                                                onClick={handleMarkAllNotificationsRead}
                                            >
                                                Đánh dấu tất cả đã đọc
                                            </button>
                                        )}
                                    </div>
                                    <div className={styles['notification-list']}>
                                        {notifications.length > 0 ? (
                                            notifications.map((notification, index) => (
                                                <button
                                                    key={`${notification.createdAt}-${index}`}
                                                    className={styles['notification-card']}
                                                    onClick={() => handleNotificationDismiss(index)}
                                                >
                                                    <div
                                                        className={styles['notification-card-icon']}
                                                    >
                                                        <i className={`bi ${getNotificationIconClass(notification.type)}`}></i>
                                                    </div>
                                                    <div className={styles['notification-card-body']}>
                                                        <div className={styles['notification-card-title']}>
                                                            {notification.title}
                                                        </div>
                                                        <div className={styles['notification-card-message']}>
                                                            {formatMessageDates(notification.message)}
                                                        </div>
                                                        <div className={styles['notification-card-meta']}>
                                                            <span className={styles['notification-card-pill']}>
                                                                {getNotificationTypeLabel(notification.type)}
                                                            </span>
                                                            <span className={styles['notification-card-time']}>
                                                                {formatDistanceToNow(new Date(notification.createdAt), {
                                                                    addSuffix: true,
                                                                    locale: language === 'vi' ? vi : enUS,
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className={styles['notification-empty']}>
                                                <i className="bi bi-inboxes"></i>
                                                <p>Không còn thông báo nào</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles["user-dropdown"]} ref={userDropdownRef}>
                                <div 
                                    className={styles["user-avatar-container"]}
                                    onClick={handleUserDropdownToggle}
                                >
                                    <img
                                        key={user.avatarUrl || 'avatar'} 
                                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email || 'User')}&background=667eea&color=fff`}
                                        alt="User avatar"
                                        className={styles["user-avatar"]}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email || 'User')}&background=667eea&color=fff`;
                                        }}
                                    />
                                    <div className={styles["user-info"]}>
                                        <div className={styles["user-name"]}>{user.fullName || 'Người dùng'}</div>
                                        <div className={styles["user-role"]}>
                                            {user.role === "Doctor" ? "Bác sĩ" : 
                                             user.role === "Admin" ? "Quản trị viên" :
                                             user.role === "Manager" ? "Quản lý" :
                                             user.role === "Patient" ? "Bệnh nhân" : "Người dùng"}
                                        </div>
                                    </div>
                                    <i className={`bi bi-chevron-${showUserDropdown ? 'up' : 'down'} ${styles["dropdown-icon"]}`}></i>
                                </div>
                                
                                {showUserDropdown && (
                                    <div className={styles["user-dropdown-menu"]}>
                                        <button className={styles["dropdown-item"]} onClick={handleDashboardClick}>
                                            <i className="bi bi-speedometer2"></i>
                                            <span>Dashboard</span>
                                        </button>
                                        <button className={styles["dropdown-item"]} onClick={handleProfileClick}>
                                            <i className="bi bi-person"></i>
                                            <span>Xem tài khoản</span>
                                        </button>
                                        <div className={styles["dropdown-divider"]}></div>
                                        <button className={styles["dropdown-item"]} onClick={handleLogout}>
                                            <i className="bi bi-box-arrow-right"></i>
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles["auth-buttons"]}>
                                <a href="/login" className={styles["btn-login"]}>
                                    {t('header.login')}
                                </a>
                                <div className="dropdown">
                                    <a href="#" className={styles["btn-register"]} data-bs-toggle="dropdown" aria-expanded="false">
                                        {t('header.register')}
                                    </a>
                                    <ul className={`dropdown-menu ${styles["register-dropdown"]}`}>
                                        <li><a className="dropdown-item" href="/patient-register">{t('header.register.patient')}</a></li>
                                        <li><a className="dropdown-item" href="/doctor/register">{t('header.register.doctor')}</a></li>
                                    </ul>
                                </div>
                            </div>
                            
                            {!isHomePage && (
                                <div className={styles['language-selector']}>
                                    <LanguageSwitcher />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header >
    );
};