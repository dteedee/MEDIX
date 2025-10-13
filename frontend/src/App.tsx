import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header, Footer } from './components'
import { RegistrationPage  } from './pages'

import './App.css'

export function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/register" element={<RegistrationPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}


