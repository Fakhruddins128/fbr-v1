import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { login } from '../store/slices/authSlice';

/** The app mark, reused on both panels so the page reads as one product. */
const BrandMark: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 1,
      backgroundColor: 'primary.main',
      color: 'primary.contrastText',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: size * 0.36
    }}
  >
    IMS
  </Box>
);

/**
 * A sales invoice carrying an FBR QR stamp: the thing this system actually
 * produces. Drawn inline rather than loaded as a photo so the login page makes
 * no network request and carries no image licence.
 */
const InvoiceIllustration: React.FC = () => (
  <Box
    component="svg"
    viewBox="16 18 344 270"
    role="img"
    aria-label="A sales invoice stamped with an FBR QR code"
    sx={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block' }}
  >
    {/* The invoice behind, suggesting a register rather than a single document */}
    <rect x="52" y="26" width="300" height="240" rx="10" fill="#FFFFFF" opacity="0.14" />
    <rect x="38" y="40" width="300" height="240" rx="10" fill="#FFFFFF" opacity="0.22" />

    {/* The invoice in front */}
    <rect x="24" y="54" width="300" height="226" rx="10" fill="#FFFFFF" />

    {/* Masthead: seller block and invoice number */}
    <rect x="48" y="80" width="104" height="9" rx="4.5" fill="#1F2225" />
    <rect x="48" y="97" width="72" height="7" rx="3.5" fill="#CED3D6" />
    <rect x="232" y="80" width="68" height="7" rx="3.5" fill="#CED3D6" />
    <rect x="248" y="94" width="52" height="7" rx="3.5" fill="#0875E1" />

    <line x1="48" y1="120" x2="300" y2="120" stroke="#DFE2E3" strokeWidth="1.5" />

    {/* Line items: description, quantity, amount */}
    {[134, 156, 178].map((y, index) => (
      <g key={y}>
        <rect x="48" y={y} width={index === 1 ? 118 : 96} height="7" rx="3.5" fill="#CED3D6" />
        <rect x="196" y={y} width="26" height="7" rx="3.5" fill="#DFE2E3" />
        <rect x={index === 2 ? 258 : 252} y={y} width={index === 2 ? 42 : 48} height="7" rx="3.5" fill="#CED3D6" />
      </g>
    ))}

    <line x1="48" y1="202" x2="300" y2="202" stroke="#DFE2E3" strokeWidth="1.5" />

    {/* Total payable */}
    <rect x="196" y="214" width="104" height="24" rx="5" fill="#0875E1" />
    <rect x="208" y="223" width="34" height="6" rx="3" fill="#FFFFFF" opacity="0.65" />
    <rect x="252" y="222" width="36" height="8" rx="4" fill="#FFFFFF" />

    {/* The FBR QR stamp every digital invoice carries */}
    <rect x="48" y="214" width="56" height="56" rx="5" fill="#1F2225" />
    <rect x="55" y="221" width="14" height="14" rx="2.5" fill="#FFFFFF" />
    <rect x="83" y="221" width="14" height="14" rx="2.5" fill="#FFFFFF" />
    <rect x="55" y="249" width="14" height="14" rx="2.5" fill="#FFFFFF" />
    <rect x="76" y="242" width="6" height="6" fill="#FFFFFF" />
    <rect x="87" y="249" width="6" height="6" fill="#FFFFFF" />
    <rect x="76" y="256" width="6" height="6" fill="#FFFFFF" />
    <rect x="87" y="263" width="6" height="6" fill="#FFFFFF" />
  </Box>
);

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('superadmin');
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    let isValid = true;

    if (!username.trim()) {
      errors.username = 'Username is required';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Use the actual username field value for login
    await dispatch(login({ username, password }));
  };

  const handleUserTypeChange = (event: SelectChangeEvent) => {
    setUserType(event.target.value);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
        backgroundColor: 'background.paper'
      }}
    >
      {/* Brand panel. On phones it shrinks to a masthead above the form. */}
      <Box
        sx={{
          backgroundColor: '#083A5E',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, md: 7, lg: 10 },
          py: { xs: 4, md: 8 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 3, md: 5 } }}>
          <BrandMark />
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
            Invoice Management System
          </Typography>
        </Box>

        <Typography
          variant="h4"
          sx={{
            color: '#FFFFFF',
            maxWidth: '32ch',
            lineHeight: 1.2,
            mb: 2
          }}
        >
          DIGITAL INVOICING MADE SIMPLE
        </Typography>

        <Typography
          sx={{
            color: 'rgba(255,255,255,0.78)',
            maxWidth: '52ch',
            lineHeight: 1.6,
            mb: { xs: 0, md: 6 }
          }}
        >
          {/* Raise sales invoices, apply the right tax treatment, and submit them
          straight to FBR Digital Invoicing. */}
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <InvoiceIllustration />
        </Box>
      </Box>

      {/* Sign-in panel */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          py: { xs: 5, md: 6 }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Typography component="h1" variant="h5" sx={{ mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use the credentials issued for your company.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="user-type-label">Login As</InputLabel>
              <Select
                labelId="user-type-label"
                id="user-type"
                value={userType}
                label="Login As"
                onChange={handleUserTypeChange}
              >
                <MenuItem value="superadmin">Super Admin</MenuItem>
                <MenuItem value="companyadmin">Company Admin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="accountant">Accountant</MenuItem>
                <MenuItem value="salesperson">Sales Person</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="User ID"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!formErrors.username}
              helperText={formErrors.username}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, py: 1.25 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 4 }}
          >
            Version 2.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
