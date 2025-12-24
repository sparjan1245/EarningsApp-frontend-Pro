import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  alpha,
  useTheme,
  Fade,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  MessageSquare,
  Plus,
  Users,
  Search,
  X,
} from 'lucide-react';
import { useGetAllTopicsQuery, useCreateTopicMutation } from '../../../services/chatApi';
import { useAuth } from '../../../app/useAuth';
import { useNavigate } from 'react-router-dom';
import UnifiedChatLayout from '../components/UnifiedChatLayout';

export default function TopicsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const { data: topics = [], isLoading } = useGetAllTopicsQuery(undefined, {
    skip: !isAuthenticated, // Skip query if not authenticated
  });
  const [createTopic] = useCreateTopicMutation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const canCreateTopic = role === 'admin' || role === 'superadmin';

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.description?.toLowerCase().includes(query)
    );
  }, [topics, searchQuery]);
  
  useEffect(() => {
    if (isAuthenticated) {
      setMounted(true);
    }
  }, [isAuthenticated]);

  // Security: Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will be handled by ProtectedRoute, but this is a safety check
  }

  const handleCreateTopic = async () => {
    try {
      await createTopic(newTopic).unwrap();
      setCreateDialogOpen(false);
      setNewTopic({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  return (
    <UnifiedChatLayout>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Instagram-like Modern Header Section */}
        <Fade in={mounted} timeout={400}>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              borderBottom: theme.palette.mode === 'light'
                ? `1px solid ${alpha('#dbdbdb', 1)}` // Instagram border
                : `1px solid ${alpha('#262626', 1)}`,
              bgcolor: theme.palette.mode === 'light'
                ? '#ffffff' // Instagram white
                : '#000000', // Instagram black
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h5" 
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                      mb: 0.5,
                      color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
                    }}
                  >
                    Channels
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.875rem',
                      color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                    }}
                  >
                    {filteredTopics.length} {filteredTopics.length === 1 ? 'channel' : 'channels'} available
                  </Typography>
                </Box>
                {canCreateTopic && (
                  <Button
                    startIcon={<Plus size={18} />}
                    variant="contained"
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      px: { xs: 2, sm: 3 },
                      py: 1,
                      fontWeight: 600,
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      textTransform: 'none',
                      bgcolor: theme.palette.mode === 'light' ? '#0095f6' : '#0095f6', // Instagram blue
                      color: '#ffffff',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'light' ? '#1877f2' : '#1877f2',
                      },
                    }}
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>New Channel</Box>
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>New</Box>
                  </Button>
                )}
              </Stack>
              
              {/* Search Bar */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} style={{ color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        sx={{ mr: -1 }}
                      >
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'light' ? '#fafafa' : '#262626',
                    border: theme.palette.mode === 'light'
                      ? `1px solid ${alpha('#dbdbdb', 1)}`
                      : `1px solid ${alpha('#262626', 1)}`,
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'light' ? '#f0f0f0' : '#1a1a1a',
                    },
                    '&.Mui-focused': {
                      bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#000000',
                      border: theme.palette.mode === 'light'
                        ? `1px solid ${alpha('#262626', 0.3)}`
                        : `1px solid ${alpha('#fafafa', 0.3)}`,
                    },
                  },
                }}
              />
            </Stack>
          </Box>
        </Fade>

        {/* Instagram-like Modern Topics List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
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
                ? alpha('#8e8e8e', 0.3)
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
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredTopics.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 12, px: 2 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'light' ? '#efefef' : '#262626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <MessageSquare 
                  size={40} 
                  style={{ 
                    color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                    opacity: 0.6 
                  }} 
                />
              </Box>
              <Typography 
                variant="h5" 
                fontWeight={700} 
                sx={{ 
                  mb: 1, 
                  color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
                }}
              >
                {searchQuery ? 'No channels found' : 'No channels yet'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 4, 
                  maxWidth: 400, 
                  mx: 'auto',
                  color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                }}
              >
                {searchQuery
                  ? 'Try a different search term'
                  : canCreateTopic 
                    ? 'Start the conversation! Create the first channel and invite others to join.' 
                    : 'Check back later for new channels.'}
              </Typography>
              {canCreateTopic && !searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    borderRadius: 2,
                    px: 3.5,
                    py: 1.3,
                    fontWeight: 600,
                    textTransform: 'none',
                    bgcolor: '#0095f6', // Instagram blue
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: '#1877f2',
                    },
                  }}
                >
                  Create First Channel
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {filteredTopics.map((topic, index) => (
                <Fade in={mounted} key={topic.id} timeout={300 + index * 50}>
                  <Card
                    onClick={() => navigate(`/chat/topic/${topic.id}`)}
                    sx={{
                      borderRadius: 0, // Instagram uses sharp corners
                      bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#000000',
                      border: theme.palette.mode === 'light'
                        ? `1px solid ${alpha('#dbdbdb', 1)}`
                        : `1px solid ${alpha('#262626', 1)}`,
                      borderTop: index === 0 ? 'none' : undefined,
                      boxShadow: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'light' ? '#fafafa' : '#1a1a1a',
                      },
                      '&:active': {
                        bgcolor: theme.palette.mode === 'light' ? '#f0f0f0' : '#262626',
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              bgcolor: theme.palette.mode === 'light' ? '#efefef' : '#262626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <MessageSquare 
                              size={28} 
                              style={{ 
                                color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
                              }} 
                            />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              fontWeight={600} 
                              sx={{ 
                                mb: 0.5,
                                color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                              }} 
                              noWrap
                            >
                              {topic.title}
                            </Typography>
                            {topic.description && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mb: 1.5,
                                  color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4,
                                }}
                              >
                                {topic.description}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                              <Chip
                                icon={<Users size={16} />}
                                label={`${topic.chat?._count?.members || 0} members`}
                                size="small"
                                sx={{ 
                                  borderRadius: 2,
                                  height: 28,
                                  fontSize: '0.8125rem',
                                  fontWeight: 500,
                                  bgcolor: theme.palette.mode === 'light' ? '#efefef' : '#262626',
                                  color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
                                  '& .MuiChip-icon': {
                                    color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                                  },
                                }}
                              />
                              <Chip
                                icon={<MessageSquare size={16} />}
                                label={`${topic.chat?._count?.messages || 0} messages`}
                                size="small"
                                sx={{ 
                                  borderRadius: 2,
                                  height: 28,
                                  fontSize: '0.8125rem',
                                  fontWeight: 500,
                                  bgcolor: theme.palette.mode === 'light' ? '#efefef' : '#262626',
                                  color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
                                  '& .MuiChip-icon': {
                                    color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                                  },
                                }}
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Fade>
              ))}
            </Stack>
          )}
        </Box>

        {/* Create Topic Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.customShadows.cardHover,
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#000000',
            borderBottom: theme.palette.mode === 'light'
              ? `1px solid ${alpha('#dbdbdb', 1)}`
              : `1px solid ${alpha('#262626', 1)}`,
            fontWeight: 600,
            color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
          }}
        >
          Create New Channel
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Channel Title"
              fullWidth
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'light' ? '#fafafa' : '#262626',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'light' ? '#dbdbdb' : '#262626',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                  },
                },
              }}
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={4}
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'light' ? '#fafafa' : '#262626',
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'light' ? '#dbdbdb' : '#262626',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
                  },
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5, borderTop: theme.palette.mode === 'light' ? `1px solid ${alpha('#dbdbdb', 1)}` : `1px solid ${alpha('#262626', 1)}` }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            variant="text"
            sx={{ 
              borderRadius: 2, 
              px: 2.5, 
              py: 1, 
              fontWeight: 600,
              color: theme.palette.mode === 'light' ? '#262626' : '#fafafa',
              '&:hover': {
                bgcolor: theme.palette.mode === 'light' ? '#fafafa' : '#1a1a1a',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTopic}
            variant="contained"
            disabled={!newTopic.title}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontWeight: 600,
              bgcolor: '#0095f6', // Instagram blue
              color: '#ffffff',
              '&:hover': {
                bgcolor: '#1877f2',
              },
              '&:disabled': {
                bgcolor: theme.palette.mode === 'light' ? '#efefef' : '#262626',
                color: theme.palette.mode === 'light' ? '#8e8e8e' : '#a8a8a8',
              },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </UnifiedChatLayout>
  );
}

