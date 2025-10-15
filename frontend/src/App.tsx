import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';

export function App() {

  return (
    <Router>
      <div className="min-h-screen w-full">
        {/* Prioritize Toaster position from develop */}
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  )
}


