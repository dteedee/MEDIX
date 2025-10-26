import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import Footer from './Footer';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

export default PublicLayout;
