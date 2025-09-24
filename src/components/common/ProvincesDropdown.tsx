import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchProvinces } from '../../store/slices/fbrSlice';

interface ProvincesDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const ProvincesDropdown: React.FC<ProvincesDropdownProps> = ({
  value,
  onChange,
  label = 'Province',
  required = false,
  disabled = false,
  fullWidth = true
}) => {
  const dispatch = useAppDispatch();
  const { provinces, isLoadingProvinces, provincesError } = useAppSelector(state => state.fbr);

  useEffect(() => {
    // Fetch provinces if not already loaded
    if (provinces.length === 0 && !isLoadingProvinces && !provincesError) {
      dispatch(fetchProvinces());
    }
  }, [dispatch, provinces.length, isLoadingProvinces, provincesError]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  if (provincesError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <div>
          <strong>Failed to load provinces:</strong> {provincesError}
          <div style={{ marginTop: '8px' }}>
            💡 <strong>Required:</strong> All FBR APIs require a valid access token. Please configure your FBR API token in the <strong>FBR Integration</strong> page to load province data and other dropdown options.
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} required={required} disabled={disabled}>
      <InputLabel id="provinces-select-label">{label}</InputLabel>
      <Select
        labelId="provinces-select-label"
        id="provinces-select"
        value={value}
        label={label}
        onChange={handleChange}
        disabled={disabled || isLoadingProvinces}
      >
        {isLoadingProvinces ? (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Loading provinces...
          </MenuItem>
        ) : (
          provinces.map((province) => (
            <MenuItem key={province.id} value={province.code || province.name}>
              {province.name}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default ProvincesDropdown;