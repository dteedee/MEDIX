import { useEffect, useState } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import AdminDashboard from './pages/admin/AdminDashboard'
import BannerList from './pages/manager/BannerList'
import UserList from './pages/admin/UserList'
import ArticleList from './pages/manager/ArticleList'
import CategoryList from './pages/manager/CategoryList'
import CmsPageList from './pages/manager/CmsPageList'
import ArticleEditPage from './pages/manager/ArticleEditPage'
import CategoryEditPage from './pages/manager/CategoryEditPage'
import UserEditPage from './pages/admin/UserEditPage'
import BannerEditPage from './pages/manager/BannerEditPage'
import CmsPageEditPage from './pages/manager/CmsPageEditPage'
import {Header} from "./components/layout/Header";
import ArticleReaderPage from './pages/patient/ArticleReaderPage'
import { ToastProvider } from './contexts/ToastContext'
import ArticleDetailPage from './pages/patient/ArticleDetailPage'
import Footer from "./components/layout/Footer";
import Sidebar from './components/layout/Sidebar'



export function App() {
  
  useEffect(() => {
  
  }, [])

  return (
    <ToastProvider>
      <BrowserRouter>
      <Header/>
        <div style={{ display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: 24 }}>
            {/* <nav style={{ marginBottom: 12 }}>
              <Link to="/">Home</Link> | <Link to="/admin">Admin</Link> | <Link to="/admin/banners">Banners</Link> | <Link to="/admin/users">Users</Link> | <Link to="/admin/articles">Articles</Link>
             <Link to="/admin/categories">Categories</Link> | <Link to="/admin/cms-pages">CMS Pages</Link>
            </nav> */}
            <Routes>
              <Route path="/" element={<ArticleReaderPage />} />
              <Route path="/articles" element={<ArticleReaderPage />} />
              <Route path="/articles/:slug" element={<ArticleDetailPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/manager/banners" element={<BannerList />} />
              <Route path="/admin/users" element={<UserList />} />
              <Route path="/manager/articles" element={<ArticleList />} />
              <Route path="/manager/articles/new" element={<ArticleEditPage />} />
              <Route path="/manager/articles/edit/:id" element={<ArticleEditPage />} />
              <Route path="/manager/banners/new" element={<BannerEditPage />} />
              <Route path="/manager/banners/edit/:id" element={<BannerEditPage />} />
              <Route path="/manager/categories" element={<CategoryList />} />
              <Route path="/manager/categories/new" element={<CategoryEditPage />} />
              <Route path="/manager/categories/edit/:id" element={<CategoryEditPage />} />
              <Route path="/manager/cms-pages" element={<CmsPageList />} />
              <Route path="/manager/cms-pages/new" element={<CmsPageEditPage />} />
              <Route path="/manager/cms-pages/edit/:id" element={<CmsPageEditPage />} />
              <Route path="/admin/users/new" element={<UserEditPage />} />
              <Route path="/admin/users/edit/:id" element={<UserEditPage />} />
            </Routes>
          </main>
        </div>
        <Footer/>
      </BrowserRouter>
    </ToastProvider>
  )
}
