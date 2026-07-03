import { apiRequest } from './api-client';

/**
 * Structured context carried between conversation turns.
 * The backend returns this on every navigate/info response; the client
 * must echo it back as `follow_up_context` on the next request so the
 * assistant can resolve relative references like "near there" or "from there".
 */
export interface FollowUpContext {
  /** The routing slug of the most-recently discussed building, e.g. 'library-complex' */
  building_id: string;
  /** Human-readable name, e.g. 'Knowledge Resource Library' */
  building_name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  routeData?: {
    points: Array<{ latitude: number; longitude: number }>;
    distanceMeters: number;
    durationMinutes: number;
  };
  buildingId?: string;
  intent?: 'navigate' | 'info' | 'general';
  /**
   * Optional context produced by the backend on navigate/info responses.
   * The UI must pass this back on the next call via sendChatMessage so
   * multi-turn follow-ups (e.g. "what about parking near there?") resolve
   * correctly.  Absent on user messages and general-intent responses.
   */
  followUpContext?: FollowUpContext;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string,
): Promise<ChatMessage> {
  // Map internal ChatMessage to what the API expects (role + content only)
  const history = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Find the most recent assistant message that carries follow-up context
  // and echo it back so the backend can resolve relative references.
  const lastContextMsg = [...messages]
    .reverse()
    .find(m => m.role === 'assistant' && m.followUpContext != null);
  const followUpContext = lastContextMsg?.followUpContext ?? null;

  return apiRequest<ChatMessage>('/ai/chat/', {
    method: 'POST',
    body: JSON.stringify({
      messages: history,
      message: userMessage,
      follow_up_context: followUpContext,
    }),
  });
}
