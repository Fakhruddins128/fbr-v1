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

interface BusinessActivitySelectorProps {
  selectedActivities: string[];
  onChange: (activities: string[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const BUSINESS_ACTIVITIES = [
  'Manufacturing',
  'Importer',
  'Distributor',
  'Wholesaler',
  'Exporter',
  'Retailer',
  'Service Provider',
  'Other'
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

const BusinessActivitySelector: React.FC<BusinessActivitySelectorProps> = ({
  selectedActivities,
  onChange,
  disabled = false,
  error = false,
  helperText
}) => {
  const handleChange = (event: SelectChangeEvent<typeof selectedActivities>) => {
    const {
      target: { value },
    } = event;
    onChange(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled}>
      <InputLabel id="business-activity-label">Business Activity</InputLabel>
      <Select
        labelId="business-activity-label"
        id="business-activity-select"
        multiple
        value={selectedActivities}
        onChange={handleChange}
        input={<OutlinedInput label="Business Activity" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} size="small" />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {BUSINESS_ACTIVITIES.map((activity) => (
          <MenuItem key={activity} value={activity}>
            <Checkbox checked={selectedActivities.indexOf(activity) > -1} />
            <ListItemText primary={activity} />
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

export default BusinessActivitySelector;
export { BUSINESS_ACTIVITIES };