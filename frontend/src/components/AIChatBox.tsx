import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/AIChatBox.module.css';
import aiChatService, { AIChatMessageDto, PromptRequest } from '../services/aiChatService';
import { AIChatMessage, RecommanededDoctorDto, RecommendedArticleDto, SymptomAnalysisResponse } from '../types/aiChat';
import { useAuth } from '../contexts/AuthContext';

interface AIChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const createGreetingMessage = (): AIChatMessage => ({
  id: 'medix-greeting',
  text: 'Xin chào! Tôi là Medix!',
  sender: 'ai',
  timestamp: new Date(),
});

const AIChatBox: React.FC<AIChatBoxProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, logout } = useAuth();

  const getMessageHistory = (): AIChatMessage[] => {
    const key = "ai_chat_history";
    const today = new Date().toDateString();

    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as { messages: AIChatMessage[]; date: string };
      if (parsed.date === today) {
        if (parsed.messages && parsed.messages.length > 0) {
          return parsed.messages;
        }
        return [];
      }
    }

    localStorage.removeItem(key);
    return [];
  }

  const addToMessageHistory = (message: AIChatMessage) => {
    const key = "ai_chat_history";
    const today = new Date().toDateString();

    const messages = getMessageHistory();
    messages.push(message);

    localStorage.setItem(key, JSON.stringify({ messages, date: today }));
  }

  const clearMessageHistory = () => {
    const key = "ai_chat_history";
    localStorage.removeItem(key);
  }

  const getChatHistory = (): AIChatMessageDto[] => {
    const storedMessages = getMessageHistory();
    return storedMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
      timestamp: msg.timestamp,
    }));
  }

  useEffect(() => {
    if (user) {
      clearMessageHistory();
      console.log('User logged in, cleared chat history.');
    }

    let initialMessages = getMessageHistory();
    if (initialMessages.length === 0) {
      initialMessages = [createGreetingMessage()];
    }

    setMessages(initialMessages);
  }, [user]);

  const quickReplies = [
    'Khó ngủ',
    'Mệt mỏi',
    'Nóng trong',
    'Đau đầu',
    'Chóng mặt',
    'Buồn nôn',
  ];

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleQuickReply = (text: string) => {
    setInputText(text);
    handleSendMessage(text);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText && uploadedFiles.length === 0) return;

    // Add user message
    if (messageText) {
      const newUserMessage: AIChatMessage = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newUserMessage]);
      setInputText('');
    }

    //Handle file uploads
    if (uploadedFiles.length > 0) {
      setIsLoading(true);
      try {
        const file = uploadedFiles[0];
        const response = await aiChatService.uploadAndAnalyzeEMR({
          file, messages: getChatHistory(),
        });
        response.timestamp = new Date(response.timestamp);
        setMessages(prev => [...prev, response]);
        addToMessageHistory({
          id: new Date().toString(),
          sender: 'ai',
          text: response.text,
          timestamp: new Date(),
          type: response.type,
          data: response.data,
        });
        setUploadedFiles([]);
      } catch (error: any) {
        let text = 'Xin lỗi, có lỗi xảy ra khi phân tích EMR. Vui lòng thử lại sau.';

        if (error.response?.status === 400 && error.response.data?.message) {
          // ✅ Use the message returned by your C# API
          text = error.response.data.message;
        }

        const errorMessage: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          text,
          sender: 'ai',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    try {
      const promptRequest: PromptRequest = {
        prompt: messageText,
        messages: getChatHistory(),
      };

      const response = await aiChatService.sendMessage(promptRequest);
      response.timestamp = new Date();
      setMessages(prev => [...prev, response]);

      addToMessageHistory({
        id: Date.now().toString(),
        sender: 'user',
        text: messageText,
        timestamp: new Date(),
        type: 'text',
      });
      addToMessageHistory({
        id: new Date().toString(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date(),
        type: response.type,
        data: response.data,
      });
    } catch (error: any) {
      const errorMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type);
    });
    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatMessage = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')
      .replace(/⚠️/g, '⚠️')
      .replace(/🚨/g, '🚨');
  };

  const getSeverityLevel = (label: string): string => {
    switch (label) {
      case "mild": return "Nhẹ";
      case "moderate": return "Trung bình";
      case "severe": return "Nặng";
      default: return "";
    }
  }

  const renderSymptomAnalysis = (data: SymptomAnalysisResponse) => {
    return (
      <>
        <div className={styles.messageText}>
          Mức độ nghiêm trọng: {getSeverityLevel(data.severity)}
        </div>
        <div className={styles.messageText}>
          {data.recommendedAction}
        </div>
        <div className={styles.symptomAnalysis}>
          {data.severity === 'mild' ? (
            <>
              {data.medicines && data.medicines.length > 0 && (
                <div className={styles.conditionsList}>
                  <h4>Các loại thuốc có thể sử dụng:</h4>
                  {data.medicines.map((medicine, index) => (
                    <div key={index} className={styles.conditionItem}>
                      <span className={styles.conditionName}>{medicine.name}</span>
                      <p className={styles.conditionDescription}>{medicine.instructions}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {data.recommendedDoctors && data.recommendedDoctors.length > 0 ? (
                <div className={styles.doctorsList}>
                  <h4>Bác sĩ được gợi ý:</h4>
                  {data.recommendedDoctors.map((doctor, index) => (
                    <>
                      <a href={`/doctor/details/${doctor.id}`} target="_blank" rel="noopener noreferrer">
                        <div key={index} className={styles.doctorItem}>
                          <span className={styles.doctorName}>{doctor.name}</span>
                          <span className={styles.doctorSpecialty}>Chuyên khoa: {doctor.specialization}</span>
                          <span className={styles.doctorSpecialty}>Học vị: {doctor.education}</span>
                          <span className={styles.doctorSpecialty}>Giá khám: {doctor.consultationFee} VND</span>
                          <span className={styles.doctorSpecialty}>Số năm kinh nghiệm: {doctor.experience}</span>
                        </div>
                      </a>
                    </>
                  ))}
                </div>
              ) : (
                <div className={styles.doctorsList}>
                  <p>Chúng tôi chưa tìm thấy bác sĩ phù hợp với yêu cầu của bạn.</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className={styles.messageText}>
          {data.disclaimer}
        </div>
      </>
    );
  };

  const renderRecommendedDoctors = (data: RecommanededDoctorDto[]) => {
    return (
      <div className={styles.symptomAnalysis}>
        {data && data.length > 0 && (
          <div className={styles.doctorsList}>
            {data.map((doctor, index) => (
              <>
                <a href={`/doctor/details/${doctor.id}`} target="_blank" rel="noopener noreferrer">
                  <div key={index} className={styles.doctorItem}>
                    <span className={styles.doctorName}>{doctor.name}</span>
                    <span className={styles.doctorSpecialty}>Chuyên khoa: {doctor.specialization}</span>
                    <span className={styles.doctorSpecialty}>Học vị: {doctor.education}</span>
                    <span className={styles.doctorSpecialty}>Giá khám: {doctor.consultationFee} VND</span>
                    <span className={styles.doctorSpecialty}>Số năm kinh nghiệm: {doctor.experience}</span>
                  </div>
                </a>
              </>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderRecommendedArticles = (data: RecommendedArticleDto[]) => {
    return (
      <div className={styles.symptomAnalysis}>
        {data && data.length > 0 && (
          <div className={styles.doctorsList}>
            {data.map((article) => (
              <>
                <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                  <div key={article.id} className={styles.doctorItem}>
                    <span className={styles.doctorName}>{article.title}</span>
                    <span className={styles.doctorSpecialty}>{article.summary}</span>
                  </div>
                </a>
              </>
            ))}
          </div>
        )}
      </div>
    )
  }


  if (!isOpen) return null;

  return (
    <div className={styles.chatboxOverlay} onClick={onClose}>
      <div className={styles.chatboxContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.chatboxHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.avatarContainer}>
              <img
                src="/images/medix-logo-mirrored.jpg"
                alt="MEDIX"
                className={styles.avatar}
              />
              <div className={styles.statusIndicator}></div>
            </div>
            <div className={styles.headerInfo}>
              <h3 className={styles.headerTitle}>MEDIX</h3>
              <p className={styles.headerSubtitle}>Đang hoạt động</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.expandButton}
              onClick={() => navigate('/ai-chat')}
              title="Phóng to"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.messagesArea}>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.aiMessage}`}
            >
              {message.sender === 'ai' && (
                <img
                  src="/images/medix-logo-mirrored.jpg"
                  alt="MEDIX"
                  className={styles.messageAvatar}
                />
              )}
              <div className={styles.messageBubble}>
                <div className={styles.messageText} dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} />
                {message.data && (
                  message.type === 'symptom_analysis' ? (
                    <div className={styles.messageData}>
                      {renderSymptomAnalysis(message.data)}
                    </div>
                  ) : message.type === 'recommended_doctors' ? (
                    <div className={styles.messageData}>
                      {renderRecommendedDoctors(message.data)}
                    </div>
                  ) : message.type === 'recommended_articles' ? (
                    <div className={styles.messageData}>
                      {renderRecommendedArticles(message.data)}
                    </div>
                  ) : null
                )}
                <div className={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className={`${styles.message} ${styles.aiMessage}`}>
              <img
                src="/images/medix-logo-mirrored.jpg"
                alt="MEDIX"
                className={styles.messageAvatar}
              />
              <div className={styles.messageBubble}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {uploadedFiles.length > 0 && (
          <div className={styles.filePreview}>
            {uploadedFiles.map((file, index) => (
              <div key={index} className={styles.fileItem}>
                <span className={styles.fileName}>{file.name}</span>
                <button
                  className={styles.removeFileButton}
                  onClick={() => removeFile(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {messages.length === 1 && (
          <div className={styles.quickSuggestions}>
            <p className={styles.suggestionPrompt}>Gợi ý:</p>
            <div className={styles.quickReplies}>
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className={styles.quickReplyButton}
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.inputArea}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            multiple
            onChange={handleFileSelect}
            className={styles.fileInput}
            id="file-upload"
          />
          <label htmlFor="file-upload" className={styles.attachButton}>
            📎
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hãy đặt câu hỏi với Medix"
            className={styles.textInput}
            rows={1}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={(!inputText.trim() && uploadedFiles.length === 0) || isLoading}
            className={styles.sendButton}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatBox;
