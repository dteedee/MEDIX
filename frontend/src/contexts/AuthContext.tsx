import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    useEffect(() => {
    }, []);

    return (
        <AuthContext.Provider value={{}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};