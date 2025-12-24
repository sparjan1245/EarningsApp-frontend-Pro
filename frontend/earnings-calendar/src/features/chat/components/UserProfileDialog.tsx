import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Avatar,
  Typography,
  Button,
  Stack,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { MessageSquare, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateOneToOneChatMutation, useGetUserChatsQuery } from '../../../services/chatApi';

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  email: string;
}

export default function UserProfileDialog({
  open,
  onClose,
  userId,
  username,
  email,
}: UserProfileDialogProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [createChat, { isLoading: isCreatingChat }] = useCreateOneToOneChatMutation();
  const { data: chats = [] } = useGetUserChatsQuery();

  const handleStartChat = async () => {
    try {
      // Check if chat already exists
      const existingChat = chats.find((chat) => {
        if (chat.type === 'ONE_TO_ONE' && chat.members) {
          return chat.members.some((member) => member.user.id === userId);
        }
        return false;
      });

      if (existingChat) {
        // Navigate to existing chat
        navigate(`/chat/one-to-one/${existingChat.id}`);
        onClose();
      } else {
        // Create new chat
        const newChat = await createChat(userId).unwrap();
        navigate(`/chat/one-to-one/${newChat.id}`);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.customShadows?.cardHover || '0 8px 24px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          User Profile
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: theme.palette.primary.main,
              fontSize: 40,
              fontWeight: 700,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {username.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              {username}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
              <Mail size={16} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ width: '100%' }} />

          <Stack spacing={2} sx={{ width: '100%' }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={20} color="white" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Member Since
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active user
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
        <Button
          onClick={handleStartChat}
          variant="contained"
          disabled={isCreatingChat}
          startIcon={isCreatingChat ? <CircularProgress size={16} /> : <MessageSquare size={18} />}
          sx={{ borderRadius: 2 }}
        >
          {isCreatingChat ? 'Starting...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
