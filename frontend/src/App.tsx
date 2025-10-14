import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

import { AuthProvider } from './contexts/AuthContext';
import DoctorRegister from './pages/DoctorRegister';

export function App() {

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full">
          <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000 }} />
          <Routes>
            <Route path="/doctor/register" element={<DoctorRegister />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}


