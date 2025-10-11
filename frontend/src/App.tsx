import React from 'react'
import { Header, Footer } from './components'
import { RegistrationPage } from './pages'
import './App.css'

export function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <RegistrationPage />
      </main>
      <Footer />
    </div>
  )
}


