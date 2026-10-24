import React from 'react';
import { TableCell, TableSortLabel } from '@mui/material';
import { SortState } from '../../hooks/useTableControls';

interface SortableTableCellProps {
  /** Must match a key in the page's sortAccessors map. */
  columnKey: string;
  label: string;
  sort: SortState;
  align?: 'left' | 'right' | 'center';
}

/** A table header cell that sorts the table by its column when clicked. */
const SortableTableCell: React.FC<SortableTableCellProps> = ({
  columnKey,
  label,
  sort,
  align = 'left'
}) => {
  const active = sort.sortKey === columnKey;

  return (
    <TableCell
      align={align}
      sortDirection={active ? sort.sortDirection : false}
      sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
    >
      <TableSortLabel
        active={active}
        direction={active ? sort.sortDirection : 'asc'}
        onClick={() => sort.toggleSort(columnKey)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
};

export default SortableTableCell;
