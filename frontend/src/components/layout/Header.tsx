import styles from '../../styles/public/header.module.css'
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiClient } from '../../lib/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { NotificationMetadata } from '../../types/notification.types';
import NotificationService from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { LanguageSwitcher } from '../LanguageSwitcher';

export const Header: React.FC = () => {
    const [notificationMetadata, setNotificationMetadata] = useState<NotificationMetadata>();
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
                setNotificationMetadata(data);
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
                            <div className="dropdown" style={{ position: 'relative', display: 'inline-block', zIndex: 10001 }}>
                                <i
                                    className="bi bi-bell-fill fs-4"
                                    style={{ cursor: 'pointer' }}
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false">
                                </i>

                                {!notificationMetadata?.isAllRead && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: 'red',
                                            borderRadius: '50%',
                                            zIndex: 10002,
                                        }}
                                    ></span>
                                )}

                                <ul className="dropdown-menu dropdown-menu-start" style={{
                                    maxHeight: '500px',
                                    overflowY: 'auto', 
                                    width: '400px',
                                    zIndex: 10000,
                                    position: 'absolute',
                                }}>
                                    <li><h6 className="dropdown-header">{t('header.notifications')}</h6></li>
                                    {notificationMetadata?.notifications.map((notification) => (
                                        <li>
                                            <a className="dropdown-item" href="#" style={{ whiteSpace: 'normal' }}>
                                                <div>
                                                    <strong><i className={`bi ${getNotificationIconClass(notification.type)} me-2`}></i>
                                                        {notification.title}</strong>
                                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginTop: '2px' }}>
                                                        {notification.message}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                                            addSuffix: true,
                                                            locale: language === 'vi' ? vi : enUS,
                                                        })}
                                                    </div>
                                                </div>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
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