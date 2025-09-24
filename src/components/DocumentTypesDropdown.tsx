import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { fetchDocumentTypes } from '../store/slices/fbrSlice';

interface DocumentTypesDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const DocumentTypesDropdown: React.FC<DocumentTypesDropdownProps> = ({
  value,
  onChange,
  label = 'Document Type',
  required = false,
  disabled = false,
  fullWidth = true
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    documentTypes, 
    isLoadingDocumentTypes, 
    documentTypesError 
  } = useSelector((state: RootState) => state.fbr);

  useEffect(() => {
    if (documentTypes.length === 0 && !isLoadingDocumentTypes) {
      dispatch(fetchDocumentTypes());
    }
  }, [dispatch, documentTypes.length, isLoadingDocumentTypes]);

  if (documentTypesError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading document types: {documentTypesError}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} required={required} disabled={disabled || isLoadingDocumentTypes}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        endAdornment={
          isLoadingDocumentTypes ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
      >
        <MenuItem value="">
          <em>Select {label}</em>
        </MenuItem>
        {documentTypes.map((docType) => (
          <MenuItem key={docType.code} value={docType.code}>
            {docType.description} ({docType.code})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DocumentTypesDropdown;