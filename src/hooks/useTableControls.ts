import { useCallback, useEffect, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

/** The sort half of the controls, as a table header needs it. */
export interface SortState {
  sortKey: string;
  sortDirection: SortDirection;
  toggleSort: (key: string) => void;
}

/** The pagination half of the controls, as TablePagination needs it. */
export interface PaginationState {
  page: number;
  rowsPerPage: number;
  setPage: (page: number) => void;
  setRowsPerPage: (rowsPerPage: number) => void;
  /** Length of `rows`, which is what TablePagination must count. */
  total: number;
}

export interface TableControls<T> extends SortState, PaginationState {
  search: string;
  setSearch: (value: string) => void;
  /** Every row after searching and sorting, in display order. */
  rows: T[];
  /** Just the current page of `rows`. This is what the table body renders. */
  pageRows: T[];
}

type Value = string | number | null | undefined;

interface Options<T> {
  rows: T[];
  /** Values the search box matches against, per row. */
  searchFields: (row: T) => Value[];
  /** Sortable columns, keyed by the key the table header passes back. */
  sortAccessors: Record<string, (row: T) => Value>;
  initialSortKey?: string;
  initialSortDirection?: SortDirection;
  initialRowsPerPage?: number;
}

const isBlank = (value: Value) => value === null || value === undefined || value === '';

/**
 * Client-side search and sort for a table.
 *
 * Every page using this already loads its whole row set in one request, so
 * there is nothing to re-fetch when the controls change. Pass `searchFields`
 * and `sortAccessors` as module-level constants rather than inline literals,
 * otherwise their changing identity re-runs the work on every render.
 */
export function useTableControls<T>({
  rows,
  searchFields,
  sortAccessors,
  initialSortKey = '',
  initialSortDirection = 'asc',
  initialRowsPerPage = 10
}: Options<T>): TableControls<T> {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const toggleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    },
    [sortKey]
  );

  const processed = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matched = query
      ? rows.filter((row) =>
          searchFields(row).some(
            (value) => !isBlank(value) && String(value).toLowerCase().includes(query)
          )
        )
      : rows;

    const accessor = sortAccessors[sortKey];
    if (!accessor) {
      return matched;
    }

    // Copied first: sort mutates in place and rows belongs to the caller
    return [...matched].sort((a, b) => {
      const left = accessor(a);
      const right = accessor(b);

      // Blanks always sort last, so empty cells never lead the table
      const leftBlank = isBlank(left);
      const rightBlank = isBlank(right);
      if (leftBlank || rightBlank) {
        if (leftBlank && rightBlank) return 0;
        return leftBlank ? 1 : -1;
      }

      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), undefined, {
              numeric: true,
              sensitivity: 'base'
            });

      return sortDirection === 'asc' ? result : -result;
    });
  }, [rows, search, searchFields, sortAccessors, sortKey, sortDirection]);

  // A new search or sort order means the old page number is meaningless
  useEffect(() => {
    setPage(0);
  }, [search, sortKey, sortDirection]);

  // Clamped rather than reset, so narrowing the list (a filter, a deletion)
  // slides to the last page that exists instead of jumping back to the first.
  const lastPage = Math.max(0, Math.ceil(processed.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);

  const pageRows = useMemo(
    () => processed.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage),
    [processed, currentPage, rowsPerPage]
  );

  const changeRowsPerPage = useCallback((value: number) => {
    setRowsPerPage(value);
    setPage(0);
  }, []);

  return {
    search,
    setSearch,
    sortKey,
    sortDirection,
    toggleSort,
    rows: processed,
    pageRows,
    page: currentPage,
    rowsPerPage,
    setPage,
    setRowsPerPage: changeRowsPerPage,
    total: processed.length
  };
}

export default useTableControls;
