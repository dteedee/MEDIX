import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from '../styles/components/ChatbotBubble.module.css';
import AIChatBox from './AIChatBox';

const ChatbotBubble: React.FC = () => {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (location.pathname.includes('/ai-chat')) {
    return null;
  }

  const handleClick = () => {
    setIsChatOpen(true);
  };

  return (
    <>
      <div 
        className={`${styles.chatbotBubble} ${isChatOpen ? styles.active : ''}`} 
        onClick={handleClick} 
        title="Hỏi MEDIX AI"
      >
        <img src="/images/medix-logo-mirrored.jpg" alt="AI Chatbot" />
        <div className={styles.statusIndicator}></div>
      </div>
      <AIChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default ChatbotBubble;

