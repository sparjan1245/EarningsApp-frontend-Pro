import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Topic {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  creator: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  chat?: {
    id: string;
    _count: {
      members: number;
      messages: number;
    };
  };
}

export interface Message {
  id: string;
  chatId?: string;
  topicId?: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  deleted: boolean;
}

export interface Chat {
  id: string;
  type: 'GROUP' | 'ONE_TO_ONE';
  topicId?: string;
  topic?: Topic;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  members: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
    joinedAt: string;
    isActive: boolean;
  }>;
  messages?: Message[];
}

export interface CreateTopicDto {
  title: string;
  description?: string;
}

export interface UpdateTopicDto {
  title?: string;
  description?: string;
}

export interface SendMessageDto {
  chatId?: string;
  topicId?: string;
  content: string;
}

export interface BlockUserDto {
  blockedId: string;
  reason?: string;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
    prepareHeaders: (headers) => {
      // no Authorization header needed; cookie-based auth
      return headers;
    },
  }),
  tagTypes: ['Topics', 'Messages', 'Chats', 'BlockedUsers'],
  endpoints: (builder) => ({
    // Topics
    createTopic: builder.mutation<Topic, CreateTopicDto>({
      query: (body) => ({
        url: '/chat/topics',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Topics'],
    }),
    getAllTopics: builder.query<Topic[], void>({
      query: () => '/chat/topics',
      providesTags: ['Topics'],
    }),
    getTopicById: builder.query<Topic, string>({
      query: (id) => `/chat/topics/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Topics', id }],
    }),
    updateTopic: builder.mutation<Topic, { id: string; data: UpdateTopicDto }>({
      query: ({ id, data }) => ({
        url: `/chat/topics/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Topics', id }, 'Topics'],
    }),
    deleteTopic: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/chat/topics/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Topics'],
    }),

    // Messages
    sendMessage: builder.mutation<Message, SendMessageDto>({
      query: (body) => ({
        url: '/chat/messages',
        method: 'POST',
        body,
      }),
      // Don't invalidate Messages tag - we use WebSocket for real-time updates
      // This prevents unnecessary API refetches when messages are sent
      // invalidatesTags: ['Messages'],
    }),
    getMessages: builder.query<
      { messages: Message[]; pagination: { total: number; page: number; pageSize: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } },
      { topicId?: string; chatId?: string; page?: number; limit?: number }
    >({
      query: ({ topicId, chatId, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        if (topicId) params.append('topicId', topicId);
        if (chatId) params.append('chatId', chatId);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        return `/chat/messages?${params.toString()}`;
      },
      // Use specific tags per topic/chat to prevent unnecessary refetches
      // Real-time updates come via WebSocket, so we don't need tag-based refetching
      providesTags: (_result, _error, { topicId, chatId }) =>
        topicId
          ? [{ type: 'Messages', id: `topic-${topicId}` }]
          : chatId
            ? [{ type: 'Messages', id: `chat-${chatId}` }]
            : ['Messages'],
    }),

    // User Blocking
    blockUser: builder.mutation<{ id: string; blockerId: string; blockedId: string; createdAt: string }, BlockUserDto>({
      query: (body) => ({
        url: '/chat/block',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BlockedUsers'],
    }),
    unblockUser: builder.mutation<{ message: string }, string>({
      query: (blockedId) => ({
        url: `/chat/block/${blockedId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BlockedUsers'],
    }),
    getBlockedUsers: builder.query<Array<{ id: string; blocked: { id: string; username: string; email: string } }>, void>({
      query: () => '/chat/blocked',
      providesTags: ['BlockedUsers'],
    }),

    // Chats
    createOneToOneChat: builder.mutation<Chat, string>({
      query: (userId) => ({
        url: `/chat/chats/one-to-one/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Chats'],
    }),
    getUserChats: builder.query<Chat[], void>({
      query: () => '/chat/chats',
      providesTags: ['Chats'],
    }),
    getUsersForChat: builder.query<Array<{
      id: string;
      username: string;
      email: string;
      role: string;
      createdAt: string;
      existingChatId: string | null;
      hasExistingChat: boolean;
    }>, void>({
      query: () => '/chat/users',
      providesTags: ['Chats'],
    }),

    // Admin functions
    suspendUser: builder.mutation<{ id: string; suspended: boolean }, string>({
      query: (userId) => ({
        url: `/chat/users/${userId}/suspend`,
        method: 'PUT',
      }),
      invalidatesTags: ['Topics', 'Messages'],
    }),
    unsuspendUser: builder.mutation<{ id: string; suspended: boolean }, string>({
      query: (userId) => ({
        url: `/chat/users/${userId}/unsuspend`,
        method: 'PUT',
      }),
      invalidatesTags: ['Topics', 'Messages'],
    }),
  }),
});

export const {
  useCreateTopicMutation,
  useGetAllTopicsQuery,
  useGetTopicByIdQuery,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  useSendMessageMutation,
  useGetMessagesQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockedUsersQuery,
  useCreateOneToOneChatMutation,
  useGetUserChatsQuery,
  useGetUsersForChatQuery,
  useSuspendUserMutation,
  useUnsuspendUserMutation,
} = chatApi;

