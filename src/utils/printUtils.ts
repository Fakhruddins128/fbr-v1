const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const copyDocumentStyles = () =>
  Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');

const replaceCanvasWithImages = (sourceRoot: HTMLElement, clonedRoot: HTMLElement) => {
  const sourceCanvases = Array.from(sourceRoot.querySelectorAll('canvas'));
  const clonedCanvases = Array.from(clonedRoot.querySelectorAll('canvas'));

  sourceCanvases.forEach((sourceCanvas, index) => {
    const clonedCanvas = clonedCanvases[index];

    if (!clonedCanvas) {
      return;
    }

    try {
      const image = document.createElement('img');
      const computedStyle = window.getComputedStyle(sourceCanvas);

      image.src = sourceCanvas.toDataURL('image/png');
      image.alt = 'Canvas preview';
      image.width = sourceCanvas.width;
      image.height = sourceCanvas.height;
      image.style.display = computedStyle.display === 'inline' ? 'inline-block' : computedStyle.display;
      image.style.width = computedStyle.width;
      image.style.height = computedStyle.height;
      image.style.maxWidth = computedStyle.maxWidth;
      image.style.maxHeight = computedStyle.maxHeight;
      image.style.objectFit = 'contain';
      image.style.verticalAlign = computedStyle.verticalAlign;

      clonedCanvas.replaceWith(image);
    } catch (error) {
      console.error('Unable to copy canvas for printing:', error);
    }
  });
};

export const printElementContent = (element: HTMLElement, title = 'Invoice Preview') => {
  const printWindow = window.open('', '_blank', 'width=1024,height=900,noopener,noreferrer');

  if (!printWindow) {
    return false;
  }

  const clonedRoot = element.cloneNode(true) as HTMLElement;
  replaceCanvasWithImages(element, clonedRoot);

  const printDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        ${copyDocumentStyles()}
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
      <body>
        <div class="print-shell">${clonedRoot.outerHTML}</div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  printWindow.onload = () => {
    setTimeout(triggerPrint, 350);
  };

  printWindow.onafterprint = () => {
    printWindow.close();
  };

  return true;
};
