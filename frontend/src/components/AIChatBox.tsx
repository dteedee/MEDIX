import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/AIChatBox.module.css';
import aiChatService, { SymptomAnalysisResponse, EMRAnalysisResponse } from '../services/aiChatService';
import { AIChatMessage } from '../types/aiChat';
import { getChatHistory, saveChatHistory } from '../utils/chatHistory';

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
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    const history = getChatHistory();
    return history.length > 0 ? history : [createGreetingMessage()];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  const handleQuickReply = (text: string) => {
    setInputText(text);
    handleSendMessage(text);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText && uploadedFiles.length === 0) return;

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

    if (uploadedFiles.length > 0) {
      setIsLoading(true);
      try {
        const file = uploadedFiles[0];
        const response = await aiChatService.uploadAndAnalyzeEMR({
          file,
        });

        const aiResponse: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response.summary + '\n\n' + response.recommendations.join('\n'),
          sender: 'ai',
          timestamp: new Date(),
          type: 'emr_analysis',
          data: response,
        };
        setMessages(prev => [...prev, aiResponse]);
        setUploadedFiles([]);
      } catch (error: any) {
        const errorMessage: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Xin lỗi, có lỗi xảy ra khi phân tích EMR. Vui lòng thử lại sau.',
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
      const symptomKeywords = ['đau', 'mệt', 'sốt', 'ho', 'khó', 'buồn', 'chóng', 'nóng', 'ngứa', 'triệu chứng'];
      const isSymptomQuery = symptomKeywords.some(keyword => messageText.toLowerCase().includes(keyword));

      if (isSymptomQuery) {
        const symptoms = messageText.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
        
        const analysisResponse = await aiChatService.analyzeSymptoms({
          symptoms: symptoms.slice(0, 10),
          additionalInfo: messageText,
        });

        const severityText = analysisResponse.severity === 'mild' ? 'nhẹ' : 
                            analysisResponse.severity === 'moderate' ? 'vừa' : 'nặng';
        
        let responseText = `**Đánh giá mức độ: ${severityText.toUpperCase()}**\n\n`;
        responseText += `${analysisResponse.overview}\n\n`;
        responseText += `**Các khả năng chẩn đoán:**\n`;
        analysisResponse.possibleConditions.forEach((condition, index) => {
          responseText += `${index + 1}. ${condition.condition} (${condition.probability}%)\n   ${condition.description}\n`;
        });

        if (analysisResponse.homeTreatment) {
          responseText += `\n**Hướng dẫn điều trị tại nhà:**\n`;
          analysisResponse.homeTreatment.instructions.forEach(instruction => {
            responseText += `• ${instruction}\n`;
          });
        }

        if (analysisResponse.recommendedDoctors && analysisResponse.recommendedDoctors.length > 0) {
          responseText += `\n**Bác sĩ được gợi ý:**\n`;
          analysisResponse.recommendedDoctors.slice(0, 3).forEach((doctor, index) => {
            responseText += `${index + 1}. ${doctor.name} - ${doctor.specialization}\n`;
            responseText += `   Đánh giá: ${doctor.rating}/5.0 | Kinh nghiệm: ${doctor.experience} năm\n`;
          });
        }

        const aiResponse: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'ai',
          timestamp: new Date(),
          type: 'symptom_analysis',
          data: analysisResponse,
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        const conversationHistory = messages.map(msg => ({
          text: msg.text,
          sender: msg.sender,
          type: msg.type,
        }));

        const response = await aiChatService.sendMessage(messageText, conversationHistory);
        
        const aiResponse: AIChatMessage = {
          id: response.id || (Date.now() + 1).toString(),
          text: response.text,
          sender: 'ai',
          timestamp: new Date(response.timestamp || new Date()),
          type: response.type as any,
          data: response.data,
        };
        setMessages(prev => [...prev, aiResponse]);
      }
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
            onKeyPress={handleKeyPress}
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
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatBox;
