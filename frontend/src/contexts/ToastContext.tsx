import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

  // --- CSS Styles cho Toast ---
  const toastContainerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const getToastStyle = (type: ToastMessage['type']): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '24px 32px',
      borderRadius: '12px',
      color: '#fff',
      fontSize: '18px',
      fontWeight: '500',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minWidth: '600px',
      maxWidth: '800px',
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#28a745' }; // Xanh lá
      case 'error':
        return { ...baseStyle, backgroundColor: '#dc3545' }; // Đỏ
      case 'warning':
        return { ...baseStyle, backgroundColor: '#ffc107', color: '#212529' }; // Vàng
      case 'info':
      default:
        return { ...baseStyle, backgroundColor: '#28a745' }; // Xanh dương
    }
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    fontSize: '36px',
    marginLeft: '30px',
    cursor: 'pointer',
    lineHeight: 1,
    fontWeight: 'bold',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Phần hiển thị các toast */}
      <div style={toastContainerStyle}>
        {toasts.map(toast => (
          <div key={toast.id} style={getToastStyle(toast.type)}>
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} style={closeButtonStyle}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;