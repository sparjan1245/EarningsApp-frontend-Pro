import { Box, Typography, Stack, Avatar, alpha, useTheme, Paper } from '@mui/material';
import { MoreVertical, Check, CheckCheck } from 'lucide-react';
import { IconButton } from '@mui/material';
import type { Message } from '../../../services/chatApi';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showUsername: boolean;
  onBlockUser?: (userId: string, username: string) => void;
  onUserClick?: (userId: string, username: string, email: string) => void;
  prevMessage?: Message | null;
  messageStatus?: 'sent' | 'delivered' | 'read'; // Message status for own messages
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  showUsername,
  onBlockUser,
  onUserClick,
  prevMessage,
  messageStatus = 'sent',
}: MessageBubbleProps) {
  const theme = useTheme();
  
  // Check if this message should show a date separator
  const showDateSeparator = !prevMessage || 
    new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();
  
  // Check if messages are from same user and within 5 minutes (group them)
  const isGrouped = prevMessage && 
    prevMessage.userId === message.userId &&
    new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 300000; // 5 minutes

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  };

  return (
    <Box>
      {showDateSeparator && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            my: 2.5,
            position: 'relative',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              width: '30%',
              height: '1px',
              bgcolor: alpha(theme.palette.divider, 0.2),
            },
            '&::before': {
              left: 0,
            },
            '&::after': {
              right: 0,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: 3,
              bgcolor: theme.palette.mode === 'light'
                ? alpha(theme.palette.grey[200], 0.8)
                : alpha(theme.palette.grey[700], 0.6),
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
            }}
          >
            {formatDate(message.createdAt)}
          </Typography>
        </Box>
      )}
      
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
          maxWidth: { xs: '85%', sm: '75%', md: '65%' },
          alignItems: 'flex-end',
          mb: isGrouped ? 0.5 : 1.5,
          px: { xs: 0.5, sm: 1 },
          animation: 'fadeIn 0.2s ease-in',
          '@keyframes fadeIn': {
            from: {
              opacity: 0,
              transform: 'translateY(4px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        {showAvatar && !isOwnMessage && (
          <Avatar
            onClick={() => onUserClick?.(message.userId, message.user.username, message.user.email)}
            sx={{
              width: 32,
              height: 32,
              bgcolor: theme.palette.primary.main,
              fontSize: 12,
              flexShrink: 0,
              opacity: isGrouped ? 0 : 1,
              transition: 'opacity 0.2s, transform 0.2s',
              cursor: onUserClick ? 'pointer' : 'default',
              '&:hover': onUserClick ? {
                transform: 'scale(1.1)',
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              } : {},
            }}
          >
            {message.user.username.charAt(0).toUpperCase()}
          </Avatar>
        )}
        {!showAvatar && !isOwnMessage && <Box sx={{ width: 33 }} />}
        {isOwnMessage && <Box sx={{ width: 33 }} />}
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {showUsername && !isOwnMessage && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.5,
                ml: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              {message.user.username}
            </Typography>
          )}
          
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.2, sm: 1.5 },
              borderRadius: isOwnMessage 
                ? '18px 18px 4px 18px' 
                : '18px 18px 18px 4px',
              bgcolor: isOwnMessage
                ? (theme.palette.mode === 'light'
                    ? '#d9fdd3' // WhatsApp-like green for sent messages
                    : alpha(theme.palette.primary.main, 0.25))
                : (theme.palette.mode === 'light'
                    ? '#ffffff' // White for received messages
                    : '#202c33'), // Dark mode received
              border: isOwnMessage
                ? 'none'
                : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: isOwnMessage
                ? `0 1px 2px ${alpha(theme.palette.common.black, 0.08)}`
                : `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)',
              '&:hover': {
                boxShadow: isOwnMessage
                  ? `0 2px 8px ${alpha(theme.palette.common.black, 0.12)}`
                  : `0 2px 6px ${alpha(theme.palette.common.black, 0.08)}`,
                transform: 'translateY(-1px)',
                '& .block-button': {
                  opacity: 1,
                },
              },
            }}
          >
            {!isOwnMessage && onBlockUser && (
              <IconButton
                size="small"
                className="block-button"
                onClick={() => onBlockUser(message.userId, message.user.username)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  width: 20,
                  height: 20,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                <MoreVertical size={14} />
              </IconButton>
            )}
            
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                lineHeight: 1.5,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                color: isOwnMessage
                  ? (theme.palette.mode === 'light' ? '#111b21' : theme.palette.text.primary)
                  : theme.palette.text.primary,
                fontWeight: 400,
                letterSpacing: '0.01em',
              }}
            >
              {message.content}
            </Typography>
            
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent="flex-end"
              sx={{ 
                mt: 0.75,
                ml: 'auto',
                width: 'fit-content',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6875rem',
                  opacity: isOwnMessage ? 0.7 : 0.6,
                  color: isOwnMessage
                    ? (theme.palette.mode === 'light' ? '#667781' : theme.palette.text.secondary)
                    : theme.palette.text.secondary,
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}
              >
                {formatTime(message.createdAt)}
              </Typography>
              {isOwnMessage && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    ml: 0.5,
                    opacity: 0.8,
                  }}
                >
                  {messageStatus === 'read' ? (
                    <CheckCheck size={14} color={theme.palette.mode === 'light' ? '#53bdeb' : theme.palette.primary.main} />
                  ) : messageStatus === 'delivered' ? (
                    <CheckCheck size={14} color={theme.palette.mode === 'light' ? '#667781' : theme.palette.text.secondary} />
                  ) : (
                    <Check size={14} color={theme.palette.mode === 'light' ? '#667781' : theme.palette.text.secondary} />
                  )}
                </Box>
              )}
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}
