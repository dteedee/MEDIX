import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  const [openCMS, setOpenCMS] = useState(false)

  const toggleCMS = () => {
    setOpenCMS(!openCMS)
  }

  return (
    <aside className="medix-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo-box"> </div>
        <div className="sidebar-logo-text">MEDIX</div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/admin" className="sidebar-link">Dashboard</Link>
        <Link to="#" className="sidebar-link">Báo cáo & Thống kê</Link>

        {/* Click để ẩn/hiện submenu */}
        <div
          className="sidebar-section"
          onClick={toggleCMS}
          style={{ cursor: 'pointer' }}
        >
          Nội dung - CMS {openCMS ? '▲' : '▼'}
        </div>

        {openCMS && (
          <>
            <Link to="/manager/articles" className="sidebar-link sub">Quản lý Bài viết</Link>
            <Link to="/manager/banners" className="sidebar-link sub">Quản lý Banner</Link>
            <Link to="/articles" className="sidebar-link sub" target="_blank">Xem trang bài viết</Link>
          </>
        )}
 

        <Link to="/admin/users" className="sidebar-link">Quản lý Người dùng</Link>
        <Link to="/manager/categories" className="sidebar-link">Quản lý Danh mục</Link>
        <Link to="/manager/cms-pages" className="sidebar-link">Quản lý CMSpage</Link>
        <Link to="#" className="sidebar-link">Quản lý Phản hồi</Link>
      </nav>
    </aside>
  )
}
