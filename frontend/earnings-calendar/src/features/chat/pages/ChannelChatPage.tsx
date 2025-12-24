import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  Chip,
  Alert,
  Collapse,
  Snackbar,
  Button,
} from '@mui/material';
import { Send, Users, Search, MoreVertical, X, ArrowLeft } from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';
import {
  useGetTopicByIdQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetBlockedUsersQuery,
} from '../../../services/chatApi';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../app/useAuth';
import type { Message } from '../../../services/chatApi';
import UserBlockDialog from '../components/UserBlockDialog';
import UserProfileDialog from '../components/UserProfileDialog';
import MessageBubble from '../components/MessageBubble';
import UnifiedChatLayout from '../components/UnifiedChatLayout';

export default function ChannelChatPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();

  // Security: Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will be handled by ProtectedRoute, but this is a safety check
  }

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [_isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // CRITICAL: Reset all state when topicId changes (fixes bug where old messages mix with new topic)
  useEffect(() => {
    if (!topicId) return;

    // Reset all chat-related state when switching topics
    setMessages([]);
    setMessage('');
    setTypingUsers(new Set());
    setIsInitialLoad(true);
    setCurrentPage(1);
    setHasMore(true);
    setIsLoadingMore(false);
    setAllLoadedPages(new Set());
    setSearchQuery('');
    setShowSearch(false);
    setIsScrolledToBottom(true);
    scrollPositionRef.current = 0;
    isLoadingMoreRef.current = false;
    messageIdsRef.current.clear();
    socketMessageCountRef.current = 0;
    apiMessageCountRef.current = 0;

    console.log('[ChannelChat] 🔄 Topic ID changed, resetting all state for:', topicId);
  }, [topicId]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'error',
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allLoadedPages, setAllLoadedPages] = useState<Set<number>>(new Set());
  const scrollPositionRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const socketMessageCountRef = useRef<number>(0);
  const apiMessageCountRef = useRef<number>(0);

  const { data: blockedUsers = [] } = useGetBlockedUsersQuery();
  const { data: topic, isLoading: topicLoading } = useGetTopicByIdQuery(topicId!);

  // Fetch initial messages with pagination
  const {
    data: messagesData,
    isLoading: messagesLoading,
    isSuccess: messagesQuerySuccess,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { topicId: topicId!, page: currentPage, limit: 50 },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: true,
      pollingInterval: 0, // Disable polling for initial load, we'll handle pagination manually
      skip: !topicId, // Skip if topicId is not available
    }
  );
  const [sendMessage] = useSendMessageMutation();

  const dedupeAndSort = useCallback((list: Message[]) => {
    const map = new Map<string, Message>();
    list.forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, []);

  // Initialize/merge messages from API (initial load + pagination)
  useEffect(() => {
    if (!messagesData?.messages || !topicId) return;

    // CRITICAL: Filter messages to only include those for the current topicId
    const topicMessages = messagesData.messages.filter(m => m.topicId === topicId);

    if (topicMessages.length === 0) {
      return;
    }

    const sortedMessages = [...topicMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Update pagination info
    if (messagesData.pagination) {
      const { page, totalPages } = messagesData.pagination;
      setHasMore(page < totalPages);
      console.log('[ChannelChat] 📊 Pagination:', { page, totalPages, hasMore: page < totalPages });
    }

    // First load (page 1)
    if (isInitialLoad && currentPage === 1) {
      setMessages(dedupeAndSort(sortedMessages));
      messageIdsRef.current = new Set(sortedMessages.map(m => m.id));
      apiMessageCountRef.current = sortedMessages.length;
      setAllLoadedPages(new Set([1]));
      console.log('[ChannelChat] 📥 Loaded', sortedMessages.length, 'messages from API for topic:', topicId, 'page:', currentPage);
      setIsInitialLoad(false);
      setIsLoadingMore(false);
      return;
    }

    // Loading more (pagination) - prepend older messages
    if (isLoadingMore && currentPage > 1 && !allLoadedPages.has(currentPage)) {
      const container = messagesContainerRef.current;
      const previousScrollHeight = container?.scrollHeight || 0;
      const previousScrollTop = container?.scrollTop || 0;

      setMessages((prev) => {
        const currentTopicMessages = prev.filter(m => m.topicId === topicId);
        const newOnes = sortedMessages.filter((m) => !messageIdsRef.current.has(m.id));
        if (newOnes.length > 0) {
          newOnes.forEach((m) => messageIdsRef.current.add(m.id));
          const merged = dedupeAndSort([...newOnes, ...currentTopicMessages]);
          console.log('[ChannelChat] 📥 Loaded', newOnes.length, 'older messages (page', currentPage, ')');

          // Restore scroll position after DOM update
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              const scrollDiff = newScrollHeight - previousScrollHeight;
              container.scrollTop = previousScrollTop + scrollDiff;
            }
          });

          return merged;
        }
        return prev;
      });

      setAllLoadedPages(prev => new Set([...prev, currentPage]));
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
      return;
    }

    // Subsequent refetch (e.g., reconnect) — merge any messages we might have missed
    setMessages((prev) => {
      const currentTopicMessages = prev.filter(m => m.topicId === topicId);
      const newOnes = sortedMessages.filter((m) => !messageIdsRef.current.has(m.id));
      if (!newOnes.length) {
        if (currentTopicMessages.length !== prev.length) {
          console.log('[ChannelChat] 🧹 Cleaned up', prev.length - currentTopicMessages.length, 'messages from other topics');
          return dedupeAndSort(currentTopicMessages);
        }
        return prev;
      }
      newOnes.forEach((m) => messageIdsRef.current.add(m.id));
      const merged = dedupeAndSort([...currentTopicMessages, ...newOnes]);
      console.log('[ChannelChat] 🔄 Merged', newOnes.length, 'missed messages from API refetch for topic:', topicId);
      return merged;
    });
  }, [messagesData, isInitialLoad, currentPage, isLoadingMore, allLoadedPages, dedupeAndSort, topicId]);

  // Real-time message handler with deduplication - optimized to reduce re-renders
  const handleNewMessage = useCallback((newMessage: Message) => {
    // Use requestAnimationFrame to batch updates and avoid blocking
    requestAnimationFrame(() => {
      console.log('[Frontend] 📨 Received new message via socket:', {
        messageId: newMessage.id,
        topicId: newMessage.topicId,
        currentTopicId: topicId,
        userId: newMessage.userId,
        content: newMessage.content.substring(0, 50),
      });

      // Check if message belongs to current topic
      if (newMessage.topicId === topicId) {
        // Check for duplicates
        if (messageIdsRef.current.has(newMessage.id)) {
          console.log('[Frontend] ⏭️ Duplicate message ignored:', newMessage.id);
          return;
        }

        messageIdsRef.current.add(newMessage.id);
        console.log('[Frontend] ✅ Adding SOCKET message to state:', newMessage.id);
        console.log('[Frontend] 📊 Total socket messages received:', socketMessageCountRef.current);

        setMessages((prev) => {
          // CRITICAL: Filter out any messages from other topics before adding new one
          const currentTopicMessages = prev.filter(m => m.topicId === topicId);
          const map = new Map<string, Message>();
          currentTopicMessages.forEach((m) => map.set(m.id, m));
          map.set(newMessage.id, newMessage); // replace or add
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      } else {
        console.log('[Frontend] ⏭️ Message ignored - wrong topic:', {
          messageTopicId: newMessage.topicId,
          currentTopicId: topicId,
        });
      }
    });
  }, [topicId]);

  // Socket connection and message listeners - CRITICAL: Must be set up correctly for real-time
  useEffect(() => {
    if (!socket || !topicId) {
      console.log('[ChannelChat] ⚠️ Socket or topicId not available:', { socket: !!socket, topicId });
      return;
    }

    console.log('[ChannelChat] 🔧 Setting up socket for topic:', topicId, {
      socketConnected: socket.connected,
      socketId: socket.id,
      isConnected,
    });

    // Set up message handler - CRITICAL for receiving messages
    // This handler MUST be defined inside useEffect to capture current topicId
    const messageHandler = (newMessage: Message) => {
      // CRITICAL: Only process messages for the current topicId
      if (newMessage.topicId !== topicId) {
        console.log('[ChannelChat] ⏭️ [SOCKET] Ignoring message from different topic:', {
          messageTopicId: newMessage.topicId,
          currentTopicId: topicId,
          messageId: newMessage.id,
        });
        return;
      }

      socketMessageCountRef.current += 1;
      console.log('[ChannelChat] 📨 [SOCKET] Received new-message event (#', socketMessageCountRef.current, '):', {
        messageId: newMessage.id,
        messageTopicId: newMessage.topicId,
        currentTopicId: topicId,
        userId: newMessage.userId,
        content: newMessage.content?.substring(0, 50),
        source: 'SOCKET',
        timestamp: new Date().toISOString(),
      });

      // Message already filtered by topicId above, so process it
      console.log('[ChannelChat] ✅ Processing SOCKET message for current topic');
      // Immediately process the message - handleNewMessage handles deduplication
      try {
        handleNewMessage(newMessage);
      } catch (error) {
        console.error('[ChannelChat] ❌ Error processing message:', error);
      }
    };

    const typingHandler = (data: { userId: string; username: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        requestAnimationFrame(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.username);
            } else {
              newSet.delete(data.username);
            }
            return newSet;
          });
        });
      }
    };

    // Function to join room
    const joinRoom = () => {
      if (socket && socket.connected) {
        console.log('[ChannelChat] 🚪 Joining topic room:', topicId, 'Socket ID:', socket.id);
        socket.emit('join-topic', { topicId }, (response: { success?: boolean; error?: string; topicId?: string; roomSize?: number }) => {
          if (response?.success) {
            console.log('[ChannelChat] ✅ Successfully joined topic room:', topicId, 'Room size:', response.roomSize);
            console.log('[ChannelChat] 📡 Ready to receive real-time messages for topic:', topicId);
            console.log('[ChannelChat] ✅ Socket setup complete - messages will arrive in real-time');
          } else {
            console.error('[ChannelChat] ❌ Failed to join topic room:', response);
          }
        });
      } else {
        console.warn('[ChannelChat] ⚠️ Socket not connected, cannot join room');
      }
    };

    // Function to setup listeners
    const setupListeners = () => {
      // Only clear message/typing listeners to avoid nuking reconnect/connect handlers
      socket.off('new-message', messageHandler);
      socket.off('user-typing', typingHandler);

      // Set up new listeners
      socket.on('new-message', messageHandler);
      socket.on('user-typing', typingHandler);

      const listenerCount = socket.listeners('new-message').length;
      console.log('[ChannelChat] ✅ Socket listeners registered for topic:', topicId);
      console.log('[ChannelChat] 📋 Listener count - new-message:', listenerCount);
      if (listenerCount !== 1) {
        console.warn('[ChannelChat] ⚠️ Expected 1 new-message listener, found', listenerCount);
      }
    };

    // Setup listeners immediately
    setupListeners();

    // Handle reconnection
    const reconnectHandler = () => {
      console.log('[ChannelChat] 🔄 Socket reconnected, setting up listeners and rejoining room');
      setupListeners();
      setTimeout(() => {
        joinRoom();
        // safety: refetch history in case any messages were missed during disconnect
        if (messagesQuerySuccess) {
          refetchMessages().catch((err) => console.warn('Refetch on reconnect failed', err));
        }
      }, 200);
    };
    socket.off('reconnect', reconnectHandler);
    socket.on('reconnect', reconnectHandler);

    // Join room if already connected, otherwise wait for connection
    if (socket.connected) {
      console.log('[ChannelChat] 🔌 Socket already connected, joining room');
      setTimeout(joinRoom, 100);
    } else {
      console.log('[ChannelChat] ⏳ Socket not connected, waiting for connection...');
      const connectHandler = () => {
        console.log('[ChannelChat] 🔌 Socket connected, setting up and joining room');
        setupListeners();
        setTimeout(() => {
          joinRoom();
          // Only refetch if query has been executed successfully
          if (messagesQuerySuccess) {
            refetchMessages().catch((err) => console.warn('Refetch on connect failed', err));
          }
        }, 100);
      };
      socket.off('connect', connectHandler);
      socket.once('connect', connectHandler);
    }

    // Cleanup function
    return () => {
      console.log('[ChannelChat] 🧹 Cleaning up socket listeners for topic:', topicId);
      socket.off('new-message', messageHandler);
      socket.off('user-typing', typingHandler);
      socket.off('reconnect', reconnectHandler);
      if (socket.connected) {
        socket.emit('leave-topic', { topicId });
      }
    };
  }, [socket, topicId, user?.id, handleNewMessage, isConnected]);

  // Load more messages when scrolling to top (infinite scroll) - MUST be defined before useEffect that uses it
  const loadMoreMessages = useCallback(async () => {
    if (!topicId || isLoadingMoreRef.current || !hasMore || isLoadingMore) {
      return;
    }

    const nextPage = currentPage + 1;
    if (allLoadedPages.has(nextPage)) {
      return; // Already loaded this page
    }

    console.log('[ChannelChat] 📥 Loading more messages, page:', nextPage);
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setCurrentPage(nextPage);
  }, [topicId, currentPage, hasMore, isLoadingMore, allLoadedPages]);

  // Improved scroll behavior - only auto-scroll if user is near bottom (like Instagram/WhatsApp)
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Only auto-scroll if user is near bottom or it's initial load
    if (isNearBottom || isInitialLoad) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: isInitialLoad ? 'auto' : 'smooth' });
        }
      }, 50);
    }
  }, [messages, isInitialLoad]);

  // Handle scroll for infinite scroll and scroll position tracking
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsScrolledToBottom(isNearBottom);

    // Load more messages when scrolling near top (within 200px)
    const isNearTop = scrollTop < 200;
    if (isNearTop && hasMore && !isLoadingMore && !isLoadingMoreRef.current) {
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  // Filter messages based on search
  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : messages;

  const handleSendMessage = async () => {
    if (!message.trim() || !topicId) return;

    const messageContent = message.trim();
    setErrorMessage(null);
    setMessage('');

    // Optimistic update - add message immediately to local state
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      topicId,
      userId: user?.id || '',
      user: {
        id: user?.id || '',
        username: user?.username || user?.email?.split('@')[0] || 'You',
        email: user?.email || '',
      },
      content: messageContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      edited: false,
      deleted: false,
    };

    // Add optimistic message (only if it belongs to current topic)
    setMessages((prev) => {
      const currentTopicMessages = prev.filter(m => m.topicId === topicId);
      return dedupeAndSort([...currentTopicMessages, optimisticMessage]);
    });
    messageIdsRef.current.add(tempId);

    // Prefer socket for sending to ensure broadcast to joined room
    const sendViaSocket = () =>
      new Promise<void>((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.emit(
          'send-message',
          { topicId, content: messageContent },
          (response: { success?: boolean; error?: string; message?: Message; warning?: string }) => {
            if (response?.success && response.message) {
              // Replace optimistic with server message (only current topic messages)
              setMessages((prev) => {
                const currentTopicMessages = prev.filter(m => m.topicId === topicId);
                const filtered = currentTopicMessages.filter((m) => m.id !== tempId);
                return dedupeAndSort([...filtered, response.message!]);
              });
              messageIdsRef.current.delete(tempId);
              messageIdsRef.current.add(response.message.id);
              if (response.warning) {
                console.warn('[ChannelChat] ⚠️ [SOCKET]', response.warning);
              } else {
                console.log('[ChannelChat] 📤 [SOCKET] Message sent via socket and acknowledged');
              }
              resolve();
            } else if (response?.success && response.message) {
              // Message was saved even if there was an error/warning (only current topic messages)
              setMessages((prev) => {
                const currentTopicMessages = prev.filter(m => m.topicId === topicId);
                const filtered = currentTopicMessages.filter((m) => m.id !== tempId);
                return dedupeAndSort([...filtered, response.message!]);
              });
              messageIdsRef.current.delete(tempId);
              messageIdsRef.current.add(response.message.id);
              console.warn('[ChannelChat] ⚠️ [SOCKET] Message saved but broadcast may have failed');
              resolve(); // Still resolve since message was saved
            } else {
              reject(new Error(response?.error || 'Socket send failed'));
            }
          }
        );
        // Safety timeout
        setTimeout(() => reject(new Error('Socket send timeout')), 5000);
      });

    try {
      await sendViaSocket();
    } catch (socketErr) {
      console.warn('[ChannelChat] ⚠️ Socket send failed, falling back to API:', socketErr);
      // Check if message was already saved (might have been saved before error)
      // Wait a bit to see if socket message arrives
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if we already have the message (by checking if tempId was replaced)
      const hasMessage = messageIdsRef.current.has(tempId) === false &&
        Array.from(messageIdsRef.current).some(id => {
          const msg = messages.find(m => m.id === id);
          return msg && msg.content === messageContent;
        });

      if (hasMessage) {
        console.log('[ChannelChat] ✅ Message already received via socket, skipping API fallback');
        return;
      }

      try {
        const savedMessage = await sendMessage({ topicId, content: messageContent }).unwrap();
        // Check for duplicates before adding
        if (messageIdsRef.current.has(savedMessage.id)) {
          console.log('[ChannelChat] ⏭️ Duplicate message from API fallback, ignoring:', savedMessage.id);
          setMessages((prev) => {
            const currentTopicMessages = prev.filter(m => m.topicId === topicId);
            return currentTopicMessages.filter((m) => m.id !== tempId);
          });
          messageIdsRef.current.delete(tempId);
          return;
        }
        // Replace optimistic message with real message (only current topic messages)
        console.log('[ChannelChat] 📤 [API] Message sent successfully (socket fallback)');
        setMessages((prev) => {
          const currentTopicMessages = prev.filter(m => m.topicId === topicId);
          const filtered = currentTopicMessages.filter((m) => m.id !== tempId);
          return dedupeAndSort([...filtered, savedMessage]);
        });
        messageIdsRef.current.delete(tempId);
        messageIdsRef.current.add(savedMessage.id);
      } catch (apiErr) {
        console.error('Failed to send message:', apiErr);
        // Remove optimistic message on error (only current topic messages)
        setMessages((prev) => {
          const currentTopicMessages = prev.filter(m => m.topicId === topicId);
          return currentTopicMessages.filter((m) => m.id !== tempId);
        });
        messageIdsRef.current.delete(tempId);
        const errorObj = apiErr as { data?: { message?: string; error?: string }; message?: string };
        const errorMsg =
          errorObj?.data?.message ||
          errorObj?.data?.error ||
          errorObj?.message ||
          'Failed to send message. Please try again.';
        setErrorMessage(errorMsg);
        setSnackbar({
          open: true,
          message: errorMsg,
          severity: 'error',
        });
        setMessage(messageContent); // Restore message on error
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (socket && topicId) {
      socket.emit('typing', { topicId, isTyping });
    }
  };

  const handleBlockUser = (userId: string, username: string) => {
    setSelectedUser({ id: userId, username });
    setBlockDialogOpen(true);
  };

  const handleUserClick = (userId: string, username: string, email: string) => {
    setSelectedProfileUser({ id: userId, username, email });
    setProfileDialogOpen(true);
  };

  // const handleScrollToBottom = () => {
  //   if (messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // };


  if (topicLoading) {
    return (
      <UnifiedChatLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </UnifiedChatLayout>
    );
  }

  if (!topic) {
    return (
      <UnifiedChatLayout>
        <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Topic not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/chat/topics')}>
            Back to Channels
          </Button>
        </Box>
      </UnifiedChatLayout>
    );
  }

  return (
    <UnifiedChatLayout>
      <Box
        sx={{
          width: '100%',
          height: '100vh', // Fixed viewport height
          maxHeight: '100vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: theme.palette.mode === 'light'
            ? '#fafafa' // Instagram-like light background
            : '#0a0a0a', // Instagram-like dark background
        }}
      >
        {/* Instagram-like Modern Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 0,
            borderBottom: theme.palette.mode === 'light'
              ? `1px solid ${alpha('#dbdbdb', 1)}` // Instagram border color
              : `1px solid ${alpha('#262626', 1)}`,
            bgcolor: theme.palette.mode === 'light'
              ? '#ffffff' // Pure white like Instagram
              : '#000000', // Pure black like Instagram dark mode
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: theme.palette.mode === 'light'
              ? `0 1px 0 ${alpha('#dbdbdb', 1)}`
              : `0 1px 0 ${alpha('#262626', 1)}`,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Back Button */}
            <IconButton
              onClick={() => navigate('/chat/topics')}
              sx={{
                color: 'text.primary',
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.1),
                },
              }}
            >
              <ArrowLeft size={20} />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {topic.title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {isConnected ? (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.7rem',
                      bgcolor: alpha(theme.palette.success.main, 0.15),
                      color: theme.palette.success.main,
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
                ) : (
                  <Chip
                    label="Connecting..."
                    size="small"
                    color="warning"
                    sx={{
                      height: 18,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
                )}
                <Chip
                  icon={<Users size={12} />}
                  label={`${topic.chat?._count?.members || 0} members`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              </Stack>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => setShowSearch(!showSearch)}
                sx={{
                  color: showSearch ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.1),
                    color: 'primary.main',
                  },
                }}
              >
                <Search size={20} />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.action.hover, 0.1),
                    color: 'primary.main',
                  },
                }}
              >
                <MoreVertical size={20} />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        {/* Search Bar */}
        <Collapse in={showSearch}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 0,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              bgcolor: theme.palette.mode === 'light'
                ? alpha(theme.palette.grey[50], 0.98)
                : alpha(theme.palette.grey[800], 0.98),
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                  endAdornment: searchQuery && (
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{ mr: -1 }}
                    >
                      <X size={16} />
                    </IconButton>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.paper, 0.98)
                      : alpha(theme.palette.grey[700], 0.5),
                  },
                }}
              />
            </Stack>
          </Paper>
        </Collapse>

        {/* Messages Area - Fixed Size with Scroll (Instagram-like) */}
        <Box
          ref={messagesContainerRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            minHeight: 0, // Critical for flex scrolling
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            p: { xs: 1.5, sm: 2, md: 2.5 },
            bgcolor: theme.palette.mode === 'light'
              ? '#fafafa' // Instagram-like light background
              : '#000000', // Instagram-like dark background
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.mode === 'light'
                ? alpha('#8e8e8e', 0.3) // Instagram-like scrollbar
                : alpha('#8e8e8e', 0.5),
              borderRadius: '4px',
              '&:hover': {
                background: theme.palette.mode === 'light'
                  ? alpha('#8e8e8e', 0.5)
                  : alpha('#8e8e8e', 0.7),
              },
            },
          }}
        >
          {/* Loading indicator at top when loading more messages */}
          {isLoadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                Loading older messages...
              </Typography>
            </Box>
          )}

          {(messagesLoading && isInitialLoad) || (isInitialLoad && !messagesData) ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, gap: 2, minHeight: 200 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">
                Loading messages...
              </Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start the conversation!
              </Typography>
            </Box>
          ) : filteredMessages.length === 0 && searchQuery ? (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No messages found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try a different search term
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0}>
              {filteredMessages.map((msg, index) => {
                const isOwnMessage = msg.userId === user?.id;
                const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                const showAvatar = !isOwnMessage && (!prevMsg || prevMsg.userId !== msg.userId ||
                  new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000);
                const showUsername = !isOwnMessage && (!prevMsg || prevMsg.userId !== msg.userId);

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwnMessage={isOwnMessage}
                    showAvatar={showAvatar}
                    showUsername={showUsername}
                    onBlockUser={handleBlockUser}
                    onUserClick={handleUserClick}
                    prevMessage={prevMsg}
                    messageStatus="delivered" // In production, get from message metadata
                  />
                );
              })}
              {typingUsers.size > 0 && (
                <Box sx={{ px: 1, py: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Instagram-like Input Footer */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 0,
            borderTop: theme.palette.mode === 'light'
              ? `1px solid ${alpha('#dbdbdb', 1)}` // Instagram border
              : `1px solid ${alpha('#262626', 1)}`,
            bgcolor: theme.palette.mode === 'light'
              ? '#ffffff' // Pure white
              : '#000000', // Pure black
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Collapse in={!!errorMessage}>
            <Alert
              severity="error"
              onClose={() => setErrorMessage(null)}
              sx={{ mb: 1.5, borderRadius: 2 }}
            >
              {errorMessage}
            </Alert>
          </Collapse>
          <Stack direction="row" spacing={1.5} alignItems="flex-end">
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setMessage((prev) => prev + emoji);
                setErrorMessage(null);
              }}
            />
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrorMessage(null);
                handleTyping(true);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                  handleTyping(false);
                }
              }}
              onBlur={() => handleTyping(false)}
              disabled={!isConnected}
              error={!!errorMessage}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  bgcolor: theme.palette.mode === 'light'
                    ? alpha(theme.palette.background.paper, 0.98)
                    : alpha(theme.palette.grey[700], 0.5),
                  fontSize: '0.9375rem',
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, 0.2),
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: '1.5px',
                  },
                  '&.Mui-error fieldset': {
                    borderColor: theme.palette.error.main,
                  },
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                mb: 0.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  bgcolor: alpha(theme.palette.action.disabled, 0.2),
                  color: alpha(theme.palette.text.disabled, 0.5),
                },
              }}
            >
              <Send size={20} />
            </IconButton>
          </Stack>
        </Paper>

        {/* Error Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Block User Dialog */}
        {selectedUser && (
          <UserBlockDialog
            open={blockDialogOpen}
            onClose={() => {
              setBlockDialogOpen(false);
              setSelectedUser(null);
            }}
            userId={selectedUser.id}
            username={selectedUser.username}
            isBlocked={blockedUsers.some((b) => {
              const blocked = (b as { blocked?: { id: string } }).blocked;
              return blocked?.id === selectedUser.id;
            })}
          />
        )}

        {/* User Profile Dialog */}
        {selectedProfileUser && (
          <UserProfileDialog
            open={profileDialogOpen}
            onClose={() => {
              setProfileDialogOpen(false);
              setSelectedProfileUser(null);
            }}
            userId={selectedProfileUser.id}
            username={selectedProfileUser.username}
            email={selectedProfileUser.email}
          />
        )}
      </Box>
    </UnifiedChatLayout>
  );
}
