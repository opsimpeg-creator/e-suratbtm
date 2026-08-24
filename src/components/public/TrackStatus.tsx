import React, { useState, useEffect } from 'react';
import { SubmissionRequest, SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { PdfGenerator } from '../../services/pdfGenerator';
import {
  Search,
  QrCode,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  FileCheck,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  Eye,
  FileDown,
  Maximize2,
  Paperclip,
  X,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';

interface TrackStatusProps {
  initialNumber?: string;
  settings: SchoolSettings;
  setActiveTab: (tab: string) => void;
  onOpenSubmitModal?: (letterTypeId?: string) => void;
}

export const TrackStatus: React.FC<TrackStatusProps> = ({
  initialNumber = '',
  settings,
  setActiveTab,
}) => {
  const [searchInput, setSearchInput] = useState(initialNumber);
  const [foundRequest, setFoundRequest] = useState<SubmissionRequest | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<{ fileName: string; fileUrl: string; fileSize?: string } | null>(null);

  const base64ToBlobUrl = (dataUrl: string): string => {
    if (!dataUrl) return '';
    if (!dataUrl.startsWith('data:')) return dataUrl;
    try {
      const parts = dataUrl.split(';base64,');
      if (parts.length < 2) return dataUrl;
      const contentType = parts[0].replace('data:', '');
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Failed base64 conversion', e);
      return dataUrl;
    }
  };

  const handleOpenPreview = (rawUrl: string, fileName: string) => {
    if (!rawUrl) return;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const safeUrl = base64ToBlobUrl(rawUrl);
    setPreviewModalFile({
      fileName,
      fileUrl: safeUrl,
    });
  };

  const handleOpenOfficialLetterPreview = async (req: SubmissionRequest) => {
    if (req.issuedDocumentUrl) {
      handleOpenPreview(
        req.issuedDocumentUrl,
        req.formData?._officialFileName || `Surat_Resmi_${req.requestNumber}.pdf`
      );
      return;
    }

    try {
      const tpl = StorageService.getTemplateForLetterType(req.letterTypeId);
      const blobUrl = await PdfGenerator.getOfficialLetterPdfBlobUrl(req, tpl, settings);
      setPreviewModalFile({
        fileName: req.formData?._officialFileName || `Surat_Resmi_${req.requestNumber}.pdf`,
        fileUrl: blobUrl,
      });
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const handleDownloadOfficialLetter = async (req: SubmissionRequest) => {
    if (req.issuedDocumentUrl) {
      handleDownloadFile(
        req.issuedDocumentUrl,
        req.formData?._officialFileName || `Surat_Resmi_${req.requestNumber}.pdf`
      );
      return;
    }

    try {
      const tpl = StorageService.getTemplateForLetterType(req.letterTypeId);
      await PdfGenerator.generateOfficialLetterPdf(req, tpl, settings);
    } catch (e) {
      console.error('Error downloading official letter:', e);
    }
  };

  // Helper to construct structured 3-stage official workflow stepper
  const getWorkflowSteps = (req: SubmissionRequest) => {
    const isRejected = req.status === 'Ditolak';
    const isSelesai = req.status === 'Selesai';
    const isDiproses = req.status === 'Diproses';

    // Find specific log events if present
    const tMenunggu = req.timeline?.find((t) => t.status === 'Menunggu') || {
      timestamp: req.createdAt,
      actor: `${req.applicantName} (Pemohon)`,
      note: 'Pengajuan permohonan berhasil terdaftar di sistem Tata Usaha.',
    };

    const tDiproses = req.timeline?.find((t) => t.status === 'Diproses') || {
      timestamp: isSelesai || isDiproses ? (req.updatedAt || req.createdAt) : null,
      actor: 'Petugas Tata Usaha',
      note: req.processingNote || 'Dokumen telah diverifikasi dan disetujui untuk penomoran serta penerbitan.',
    };

    const tSelesai = req.timeline?.find((t) => t.status === 'Selesai') || {
      timestamp: isSelesai ? (req.officialLetterDate || req.updatedAt || req.createdAt) : null,
      actor: 'Tata Usaha / Kepala Sekolah',
      note: `Surat resmi telah diterbitkan dengan Nomor: ${req.officialLetterNumber || '-'}`,
    };

    const tDitolak = req.timeline?.find((t) => t.status === 'Ditolak') || {
      timestamp: req.updatedAt || req.createdAt,
      actor: 'Petugas Tata Usaha',
      note: req.rejectionReason || 'Permohonan ditolak karena kelengkapan data belum memenuhi syarat.',
    };

    if (isRejected) {
      return [
        {
          key: 'step-1',
          title: 'Pengajuan Diterima',
          state: 'completed', // 'completed' | 'active' | 'pending' | 'rejected'
          timestamp: tMenunggu.timestamp,
          actor: tMenunggu.actor,
          desc: tMenunggu.note,
        },
        {
          key: 'step-rejected',
          title: 'Permohonan Ditolak',
          state: 'rejected',
          timestamp: tDitolak.timestamp,
          actor: tDitolak.actor,
          desc: tDitolak.note,
        },
      ];
    }

    return [
      {
        key: 'step-1',
        title: '1. Pengajuan Masuk',
        state: 'completed',
        timestamp: tMenunggu.timestamp,
        actor: tMenunggu.actor,
        desc: tMenunggu.note,
      },
      {
        key: 'step-2',
        title: '2. Verifikasi & Pemrosesan Staf TU',
        state: isSelesai ? 'completed' : isDiproses ? 'active' : 'pending',
        timestamp: isSelesai || isDiproses ? tDiproses.timestamp : null,
        actor: isSelesai || isDiproses ? tDiproses.actor : undefined,
        desc: isSelesai
          ? 'Persyaratan data telah diverifikasi dan disetujui oleh Petugas Tata Usaha.'
          : isDiproses
          ? (req.processingNote || 'Sedang diverifikasi, disiapkan draft dokumen, dan proses penandatanganan surat.')
          : 'Menunggu antrean verifikasi kelengkapan berkas oleh Petugas Tata Usaha.',
      },
      {
        key: 'step-3',
        title: '3. Surat Selesai & Terbit',
        state: isSelesai ? 'completed' : 'pending',
        timestamp: isSelesai ? tSelesai.timestamp : null,
        actor: isSelesai ? tSelesai.actor : undefined,
        desc: isSelesai
          ? `Surat resmi telah diterbitkan dengan Nomor: ${req.officialLetterNumber || '-'} dan siap diunduh.`
          : 'Dokumen surat resmi belum diterbitkan.',
      },
    ];
  };

  const handleDownloadFile = (rawUrl: string, fileName: string) => {
    if (!rawUrl) return;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const safeUrl = base64ToBlobUrl(rawUrl);
    const a = document.createElement('a');
    a.href = safeUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    if (initialNumber) {
      handleSearch(initialNumber);
    }
  }, [initialNumber]);

  const handleSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;

    setHasSearched(true);
    let result = StorageService.getSubmissionByNumber(q);
    if (!result) {
      result = StorageService.getSubmissionByQr(q);
    }

    setFoundRequest(result || null);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai / Terbit</span>
          </span>
        );
      case 'Diproses':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Sedang Diproses Staf TU</span>
          </span>
        );
      case 'Ditolak':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Pelacakan Real-time
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">Cek Status Permohonan Surat</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Masukkan Nomor Permohonan atau Kode QR dari bukti pengajuan untuk memantau proses verifikasi dokumen.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <form onSubmit={onFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Masukkan Nomor Permohonan (Contoh: SRT-CONTOH-0001)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase font-mono tracking-wider"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-md flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Cek Status</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Contoh no resi sampel:{' '}
            <button
              type="button"
              onClick={() => {
                setSearchInput('SRT-CONTOH-0001');
                handleSearch('SRT-CONTOH-0001');
              }}
              className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded"
            >
              SRT-CONTOH-0001
            </button>
          </span>
          <button
            onClick={() => setActiveTab('verifikasi')}
            className="text-blue-700 font-semibold hover:underline flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Verifikasi QR Surat Resmi</span>
          </button>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && !foundRequest && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-lg">Permohonan Tidak Ditemukan</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Nomor permohonan "<b>{searchInput}</b>" tidak terdaftar di database kami. Pastikan format nomor permohonan sudah sesuai.
          </p>
        </div>
      )}

      {foundRequest && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-8 p-6 sm:p-8">
          {/* Card Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">No. Permohonan:</span>
                <span className="font-mono font-bold text-blue-800 text-base">{foundRequest.requestNumber}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{foundRequest.letterTypeName}</h2>
            </div>
            <div>{getStatusBadge(foundRequest.status)}</div>
          </div>

          {/* Details Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Nama Pemohon:</span>
              <span className="font-bold text-slate-900 text-sm">{foundRequest.applicantName}</span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Tanggal Pengajuan:</span>
              <span className="font-bold text-slate-900">
                {new Date(foundRequest.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Nomor Surat Resmi:</span>
              <span className="font-bold text-blue-700 font-mono">
                {foundRequest.officialLetterNumber || 'Belum diterbitkan'}
              </span>
            </div>
          </div>

          {/* Rejection Note */}
          {foundRequest.status === 'Ditolak' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1 text-xs text-rose-900">
              <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Alasan Penolakan dari Tata Usaha:</span>
              </h4>
              <p className="pl-5 leading-relaxed">{foundRequest.rejectionReason || 'Persyaratan data belum lengkap.'}</p>
            </div>
          )}

          {/* Progress Stepper Workflow (Opsi B) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Tahapan & Status Permohonan</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Alur Proses Resmi Tata Usaha</span>
            </div>

            {/* Stepper Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {getWorkflowSteps(foundRequest).map((step, idx) => {
                const isCompleted = step.state === 'completed';
                const isActive = step.state === 'active';
                const isRejected = step.state === 'rejected';

                let borderCard = 'border-slate-200 bg-slate-50/60';
                let badgeBg = 'bg-slate-200 text-slate-600';
                let icon = <Clock className="w-4 h-4 text-slate-400" />;

                if (isCompleted) {
                  borderCard = 'border-emerald-200 bg-emerald-50/40';
                  badgeBg = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                  icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
                } else if (isActive) {
                  borderCard = 'border-blue-300 bg-blue-50/60 ring-2 ring-blue-100';
                  badgeBg = 'bg-blue-600 text-white shadow-xs';
                  icon = <Clock className="w-4 h-4 text-white animate-spin" />;
                } else if (isRejected) {
                  borderCard = 'border-rose-300 bg-rose-50/60 ring-2 ring-rose-100';
                  badgeBg = 'bg-rose-600 text-white';
                  icon = <XCircle className="w-4 h-4 text-white" />;
                }

                return (
                  <div
                    key={step.key}
                    className={`p-4 rounded-2xl border transition-all ${borderCard} flex flex-col justify-between space-y-2`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badgeBg}`}>
                          {icon}
                        </span>
                        {step.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(step.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-bold ${isCompleted ? 'text-emerald-900' : isActive ? 'text-blue-900' : isRejected ? 'text-rose-900' : 'text-slate-700'}`}>
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-3">
                        {step.desc}
                      </p>
                    </div>

                    {step.timestamp && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(step.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        {step.actor && <span className="truncate max-w-[110px]">{step.actor}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional Collapsible Audit Activity Log */}
            {foundRequest.timeline && foundRequest.timeline.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowActivityLogs(!showActivityLogs)}
                  className="text-xs text-slate-500 hover:text-blue-700 font-semibold flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{showActivityLogs ? 'Sembunyikan' : 'Lihat'} Catatan Log Aktivitas Lengkap ({foundRequest.timeline.length} catatan)</span>
                  {showActivityLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showActivityLogs && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in text-xs">
                    <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                      {foundRequest.timeline.map((log, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-2xs"></div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800">{log.status}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                • {new Date(log.timestamp).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] mt-0.5">{log.note}</p>
                            {log.actor && <span className="text-[10px] text-slate-400 block mt-0.5">Oleh: {log.actor}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={() => PdfGenerator.generateProofPdf(foundRequest, settings)}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Bukti Pengajuan (PDF)</span>
            </button>

            {foundRequest.status === 'Selesai' && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenOfficialLetterPreview(foundRequest)}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Pratinjau Surat Resmi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadOfficialLetter(foundRequest)}
                  className="px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Surat Resmi (PDF)</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Pratinjau Surat Resmi */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-emerald-600/30 text-emerald-300 rounded-xl">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">{previewModalFile.fileName}</h3>
                  <span className="text-xs text-emerald-400 font-medium">Surat Resmi Berhasil Diterbitkan</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewModalFile.fileUrl, previewModalFile.fileName)}
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold px-3 bg-slate-800/60"
                  title="Unduh File"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Unduh Surat</span>
                </button>
                <a
                  href={previewModalFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold px-3 bg-slate-800/60"
                  title="Buka di Tab Baru"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalFile(null)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="p-4 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[400px]">
              {previewModalFile.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) || previewModalFile.fileUrl.startsWith('data:image/') ? (
                <img
                  src={previewModalFile.fileUrl}
                  alt={previewModalFile.fileName}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200"
                />
              ) : previewModalFile.fileName.match(/\.pdf$/i) || previewModalFile.fileUrl.includes('pdf') || previewModalFile.fileUrl.startsWith('data:application/pdf') || previewModalFile.fileUrl.startsWith('blob:') ? (
                <iframe
                  src={previewModalFile.fileUrl}
                  title={previewModalFile.fileName}
                  className="w-full h-[70vh] rounded-xl border border-slate-300 shadow-inner bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
                  <Paperclip className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1">{previewModalFile.fileName}</h4>
                  <p className="text-xs text-slate-500 mb-4">Silakan unduh atau buka surat resmi melalui tombol di bawah.</p>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(previewModalFile.fileUrl, previewModalFile.fileName)}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh Surat Resmi Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
