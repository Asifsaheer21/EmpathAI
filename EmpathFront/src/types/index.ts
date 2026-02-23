// User and Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface GoogleAuthRequest {
  credential: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  messages: Message[];
}

export interface ProfileUpdateRequest {
  name?: string;
  avatar?: string;
}

export interface ExportDataResponse {
  conversations: Conversation[];
  messages: Message[];
  exportedAt: string;
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  dataCollection: boolean;
  chatHistory: boolean;
}

// Grouped Conversations for Sidebar
export interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  previous7Days: Conversation[];
  previous30Days: Conversation[];
  older: Conversation[];
}
