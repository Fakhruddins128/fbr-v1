import React, { useEffect } from 'react';
import { TextField, MenuItem, CircularProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchSroItemCodes } from '../store/slices/fbrSlice';
import { RootState } from '../store';
import { SroItemCode } from '../types';

interface SroItemCodesDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const SroItemCodesDropdown: React.FC<SroItemCodesDropdownProps> = ({
  value,
  onChange,
  label = 'SRO Item Code',
  size = 'small',
  fullWidth = true
}) => {
  const dispatch = useAppDispatch();
  const { sroItemCodes, isLoadingSroItemCodes, error } = useAppSelector((state: RootState) => state.fbr);

  useEffect(() => {
    if (sroItemCodes.length === 0 && !isLoadingSroItemCodes) {
      dispatch(fetchSroItemCodes());
    }
  }, [dispatch, sroItemCodes.length, isLoadingSroItemCodes]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  if (error) {
    return (
      <TextField
        fullWidth={fullWidth}
        size={size}
        label={label}
        value=""
        disabled
        helperText="Failed to load SRO item codes"
        error
      />
    );
  }

  return (
    <TextField
      fullWidth={fullWidth}
      select
      label={label}
      value={value}
      onChange={handleChange}
      size={size}
      disabled={isLoadingSroItemCodes}
      InputProps={{
        endAdornment: isLoadingSroItemCodes ? <CircularProgress size={20} /> : null,
      }}
    >
      <MenuItem value="">
        <em>Select SRO Item Code</em>
      </MenuItem>
      {sroItemCodes.map((sroItem: SroItemCode) => (
        <MenuItem key={sroItem.id} value={`${sroItem.code} - ${sroItem.description}`}>
          {sroItem.code} - {sroItem.description}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default SroItemCodesDropdown;