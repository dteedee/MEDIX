import React, { useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AIChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là AI Assistant của Medix. Tôi có thể giúp bạn tư vấn sức khỏe ban đầu. Bạn có thể mô tả triệu chứng hoặc câu hỏi sức khỏe của mình.',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Cảm ơn bạn đã chia sẻ. Dựa trên thông tin "${inputText}", tôi khuyên bạn nên: 
        
1. Theo dõi các triệu chứng thêm 24-48 giờ
2. Uống đủ nước và nghỉ ngơi
3. Nếu triệu chứng không cải thiện hoặc trở nên nghiêm trọng hơn, hãy đặt lịch khám với bác sĩ

⚠️ Lưu ý: Đây chỉ là tư vấn ban đầu, không thay thế việc khám bác sĩ chuyên khoa.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h1 className="text-xl font-semibold">AI Tư vấn Sức khỏe</h1>
        <p className="text-blue-100 text-sm">Hỗ trợ tư vấn sức khỏe ban đầu 24/7</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
              <p className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                </div>
                <span className="text-sm text-gray-500">AI đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mô tả triệu chứng hoặc câu hỏi sức khỏe của bạn..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ Thông tin từ AI chỉ mang tính chất tham khảo, không thay thế việc khám và điều trị của bác sĩ chuyên khoa.
        </p>
      </div>
    </div>
  );
};
