import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default AuthLayout;


