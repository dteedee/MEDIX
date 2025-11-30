import { apiClient } from '../lib/apiClient';

export interface ChatMessage {
  id?: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp?: Date | string;
  type?: 'text' | 'symptom_analysis' | 'doctor_recommendation' | 'emr_analysis' | 'system_query' | 'symptom_guidance' | 'general_health' | 'out_of_scope';
  data?: any;
}

export interface SymptomAnalysisRequest {
  symptoms: string[];
  additionalInfo?: string;
  duration?: string;
  severity?: string;
}

export interface SymptomAnalysisResponse {
  severity: 'mild' | 'moderate' | 'severe';
  overview: string;
  possibleConditions: Array<{
    condition: string;
    probability: number;
    description: string;
  }>;
  homeTreatment?: {
    instructions: string[];
    medications?: string[];
    precautions: string[];
  };
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

export interface EMRUploadRequest {
  file: File;
  patientInfo?: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
  };
}

export interface EMRAnalysisResponse {
  extractedData: {
    patientName?: string;
    dateOfBirth?: string;
    gender?: string;
    diagnosis?: string[];
    medications?: string[];
    testResults?: any;
    notes?: string;
  };
  summary: string;
  recommendations: string[];
}

export interface SystemQueryResponse {
  answer: string;
  data?: any;
}

class AIChatService {
 
  async sendMessage(message: string, conversationHistory?: ChatMessage[]): Promise<ChatMessage> {
    try {
      const response = await apiClient.post<ChatMessage>('/ai-chat/message', {
        message,
        conversationHistory: conversationHistory?.map(msg => ({
          text: msg.text,
          sender: msg.sender,
          type: msg.type,
        })),
      });
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }


  async analyzeSymptoms(request: SymptomAnalysisRequest): Promise<SymptomAnalysisResponse> {
    try {
      const response = await apiClient.post<SymptomAnalysisResponse>(
        '/ai-chat/analyze-symptoms',
        request
      );
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }


  async uploadAndAnalyzeEMR(request: EMRUploadRequest): Promise<EMRAnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      if (request.patientInfo) {
        formData.append('patientInfo', JSON.stringify(request.patientInfo));
      }

      const response = await apiClient.postMultipart<EMRAnalysisResponse>(
        '/ai-chat/analyze-emr',
        formData
      );
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async querySystem(query: string): Promise<SystemQueryResponse> {
    try {
      const response = await apiClient.post<SystemQueryResponse>('/ai-chat/query-system', {
        query,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  private handleApiError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('Network error');
  }
}

const aiChatService = new AIChatService();
export default aiChatService;

