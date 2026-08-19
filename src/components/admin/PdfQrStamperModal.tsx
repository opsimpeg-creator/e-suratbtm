import React, { useState, useRef, useEffect } from 'react';
import { X, QrCode, Sparkles, Check, Move, Layers, ZoomIn, ZoomOut, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { PdfStamper } from '../../services/pdfStamper';
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
  const [posX, setPosX] = useState<number>(75); // percent from left (default right near signature)
  const [posY, setPosY] = useState<number>(78); // percent from top (default bottom)
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showBorder, setShowBorder] = useState<boolean>(true);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Generate QR code preview image
  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 200,
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then(url => setQrPreviewUrl(url)).catch(() => {});
  }, [verificationUrl]);

  if (!isOpen) return null;

  const isImage = fileDataUri.startsWith('data:image/');
  const isPdf = fileDataUri.startsWith('data:application/pdf') || fileName.toLowerCase().endsWith('.pdf');

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
    setPosX(Math.max(5, Math.min(85, Math.round(x))));
    setPosY(Math.max(5, Math.min(85, Math.round(y))));
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
          schoolName
        });
      } else {
        result = await PdfStamper.stampQrOnPdf(fileDataUri, {
          qrContent: verificationUrl,
          pageIndex,
          xPercent: posX,
          yPercent: posY,
          sizeMm: qrSizeMm,
          showBorderAndLabel: showBorder,
          officialNumber,
          schoolName
        });
      }

      const stampedName = fileName.replace(/\.[^/.]+$/, '') + '_Resmi_QR.pdf';
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
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Penempelan QR Code Verifikasi (e-Meterai Style)</h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Interactive Stamp
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Geser atau klik pada pratinjau surat untuk mengatur posisi QR Code sebelum diterbitkan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center: Interactive Canvas Sheet Preview */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <Move className="w-4 h-4 text-blue-600" />
                <span>Klik atau geser kotak QR ke titik tanda tangan yang diinginkan</span>
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-mono text-[11px]">
                X: {posX}% | Y: {posY}%
              </span>
            </div>

            {/* Simulated Paper Sheet (A4 Proportion) */}
            <div
              ref={previewContainerRef}
              onClick={updatePositionFromPointer}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full max-w-[500px] aspect-[1/1.414] bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden cursor-crosshair select-none flex flex-col items-center justify-between p-6"
              style={{
                backgroundImage: `radial-gradient(#e2e8f0 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
              }}
            >
              {/* Document Background Visual */}
              {isImage ? (
                <img
                  src={fileDataUri}
                  alt="Pratinjau Surat"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90"
                />
              ) : (
                <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none opacity-70">
                  {/* Mock header */}
                  <div className="text-center border-b-2 border-slate-800 pb-2 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-700 tracking-wider">PEMERINTAH PROVINSI KALIMANTAN SELATAN</p>
                    <p className="text-xs font-extrabold text-slate-900">{schoolName}</p>
                    <p className="text-[8px] text-slate-500">Jl. Ahmad Yani Km. 4.5 Batumandi, Kab. Balangan</p>
                  </div>
                  {/* Mock Content Lines */}
                  <div className="space-y-2 py-4">
                    <div className="h-2.5 bg-slate-200 rounded-full w-3/4 mx-auto mb-4" />
                    <div className="h-1.5 bg-slate-200 rounded-full w-full" />
                    <div className="h-1.5 bg-slate-200 rounded-full w-5/6" />
                    <div className="h-1.5 bg-slate-200 rounded-full w-full" />
                    <div className="h-1.5 bg-slate-200 rounded-full w-4/5" />
                    <div className="h-1.5 bg-slate-200 rounded-full w-full" />
                  </div>
                  {/* Mock Signature Zone */}
                  <div className="flex justify-between items-end pt-4">
                    <div className="text-left space-y-1">
                      <p className="text-[9px] text-slate-400 italic">No. Surat: {officialNumber || '420/001/TU-SMK/2026'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[9px] text-slate-600">Batumandi, Kepala Sekolah</p>
                      <div className="h-8 w-24 border-b border-slate-400 ml-auto flex items-center justify-center">
                        <span className="text-[8px] text-slate-400 italic">(Tanda Tangan & Cap)</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-800">Drs. H. Ahmad Rizky, M.Pd.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Draggable QR Stamp Element */}
              <div
                style={{
                  position: 'absolute',
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${qrSizeMm * 2.8}px`,
                  height: `${qrSizeMm * 2.8}px`,
                }}
                className={`z-20 cursor-grab active:cursor-grabbing transition-shadow rounded-lg p-1 bg-white flex flex-col items-center justify-center shadow-lg border-2 ${
                  showBorder ? 'border-blue-700' : 'border-dashed border-blue-400'
                } hover:scale-105`}
              >
                {qrPreviewUrl ? (
                  <img src={qrPreviewUrl} alt="QR" className="w-full h-full object-contain pointer-events-none" />
                ) : (
                  <QrCode className="w-full h-full text-slate-800" />
                )}
                <span className="absolute -top-3 -right-2 bg-blue-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                  QR Resmi
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Controls & Presets */}
          <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Informasi Target Dokumen</span>
                </p>
                <div className="space-y-1 text-[11px] text-blue-800">
                  <p><b>Berkas:</b> {fileName}</p>
                  <p><b>No. Permohonan:</b> {requestNumber}</p>
                  <p><b>No. Surat Resmi:</b> {officialNumber || '(Dibuat otomatis)'}</p>
                </div>
              </div>

              {/* Preset Position Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Posisi Cepat (Preset):</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setPosX(78); setPosY(80); }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 font-semibold text-slate-700 transition text-left"
                  >
                    📍 Kanan Bawah (Dekat TTD)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosX(22); setPosY(80); }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 font-semibold text-slate-700 transition text-left"
                  >
                    📍 Kiri Bawah (Dekat Catatan)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosX(50); setPosY(80); }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 font-semibold text-slate-700 transition text-left"
                  >
                    📍 Tengah Bawah
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosX(80); setPosY(20); }}
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
                      className={`py-2 px-3 rounded-xl border font-bold text-center transition ${
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
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-2">
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
                disabled={isProcessing}
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Sedang Menempelkan QR ke PDF...</span>
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
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
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
