import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/pages/AIChatBot.module.css';
import aiChatService, { SymptomAnalysisResponse, EMRAnalysisResponse, PromptRequest } from '../../services/aiChatService';
import { AIChatMessage } from '../../types/aiChat';
import { useAuth } from '../../contexts/AuthContext';
import { get } from 'http';

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

  const [chatToken, setChatToken] = useState<string>("");

  const getNewChatToken = (): string => {
    // Generate a new token every time the page loads
    let token: string;

    if (crypto.randomUUID) {
      token = crypto.randomUUID(); // modern browsers
    } else {
      // fallback for older browsers
      token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    return token;
  }

  const initializeChatToken = (): string => {
    if (user) {
      return getNewChatToken();
    }

    const key = "ai_chat_token";
    const today = new Date().toDateString();

    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as { value: string; date: string };
      if (parsed.date === today) {
        // ✅ Same day → reuse token
        return parsed.value;
      }
    }

    // ❌ No token yet or different day → generate new token
    const newToken = getNewChatToken();
    localStorage.setItem(key, JSON.stringify({ value: newToken, date: today }));
    return newToken;
  }

  const getChatHistory = async (token: string) => {
    try {
      const history = await aiChatService.getChatHistory(token);
      if (!history || history.length === 0) {
        // First time chat - add greeting message
        setMessages([createGreetingMessage()]);
      } else {
        var chatHistory = history.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(chatHistory);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setMessages([createGreetingMessage()]);
    }
  }

  useEffect(() => {
    (async () => {
      const token = initializeChatToken();
      setChatToken(token);
      await getChatHistory(token);
    })();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

    // Handle file uploads
    if (uploadedFiles.length > 0) {
      setIsLoading(true);
      try {
        const file = uploadedFiles[0];
        const response = await aiChatService.uploadAndAnalyzeEMR({
          file,
          chatToken,
        });

        const aiResponse: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, aiResponse]);
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
      //   // Check if it's a symptom query
      //   const symptomKeywords = ['đau', 'mệt', 'sốt', 'ho', 'khó', 'buồn', 'chóng', 'nóng', 'ngứa', 'triệu chứng'];
      //   const isSymptomQuery = symptomKeywords.some(keyword => messageText.toLowerCase().includes(keyword));

      //   if (isSymptomQuery) {
      //     // Extract symptoms (simplified - in production, use NLP)
      //     const symptoms = messageText.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);

      //     const analysisResponse = await aiChatService.analyzeSymptoms({
      //       symptoms: symptoms.slice(0, 10), // Limit to 10 symptoms
      //       additionalInfo: messageText,
      //     });

      //     const severityText = analysisResponse.severity === 'mild' ? 'nhẹ' : 
      //                         analysisResponse.severity === 'moderate' ? 'vừa' : 'nặng';

      //     let responseText = `**Đánh giá mức độ: ${severityText.toUpperCase()}**\n\n`;
      //     responseText += `${analysisResponse.overview}\n\n`;
      //     responseText += `**Các khả năng chẩn đoán:**\n`;
      //     analysisResponse.possibleConditions.forEach((condition, index) => {
      //       responseText += `${index + 1}. ${condition.condition} (${condition.probability}%)\n   ${condition.description}\n`;
      //     });

      //     if (analysisResponse.homeTreatment) {
      //       responseText += `\n**Hướng dẫn điều trị tại nhà:**\n`;
      //       analysisResponse.homeTreatment.instructions.forEach(instruction => {
      //         responseText += `• ${instruction}\n`;
      //       });
      //     }

      //     if (analysisResponse.recommendedDoctors && analysisResponse.recommendedDoctors.length > 0) {
      //       responseText += `\n**Bác sĩ được gợi ý:**\n`;
      //       analysisResponse.recommendedDoctors.slice(0, 3).forEach((doctor, index) => {
      //         responseText += `${index + 1}. ${doctor.name} - ${doctor.specialization}\n`;
      //         responseText += `   Đánh giá: ${doctor.rating}/5.0 | Kinh nghiệm: ${doctor.experience} năm\n`;
      //       });
      //     }

      //     const aiResponse: AIChatMessage = {
      //       id: (Date.now() + 1).toString(),
      //       text: responseText,
      //       sender: 'ai',
      //       timestamp: new Date(),
      //       type: 'symptom_analysis',
      //       data: analysisResponse,
      //     };
      //     setMessages(prev => [...prev, aiResponse]);
      //   } else {
      // Regular chat message
      const conversationHistory = messages.map(msg => ({
        text: msg.text,
        sender: msg.sender,
        type: msg.type,
      }));

      const promptRequest: PromptRequest = {
        prompt: messageText,
        chatToken: chatToken,
      };

      const response = await aiChatService.sendMessage(promptRequest);

      const aiResponse: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date(),
        type: "text",
        data: "response.data",
      };
      setMessages(prev => [...prev, aiResponse]);
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

  const formatMessage = (text: string): string => {
    // Format markdown-like syntax
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')
      .replace(/⚠️/g, '⚠️')
      .replace(/🚨/g, '🚨');
  };

  const renderSymptomAnalysis = (data: SymptomAnalysisResponse) => {
    return (
      <div className={styles.symptomAnalysis}>
        {data.possibleConditions && data.possibleConditions.length > 0 && (
          <div className={styles.conditionsList}>
            <h4>Khả năng chẩn đoán:</h4>
            {data.possibleConditions.map((condition, index) => (
              <div key={index} className={styles.conditionItem}>
                <span className={styles.conditionName}>{condition.condition}</span>
                <span className={styles.conditionProbability}>{condition.probability}%</span>
                <p className={styles.conditionDescription}>{condition.description}</p>
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

  const renderEMRAnalysis = (data: EMRAnalysisResponse) => {
    return (
      <div className={styles.emrAnalysis}>
        {data.extractedData.diagnosis && data.extractedData.diagnosis.length > 0 && (
          <div className={styles.emrSection}>
            <strong>Chẩn đoán:</strong> {data.extractedData.diagnosis.join(', ')}
          </div>
        )}
        {data.extractedData.medications && data.extractedData.medications.length > 0 && (
          <div className={styles.emrSection}>
            <strong>Thuốc:</strong> {data.extractedData.medications.join(', ')}
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
              {message.data && message.type === 'emr_analysis' && (
                <div className={styles.messageData}>
                  {renderEMRAnalysis(message.data)}
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
};
