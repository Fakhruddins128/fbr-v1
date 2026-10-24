import React from 'react';
import { TablePagination } from '@mui/material';
import { PaginationState } from '../../hooks/useTableControls';

interface TablePaginationControlsProps {
  pagination: PaginationState;
}

/** The pager under a list table, wired to useTableControls. */
const TablePaginationControls: React.FC<TablePaginationControlsProps> = ({ pagination }) => (
  <TablePagination
    rowsPerPageOptions={[5, 10, 25, 50, 100]}
    component="div"
    count={pagination.total}
    rowsPerPage={pagination.rowsPerPage}
    page={pagination.page}
    onPageChange={(_, newPage) => pagination.setPage(newPage)}
    onRowsPerPageChange={(event) => pagination.setRowsPerPage(parseInt(event.target.value, 10))}
  />
);

export default TablePaginationControls;
