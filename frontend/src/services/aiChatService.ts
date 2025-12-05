import { apiClient } from "../lib/apiClient";
import { AIChatMessage } from "../types/aiChat";

export interface AIChatMessageDto{
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PromptRequest {
  prompt: string;
  messages: AIChatMessageDto[];
}

export interface EMRUploadRequest {
  file: File;
  messages: AIChatMessageDto[];
}

export interface SymptomAnalysisResponse {
  severity: 'mild' | 'moderate' | 'severe';
  recommendedAction: string;
  medicines?: {
    name: string;
    instructions: string;
  }[];
  recommendedSpecialty?: string;
  recommendedDoctors?: Array<{
    id: string;
    name: string;
    specialization: string;
    rating: number;
    experience: number;
    consultationFee: number;
    avatarUrl?: string;
  }>;
  disclaimer: string;
}

class AIChatService {
  async sendMessage(request: PromptRequest): Promise<AIChatMessage> {
    const response = await apiClient.post<AIChatMessage>(
      '/ai-chat/message',
      request,
    );
    return response.data;
  }

  async uploadAndAnalyzeEMR(request: EMRUploadRequest): Promise<AIChatMessage> {
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.messages && request.messages.length > 0) {
      formData.append('messages', JSON.stringify(request.messages));
    }

    const response = await apiClient.postMultipart<AIChatMessage>(
      '/ai-chat/analyze-emr',
      formData,
    );
    return response.data;
  }
}

const aiChatService = new AIChatService();
export default aiChatService;

