import { apiClient } from "../lib/apiClient";
import { AIChatMessage } from "../types/aiChat";

export interface PromptRequest {
  chatToken?: string;
  prompt: string;
}

export interface EMRUploadRequest {
  file: File;
  chatToken?: string;
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
      {
        withCredentials: true
      }
    );
    return response.data;
  }

  async getChatHistory(chatToken: string): Promise<AIChatMessage[]> {
    console.log('Fetching chat history for token:', chatToken);
    const response = await apiClient.get<AIChatMessage[]>(
      `/ai-chat/conversation-history/${chatToken}`, {
      withCredentials: true // <-- this is the Axios equivalent of credentials: "include"
    }
    );
    return response.data;
  }

  async uploadAndAnalyzeEMR(request: EMRUploadRequest): Promise<AIChatMessage> {
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.chatToken) {
      formData.append('chatToken', JSON.stringify(request.chatToken));
    }

    const response = await apiClient.postMultipartWithCredentials<AIChatMessage>(
      '/ai-chat/analyze-emr',
      formData,
    );
    return response.data;
  }
}

const aiChatService = new AIChatService();
export default aiChatService;

