import { useEffect, useState } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import AdminDashboard from './pages/admin/AdminDashboard'
import BannerList from './pages/manager/BannerList'
import UserList from './pages/manager/UserList'
import ArticleList from './pages/manager/ArticleList'
import CategoryList from './pages/manager/CategoryList'
import CmsPageList from './pages/manager/CmsPageList'
import {Header} from "./components/layout/Header";
import Sidebar from './components/layout/Sidebar'



export function App() {
  const [message, setMessage] = useState<string>('Loading...')
  useEffect(() => {
    axios.get('/api/hello')
      .then(r => setMessage(r.data.message ?? 'No message'))
      .catch((err) => {
        // show detailed message for easier debugging in dev
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr: any = err
        if (anyErr?.response) {
          setMessage(`API error: ${anyErr.response.status} ${anyErr.response.statusText}`)
          console.debug('App: /api/hello response', anyErr.response)
        } else {
          setMessage('API not available yet')
          console.debug('App: /api/hello error', anyErr)
        }
      })
  }, [])

  return (
    <BrowserRouter>
    <Header/>
      <div style={{ display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 24 }}>
          <h1>Medix</h1>
          <p>{message}</p>
          {/* <nav style={{ marginBottom: 12 }}>
            <Link to="/">Home</Link> | <Link to="/admin">Admin</Link> | <Link to="/admin/banners">Banners</Link> | <Link to="/admin/users">Users</Link> | <Link to="/admin/articles">Articles</Link>
           <Link to="/admin/categories">Categories</Link> | <Link to="/admin/cms-pages">CMS Pages</Link>
          </nav> */}
          <Routes>
            <Route path="/" element={<div>Welcome to Medix</div>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/manager/banners" element={<BannerList />} />
            <Route path="/manager/users" element={<UserList />} />
            <Route path="/manager/articles" element={<ArticleList />} />
            <Route path="/manager/categories" element={<CategoryList />} />
            <Route path="/manager/cms-pages" element={<CmsPageList />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}


