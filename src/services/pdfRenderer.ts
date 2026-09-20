import * as pdfjsLib from 'pdfjs-dist';

// Configure worker safely for browser environments
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use unpkg or cdnjs with exact version matching
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface PdfPageRenderResult {
  numPages: number;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
}

export const PdfRenderer = {
  /**
   * Renders a specific page of a PDF data URI onto an HTML Canvas with high crispness.
   */
  async renderPage(
    pdfDataUriOrBytes: string | Uint8Array,
    pageNumber: number, // 1-indexed
    canvas: HTMLCanvasElement
  ): Promise<PdfPageRenderResult> {
    let uint8Array: Uint8Array;

    if (typeof pdfDataUriOrBytes === 'string') {
      const base64Data = pdfDataUriOrBytes.includes(',')
        ? pdfDataUriOrBytes.split(',')[1]
        : pdfDataUriOrBytes;
      const binary = atob(base64Data);
      uint8Array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        uint8Array[i] = binary.charCodeAt(i);
      }
    } else {
      uint8Array = pdfDataUriOrBytes;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const safePageNum = Math.min(Math.max(1, pageNumber), numPages);
    const page = await pdfDoc.getPage(safePageNum);

    const baseViewport = page.getViewport({ scale: 1.0 });
    // Render at 2x scale for sharp HD resolution
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Context 2D tidak tersedia pada canvas');

    // Clear canvas before render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport,
    };

    await (page.render(renderContext as any) as any).promise;

    return {
      numPages,
      originalWidth: baseViewport.width,
      originalHeight: baseViewport.height,
      aspectRatio: baseViewport.width / baseViewport.height,
    };
  },
};
