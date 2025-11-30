export type AIChatMessageType =
  | 'text'
  | 'symptom_analysis'
  | 'doctor_recommendation'
  | 'emr_analysis'
  | 'system_query'
  | 'symptom_guidance'
  | 'general_health'
  | 'out_of_scope';

export interface AIChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: AIChatMessageType;
  data?: any;
}

export interface StoredAIChatMessage extends Omit<AIChatMessage, 'timestamp'> {
  timestamp: string;
}


