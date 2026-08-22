import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  QrCode,
  Sparkles,
  Move,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ZoomIn,
  RefreshCw,
} from 'lucide-react';
import { PdfStamper } from '../../services/pdfStamper';
import { PdfRenderer } from '../../services/pdfRenderer';
import QRCode from 'qrcode';

interface PdfQrStamperModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileDataUri: string;
  fileName: string;
  requestNumber: string;
  officialNumber?: string;
  schoolName: string;
  verificationUrl: string;
  onStampComplete: (stampedDataUri: string, stampedFileName: string) => void;
}

export const PdfQrStamperModal: React.FC<PdfQrStamperModalProps> = ({
  isOpen,
  onClose,
  fileDataUri,
  fileName,
  requestNumber,
  officialNumber,
  schoolName,
  verificationUrl,
  onStampComplete,
}) => {
  const [qrSizeMm, setQrSizeMm] = useState<number>(26); // mm
  const [posX, setPosX] = useState<number>(75); // percent from left
  const [posY, setPosY] = useState<number>(78); // percent from top
  const [currentPage, setCurrentPage] = useState<number>(1); // 1-indexed for display
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRenderingDoc, setIsRenderingDoc] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [docAspectRatio, setDocAspectRatio] = useState<number>(1 / 1.414); // Standard A4 ratio
  const [showBorder, setShowBorder] = useState<boolean>(true);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isImage = fileDataUri?.startsWith('data:image/');
  const isPdf =
    fileDataUri?.startsWith('data:application/pdf') ||
    fileName?.toLowerCase().endsWith('.pdf') ||
    (!isImage && fileDataUri?.startsWith('data:'));

  // Generate QR code preview image
  useEffect(() => {
    if (!verificationUrl) return;
    QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 240,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setQrPreviewUrl(url))
      .catch(() => {});
  }, [verificationUrl]);

  // Render real PDF document onto Canvas
  const loadPdfDocument = useCallback(async () => {
    if (!isOpen || !isPdf || !fileDataUri) return;
    if (!canvasRef.current) return;

    setIsRenderingDoc(true);
    setRenderError(null);

    try {
      const result = await PdfRenderer.renderPage(fileDataUri, currentPage, canvasRef.current);
      setTotalPages(result.numPages || 1);
      if (result.aspectRatio && result.aspectRatio > 0.2 && result.aspectRatio < 3) {
        setDocAspectRatio(result.aspectRatio);
      }
    } catch (err: any) {
      console.error('Failed to render PDF page on canvas:', err);
      setRenderError(
        'Dokumen asli tidak dapat dirender secara visual (' +
          (err?.message || 'Format tidak didukung') +
          '). Anda tetap dapat memposisikan QR Code sesuai perkiraan.'
      );
    } finally {
      setIsRenderingDoc(false);
    }
  }, [isOpen, isPdf, fileDataUri, currentPage]);

  useEffect(() => {
    if (isOpen && isPdf) {
      // Small timeout to ensure canvas ref is mounted in DOM
      const timer = setTimeout(() => {
        loadPdfDocument();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isPdf, currentPage, loadPdfDocument]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePositionFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePositionFromPointer(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updatePositionFromPointer = (e: React.PointerEvent | React.MouseEvent) => {
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosX(Math.max(4, Math.min(88, Math.round(x))));
    setPosY(Math.max(4, Math.min(88, Math.round(y))));
  };

  const handleStampAndSave = async () => {
    setIsProcessing(true);
    try {
      let result;
      if (isImage) {
        result = await PdfStamper.stampQrOnImageToPdf(fileDataUri, {
          qrContent: verificationUrl,
          pageIndex: 0,
          xPercent: posX,
          yPercent: posY,
          sizeMm: qrSizeMm,
          showBorderAndLabel: showBorder,
          officialNumber,
          schoolName,
        });
      } else {
        result = await PdfStamper.stampQrOnPdf(fileDataUri, {
          qrContent: verificationUrl,
          pageIndex: Math.max(0, currentPage - 1),
          xPercent: posX,
          yPercent: posY,
          sizeMm: qrSizeMm,
          showBorderAndLabel: showBorder,
          officialNumber,
          schoolName,
        });
      }

      const cleanBaseName = fileName.replace(/\.[^/.]+$/, '');
      const stampedName = `${cleanBaseName}_Resmi_QR.pdf`;
      onStampComplete(result.stampedDataUri, stampedName);
      onClose();
    } catch (err: any) {
      console.error('Error stamping QR:', err);
      alert('Gagal menyematkan QR Code ke dokumen: ' + (err.message || 'Format dokumen tidak didukung'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Penempelan QR Code Verifikasi (e-Meterai Style)</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Live Document Render
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dokumen asli ditampilkan di bawah. Klik atau geser kotak QR tepat di sebelah tanda tangan/stempel surat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center: Interactive Canvas Sheet Preview */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Top Toolbar: Guidance & Page Switcher */}
            <div className="w-full flex items-center justify-between mb-3 text-xs font-semibold text-slate-600 gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Move className="w-4 h-4 text-blue-600" />
                <span>Geser / Klik pada surat untuk menaruh QR</span>
              </span>

              {/* Multi-page switcher if PDF has > 1 page */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-600 font-medium">Halaman:</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isRenderingDoc}
                    className="p-1 rounded bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-slate-900 text-xs px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || isRenderingDoc}
                    className="p-1 rounded bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-mono text-[11px] text-slate-800">
                Posisi: <b>X: {posX}% | Y: {posY}%</b> (Hal {currentPage})
              </span>
            </div>

            {/* Simulated / Real Paper Canvas Container */}
            <div className="w-full flex justify-center items-center bg-slate-100/80 p-2 sm:p-4 rounded-2xl border border-slate-200">
              <div
                ref={previewContainerRef}
                onClick={updatePositionFromPointer}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-full max-w-[500px] bg-white border-2 border-slate-300 rounded-xl shadow-2xl overflow-hidden cursor-crosshair select-none flex items-center justify-center transition-all"
                style={{
                  aspectRatio: docAspectRatio,
                }}
              >
                {/* 1. Real PDF Canvas */}
                {isPdf && (
                  <canvas
                    ref={canvasRef}
                    className={`w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${
                      isRenderingDoc ? 'opacity-30' : 'opacity-100'
                    }`}
                  />
                )}

                {/* 2. Real Image (Scan/Foto) */}
                {isImage && (
                  <img
                    src={fileDataUri}
                    alt="Pratinjau Surat Asli"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                )}

                {/* Loading indicator while PDF.js renders */}
                {isRenderingDoc && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-2xs z-10 space-y-2">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-700">Merender Dokumen Asli...</p>
                  </div>
                )}

                {/* Fallback Warning if PDF rendering had issues */}
                {renderError && (
                  <div className="absolute top-4 inset-x-4 bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-[11px] text-amber-900 flex items-start gap-2 shadow-sm z-10">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-tight">{renderError}</p>
                  </div>
                )}

                {/* Draggable & Clickable QR Stamp Element */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${qrSizeMm * 2.8}px`,
                    height: `${qrSizeMm * 2.8}px`,
                  }}
                  className={`z-20 cursor-grab active:cursor-grabbing transition-shadow rounded-lg p-1 bg-white flex flex-col items-center justify-center shadow-xl border-2 ${
                    showBorder ? 'border-blue-700 ring-2 ring-blue-400/40' : 'border-dashed border-blue-400'
                  } hover:scale-105`}
                >
                  {qrPreviewUrl ? (
                    <img src={qrPreviewUrl} alt="QR" className="w-full h-full object-contain pointer-events-none" />
                  ) : (
                    <QrCode className="w-full h-full text-slate-800" />
                  )}
                  <span className="absolute -top-3 -right-2 bg-blue-700 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    QR Resmi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Controls & Presets */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Document Target Info */}
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Target Dokumen & Info QR</span>
                </p>
                <div className="space-y-1 text-[11px] text-blue-800">
                  <p className="truncate">
                    <b>Berkas:</b> {fileName}
                  </p>
                  <p>
                    <b>No. Permohonan:</b> {requestNumber}
                  </p>
                  <p>
                    <b>No. Surat Resmi:</b> {officialNumber || '(Dibuat otomatis)'}
                  </p>
                  <p>
                    <b>Halaman Target QR:</b> Halaman {currentPage} dari {totalPages}
                  </p>
                </div>
              </div>

              {/* Preset Position Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Posisi Cepat (Preset):</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPosX(78);
                      setPosY(80);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 font-semibold text-slate-700 transition text-left"
                  >
                    📍 Kanan Bawah (Dekat TTD)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosX(22);
                      setPosY(80);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 font-semibold text-slate-700 transition text-left"
                  >
                    📍 Kiri Bawah (Dekat Catatan)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosX(50);
                      setPosY(80);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 font-semibold text-slate-700 transition text-left"
                  >
                    📍 Tengah Bawah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosX(80);
                      setPosY(20);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 font-semibold text-slate-700 transition text-left"
                  >
                    📍 Kanan Atas (Dekat Kop)
                  </button>
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Ukuran QR Code:</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Kecil', mm: 20 },
                    { label: 'Sedang', mm: 26 },
                    { label: 'Besar', mm: 32 },
                  ].map((s) => (
                    <button
                      key={s.mm}
                      type="button"
                      onClick={() => setQrSizeMm(s.mm)}
                      className={`py-2 px-2 rounded-xl border font-bold text-center transition ${
                        qrSizeMm === s.mm
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s.label} ({s.mm}mm)
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Border Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={showBorder}
                  onChange={(e) => setShowBorder(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Beri Garis Tepi Putih & Bingkai Pengaman di belakang QR</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleStampAndSave}
                disabled={isProcessing || isRenderingDoc}
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sedang Menyematkan QR ke PDF...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Tempelkan QR & Terbitkan Dokumen</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
