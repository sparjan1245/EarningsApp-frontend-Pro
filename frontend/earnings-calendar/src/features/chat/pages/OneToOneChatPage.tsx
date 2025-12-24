import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Stack,
  Avatar,
  alpha,
  useTheme,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import { Send, Search, MoreVertical, X, ArrowLeft, Ban, ChevronDown } from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';
import { useGetMessagesQuery, useSendMessageMutation, useGetUserChatsQuery, useGetBlockedUsersQuery } from '../../../services/chatApi';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../app/useAuth';
import type { Message, Chat } from '../../../services/chatApi';
import MessageBubble from '../components/MessageBubble';
import UserProfileDialog from '../components/UserProfileDialog';
import UserBlockDialog from '../components/UserBlockDialog';
import UnifiedChatLayout from '../components/UnifiedChatLayout';

export default function OneToOneChatPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const socketMessageCountRef = useRef<number>(0);
  const apiMessageCountRef = useRef<number>(0);

  const { data: chats = [] } = useGetUserChatsQuery();
  const { data: blockedUsers = [] } = useGetBlockedUsersQuery();
  
  // Get blocked user IDs
  const blockedUserIds = useMemo(() => {
    return new Set(
      blockedUsers.map((b) => {
        const blocked = (b as { blocked?: { id: string } }).blocked;
        return blocked?.id;
      }).filter(Boolean) as string[]
    );
  }, [blockedUsers]);

  // Fetch messages (history) once; use socket for live, allow refetch on reconnect to catch missed messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { chatId: chatId!, page: 1, limit: 100 },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: true, // allow refetch on reconnect
      pollingInterval: 4000, // safety fallback so updates arrive even if socket misses
      skip: !chatId || !isAuthenticated,
    }
  );

  // CRITICAL: Reset all state when chatId changes (fixes bug where old messages mix with new chat)
  useEffect(() => {
    if (!chatId) return;
    
    console.log('[OneToOneChat] 🔄 Chat ID changed, resetting all state for:', chatId);
    
    // IMMEDIATELY clear all messages and state to prevent bleed
    setMessages([]);
    setMessage('');
    setChat(null);
    setTypingUsers(new Set());
    setIsInitialLoad(true);
    setSearchQuery('');
    setShowSearch(false);
    setIsScrolledToBottom(true);
    messageIdsRef.current.clear();
    socketMessageCountRef.current = 0;
    apiMessageCountRef.current = 0;
    
    // Force scroll to top when switching chats
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [chatId]);

  const dedupeAndSort = useCallback((list: Message[]) => {
    const map = new Map<string, Message>();
    list.forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, []);
  const [sendMessage] = useSendMessageMutation();

  useEffect(() => {
    const foundChat = chats.find((c) => c.id === chatId);
    if (foundChat) {
      setChat(foundChat);
    }
  }, [chats, chatId]);

  // Initialize/merge messages from API (initial load + any refetches on reconnect)
  useEffect(() => {
    if (!messagesData?.messages || !chatId) return;

    // CRITICAL: Only process messages for the current chatId to prevent bleed
    const chatMessages = messagesData.messages.filter(m => m.chatId === chatId);
    if (chatMessages.length === 0) {
      console.log('[OneToOneChat] ⚠️ No messages found for chatId:', chatId);
      setIsInitialLoad(false);
      return;
    }

    const sortedMessages = [...chatMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // First load - completely replace messages
    if (isInitialLoad) {
      console.log('[OneToOneChat] 📥 Loading', sortedMessages.length, 'messages for chat:', chatId);
      setMessages(dedupeAndSort(sortedMessages));
      messageIdsRef.current = new Set(sortedMessages.map(m => m.id));
      apiMessageCountRef.current = sortedMessages.length;
      setIsInitialLoad(false);
      return;
    }

    // Subsequent refetch (e.g., reconnect) — merge any messages we might have missed
    setMessages((prev) => {
      // Only merge messages that belong to current chat
      const currentChatMessages = prev.filter(m => m.chatId === chatId);
      const newOnes = sortedMessages.filter((m) => !messageIdsRef.current.has(m.id));
      if (!newOnes.length) return currentChatMessages;
      newOnes.forEach((m) => messageIdsRef.current.add(m.id));
      const merged = dedupeAndSort([...currentChatMessages, ...newOnes]);
      console.log('[OneToOneChat] 🔄 Merged', newOnes.length, 'missed messages from API refetch');
      return merged;
    });
  }, [messagesData, isInitialLoad, dedupeAndSort, chatId]);

  // Real-time message handler with deduplication - optimized to reduce re-renders
  const handleNewMessage = useCallback((newMessage: Message) => {
    // Use requestAnimationFrame to batch updates and avoid blocking
    requestAnimationFrame(() => {
      console.log('[Frontend] 📨 Received new message via socket:', {
        messageId: newMessage.id,
        chatId: newMessage.chatId,
        currentChatId: chatId,
        userId: newMessage.userId,
        content: newMessage.content.substring(0, 50),
      });
      
      // Check if message belongs to current chat
      if (newMessage.chatId === chatId) {
        // Check for duplicates
        if (messageIdsRef.current.has(newMessage.id)) {
          console.log('[Frontend] ⏭️ Duplicate message ignored:', newMessage.id);
          return;
        }
        
        messageIdsRef.current.add(newMessage.id);
        console.log('[Frontend] ✅ Adding SOCKET message to state:', newMessage.id);
        console.log('[Frontend] 📊 Total socket messages received:', socketMessageCountRef.current);
        
        setMessages((prev) => {
          const map = new Map<string, Message>();
          prev.forEach((m) => map.set(m.id, m));
          map.set(newMessage.id, newMessage); // replace or add
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      } else {
        console.log('[Frontend] ⏭️ Message ignored - wrong chat:', {
          messageChatId: newMessage.chatId,
          currentChatId: chatId,
        });
      }
    });
  }, [chatId]);

  // Socket connection and message listeners - CRITICAL: Must be set up correctly for real-time
  useEffect(() => {
    if (!socket || !chatId) {
      console.log('[OneToOneChat] ⚠️ Socket or chatId not available:', { socket: !!socket, chatId });
      return;
    }

    console.log('[OneToOneChat] 🔧 Setting up socket for chat:', chatId, {
      socketConnected: socket.connected,
      socketId: socket.id,
      isConnected,
    });

    // Set up message handler - CRITICAL for receiving messages
    const messageHandler = (newMessage: Message) => {
      socketMessageCountRef.current += 1;
      console.log('[OneToOneChat] 📨 [SOCKET] Received new-message event (#', socketMessageCountRef.current, '):', {
        messageId: newMessage.id,
        chatId: newMessage.chatId,
        currentChatId: chatId,
        userId: newMessage.userId,
        content: newMessage.content?.substring(0, 50),
        source: 'SOCKET',
      });
      
      // Only process if message belongs to current chat
      if (newMessage.chatId === chatId) {
        console.log('[OneToOneChat] ✅ Processing SOCKET message for current chat');
        // Call handleNewMessage directly (it's already wrapped in requestAnimationFrame)
        handleNewMessage(newMessage);
      } else {
        console.log('[OneToOneChat] ⏭️ SOCKET message ignored - different chat:', {
          messageChatId: newMessage.chatId,
          currentChatId: chatId,
        });
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
        console.log('[OneToOneChat] 🚪 Joining chat room:', chatId, 'Socket ID:', socket.id);
        socket.emit('join-chat', { chatId }, (response: { success?: boolean; error?: string; chatId?: string; roomSize?: number }) => {
          if (response?.success) {
            console.log('[OneToOneChat] ✅ Successfully joined chat room:', chatId, 'Room size:', response.roomSize);
            console.log('[OneToOneChat] 📡 Ready to receive real-time messages for chat:', chatId);
            console.log('[OneToOneChat] ✅ Socket setup complete - messages will arrive in real-time');
          } else {
            console.error('[OneToOneChat] ❌ Failed to join chat room:', response);
          }
        });
      } else {
        console.warn('[OneToOneChat] ⚠️ Socket not connected, cannot join room');
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
      console.log('[OneToOneChat] ✅ Socket listeners registered for chat:', chatId);
      console.log('[OneToOneChat] 📋 Listener count - new-message:', listenerCount);
      if (listenerCount !== 1) {
        console.warn('[OneToOneChat] ⚠️ Expected 1 new-message listener, found', listenerCount);
      }
    };

    // Setup listeners immediately
    setupListeners();

    // Handle reconnection
    const reconnectHandler = () => {
      console.log('[OneToOneChat] 🔄 Socket reconnected, setting up listeners and rejoining room');
      setupListeners();
      setTimeout(() => {
        joinRoom();
        // safety: refetch history in case any messages were missed during disconnect
        refetchMessages().catch((err) => console.warn('Refetch on reconnect failed', err));
      }, 200);
    };
    socket.off('reconnect', reconnectHandler);
    socket.on('reconnect', reconnectHandler);

    // Join room if already connected, otherwise wait for connection
    if (socket.connected) {
      console.log('[OneToOneChat] 🔌 Socket already connected, joining room');
      setTimeout(joinRoom, 100);
    } else {
      console.log('[OneToOneChat] ⏳ Socket not connected, waiting for connection...');
      const connectHandler = () => {
        console.log('[OneToOneChat] 🔌 Socket connected, setting up and joining room');
        setupListeners();
        setTimeout(() => {
          joinRoom();
          // initial sync to be safe
          refetchMessages().catch((err) => console.warn('Refetch on connect failed', err));
        }, 100);
      };
      socket.off('connect', connectHandler);
      socket.once('connect', connectHandler);
    }

    // Cleanup function - CRITICAL: Abort old listeners when chatId changes
    return () => {
      console.log('[OneToOneChat] 🧹 Cleaning up socket listeners for chat:', chatId);
      socket.off('new-message', messageHandler);
      socket.off('user-typing', typingHandler);
      socket.off('reconnect', reconnectHandler);
      if (socket.connected && chatId) {
        socket.emit('leave-chat', { chatId });
      }
    };
  }, [socket, chatId, user?.id, handleNewMessage, isConnected, refetchMessages]);

  // Improved scroll behavior - only auto-scroll if user is near bottom (like Instagram/WhatsApp)
  useEffect(() => {
    if (!messagesContainerRef.current || !messagesEndRef.current || !chatId) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    // Always scroll to bottom on initial load or when new messages arrive and user is near bottom
    if (isInitialLoad || isNearBottom) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          // Scroll to bottom smoothly
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: isInitialLoad ? 'auto' : 'smooth',
          });
        }
      });
    }
  }, [messages, isInitialLoad, chatId]);

  // Track scroll position with throttling for better performance
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          setIsScrolledToBottom(isNearBottom);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter messages - exclude messages from blocked users and apply search
  const filteredMessages = useMemo(() => {
    let filtered = messages.filter((msg) => !blockedUserIds.has(msg.userId));
    
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((msg) =>
        msg.content.toLowerCase().includes(query) ||
        msg.user.username.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [messages, blockedUserIds, searchQuery]);

  const handleUserClick = () => {
    setProfileDialogOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleBlockClick = () => {
    handleMenuClose();
    setBlockDialogOpen(true);
  };

  const handleScrollToBottom = () => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId || isUserBlocked) return;

    const messageContent = message.trim();
    setMessage('');

    // Optimistic update - add message immediately to local state
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      chatId,
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

    // Add optimistic message
    setMessages((prev) => dedupeAndSort([...prev, optimisticMessage]));
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
          { chatId, content: messageContent },
          (response: { success?: boolean; error?: string; message?: Message; warning?: string }) => {
            if (response?.success && response.message) {
              // Replace optimistic with server message
              const serverMessage = response.message;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempId);
                return dedupeAndSort([...filtered, serverMessage]);
              });
              messageIdsRef.current.delete(tempId);
              messageIdsRef.current.add(serverMessage.id);
              if (response.warning) {
                console.warn('[OneToOneChat] ⚠️ [SOCKET]', response.warning);
              } else {
                console.log('[OneToOneChat] 📤 [SOCKET] Message sent via socket and acknowledged');
              }
              resolve();
            } else if (response?.success && response.message) {
              // Message was saved even if there was an error/warning
              const serverMessage = response.message;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempId);
                return dedupeAndSort([...filtered, serverMessage]);
              });
              messageIdsRef.current.delete(tempId);
              messageIdsRef.current.add(serverMessage.id);
              console.warn('[OneToOneChat] ⚠️ [SOCKET] Message saved but broadcast may have failed');
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
      console.warn('[OneToOneChat] ⚠️ Socket send failed, falling back to API:', socketErr);
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
        console.log('[OneToOneChat] ✅ Message already received via socket, skipping API fallback');
        return;
      }
      
      try {
        const savedMessage = await sendMessage({ chatId, content: messageContent }).unwrap();
        // Check for duplicates before adding
        if (messageIdsRef.current.has(savedMessage.id)) {
          console.log('[OneToOneChat] ⏭️ Duplicate message from API fallback, ignoring:', savedMessage.id);
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          messageIdsRef.current.delete(tempId);
          return;
        }
        // Replace optimistic message with real message
        console.log('[OneToOneChat] 📤 [API] Message sent successfully (socket fallback)');
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempId);
          return dedupeAndSort([...filtered, savedMessage]);
        });
        messageIdsRef.current.delete(tempId);
        messageIdsRef.current.add(savedMessage.id);
      } catch (apiErr) {
        console.error('Failed to send message:', apiErr);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        messageIdsRef.current.delete(tempId);
        setMessage(messageContent); // Restore message on error
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (socket && chatId) {
      socket.emit('typing', { chatId, isTyping });
    }
  };

  const otherUser = useMemo(() => {
    return chat?.members.find((m) => m.userId !== user?.id)?.user;
  }, [chat, user?.id]);

  const isUserBlocked = useMemo(() => {
    if (!otherUser) return false;
    return blockedUserIds.has(otherUser.id);
  }, [otherUser, blockedUserIds]);

  // Security: Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will be handled by ProtectedRoute, but this is a safety check
  }

  if (!chat) {
    return (
      <UnifiedChatLayout>
        <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Chat not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/chat/chats')}>
            Back to Chats
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
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Critical for flex scrolling
          bgcolor: theme.palette.mode === 'light'
            ? alpha(theme.palette.grey[50], 0.5)
            : alpha(theme.palette.grey[900], 0.3),
        }}
      >
      {/* WhatsApp/Instagram-like Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: 0,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: theme.palette.mode === 'light'
            ? '#f0f2f5'
            : '#202c33',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Back Button */}
          <IconButton
            onClick={() => navigate('/chat/chats')}
            sx={{
              color: 'text.primary',
              '&:hover': {
                bgcolor: alpha(theme.palette.action.hover, 0.1),
              },
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          {otherUser && (
            <Avatar
              onClick={() => handleUserClick()}
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.palette.primary.main,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
              }}
            >
              {otherUser.username.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight={500}
              sx={{
                fontSize: { xs: '0.9375rem', sm: '1rem' },
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 0.25,
              }}
            >
              {otherUser?.username || 'Unknown User'}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isConnected ? 'online' : 'offline'}
            </Typography>
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
              onClick={handleMenuOpen}
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
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                mt: 1,
                minWidth: 200,
                boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={handleBlockClick}
              sx={{
                color: isUserBlocked ? theme.palette.primary.main : theme.palette.error.main,
                '&:hover': {
                  bgcolor: alpha(isUserBlocked ? theme.palette.primary.main : theme.palette.error.main, 0.1),
                },
              }}
            >
              <ListItemIcon>
                <Ban size={18} color={isUserBlocked ? theme.palette.primary.main : theme.palette.error.main} />
              </ListItemIcon>
              <ListItemText>
                {isUserBlocked ? 'Unblock User' : 'Block User'}
              </ListItemText>
            </MenuItem>
          </Menu>
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

      {/* Messages Area - WhatsApp/Instagram Style */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          p: { xs: 1, sm: 1.5, md: 2 },
          minHeight: 0, // Critical for flex scrolling
          bgcolor: theme.palette.mode === 'light'
            ? '#efeae2'
            : '#0b141a',
          backgroundImage: theme.palette.mode === 'light'
            ? `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63-85c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM27 18c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm40 25c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4zm60-60c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4z' fill='%23d4d4d4' fill-opacity='0.05'/%3E%3C/svg%3E")`
            : `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63-85c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM27 18c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm40 25c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4zm60-60c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4-4 1.79-4 4z' fill='%23ffffff' fill-opacity='0.02'/%3E%3C/svg%3E")`,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.grey[400], 0.4),
            borderRadius: '3px',
            '&:hover': {
              background: alpha(theme.palette.grey[400], 0.6),
            },
          },
        }}
      >
        {messagesLoading && isInitialLoad ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2, 
              p: 2,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading messages...
            </Typography>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box 
                key={i} 
                sx={{ 
                  display: 'flex', 
                  gap: 1.5, 
                  alignItems: 'flex-start',
                  width: '100%',
                  justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
                }}
              >
                {i % 2 === 0 && <Box sx={{ flex: 1 }} />}
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1, maxWidth: '70%' }}>
                  <Skeleton variant="text" width="40%" height={16} sx={{ mb: 0.5 }} />
                  <Skeleton variant="rectangular" width="100%" height={i % 2 === 0 ? 50 : 70} sx={{ borderRadius: 2 }} />
                </Box>
                {i % 2 !== 0 && <Box sx={{ flex: 1 }} />}
              </Box>
            ))}
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
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No messages yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start the conversation!
            </Typography>
          </Box>
        ) : (
          <Stack 
            spacing={0}
            sx={{
              width: '100%',
            }}
          >
            {filteredMessages.map((msg, index) => {
              // CRITICAL: Ensure message belongs to current chat
              if (msg.chatId !== chatId) {
                console.warn('[OneToOneChat] ⚠️ Message with wrong chatId filtered out:', {
                  messageChatId: msg.chatId,
                  currentChatId: chatId,
                });
                return null;
              }
              
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
                  onUserClick={handleUserClick}
                  prevMessage={prevMsg}
                  messageStatus="delivered" // In production, get from message metadata
                />
              );
            })}
            {typingUsers.size > 0 && (
              <Box 
                sx={{ 
                  px: 2, 
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.3,
                    '& > div': {
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: theme.palette.text.secondary,
                      animation: 'typing 1.4s infinite',
                      '&:nth-of-type(1)': {
                        animationDelay: '0s',
                      },
                      '&:nth-of-type(2)': {
                        animationDelay: '0.2s',
                      },
                      '&:nth-of-type(3)': {
                        animationDelay: '0.4s',
                      },
                    },
                    '@keyframes typing': {
                      '0%, 60%, 100%': {
                        transform: 'translateY(0)',
                        opacity: 0.4,
                      },
                      '30%': {
                        transform: 'translateY(-8px)',
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box />
                  <Box />
                  <Box />
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    fontStyle: 'italic', 
                    fontSize: '0.8125rem',
                    opacity: 0.8,
                  }}
                >
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        )}
        
        {/* Scroll to bottom button (like WhatsApp) */}
        {!isScrolledToBottom && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 80,
              right: { xs: 16, sm: 24 },
              zIndex: 5,
            }}
          >
            <IconButton
              onClick={handleScrollToBottom}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                width: 48,
                height: 48,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'scale(1.1)',
                },
              }}
            >
              <ChevronDown size={20} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Premium Modern Input Footer */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 0,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.mode === 'light'
            ? `linear-gradient(180deg, ${alpha('#f0f2f5', 0.98)} 0%, ${alpha('#f5f7fa', 0.98)} 100%)`
            : `linear-gradient(180deg, ${alpha('#1e2a30', 0.98)} 0%, ${alpha('#1a2529', 0.98)} 100%)`,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          boxShadow: theme.palette.mode === 'light'
            ? `0 -4px 20px ${alpha(theme.palette.common.black, 0.08)}, 0 -1px 0 ${alpha(theme.palette.common.white, 0.5)} inset`
            : `0 -4px 20px ${alpha(theme.palette.common.black, 0.4)}, 0 -1px 0 ${alpha(theme.palette.common.white, 0.05)} inset`,
        }}
      >
        <Stack 
          direction="row" 
          spacing={1.5} 
          alignItems="flex-end"
          sx={{
            position: 'relative',
          }}
        >
          {/* Emoji Picker Button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.5,
            }}
          >
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setMessage((prev) => prev + emoji);
              }}
            />
          </Box>

          {/* Input Field Container */}
          <Box 
            sx={{ 
              flex: 1, 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={isUserBlocked ? "User is blocked" : "Type a message..."}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping(true);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (message.trim() && !isUserBlocked && isConnected) {
                    handleSendMessage();
                    handleTyping(false);
                  }
                }
              }}
              onBlur={() => handleTyping(false)}
              disabled={!isConnected || isUserBlocked}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'light'
                    ? '#ffffff'
                    : alpha('#2a3942', 0.95),
                  fontSize: '0.9375rem',
                  py: 1.25,
                  px: 2,
                  minHeight: 48,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: theme.palette.mode === 'light'
                    ? `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}, 0 0 0 1px ${alpha(theme.palette.divider, 0.1)}`
                    : `0 2px 8px ${alpha(theme.palette.common.black, 0.3)}, 0 0 0 1px ${alpha(theme.palette.divider, 0.2)}`,
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'light'
                      ? `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`
                      : `0 4px 12px ${alpha(theme.palette.common.black, 0.4)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}, 0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                    transform: 'translateY(-1px)',
                    bgcolor: theme.palette.mode === 'light'
                      ? '#ffffff'
                      : alpha('#2a3942', 1),
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(theme.palette.action.disabled, 0.04),
                    boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
                    cursor: 'not-allowed',
                  },
                },
                '& .MuiInputBase-input': {
                  color: theme.palette.text.primary,
                  lineHeight: 1.5,
                  '&::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 0.65,
                    fontWeight: 400,
                  },
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: alpha(theme.palette.text.secondary, 0.2),
                    borderRadius: '3px',
                    '&:hover': {
                      background: alpha(theme.palette.text.secondary, 0.3),
                    },
                  },
                },
              }}
            />
          </Box>

          {/* Send Button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.5,
            }}
          >
            <IconButton
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected || isUserBlocked}
              sx={{
                width: { xs: 48, sm: 52 },
                height: { xs: 48, sm: 52 },
                borderRadius: 2.5,
                bgcolor: message.trim() && isConnected && !isUserBlocked
                  ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                  : alpha(theme.palette.action.disabled, 0.12),
                color: message.trim() && isConnected && !isUserBlocked
                  ? 'white'
                  : alpha(theme.palette.text.disabled, 0.4),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: message.trim() && isConnected && !isUserBlocked
                  ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)} inset`
                  : `0 2px 4px ${alpha(theme.palette.common.black, 0.08)}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': message.trim() && isConnected && !isUserBlocked ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.2)} 0%, transparent 100%)`,
                  pointerEvents: 'none',
                } : {},
                '&:hover:not(:disabled)': {
                  transform: 'translateY(-2px) scale(1.05)',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.15)} inset`,
                  bgcolor: message.trim() && isConnected && !isUserBlocked
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                    : undefined,
                },
                '&:active:not(:disabled)': {
                  transform: 'translateY(0) scale(0.98)',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                '&:disabled': {
                  cursor: 'not-allowed',
                  opacity: 0.5,
                },
                '& svg': {
                  filter: message.trim() && isConnected && !isUserBlocked
                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                    : 'none',
                  transition: 'transform 0.2s ease',
                },
                '&:hover:not(:disabled) svg': {
                  transform: 'translateX(1px)',
                },
              }}
            >
              <Send size={22} strokeWidth={2.5} />
            </IconButton>
          </Box>
        </Stack>
      </Paper>

      {/* User Profile Dialog */}
      {otherUser && (
        <UserProfileDialog
          open={profileDialogOpen}
          onClose={() => {
            setProfileDialogOpen(false);
          }}
          userId={otherUser.id}
          username={otherUser.username}
          email={otherUser.email}
        />
      )}

      {/* Block User Dialog */}
      {otherUser && (
        <UserBlockDialog
          open={blockDialogOpen}
          onClose={() => {
            setBlockDialogOpen(false);
          }}
          userId={otherUser.id}
          username={otherUser.username}
          isBlocked={isUserBlocked}
        />
      )}
      </Box>
    </UnifiedChatLayout>
  );
}
