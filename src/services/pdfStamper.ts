import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

export interface StampOptions {
  qrContent: string;
  pageIndex: number; // 0-based
  xPercent: number; // 0 to 100 (from left)
  yPercent: number; // 0 to 100 (from top)
  sizeMm: number; // e.g. 24mm to 40mm
  showBorderAndLabel?: boolean;
  officialNumber?: string;
  schoolName?: string;
}

export const PdfStamper = {
  /**
   * Stamps a QR code onto an existing PDF document at specified coordinates.
   */
  async stampQrOnPdf(
    pdfDataUriOrBytes: string | Uint8Array | ArrayBuffer,
    options: StampOptions
  ): Promise<{ stampedDataUri: string; blob: Blob }> {
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
    } else if (pdfDataUriOrBytes instanceof ArrayBuffer) {
      uint8Array = new Uint8Array(pdfDataUriOrBytes);
    } else {
      uint8Array = pdfDataUriOrBytes;
    }

    const pdfDoc = await PDFDocument.load(uint8Array, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const pageIndex = Math.min(Math.max(0, options.pageIndex), pages.length - 1);
    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    // Generate high quality QR code PNG
    const qrDataUrl = await QRCode.toDataURL(options.qrContent, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const qrImageBytes = Uint8Array.from(
      atob(qrDataUrl.split(',')[1]),
      (c) => c.charCodeAt(0)
    );
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    // 1 mm = 72 / 25.4 points ≈ 2.8346 points
    const ptPerMm = 72 / 25.4;
    const qrSizePt = options.sizeMm * ptPerMm;

    // Calculate position
    const xPt = (options.xPercent / 100) * width;
    const yFromTopPt = (options.yPercent / 100) * height;
    // PDF coordinate origin (0,0) is bottom-left
    const yPt = height - yFromTopPt - qrSizePt;

    // Ensure within page bounds
    const clampedX = Math.max(5, Math.min(width - qrSizePt - 5, xPt));
    const clampedY = Math.max(5, Math.min(height - qrSizePt - 5, yPt));

    // Optional white protective background card with subtle border
    if (options.showBorderAndLabel) {
      page.drawRectangle({
        x: clampedX - 3,
        y: clampedY - 3,
        width: qrSizePt + 6,
        height: qrSizePt + 6,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.12, 0.23, 0.54), // Navy border
        borderWidth: 0.8,
      });
    }

    // Embed QR Code
    page.drawImage(qrImage, {
      x: clampedX,
      y: clampedY,
      width: qrSizePt,
      height: qrSizePt,
    });

    const stampedBytes = await pdfDoc.save();
    
    // Convert to Blob and Data URI
    const blob = new Blob([stampedBytes as unknown as BlobPart], { type: 'application/pdf' });
    
    // Chunked base64 conversion to prevent call stack limits
    let binary = '';
    const bytes = new Uint8Array(stampedBytes);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, Math.min(i + chunkSize, bytes.length)))
      );
    }
    const stampedDataUri = `data:application/pdf;base64,${btoa(binary)}`;

    return {
      stampedDataUri,
      blob,
    };
  },

  /**
   * Stamps QR Code onto an image (JPG/PNG scan) and returns as PDF Data URI.
   */
  async stampQrOnImageToPdf(
    imageDataUri: string,
    options: StampOptions
  ): Promise<{ stampedDataUri: string; blob: Blob }> {
    const pdfDoc = await PDFDocument.create();

    // Determine image type
    let embeddedImage;
    if (imageDataUri.includes('image/png')) {
      const bytes = Uint8Array.from(atob(imageDataUri.split(',')[1]), (c) => c.charCodeAt(0));
      embeddedImage = await pdfDoc.embedPng(bytes);
    } else {
      const bytes = Uint8Array.from(atob(imageDataUri.split(',')[1]), (c) => c.charCodeAt(0));
      embeddedImage = await pdfDoc.embedJpg(bytes);
    }

    const { width: imgW, height: imgH } = embeddedImage;
    // Standard A4 in points: 595.28 x 841.89
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width: pageW, height: pageH } = page.getSize();

    // Scale image to fit page with margins
    const scale = Math.min((pageW - 20) / imgW, (pageH - 20) / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const imgX = (pageW - drawW) / 2;
    const imgY = (pageH - drawH) / 2;

    page.drawImage(embeddedImage, {
      x: imgX,
      y: imgY,
      width: drawW,
      height: drawH,
    });

    // Generate QR
    const qrDataUrl = await QRCode.toDataURL(options.qrContent, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    const qrBytes = Uint8Array.from(atob(qrDataUrl.split(',')[1]), (c) => c.charCodeAt(0));
    const qrImage = await pdfDoc.embedPng(qrBytes);

    const ptPerMm = 72 / 25.4;
    const qrSizePt = options.sizeMm * ptPerMm;

    const xPt = imgX + (options.xPercent / 100) * drawW;
    const yFromTopPt = imgY + drawH - (options.yPercent / 100) * drawH;
    const yPt = yFromTopPt - qrSizePt;

    page.drawRectangle({
      x: xPt - 2,
      y: yPt - 2,
      width: qrSizePt + 4,
      height: qrSizePt + 4,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.12, 0.23, 0.54),
      borderWidth: 0.8,
    });

    page.drawImage(qrImage, {
      x: xPt,
      y: yPt,
      width: qrSizePt,
      height: qrSizePt,
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

    let binary = '';
    const bytes = new Uint8Array(pdfBytes);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, Math.min(i + chunkSize, bytes.length)))
      );
    }
    const stampedDataUri = `data:application/pdf;base64,${btoa(binary)}`;

    return { stampedDataUri, blob };
  },
};
