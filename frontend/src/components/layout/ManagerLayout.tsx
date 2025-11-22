import React, { useState, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ManagerSidebar from './ManagerSidebar';

// Create context for sidebar state
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

const ManagerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // Determine current page based on pathname
  const getCurrentPage = () => {
    if (location.pathname.includes('/doctors')) return 'doctors';
    if (location.pathname.includes('/reports')) return 'reports';
    if (location.pathname.includes('/articles')) return 'articles';
    if (location.pathname.includes('/banners')) return 'banners';
    if (location.pathname.includes('/packages')) return 'packages';
    if (location.pathname.includes('/commissions')) return 'commissions';
    if (location.pathname.includes('/promotions')) return 'promotions';
    if (location.pathname.includes('/feedback')) return 'feedback';
    return 'dashboard';
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <ManagerSidebar currentPage={getCurrentPage()} />
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

export default ManagerLayout;
