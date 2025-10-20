import styles from '../../styles/header.module.css'
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
        </header>
    );
};