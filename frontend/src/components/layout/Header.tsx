import { useState } from 'react';
import '../../styles/header.css'

const Header = () => {
    const token = null;
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleDropdown = () => setShowDropdown((prev) => !prev);
    const handleLogout = () => {
        // Your logout logic here
        console.log("Logging out...");
    };


    return (
        <header>
            <div className="top-bar">
                <div className="logo">
                    <a href='/' className="logo">
                        MEDIX
                        <small style={{ textTransform: 'uppercase' }}>Hệ thống y tế thông minh ứng dụng AI</small>
                    </a>
                </div>
                <div className="search-bar">
                    <input type="text" placeholder="Chuyên khoa, triệu chứng, tên bác sĩ..." />
                    <button>🔍</button>
                </div>
                <div className="header-links">
                    {token ? (
                        <div className="dropdown">
                            <img
                                src="https://pbs.twimg.com/profile_images/1937117284725661696/8ppkq53g_400x400.jpg" // Replace with actual avatar URL
                                alt="User avatar"
                                className="rounded-circle dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                            />
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button className="dropdown-item" onClick={handleLogout}>
                                        Đăng xuất
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <>
                            <a href="#">Đăng nhập</a>
                            <a href="#">Đăng ký</a>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;