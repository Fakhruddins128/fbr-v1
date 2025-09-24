import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface FBRErrorModalProps {
  open: boolean;
  onClose: () => void;
  error: {
    message: string;
    status?: number;
    statusText?: string;
    data?: any;
    url?: string;
    method?: string;
  } | null;
}

const FBRErrorModal: React.FC<FBRErrorModalProps> = ({ open, onClose, error }) => {
  if (!error) return null;

  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  const getErrorTitle = () => {
    if (error.status === 401) {
      return 'FBR Authentication Error';
    } else if (error.status === 400) {
      return 'FBR Request Error';
    } else if (error.status === 500) {
      return 'FBR Server Error';
    } else if (error.status) {
      return `FBR API Error (${error.status})`;
    }
    return 'FBR API Error';
  };

  const getErrorSeverity = () => {
    if (error.status === 401) return 'warning';
    if (error.status === 400) return 'error';
    if (error.status === 500) return 'error';
    return 'error';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '300px'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" />
          <Typography variant="h6" component="div">
            {getErrorTitle()}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Alert severity={getErrorSeverity()} sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {error.message}
          </Typography>
        </Alert>

        {error.status && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> {error.status} {error.statusText && `(${error.statusText})`}
            </Typography>
            {error.url && (
              <Typography variant="body2" color="text.secondary">
                <strong>URL:</strong> {error.url}
              </Typography>
            )}
            {error.method && (
              <Typography variant="body2" color="text.secondary">
                <strong>Method:</strong> {error.method}
              </Typography>
            )}
          </Box>
        )}

        {error.data && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="error-details-content"
              id="error-details-header"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Complete Error Response (JSON)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  backgroundColor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '300px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {formatJSON(error.data)}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Troubleshooting Tips:</strong>
          </Typography>
          <Typography variant="body2" color="info.contrastText" sx={{ mt: 1 }}>
            {error.status === 401 && (
              "• Check if your FBR API token is valid and properly configured in the FBR Integration page."
            )}
            {error.status === 400 && (
              "• Verify that all required fields are filled correctly and the data format matches FBR requirements."
            )}
            {error.status === 500 && (
              "• This is a server error from FBR. Please try again later or contact FBR support."
            )}
            {!error.status && (
              "• Check your internet connection and try again. If the problem persists, contact support."
            )}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={() => {
            if (error.data) {
              navigator.clipboard.writeText(formatJSON(error.data));
            }
          }}
          variant="outlined"
          disabled={!error.data}
        >
          Copy Error Details
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FBRErrorModal;