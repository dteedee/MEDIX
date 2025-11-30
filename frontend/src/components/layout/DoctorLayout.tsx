import React, { useState, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';

interface SidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

const DoctorLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  const getCurrentPage = () => {
    if (location.pathname.includes('/schedule')) return 'schedule';
    if (location.pathname.includes('/appointments')) return 'appointments';
    if (location.pathname.includes('/patients')) return 'patients';
    if (location.pathname.includes('/wallet')) return 'wallet';
    if (location.pathname.includes('/packages')) return 'packages';
    if (location.pathname.includes('/feedback')) return 'feedback';
    if (location.pathname.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <DoctorSidebar currentPage={getCurrentPage()} />
        <div style={{ 
          marginLeft: sidebarOpen ? '280px' : '70px', 
          flex: 1, 
          transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh'
        }}>
          <Outlet />
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default DoctorLayout;
