// src/pages/auth/SignUp.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Fade,
} from '@mui/material';
import { Chrome, User, Mail, Lock, Calendar, Eye, EyeOff } from 'lucide-react';
import { useSignupMutation, useOauthUrlQuery } from '../../services/authApi';
import HeaderBar from '../../features/dashboard/components/HeaderBar';
import Footer from '../../features/dashboard/components/Footer';

export default function SignUp() {
  const nav = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
  });

  const [signup] = useSignupMutation();
  const { data: oauthUrl, error: oauthError, isLoading: oauthLoading } = useOauthUrlQuery();

  const onChange =
    (k: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
        const data = await signup(form).unwrap();
    
        if (data && 'devCode' in data) {          // dev build
          nav('/verify', {
            state: { email: form.email, prefill: (data as any).devCode },
          });
          // Or simply: alert(`DEV CODE: ${(data as any).devCode}`);
        } else {
          nav('/verify', { state: { email: form.email } });
        }
      } catch (err) {
        console.error('Signup failed:', err);
      }
    };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
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
        <Fade in={true} timeout={600}>
        <Box>
            <HeaderBar />
        </Box>
        </Fade>

      {/* auth card */}
        <Stack flex={1} alignItems="center" justifyContent="center" sx={{ px: 2, my: 4 }}>
          <Fade in={true} timeout={800}>
        <Card
          sx={{
                width: { xs: '100%', sm: 440 },
                maxWidth: 440,
            px: 4,
            py: 6,
                borderRadius: 2,
                boxShadow: (t) => t.customShadows.card,
                bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h4" fontWeight={700} textAlign="center" mb={4}>
            Seconds to sign up!
          </Typography>

          <Button
            fullWidth
            startIcon={<Chrome size={20} />}
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: 2 }}
            onClick={() => {
              if (oauthUrl) {
                window.location.href = oauthUrl;
              }
            }}
            disabled={!oauthUrl || oauthLoading}
          >
            {oauthLoading ? 'Loading...' : oauthError ? 'OAuth Unavailable' : 'Continue with Google'}
          </Button>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                required
                value={form.username}
                onChange={onChange('username')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Work Email"
                type="email"
                required
                value={form.email}
                onChange={onChange('email')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type={showPwd ? 'text' : 'password'}
                required
                value={form.password}
                onChange={onChange('password')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm Password"
                type={showPwd ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={onChange('confirmPassword')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Date of Birth (MM/DD/YYYY)"
                placeholder="01/31/1990"
                required
                value={form.dob}
                onChange={onChange('dob')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Calendar size={18} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button type="submit" variant="contained" size="large" fullWidth>
                Create account
              </Button>
            </Stack>
          </Box>
        </Card>
          </Fade>
      </Stack>

        <Fade in={true} timeout={1000}>
          <Box sx={{ mt: 'auto', pt: { xs: 4, md: 6 } }}>
            <Footer />
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
