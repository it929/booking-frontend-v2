// src/lib/printUtils.ts

/**
 * Cleanly prints a single element (e.g. ticket, receipt, or manifest) in an isolated iframe,
 * ensuring no navbars, footers, page titles, or background page elements are printed.
 */
export interface PrintElementOptions {
  fullWidth?: boolean;
  landscape?: boolean;
  pageTitle?: string;
  margin?: string;
}

export function printElement(
  elementId: string,
  title = 'Isalu Hospitals - Clinical Document',
  options?: PrintElementOptions
): void {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Clone element and strip any Tailwind hidden classes that cause blank prints
  const cloned = element.cloneNode(true) as HTMLElement;
  cloned.classList.remove('hidden');
  cloned.style.display = 'block';
  cloned.style.visibility = 'visible';
  cloned.style.opacity = '1';

  // Remove existing print iframe if any
  const existingIframe = document.getElementById('isalu-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'isalu-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Collect all stylesheets from parent document to preserve typography and styling
  const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  const isFullWidth = options?.fullWidth ?? false;
  const isLandscape = options?.landscape ?? false;
  const pageSize = isLandscape ? 'landscape' : 'portrait';
  const pageMargin = options?.margin || (isFullWidth ? '6mm 8mm' : '10mm');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${styleElements}
        <style>
          @page {
            margin: ${pageMargin};
            size: ${pageSize};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          .print-wrapper {
            width: 100% !important;
            max-width: ${isFullWidth ? '100%' : '440px'} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: block !important;
            visibility: visible !important;
          }
          #${elementId},
          #${elementId} * {
            visibility: visible !important;
          }
          #${elementId} {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            border: ${isFullWidth ? 'none' : '1px solid #cbd5e1'} !important;
            box-shadow: none !important;
            border-radius: ${isFullWidth ? '0' : '16px'} !important;
            background: #ffffff !important;
            width: 100% !important;
            max-width: ${isFullWidth ? '100%' : '440px'} !important;
            margin: 0 auto !important;
            padding: ${isFullWidth ? '4px 0' : '18px'} !important;
            page-break-inside: avoid !important;
          }
          ${
            !isFullWidth
              ? `
          #${elementId} .p-6,
          #${elementId} .p-8,
          #${elementId} .sm\\:p-8 {
            padding: 16px !important;
          }
          #${elementId} .space-y-6 > * + * {
            margin-top: 12px !important;
          }
          #${elementId} .p-4 {
            padding: 10px 14px !important;
          }
          `
              : `
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            page-break-inside: avoid !important;
          }
          `
          }
          button, .no-print {
            display: none !important;
            visibility: hidden !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${cloned.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Allow fonts & styles in the iframe to settle, then print
  const printAction = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  };

  setTimeout(printAction, 250);
}
