import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  SelectChangeEvent,
  Chip,
  Box,
} from '@mui/material';

interface SectorSelectorProps {
  selectedSectors: string[];
  onChange: (sectors: string[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const SECTORS = [
  'All Other Sectors',
  'Steel',
  'FMCG',
  'Textile',
  'Telecom',
  'Petroleum',
  'Electricity Distribution',
  'Gas Distribution',
  'Services',
  'Automobile',
  'CNG Stations',
  'Pharmaceuticals',
  'Wholesale/Retails'
];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const SectorSelector: React.FC<SectorSelectorProps> = ({
  selectedSectors,
  onChange,
  disabled = false,
  error = false,
  helperText
}) => {
  const handleChange = (event: SelectChangeEvent<typeof selectedSectors>) => {
    const {
      target: { value },
    } = event;
    onChange(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled}>
      <InputLabel id="sector-label">Sector</InputLabel>
      <Select
        labelId="sector-label"
        id="sector-select"
        multiple
        value={selectedSectors}
        onChange={handleChange}
        input={<OutlinedInput label="Sector" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} size="small" />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {SECTORS.map((sector) => (
          <MenuItem key={sector} value={sector}>
            <Checkbox checked={selectedSectors.indexOf(sector) > -1} />
            <ListItemText primary={sector} />
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <Box sx={{ mt: 1, fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary' }}>
          {helperText}
        </Box>
      )}
    </FormControl>
  );
};

export default SectorSelector;
export { SECTORS };