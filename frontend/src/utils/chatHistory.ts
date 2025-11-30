import { AIChatMessage, StoredAIChatMessage } from '../types/aiChat';

const CHAT_HISTORY_KEY = 'medix-ai-chat-history';

const isBrowser = typeof window !== 'undefined';
const getStorage = () => (isBrowser ? window.sessionStorage : null);

const serializeMessages = (messages: AIChatMessage[]): StoredAIChatMessage[] =>
  messages.map(message => ({
    ...message,
    timestamp: message.timestamp.toISOString(),
  }));

const deserializeMessages = (messages: StoredAIChatMessage[]): AIChatMessage[] =>
  messages.map(message => ({
    ...message,
    timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
  }));

export const getChatHistory = (): AIChatMessage[] => {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  try {
    const stored = storage.getItem(CHAT_HISTORY_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as StoredAIChatMessage[];
    return deserializeMessages(parsed);
  } catch (error) {
    console.warn('Failed to parse chat history', error);
    return [];
  }
};

export const saveChatHistory = (messages: AIChatMessage[]) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    const serializable = serializeMessages(messages);
    storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.warn('Failed to save chat history', error);
  }
};

export const clearChatHistory = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(CHAT_HISTORY_KEY);
};


