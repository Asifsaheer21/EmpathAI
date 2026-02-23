import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  GoogleAuthRequest,
  User,
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
  ProfileUpdateRequest,
  ExportDataResponse,
} from '@/types';

// Base API URL - Replace with your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'An error occurred' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Auth API
export const authApi = {
  login: (credentials: LoginRequest) =>
    apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterRequest) =>
    apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleAuth: (data: GoogleAuthRequest) =>
    apiCall<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiCall<void>('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    apiCall<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiCall<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

// User API
export const userApi = {
  getProfile: () => apiCall<User>('/user/profile'),

  updateProfile: (data: ProfileUpdateRequest) =>
    apiCall<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  exportData: () => apiCall<ExportDataResponse>('/user/export'),

  deleteAccount: () =>
    apiCall<void>('/user/delete', {
      method: 'DELETE',
    }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiCall<void>('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Conversations API
export const conversationsApi = {
  getAll: () => apiCall<ConversationsResponse>('/conversations'),

  create: (title?: string) =>
    apiCall<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  delete: (id: string) =>
    apiCall<void>(`/conversations/${id}`, {
      method: 'DELETE',
    }),

  deleteAll: () =>
    apiCall<void>('/conversations', {
      method: 'DELETE',
    }),

  getMessages: (id: string) =>
    apiCall<MessagesResponse>(`/conversations/${id}/messages`),
  

  sendAudio: async (conversationId: string, file: File): Promise<Response> => {
  const token = localStorage.getItem('auth_token');

  const formData = new FormData();
  formData.append('file', file);

  return fetch(`${API_BASE_URL}/analyze/${conversationId}/audio`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
},

  // Streaming message - returns a ReadableStream
  sendMessage: async (conversationId: string, content: string): Promise<Response> => {
    const token = localStorage.getItem('auth_token');
    
    return fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ content }),
    });
  },
};

// Expected API Response Structures (for your backend reference)
export const apiResponseStructures = {
  // POST /auth/login
  loginResponse: {
    user: {
      id: 'string',
      email: 'string',
      name: 'string',
      avatar: 'string (optional)',
      createdAt: 'ISO date string',
    },
    token: 'JWT token string',
  },

  // POST /auth/register
  registerResponse: {
    user: {
      id: 'string',
      email: 'string',
      name: 'string',
      createdAt: 'ISO date string',
    },
    token: 'JWT token string',
  },

  // GET /conversations
  conversationsResponse: {
    conversations: [
      {
        id: 'string',
        title: 'string',
        createdAt: 'ISO date string',
        updatedAt: 'ISO date string',
        preview: 'string (first message preview)',
      },
    ],
  },

  // GET /conversations/:id/messages
  messagesResponse: {
    messages: [
      {
        id: 'string',
        conversationId: 'string',
        role: "'user' | 'assistant'",
        content: 'string',
        createdAt: 'ISO date string',
      },
    ],
  },

  // POST /conversations/:id/messages (Streaming Response)
  // Returns a stream of Server-Sent Events (SSE):
  // data: {"content": "Hello", "done": false}
  // data: {"content": " world", "done": false}
  // data: {"content": "", "done": true}
  streamingFormat: 'Server-Sent Events (SSE) with JSON chunks',

  // GET /user/export
  exportResponse: {
    conversations: 'Array of all conversations',
    messages: 'Array of all messages',
    exportedAt: 'ISO date string',
  },
};

// import type {
//   ApiResponse,
//   AuthResponse,
//   LoginRequest,
//   RegisterRequest,
//   GoogleAuthRequest,
//   User,
//   Conversation,
//   ConversationsResponse,
//   Message,
//   MessagesResponse,
//   ProfileUpdateRequest,
//   ExportDataResponse,
// } from '@/types';

// /* =====================================================
//    🔁 TOGGLE HERE
// ===================================================== */
// const USE_DUMMY = true;

// /* =====================================================
//    🛠 HELPERS
// ===================================================== */
// const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

// const get = <T>(key: string, fallback: T): T =>
//   JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));

// const set = (key: string, value: unknown) =>
//   localStorage.setItem(key, JSON.stringify(value));

// const token = () => 'dummy-token-' + Math.random().toString(36).slice(2);

// /* =====================================================
//    👤 DEFAULT USER
// ===================================================== */
// const defaultUser: User = {
//   id: '1',
//   email: 'test@test.com',
//   name: 'Test User',
//   createdAt: new Date().toISOString(),
// };

// /* =====================================================
//    🔐 AUTH API
// ===================================================== */
// export const authApi = {
//   async login(_: LoginRequest): Promise<ApiResponse<AuthResponse>> {
//     if (!USE_DUMMY) throw new Error('Backend disabled');

//     await delay();

//     set('auth_user', defaultUser);
//     localStorage.setItem('auth_token', token());

//     return {
//       success: true,
//       data: { user: defaultUser, token: token() },
//     };
//   },

//   async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
//     if (!USE_DUMMY) throw new Error('Backend disabled');

//     await delay();

//     const user: User = {
//       ...defaultUser,
//       email: data.email,
//       name: data.name,
//     };

//     set('auth_user', user);
//     localStorage.setItem('auth_token', token());

//     return {
//       success: true,
//       data: { user, token: token() },
//     };
//   },

//   async googleAuth(_: GoogleAuthRequest): Promise<ApiResponse<AuthResponse>> {
//     await delay();
//     set('auth_user', defaultUser);
//     return { success: true, data: { user: defaultUser, token: token() } };
//   },

//   async logout(): Promise<ApiResponse<void>> {
//     localStorage.removeItem('auth_user');
//     localStorage.removeItem('auth_token');
//     return { success: true };
//   },

//   async forgotPassword(email: string): Promise<ApiResponse<void>> {
//     return { success: true };
//   },

//   async resetPassword(): Promise<ApiResponse<void>> {
//     return { success: true };
//   },
// };

// /* =====================================================
//    👤 USER API
// ===================================================== */
// export const userApi = {
//   async getProfile(): Promise<ApiResponse<User>> {
//     await delay();
//     const user = get<User | null>('auth_user', null);
//     return user
//       ? { success: true, data: user }
//       : { success: false, error: 'Not logged in' };
//   },

//   async updateProfile(
//     data: ProfileUpdateRequest
//   ): Promise<ApiResponse<User>> {
//     await delay();

//     const existing = get<User | null>('auth_user', null);
//     if (!existing) return { success: false, error: 'Not logged in' };

//     const updated: User = { ...existing, ...data };
//     set('auth_user', updated);

//     return { success: true, data: updated };
//   },

//   async updatePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
//     return { success: true };
//   },

//   async deleteAccount(): Promise<ApiResponse<void>> {
//     localStorage.clear();
//     return { success: true };
//   },

//   async exportData(): Promise<ApiResponse<ExportDataResponse>> {
//     return {
//       success: true,
//       data: {
//         conversations: get('conversations', []),
//         messages: get('messages', []),
//         exportedAt: new Date().toISOString(),
//       },
//     };
//   },
// };

// /* =====================================================
//    💬 CONVERSATIONS API
// ===================================================== */
// export const conversationsApi = {
//   async getAll(): Promise<ApiResponse<ConversationsResponse>> {
//     await delay();
//     return {
//       success: true,
//       data: { conversations: get('conversations', []) },
//     };
//   },

//   async create(title?: string): Promise<ApiResponse<Conversation>> {
//     await delay();

//     const conversations = get<Conversation[]>('conversations', []);
//     const convo: Conversation = {
//       id: Date.now().toString(),
//       title: title || 'New Chat',
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//       preview: '',
//     };

//     conversations.unshift(convo);
//     set('conversations', conversations);

//     return { success: true, data: convo };
//   },

//   async delete(id: string): Promise<ApiResponse<void>> {
//     set(
//       'conversations',
//       get<Conversation[]>('conversations', []).filter(c => c.id !== id)
//     );
//     return { success: true };
//   },

//   async deleteAll(): Promise<ApiResponse<void>> {
//     set('conversations', []);
//     return { success: true };
//   },

//   async getMessages(id: string): Promise<ApiResponse<MessagesResponse>> {
//     const messages = get<Message[]>('messages', []).filter(
//       m => m.conversationId === id
//     );
//     return { success: true, data: { messages } };
//   },

//   async sendMessage(id: string, content: string): Promise<Response> {
//     return new Response(
//       new ReadableStream({
//         start(controller) {
//           controller.enqueue(
//             new TextEncoder().encode(
//               `data: ${JSON.stringify({
//                 content: 'Hello from dummy AI 🤖',
//                 done: true,
//               })}\n\n`
//             )
//           );
//           controller.close();
//         },
//       }),
//       { headers: { 'Content-Type': 'text/event-stream' } }
//     );
//   },
// };
