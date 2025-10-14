import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header, Footer } from './components'
import { RegistrationPage  } from './pages'
import { AdminDashboard } from './pages/AdminDashboard'
import { PatientDashboard } from './pages/PatientDashboard'
import { DoctorDashboard } from './pages/DoctorDashboard'
import { ManagerDashboard } from './pages/ManageDashboard'

import './App.css'

export function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/manager" element={<ManagerDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}


