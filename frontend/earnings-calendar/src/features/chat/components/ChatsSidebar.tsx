import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  alpha,
  useTheme,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import { Search, User, Users } from 'lucide-react';
import { useGetUserChatsQuery } from '../../../services/chatApi';
import { useAuth } from '../../../app/useAuth';
import type { Chat } from '../../../services/chatApi';

interface ChatsSidebarProps {
  onClose?: () => void;
}

export default function ChatsSidebar({ onClose }: ChatsSidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { data: chats = [], isLoading } = useGetUserChatsQuery();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Only show ONE_TO_ONE chats when on one-to-one page
  const isOneToOnePage = location.pathname.startsWith('/chat/one-to-one/');
  const relevantChats = isOneToOnePage 
    ? chats.filter((chat) => chat.type === 'ONE_TO_ONE')
    : chats;

  const filteredChats = relevantChats.filter((chat) => {
    if (chat.type === 'ONE_TO_ONE') {
      const otherUser = chat.members.find((m) => m.userId !== user?.id)?.user;
      return (
        otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        otherUser?.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return chat.topic?.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const handleChatClick = (chat: Chat) => {
    if (chat.type === 'ONE_TO_ONE') {
      navigate(`/chat/one-to-one/${chat.id}`);
    } else if (chat.topicId) {
      navigate(`/chat/topic/${chat.topicId}`);
    }
    onClose?.();
  };

  const formatLastMessage = (chat: Chat) => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMsg = chat.messages[0];
      return lastMsg.content.length > 40
        ? lastMsg.content.substring(0, 40) + '...'
        : lastMsg.content;
    }
    return 'No messages yet';
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: '100%', sm: 320, md: 360 },
        height: '100%',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderRight: theme.palette.mode === 'light'
          ? `1px solid ${alpha('#dbdbdb', 1)}` // Instagram border
          : `1px solid ${alpha('#262626', 1)}`,
        bgcolor: theme.palette.mode === 'light'
          ? '#ffffff' // Instagram white
          : '#000000', // Instagram black
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {isOneToOnePage ? 'One-to-One Chats' : 'All Chats'}
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color={theme.palette.text.secondary} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'light'
                ? alpha(theme.palette.background.paper, 0.98)
                : alpha(theme.palette.grey[700], 0.5),
              '& fieldset': {
                borderColor: alpha(theme.palette.divider, 0.2),
              },
            },
          }}
        />
      </Box>

      {/* Chats List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading chats...
            </Typography>
          </Box>
        ) : filteredChats.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <User size={48} color={theme.palette.text.secondary} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No chats found' : 'No chats available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredChats.map((chat, index) => {
              const isActive = chatId === chat.id;
              const isOneToOne = chat.type === 'ONE_TO_ONE';
              const otherUser = chat.members.find((m) => m.userId !== user?.id)?.user;

              return (
                <Box key={chat.id}>
                  <ListItemButton
                    onClick={() => handleChatClick(chat)}
                    selected={isActive}
                    sx={{
                      p: 2,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: isOneToOne
                            ? theme.palette.secondary.main
                            : theme.palette.primary.main,
                        }}
                      >
                        {isOneToOne ? (
                          otherUser ? (
                            otherUser.username.charAt(0).toUpperCase()
                          ) : (
                            <User size={24} />
                          )
                        ) : (
                          <Users size={24} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {isOneToOne
                              ? otherUser?.username || 'Unknown User'
                              : chat.topic?.title || 'Group Chat'}
                          </Typography>
                          {isOneToOne && (
                            <Chip
                              label="1-on-1"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.main,
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              fontSize: '0.8125rem',
                            }}
                          >
                            {formatLastMessage(chat)}
                          </Typography>
                          {chat.lastMessageAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {formatTime(chat.lastMessageAt)}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                  </ListItemButton>
                  {index < filteredChats.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Paper>
  );
}
