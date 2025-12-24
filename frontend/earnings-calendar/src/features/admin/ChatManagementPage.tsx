import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  alpha,
  useTheme,
  Fade,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import { MessageSquare, Plus, Users, Shield, Edit, Trash2 } from 'lucide-react';
import {
  useGetAllTopicsQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
} from '../../services/chatApi';
import { useAuth } from '../../app/useAuth';
import { IconButton, Tooltip } from '@mui/material';

export default function ChatManagementPage() {
  const theme = useTheme();
  const { role } = useAuth();
  console.log('ChatManagementPage - Role:', role);
  const { data: topics = [], isLoading, refetch } = useGetAllTopicsQuery();
  const [createTopic] = useCreateTopicMutation();
  const [updateTopic] = useUpdateTopicMutation();
  const [deleteTopic] = useDeleteTopicMutation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; title: string; description?: string } | null>(null);
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const canCreateTopic = role === 'admin' || role === 'superadmin';
  const isSuperAdmin = role === 'superadmin';
  
  const handleCreateTopic = async () => {
    try {
      await createTopic(newTopic).unwrap();
      setCreateDialogOpen(false);
      setNewTopic({ title: '', description: '' });
      refetch();
      setSnackbar({ open: true, message: 'Topic created successfully!', severity: 'success' });
    } catch (error: any) {
      console.error('Failed to create topic:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create topic';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleEditTopic = async () => {
    if (!selectedTopic) return;
    try {
      await updateTopic({ id: selectedTopic.id, data: { title: newTopic.title, description: newTopic.description } }).unwrap();
      setEditDialogOpen(false);
      setSelectedTopic(null);
      setNewTopic({ title: '', description: '' });
      refetch();
      setSnackbar({ open: true, message: 'Topic updated successfully!', severity: 'success' });
    } catch (error: any) {
      console.error('Failed to update topic:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to update topic';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;
    try {
      await deleteTopic(selectedTopic.id).unwrap();
      setDeleteDialogOpen(false);
      setSelectedTopic(null);
      refetch();
      setSnackbar({ open: true, message: 'Topic deleted successfully!', severity: 'success' });
    } catch (error: any) {
      console.error('Failed to delete topic:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete topic';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const openEditDialog = (topic: typeof topics[0]) => {
    setSelectedTopic({ id: topic.id, title: topic.title, description: topic.description });
    setNewTopic({ title: topic.title, description: topic.description || '' });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (topic: typeof topics[0]) => {
    setSelectedTopic({ id: topic.id, title: topic.title, description: topic.description });
    setDeleteDialogOpen(true);
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Fade in={true} timeout={400}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3, md: 3.5 },
            mb: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            boxShadow: theme.customShadows.card,
          }}
        >
          <Stack direction="row" spacing={2.5} alignItems="center" mb={3}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              <MessageSquare size={28} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{
                  mb: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Chat Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14 }}>
                Manage discussion topics and user moderation
              </Typography>
            </Box>
          </Stack>

          {canCreateTopic && (
            <Button
              startIcon={<Plus size={18} />}
              variant="contained"
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.3,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.3px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Create New Topic
            </Button>
          )}
        </Paper>
      </Fade>

      {/* Topics List */}
      <Fade in={true} timeout={600}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            boxShadow: theme.customShadows.card,
          }}
        >
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Loading topics...</Typography>
            </Box>
          ) : topics.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No topics created yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                {topics.map((topic) => (
                  <Paper
                    key={topic.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                          <MessageSquare size={20} color={theme.palette.primary.main} />
                          <Typography variant="h6" fontWeight={700}>
                            {topic.title}
                          </Typography>
                          {!topic.isActive && (
                            <Chip label="Inactive" size="small" color="error" sx={{ borderRadius: 1.5 }} />
                          )}
                        </Stack>
                        {isSuperAdmin && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Tooltip title="Edit Topic">
                              <IconButton
                                size="small"
                                onClick={() => openEditDialog(topic)}
                                sx={{
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                              >
                                <Edit size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Topic">
                              <IconButton
                                size="small"
                                onClick={() => openDeleteDialog(topic)}
                                sx={{
                                  color: theme.palette.error.main,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                  },
                                }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                        {topic.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {topic.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          <Chip
                            icon={<Users size={14} />}
                            label={`${topic.chat?._count.members || 0} members`}
                            size="small"
                            sx={{ borderRadius: 1.5 }}
                          />
                          <Chip
                            icon={<MessageSquare size={14} />}
                            label={`${topic.chat?._count.messages || 0} messages`}
                            size="small"
                            sx={{ borderRadius: 1.5 }}
                          />
                          <Chip
                            icon={<Shield size={14} />}
                            label={`Created by ${topic.creator.username}`}
                            size="small"
                            sx={{ borderRadius: 1.5 }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      </Fade>

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
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            fontWeight: 700,
          }}
        >
          Create New Topic
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Topic Title"
              fullWidth
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, px: 2.5, py: 1, fontWeight: 600 }}
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
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTopic(null);
          setNewTopic({ title: '', description: '' });
        }}
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
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            fontWeight: 700,
          }}
        >
          Edit Topic
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Topic Title"
              fullWidth
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedTopic(null);
              setNewTopic({ title: '', description: '' });
            }}
            variant="outlined"
            sx={{ borderRadius: 2, px: 2.5, py: 1, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditTopic}
            variant="contained"
            disabled={!newTopic.title}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Topic Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedTopic(null);
        }}
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
            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            fontWeight: 700,
            color: theme.palette.error.main,
          }}
        >
          Delete Topic
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography>
            Are you sure you want to delete the topic <strong>"{selectedTopic?.title}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedTopic(null);
            }}
            variant="outlined"
            sx={{ borderRadius: 2, px: 2.5, py: 1, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTopic}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontWeight: 600,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

