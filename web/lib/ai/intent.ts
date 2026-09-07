export type SoftPreferences = Partial<{
  beach: number;
  cleanliness: number;
  food: number;
  luxury: number;
  romantic: number;
  family: number;
  nightlife: number;
  business: number;
  quiet: number;
  value: number;
}>;

export type Intent = {
  destination?: string;
  dates?: { checkIn: string; checkOut: string };
  guests?: { adults: number; children: number; rooms: number };
  budget?: { amount: number; currency: string };
  softPreferences?: SoftPreferences;
  context?: 'family' | 'couple' | 'business' | 'solo' | 'group';
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ConversationState = {
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  extractedPreferences: Intent;
  searchContext: {
    lastQuery?: Intent;
    lastResults?: { hotelIds: string[]; rankedAt: string };
  };
  createdAt: string;
  updatedAt: string;
};
