import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { fetchTransactionTypes } from '../store/slices/fbrSlice';

interface TransactionTypesDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const TransactionTypesDropdown: React.FC<TransactionTypesDropdownProps> = ({
  value,
  onChange,
  label = 'Transaction Type',
  required = false,
  disabled = false,
  fullWidth = true
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    transactionTypes, 
    isLoadingTransactionTypes, 
    transactionTypesError 
  } = useSelector((state: RootState) => state.fbr);

  useEffect(() => {
    if (transactionTypes.length === 0 && !isLoadingTransactionTypes) {
      dispatch(fetchTransactionTypes());
    }
  }, [dispatch, transactionTypes.length, isLoadingTransactionTypes]);

  if (transactionTypesError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading transaction types: {transactionTypesError}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} required={required} disabled={disabled || isLoadingTransactionTypes}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        endAdornment={
          isLoadingTransactionTypes ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
      >
        <MenuItem value="">
          <em>Select {label}</em>
        </MenuItem>
        {transactionTypes.map((transType) => (
          <MenuItem key={transType.code} value={transType.code}>
            {transType.description} ({transType.code})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TransactionTypesDropdown;