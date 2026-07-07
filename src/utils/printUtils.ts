import React from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { createRoot } from 'react-dom/client';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const printTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    },
    background: {
      default: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
});

export const printReactContent = (
  content: React.ReactElement,
  title = 'Invoice Preview',
  options?: { scale?: number }
) => {
  const scale = options?.scale ?? 0.7;
  const printWindow = window.open('about:blank', '_blank', 'width=1024,height=900,left=120,top=80');

  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
          }

          body {
            background: #fff;
          }

          .print-shell {
            background: #fff;
            min-height: 100vh;
            overflow: visible;
          }

          .print-scale-wrap {
            zoom: ${scale};
            transform-origin: top left;
          }

          @supports not (zoom: 1) {
            .print-scale-wrap {
              transform: scale(${scale});
              transform-origin: top left;
              width: ${100 / scale}%;
            }
          }

          @media print {
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body></body>
    </html>
  `);
  printWindow.document.close();

  const rootElement = printWindow.document.createElement('div');
  rootElement.id = 'print-root';
  printWindow.document.body.innerHTML = '';
  printWindow.document.body.appendChild(rootElement);

  const cache = createCache({
    key: 'print',
    container: printWindow.document.head
  });

  const root = createRoot(rootElement);
  root.render(
    React.createElement(
      CacheProvider,
      { value: cache },
      React.createElement(
        ThemeProvider,
        { theme: printTheme },
        React.createElement(
          React.Fragment,
          null,
          React.createElement(CssBaseline),
          React.createElement('div', { className: 'print-scale-wrap' }, content)
        )
      )
    )
  );

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  setTimeout(triggerPrint, 500);

  printWindow.onafterprint = () => {
    root.unmount();
    printWindow.close();
  };

  return true;
};
