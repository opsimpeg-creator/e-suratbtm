import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { SubmissionRequest, SchoolSettings } from '../../types';
import { PdfGenerator } from '../../services/pdfGenerator';
import { CheckCircle2, Download, Printer, ArrowRight, Copy, X } from 'lucide-react';

interface SubmissionSuccessModalProps {
  request: SubmissionRequest;
  settings: SchoolSettings;
  onClose: () => void;
  onTrack: (requestNumber: string) => void;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  request,
  settings,
  onClose,
  onTrack,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(request.qrVerificationCode || request.requestNumber, { margin: 1, width: 220 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [request]);

  const handleCopy = () => {
    navigator.clipboard.writeText(request.requestNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadProof = () => {
    PdfGenerator.generateProofPdf(request, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center p-6 sm:p-8 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Pengajuan Berhasil Terkirim
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            Permohonan Surat Diterima!
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Terima kasih {request.applicantName}. Permohonan <b>{request.letterTypeName}</b> Anda telah dicatat di database Tata Usaha.
          </p>
        </div>

        {/* Request Number Display Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Nomor Permohonan / Tracking ID Anda
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-800 font-mono tracking-wider">
              {request.requestNumber}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:text-blue-700 hover:bg-white rounded-lg transition"
              title="Salin Nomor Permohonan"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied && <p className="text-[11px] text-emerald-600 font-semibold">Berhasil disalin!</p>}
        </div>

        {/* QR Code Preview */}
        <div className="flex flex-col items-center justify-center space-y-2">
          {qrDataUrl && (
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 object-contain" />
            </div>
          )}
          <p className="text-[11px] text-slate-500 font-medium">
            Scan QR Code di atas untuk melacak status atau verifikasi keabsahan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadProof}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Bukti (PDF)</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs border border-slate-300 transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Bukti</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => onTrack(request.requestNumber)}
            className="text-xs text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Lacak Status Permohonan Ini Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
