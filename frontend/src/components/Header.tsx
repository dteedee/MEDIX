import React from 'react';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1 className="logo-text">MEDIX</h1>
          <p className="logo-subtitle">HỆ THỐNG Y TẾ THÔNG MINH ỨNG DỤNG AI</p>
        </div>
        
        <div className="header-center">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Chuyên khoa, Triệu chứng, Tên bác sĩ"
              className="search-input"
            />
            <button className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="header-actions">
          <button className="login-btn">Đăng Nhập</button>
          <button className="register-btn">Đăng Ký</button>
        </div>
      </div>
    </header>
  );
}