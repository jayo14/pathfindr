import { apiRequest } from './api-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  routeData?: {
    points: Array<{latitude: number, longitude: number}>,
    distanceMeters: number,
    durationMinutes: number
  };
  buildingId?: string;
  intent?: 'navigate' | 'info' | 'general';
}

export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string
): Promise<ChatMessage> {
  // Map internal ChatMessage to what the API expects (role and content)
  const history = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  return apiRequest<ChatMessage>('/ai/chat/', {
    method: 'POST',
    body: JSON.stringify({ messages: history, message: userMessage })
  });
}
