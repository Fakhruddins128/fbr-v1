import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { fetchItemDescriptionCodes } from '../store/slices/fbrSlice';

interface ItemDescriptionCodesDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const ItemDescriptionCodesDropdown: React.FC<ItemDescriptionCodesDropdownProps> = ({
  value,
  onChange,
  label = 'HS Code',
  required = false,
  disabled = false,
  fullWidth = true
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    itemDescriptionCodes, 
    isLoadingItemDescriptionCodes, 
    itemDescriptionCodesError 
  } = useSelector((state: RootState) => state.fbr);

  useEffect(() => {
    if (itemDescriptionCodes.length === 0 && !isLoadingItemDescriptionCodes) {
      dispatch(fetchItemDescriptionCodes());
    }
  }, [dispatch, itemDescriptionCodes.length, isLoadingItemDescriptionCodes]);

  if (itemDescriptionCodesError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading HS codes: {itemDescriptionCodesError}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} required={required} disabled={disabled || isLoadingItemDescriptionCodes}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        endAdornment={
          isLoadingItemDescriptionCodes ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
      >
        <MenuItem value="">
          <em>Select {label}</em>
        </MenuItem>
        {itemDescriptionCodes.map((item) => (
          <MenuItem key={item.code} value={item.code}>
            {item.description} ({item.code})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ItemDescriptionCodesDropdown;