import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from '../components/ui/Toast.module.css';

// Định nghĩa kiểu dữ liệu cho một toast
interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Định nghĩa kiểu cho context
interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

// Tạo Context với giá trị mặc định
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook tùy chỉnh để sử dụng toast context dễ dàng hơn
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ToastProvider component
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now();
    const newToast: ToastMessage = { id, message, type };
    setToasts(prevToasts => [...prevToasts, newToast]);

    // Tự động xóa toast sau 5 giây
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;