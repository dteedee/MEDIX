import { AIChatMessage } from "../../types/aiChat";
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/pages/AIChatBot.module.css';
import { useEffect, useRef, useState } from "react";
import aiChatService, { AIChatMessageDto, PromptRequest, SymptomAnalysisResponse } from "../../services/aiChatService";
import { useAuth } from "../../contexts/AuthContext";

const createGreetingMessage = (): AIChatMessage => ({
  id: 'medix-greeting',
  text: 'Xin chào! Tôi là Medix! Tôi có thể giúp bạn tư vấn sức khỏe, phân tích triệu chứng, hoặc trả lời các câu hỏi về hệ thống. Hãy cho tôi biết bạn cần hỗ trợ gì nhé!',
  sender: 'ai',
  timestamp: new Date(),
});

export const AIChatBot: React.FC = () => {

  const navigate = useNavigate();

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, logout } = useAuth();

  const quickReplies = [
    'Khó ngủ',
    'Mệt mỏi',
    'Nóng trong',
    'Đau đầu',
    'Chóng mặt',
    'Buồn nôn',
  ];

  useEffect(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages]);

  const getMessageHistory = (): AIChatMessageDto[] => {
    const key = "ai_chat_token";
    const today = new Date().toDateString();

    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as { messages: AIChatMessageDto[]; date: string };
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

  const addToMessageHistory = (message: AIChatMessageDto) => {
    const key = "ai_chat_token";
    const today = new Date().toDateString();

    const messages = getMessageHistory();
    messages.push(message);

    localStorage.setItem(key, JSON.stringify({ messages, date: today }));
  }

  const clearMessageHistory = () => {
    const key = "ai_chat_token";
    localStorage.removeItem(key);
  }

  const getChatHistory = (): AIChatMessage[] => {
    var chatHistory = getMessageHistory().map(msg => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      text: msg.content,
      sender: msg.role === 'user' ? 'user' as const : 'ai' as const,
      timestamp: new Date(msg.timestamp) ?? new Date(),
    }));
    return chatHistory;
  }

  useEffect(() => {
    if (user) {
      clearMessageHistory();
      console.log('User logged in, cleared chat history.');
    }

    let initialMessages = getChatHistory();
    if (initialMessages.length === 0) {
      initialMessages = [createGreetingMessage()];
    }

    setMessages(initialMessages);
  }, [user]);

  const formatMessage = (text: string): string => {
    // Format markdown-like syntax
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')
      .replace(/⚠️/g, '⚠️')
      .replace(/🚨/g, '🚨');
  };

  const handleQuickReply = (text: string) => {
    setInputText(text);
    handleSendMessage(text);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText && uploadedFiles.length === 0) return;

    let chatHistory = getMessageHistory();

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
          file, messages: chatHistory
        });
        response.timestamp = new Date(response.timestamp);
        setMessages(prev => [...prev, response]);
        addToMessageHistory({
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
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
        messages: chatHistory,
      };

      const response = await aiChatService.sendMessage(promptRequest);
      response.timestamp = new Date(response.timestamp);
      setMessages(prev => [...prev, response]);

      addToMessageHistory({
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      });
      addToMessageHistory({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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

  const renderSymptomAnalysis = (data: SymptomAnalysisResponse) => {
    return (
      <div className={styles.symptomAnalysis}>
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
        {data.recommendedDoctors && data.recommendedDoctors.length > 0 && (
          <div className={styles.doctorsList}>
            <h4>Bác sĩ được gợi ý:</h4>
            {data.recommendedDoctors.map((doctor, index) => (
              <div key={index} className={styles.doctorItem}>
                <span className={styles.doctorName}>{doctor.name}</span>
                <span className={styles.doctorSpecialty}>{doctor.specialization}</span>
                <span className={styles.doctorRating}>⭐ {doctor.rating}/5.0</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.chatPage}>
      {/* Header */}
      <div className={styles.chatHeader}>
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
            <h1 className={styles.headerTitle}>MEDIX</h1>
            <p className={styles.headerSubtitle}>Đang hoạt động</p>
          </div>
        </div>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          title="Quay lại"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
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
              {message.data && message.type === 'symptom_analysis' && (
                <div className={styles.messageData}>
                  {renderSymptomAnalysis(message.data)}
                </div>
              )}
              <div className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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

      {/* File Preview */}
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

      {/* Quick Suggestions - Above input area */}
      {messages.length === 1 && (
        <div className={styles.quickSuggestions}>
          <p className={styles.suggestionPrompt}>Gợi ý nhanh:</p>
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

      {/* Input Area - At the bottom */}
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Hãy đặt câu hỏi với Medix..."
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
  );
}