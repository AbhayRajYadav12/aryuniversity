import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function loadPdfFromBlob(blob) {
  const data = new Uint8Array(await blob.arrayBuffer());
  return pdfjs.getDocument({ data, useSystemFonts: true }).promise;
}

/**
 * Draw a PDF page and overlay a repeated translucent diagonal watermark.
 */
export async function renderPageWithWatermark(page, canvas, watermarkLines) {
  const viewport = page.getViewport({ scale: 1.25 });
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

  context.save();
  context.globalAlpha = 0.14;
  context.fillStyle = '#0a1f44';
  context.font = '600 14px "Source Sans 3", sans-serif';
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((-28 * Math.PI) / 180);

  const text = ['ARY UNIVERSITY – CONFIDENTIAL', ...watermarkLines].join('  ·  ');
  const stepY = 64;
  const stepX = Math.max(320, context.measureText(text).width + 40);

  for (let y = -canvas.height; y < canvas.height; y += stepY) {
    for (let x = -canvas.width; x < canvas.width; x += stepX) {
      context.fillText(text, x, y);
    }
  }
  context.restore();
}
