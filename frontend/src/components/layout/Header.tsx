import styles from '../../styles/header.module.css'
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { NotificationMetadata } from '../../types/notification.types';
import NotificationService from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Header: React.FC = () => {
    const [notificationMetadata, setNotificationMetadata] = useState<NotificationMetadata>();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const data = await NotificationService.getMetadata();
                setNotificationMetadata(data);
                console.log(data);
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            }
        }
        fetchMetadata();
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
                return 'bi-info-circle'; // fallback icon
        }
    };

    return (
        <header>
            <div className={styles["top-bar"]}>
                <div className={styles["logo"]}>
                    <a href='/' className={styles["logo"]}>
                        MEDIX
                        <small style={{ textTransform: 'uppercase' }}>Hệ thống y tế thông minh ứng dụng AI</small>
                    </a>
                </div>
                <div className={styles["search-bar"]}>
                    <input type="text" placeholder="Chuyên khoa, triệu chứng, tên bác sĩ..." />
                    <button>🔍</button>
                </div>
                <div className={styles["header-links"]}>
                    {user ? (
                        <>
                            <div>
                                <a href={user.role === "Doctor" ? "/doctor/profile/edit" : "/patient/profile"}>
                                    <img
                                        src={user.avatarUrl}
                                        alt="User avatar"
                                        className="rounded-circle dropdown-toggle"
                                        // data-bs-toggle="dropdown"
                                        // aria-expanded="false"
                                        style={{ width: '40px', height: '40px', cursor: 'pointer' }} />
                                </a>
                                {/* <ul className="dropdown-menu dropdown-menu-start">
                                    <li>
                                        <button className="dropdown-item">
                                            {user.avatarUrl}
                                        </button>
                                    </li>
                                </ul> */}
                            </div>
                            <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
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
                                        }}
                                    ></span>
                                )}

                                <ul className="dropdown-menu dropdown-menu-start" style={{
                                    maxHeight: '500px', // 🔧 Short height for testing
                                    overflowY: 'auto', width: '400px'
                                }}>
                                    <li><h6 className="dropdown-header">Thông báo</h6></li>
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
                                                            locale: vi,
                                                        })}
                                                    </div>
                                                </div>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button className={styles['header-link']}
                                onClick={async () => {
                                    await logout();
                                    navigate('/login');
                                }}>
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <a className={styles['header-link']} href="/login">Đăng nhập</a>
                            <a className={styles['header-link']} href="#" data-bs-toggle="dropdown" aria-expanded="false">Đăng ký</a>
                            <ul className="dropdown-menu">
                                <li><a className="dropdown-item" href="/patient-register">Đăng ký bệnh nhân</a></li>
                                <li><a className="dropdown-item" href="/doctor/register">Đăng ký bác sĩ</a></li>
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </header >
    );
};