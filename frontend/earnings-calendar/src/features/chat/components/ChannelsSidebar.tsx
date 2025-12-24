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
  Avatar,
  alpha,
  useTheme,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import { Search, MessageSquare, Users } from 'lucide-react';
import { useGetAllTopicsQuery } from '../../../services/chatApi';
import type { Topic } from '../../../services/chatApi';

interface ChannelsSidebarProps {
  onClose?: () => void;
}

export default function ChannelsSidebar({ onClose }: ChannelsSidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();
  const { data: topics = [], isLoading } = useGetAllTopicsQuery();
  const [searchQuery, setSearchQuery] = useState('');

  // Only show channels when on channel/topic page
  const isChannelPage = location.pathname.startsWith('/chat/topic/');
  const relevantTopics = isChannelPage ? topics : [];

  const filteredTopics = relevantTopics.filter((topic) =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTopicClick = (topic: Topic) => {
    navigate(`/chat/topic/${topic.id}`);
    onClose?.();
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
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {isChannelPage ? 'Channels' : 'All Channels'}
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search channels..."
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

      {/* Channels List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading channels...
            </Typography>
          </Box>
        ) : !isChannelPage ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <MessageSquare size={48} color={theme.palette.text.secondary} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Typography variant="body2" color="text.secondary">
              Navigate to a channel to see the channels list
            </Typography>
          </Box>
        ) : filteredTopics.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <MessageSquare size={48} color={theme.palette.text.secondary} style={{ opacity: 0.3, marginBottom: 16 }} />
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No channels found' : 'No channels available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredTopics.map((topic, index) => {
              const isActive = topicId === topic.id;
              return (
                <Box key={topic.id}>
                  <ListItemButton
                    onClick={() => handleTopicClick(topic)}
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
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: isActive
                            ? theme.palette.primary.main
                            : alpha(theme.palette.primary.main, 0.1),
                          color: isActive ? 'white' : theme.palette.primary.main,
                        }}
                      >
                        <MessageSquare size={20} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5,
                          }}
                        >
                          {topic.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            icon={<Users size={12} />}
                            label={topic.chat?._count?.members || 0}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {topic.chat?._count?.messages || 0} msgs
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </ListItemButton>
                  {index < filteredTopics.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Paper>
  );
}
