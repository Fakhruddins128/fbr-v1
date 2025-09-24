import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { fetchUnitOfMeasurements } from '../store/slices/fbrSlice';

interface UnitOfMeasurementsDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const UnitOfMeasurementsDropdown: React.FC<UnitOfMeasurementsDropdownProps> = ({
  value,
  onChange,
  label = 'Unit of Measurement',
  required = false,
  disabled = false,
  fullWidth = true
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    unitOfMeasurements, 
    isLoadingUnitOfMeasurements, 
    unitOfMeasurementsError 
  } = useSelector((state: RootState) => state.fbr);

  useEffect(() => {
    if (unitOfMeasurements.length === 0 && !isLoadingUnitOfMeasurements) {
      dispatch(fetchUnitOfMeasurements());
    }
  }, [dispatch, unitOfMeasurements.length, isLoadingUnitOfMeasurements]);

  if (unitOfMeasurementsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading units of measurement: {unitOfMeasurementsError}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} required={required} disabled={disabled || isLoadingUnitOfMeasurements}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        endAdornment={
          isLoadingUnitOfMeasurements ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
      >
        <MenuItem value="">
          <em>Select {label}</em>
        </MenuItem>
        {unitOfMeasurements.map((uom) => (
          <MenuItem key={uom.code} value={uom.code}>
            {uom.description} ({uom.code})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default UnitOfMeasurementsDropdown;