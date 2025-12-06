export type AIChatMessageType =
  | 'text'
  | 'symptom_analysis'
  | 'out_of_scope'
  | 'limit_reached'
  | 'recommended_doctors'
  | 'recommended_articles';

export interface AIChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: AIChatMessageType;
  data?: any;
}

export interface RecommanededDoctorDto {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  experience: number;
  consultationFee: number;
  avatarUrl?: string;
}

export interface RecommendedArticleDto{
  id : string;
  title : string;
  summary : string;
}

export interface SymptomAnalysisResponse {
  severity: 'mild' | 'moderate' | 'severe';
  recommendedAction: string;
  medicines?: {
    name: string;
    instructions: string;
  }[];
  recommendedSpecialty?: string;
  recommendedDoctors?: RecommanededDoctorDto[];
  disclaimer: string;
}

export interface StoredAIChatMessage extends Omit<AIChatMessage, 'timestamp'> {
  timestamp: string;
}


