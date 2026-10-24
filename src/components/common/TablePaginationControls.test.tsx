import React, { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TablePaginationControls from './TablePaginationControls';
import useTableControls from '../../hooks/useTableControls';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme';

interface Row {
  id: number;
  name: string;
}

const ROWS: Row[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `Row ${i + 1}`
}));

const SEARCH_FIELDS = (row: Row) => [row.name];
const SORT_ACCESSORS = { name: (row: Row) => row.name };

const Harness: React.FC = () => {
  const controls = useTableControls<Row>({
    rows: ROWS,
    searchFields: SEARCH_FIELDS,
    sortAccessors: SORT_ACCESSORS,
    initialSortKey: 'name'
  });

  return (
    <div>
      <ul data-testid="rows">
        {controls.pageRows.map((row) => (
          <li key={row.id}>{row.name}</li>
        ))}
      </ul>
      <TablePaginationControls pagination={controls} />
    </div>
  );
};

/**
 * The same document-level listeners App.tsx installs. The rows-per-page menu is
 * keyboard-operable, so these have to be present for the test to mean anything.
 */
const installGlobalInputRestriction = () => {
  const isEditable = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    if (target instanceof HTMLTextAreaElement) return true;
    if (target instanceof HTMLInputElement) {
      const blocked = new Set([
        'button', 'checkbox', 'color', 'file', 'hidden',
        'image', 'radio', 'range', 'reset', 'submit'
      ]);
      return !blocked.has((target.type || '').toLowerCase());
    }
    return false;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isEditable(event.target)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  document.addEventListener('keydown', onKeyDown, true);
  return () => document.removeEventListener('keydown', onKeyDown, true);
};

const openRowsPerPageMenu = () => {
  // MUI renders the trigger as a combobox, with the value as its text
  const trigger = screen.getByRole('combobox');
  fireEvent.mouseDown(trigger);
  return screen.getByRole('listbox');
};

/** The pages render inside the application ThemeProvider, so the test does too. */
const renderHarness = () =>
  render(
    <ThemeProvider theme={theme}>
      <Harness />
    </ThemeProvider>
  );

describe('rows-per-page dropdown', () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installGlobalInputRestriction();
  });

  afterEach(() => {
    teardown();
  });

  it('shows the initial page size', () => {
    renderHarness();
    expect(screen.getByRole('combobox')).toHaveTextContent('10');
    expect(within(screen.getByTestId('rows')).getAllByRole('listitem')).toHaveLength(10);
  });

  it('holds the selection after clicking an option', () => {
    renderHarness();

    const listbox = openRowsPerPageMenu();
    fireEvent.click(within(listbox).getByRole('option', { name: '25' }));

    expect(screen.getByRole('combobox')).toHaveTextContent('25');
    expect(within(screen.getByTestId('rows')).getAllByRole('listitem')).toHaveLength(25);
  });

  it('holds a selection larger than the row count', () => {
    renderHarness();

    const listbox = openRowsPerPageMenu();
    fireEvent.click(within(listbox).getByRole('option', { name: '100' }));

    expect(screen.getByRole('combobox')).toHaveTextContent('100');
    expect(within(screen.getByTestId('rows')).getAllByRole('listitem')).toHaveLength(47);
  });

  it('keeps the selection when paging afterwards', () => {
    renderHarness();

    fireEvent.click(within(openRowsPerPageMenu()).getByRole('option', { name: '25' }));
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));

    expect(screen.getByRole('combobox')).toHaveTextContent('25');
    expect(within(screen.getByTestId('rows')).getAllByRole('listitem')).toHaveLength(22);
  });

  it('returns to the first page when the page size changes', () => {
    renderHarness();

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('Row 11')).toBeInTheDocument();

    fireEvent.click(within(openRowsPerPageMenu()).getByRole('option', { name: '25' }));
    expect(screen.getByText('Row 1')).toBeInTheDocument();
  });
});
