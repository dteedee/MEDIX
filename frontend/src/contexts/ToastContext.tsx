import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from '../components/ui/toast';

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

    // Thời gian hiển thị khác nhau theo loại toast
    const getToastDuration = (toastType: ToastMessage['type']) => {
      switch (toastType) {
        case 'info': // Trạng thái "đang"
          return 1500; // 0.5 giây
        case 'success': // Thành công
        case 'error': // Thất bại
        case 'warning': // Cảnh báo
        default:
          return 3000; // 2 giây
      }
    };

    const duration = getToastDuration(type);
    
    // Tự động xóa toast sau thời gian tương ứng
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, duration);
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