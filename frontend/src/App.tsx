import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import DoctorRegister from './pages/DoctorRegister';

export function App() {

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full">
          {/* Prioritize Toaster position from develop */}
          <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000 }} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/doctor/register" element={<DoctorRegister />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}


