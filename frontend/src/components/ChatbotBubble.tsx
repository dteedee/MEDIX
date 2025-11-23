import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/components/ChatbotBubble.module.css';

const ChatbotBubble: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Không hiển thị ở trang AI chẩn đoán
  if (location.pathname.includes('/ai-chat')) {
    return null;
  }

  const handleClick = () => {
    // Navigate to AI chat page
    // ProtectedRoute sẽ tự động redirect đến login nếu chưa đăng nhập
    navigate('/app/ai-chat');
  };

  return (
    <div className={styles.chatbotBubble} onClick={handleClick} title="Tư vấn AI sức khỏe">
      <img src="/images/medix-logo-mirrored.jpg" alt="AI Chatbot" />
      <div className={styles.statusIndicator}></div>
    </div>
  );
};

export default ChatbotBubble;

