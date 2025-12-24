import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Stack,
  Badge,
  Drawer,
  useMediaQuery,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MessageSquare, Users } from 'lucide-react';
import { useGetUserChatsQuery } from '../../../services/chatApi';
import { useAuth } from '../../../app/useAuth';
import HeaderBar from '../../dashboard/components/HeaderBar';
import Footer from '../../dashboard/components/Footer';
import ChannelsSidebar from './ChannelsSidebar';
import ChatsSidebar from './ChatsSidebar';
import { Fade } from '@mui/material';

interface UnifiedChatLayoutProps {
  children: ReactNode;
}

export default function UnifiedChatLayout({ children }: UnifiedChatLayoutProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mounted, setMounted] = useState(false);
  const { data: chats = [], isLoading: isLoadingChats } = useGetUserChatsQuery(undefined, {
    skip: !isAuthenticated, // Skip query if not authenticated
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const getCurrentTab = () => {
    if (location.pathname.startsWith('/chat/topic/')) return 0; // Channels
    if (location.pathname.startsWith('/chat/one-to-one/')) return 1; // Chats
    if (location.pathname === '/chat/chats') return 1;
    if (location.pathname === '/chat/topics') return 0;
    return 0;
  };

  const showSidebar = location.pathname.startsWith('/chat/topic/') ||
    location.pathname.startsWith('/chat/one-to-one/');

  const isChannelView = location.pathname.startsWith('/chat/topic/');
  const isChatView = location.pathname.startsWith('/chat/one-to-one/');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      navigate('/chat/topics');
    } else {
      navigate('/chat/chats');
    }
  };

  const unreadCount = chats.filter(() => {
    // Add logic to count unread messages if you have that data
    return false;
  }).length;

  // Security: Redirect to signin if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Show loading state while checking authentication
  if (isLoadingChats && !mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: (t) => t.palette.mode === 'light'
            ? 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #c3cfe2 100%)'
            : 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%)',
          zIndex: -1,
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '100%', md: '1400px', lg: '1600px' },
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          py: { xs: 3, sm: 4, md: 5, lg: 6 },
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack
          spacing={{ xs: 3, sm: 4, md: 5, lg: 6 }}
          sx={{
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Fade in={mounted} timeout={600}>
            <Box>
              <HeaderBar />
            </Box>
          </Fade>

          {/* Tabs Navigation */}
          <Fade in={mounted} timeout={800}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                boxShadow: theme.customShadows.card,
              }}
            >

              <Tabs
                value={getCurrentTab()}
                onChange={handleTabChange}
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  px: 2,
                  '& .MuiTab-root': {
                    minHeight: 56,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  },
                }}
              >
                <Tab
                  icon={<MessageSquare size={18} />}
                  iconPosition="start"
                  label="Channels"
                  sx={{ gap: 1 }}
                />
                <Tab
                  icon={<Users size={18} />}
                  iconPosition="start"
                  label={
                    <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="error">
                      Chats
                    </Badge>
                  }
                  sx={{ gap: 1 }}
                />
              </Tabs>
            </Paper>
          </Fade>

          {/* Main Content with Sidebar - Instagram-like Layout */}
          <Fade in={mounted} timeout={1000}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                gap: 0,
                minHeight: 0,
                maxHeight: 'calc(100vh - 200px)', // Fixed height for better scrolling
                bgcolor: theme.palette.mode === 'light'
                  ? '#ffffff' // Instagram white
                  : '#000000', // Instagram black
                border: theme.palette.mode === 'light'
                  ? `1px solid ${alpha('#dbdbdb', 1)}`
                  : `1px solid ${alpha('#262626', 1)}`,
                borderRadius: 0, // Instagram uses sharp corners
                overflow: 'hidden',
                boxShadow: theme.palette.mode === 'light'
                  ? `0 0 0 1px ${alpha('#dbdbdb', 1)}`
                  : `0 0 0 1px ${alpha('#262626', 1)}`,
              }}
            >
              {/* Sidebar - Only show relevant sidebar based on page type */}
              {showSidebar && (
                <>
                  {isMobile ? (
                    <Drawer
                      anchor="left"
                      open={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                      PaperProps={{
                        sx: {
                          width: { xs: '100%', sm: 320, md: 360 },
                        },
                      }}
                    >
                      {isChannelView ? (
                        <ChannelsSidebar onClose={() => setSidebarOpen(false)} />
                      ) : isChatView ? (
                        <ChatsSidebar onClose={() => setSidebarOpen(false)} />
                      ) : null}
                    </Drawer>
                  ) : (
                    sidebarOpen && (
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        {isChannelView ? (
                          <ChannelsSidebar />
                        ) : isChatView ? (
                          <ChatsSidebar />
                        ) : null}
                      </Box>
                    )
                  )}
                </>
              )}

              {/* Main Content */}
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {children}
              </Box>
            </Box>
          </Fade>
        </Stack>

        {/* Footer */}
        <Fade in={mounted} timeout={1200}>
          <Box sx={{ mt: 'auto', pt: { xs: 4, md: 6 } }}>
            <Footer />
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
