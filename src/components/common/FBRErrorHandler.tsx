import React, { useEffect, useState } from 'react';
import { Alert, Snackbar, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface FBRAuthErrorDetail {
  message: string;
  type: 'PDI_AUTH_ERROR' | 'MAIN_AUTH_ERROR';
}

const FBRErrorHandler: React.FC = () => {
  const [error, setError] = useState<FBRAuthErrorDetail | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleFBRAuthError = (event: CustomEvent<FBRAuthErrorDetail>) => {
      setError(event.detail);
      setOpen(true);
    };

    // Listen for FBR authentication errors
    window.addEventListener('fbrAuthError', handleFBRAuthError as EventListener);

    return () => {
      window.removeEventListener('fbrAuthError', handleFBRAuthError as EventListener);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleGoToFBRIntegration = () => {
    navigate('/fbr-integration');
    handleClose();
  };

  if (!error) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={10000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="error"
        onClose={handleClose}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleGoToFBRIntegration}
            sx={{ ml: 1 }}
          >
            Configure Token
          </Button>
        }
        sx={{ minWidth: '400px' }}
      >
        <strong>FBR API Authentication Failed</strong>
        <br />
        {error.message}
      </Alert>
    </Snackbar>
  );
};

export default FBRErrorHandler;