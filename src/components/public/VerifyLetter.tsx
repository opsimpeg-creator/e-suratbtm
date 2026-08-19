import React, { useState, useEffect } from 'react';
import { SubmissionRequest, SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { PdfGenerator } from '../../services/pdfGenerator';
import { ShieldCheck, Search, CheckCircle2, AlertTriangle, FileText, Download, Lock, Check, Eye, FileDown, ExternalLink, Paperclip, Maximize2, X } from 'lucide-react';

interface VerifyLetterProps {
  settings: SchoolSettings;
}

export const VerifyLetter: React.FC<VerifyLetterProps> = ({ settings }) => {
  const [queryCode, setQueryCode] = useState('');
  const [verifiedRequest, setVerifiedRequest] = useState<SubmissionRequest | null>(null);
  const [searched, setSearched] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<{ fileName: string; fileUrl: string; fileSize?: string } | null>(null);

  useEffect(() => {
    // Check URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setQueryCode(code);
      handleVerify(code);
    }
  }, []);

  const handleVerify = (code: string) => {
    const c = code.trim();
    if (!c) return;

    setSearched(true);
    const submissions = StorageService.getSubmissions();
    const found = submissions.find(
      (s) =>
        (s.qrVerificationCode && s.qrVerificationCode.toLowerCase() === c.toLowerCase()) ||
        (s.officialLetterNumber && s.officialLetterNumber.toLowerCase() === c.toLowerCase()) ||
        (s.requestNumber && s.requestNumber.toLowerCase() === c.toLowerCase())
    );

    setVerifiedRequest(found || null);
  };

  const onVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(queryCode);
  };

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

  // Helper to extract official document URL if present
  const getOfficialDocumentUrl = (req: SubmissionRequest): string | null => {
    if (req.issuedDocumentUrl) return req.issuedDocumentUrl;
    if (req.formData?._officialFileUrl) return req.formData._officialFileUrl;
    
    // Look for drive link or uploaded files in formData
    const entries = Object.entries(req.formData || {});
    for (const [k, v] of entries) {
      if (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')) && (k.toLowerCase().includes('drivelink') || k.toLowerCase().includes('surat'))) {
        return v;
      }
    }
    return null;
  };

  const getOfficialDocumentName = (req: SubmissionRequest): string => {
    if (req.formData?._officialFileName) return req.formData._officialFileName;
    return `Surat_Resmi_${req.officialLetterNumber ? req.officialLetterNumber.replace(/[\/\\?%*:|"<>]/g, '_') : req.requestNumber}.pdf`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sistem Verifikasi QR Keabsahan Surat</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Verifikasi Dokumen Surat Resmi</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Cek keaslian dokumen surat yang diterbitkan oleh Tata Usaha {settings.schoolName} dengan memindai Kode QR atau memasukkan Nomor Surat.
        </p>
      </div>

      {/* Verification Search Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <form onSubmit={onVerifySubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              placeholder="Masukkan Kode QR Verifikasi / Nomor Surat Resmi..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase font-mono tracking-wider"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Verifikasi Keabsahan</span>
          </button>
        </form>

        <div className="text-xs text-slate-500 pt-1 space-y-1">
          <p className="flex items-center gap-1.5 font-medium text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600 inline" />
            Petunjuk: Masukkan Kode Verifikasi yang tertera di bawah Kode QR atau ketikkan Nomor Surat Resmi yang terbit.
          </p>
          {(() => {
            const issuedLetters = StorageService.getSubmissions().filter((s) => s.officialLetterNumber || s.qrVerificationCode);
            if (issuedLetters.length > 0) {
              return (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[11px] text-slate-400">Contoh Surat Terbit di Database:</span>
                  {issuedLetters.slice(0, 3).map((item) => {
                    const codeToUse = item.qrVerificationCode || item.officialLetterNumber || item.requestNumber;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setQueryCode(codeToUse);
                          handleVerify(codeToUse);
                        }}
                        className="font-mono text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-blue-700 px-2.5 py-1 rounded-lg font-bold border border-slate-200 transition"
                      >
                        {item.officialLetterNumber || item.qrVerificationCode}
                      </button>
                    );
                  })}
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Verification Result Display */}
      {searched && verifiedRequest && (
        <div className="bg-white rounded-3xl border border-emerald-300 shadow-2xl overflow-hidden">
          {/* Green VALID Banner */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-emerald-300 border border-white/20">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                  STATUS KEABSAHAN
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-1">DOKUMEN VALID & SAH</h2>
                <p className="text-xs text-emerald-100">
                  Surat ini terdaftar resmi di database Tata Usaha {settings.schoolName}.
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 px-4 py-2 rounded-2xl border border-white/20 text-center">
              <span className="text-[10px] text-emerald-200 block uppercase">Tanggal Terbit</span>
              <span className="text-sm font-bold text-white">
                {verifiedRequest.officialLetterDate
                  ? new Date(verifiedRequest.officialLetterDate).toLocaleDateString('id-ID', { dateStyle: 'long' })
                  : new Date(verifiedRequest.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </span>
            </div>
          </div>

          {/* Letter Details Card */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block">Nomor Surat Resmi:</span>
                  <span className="font-mono font-bold text-blue-800 text-base">{verifiedRequest.officialLetterNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jenis Surat:</span>
                  <span className="font-bold text-slate-900 text-sm">{verifiedRequest.letterTypeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Penandatangan Utama (Kepala Sekolah):</span>
                  <span className="font-bold text-slate-900 block">{settings.headmasterName || 'Kepala Sekolah'}</span>
                  {settings.headmasterNIP && (
                    <span className="text-[11px] text-slate-500 font-mono block">NIP. {settings.headmasterNIP}</span>
                  )}
                </div>
                {settings.tuHeadName && (
                  <div>
                    <span className="text-slate-500 block">Kasubag Tata Usaha:</span>
                    <span className="font-bold text-slate-900 block">{settings.tuHeadName}</span>
                    {settings.tuHeadNIP && (
                      <span className="text-[11px] text-slate-500 font-mono block">NIP. {settings.tuHeadNIP}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                <div>
                  <span className="text-slate-500 block">Nama Pemilik Surat:</span>
                  <span className="font-bold text-slate-900 text-sm">{verifiedRequest.applicantName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">NIS / NISN:</span>
                  <span className="font-bold text-slate-800">
                    {verifiedRequest.formData.nis || '-'} / {verifiedRequest.formData.nisn || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Keabsahan & Stempel Legalisir:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Tercetak Resmi dengan Legalisir & Stempel TU
                  </span>
                </div>
              </div>
            </div>

            {/* Official Uploaded File / Link Section */}
            {(() => {
              const docUrl = getOfficialDocumentUrl(verifiedRequest);
              const docName = getOfficialDocumentName(verifiedRequest);
              const isHttp = docUrl && (docUrl.startsWith('http://') || docUrl.startsWith('https://'));

              if (docUrl) {
                return (
                  <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-blue-950 text-xs uppercase flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-700" />
                        <span>Berkas Dokumen Surat Resmi (Hasil Penerbitan Staf TU)</span>
                      </h3>
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersedia
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-3 bg-blue-700 text-white rounded-xl shrink-0 shadow-xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{docName}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {isHttp ? 'Tautan Berkas Google Drive / Server' : 'Berkas Surat Resmi Diterbitkan Tata Usaha'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(docUrl, docName)}
                          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                          title="Lihat Dokumen Surat Resmi"
                        >
                          {isHttp ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          <span>{isHttp ? 'Buka Link' : 'Lihat Surat'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(docUrl, docName)}
                          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                          title="Unduh Dokumen Surat Resmi"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Unduh File</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Konfirmasi Keabsahan Data Database Tata Usaha</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Dokumen surat atas nama <b>{verifiedRequest.applicantName}</b> dengan Nomor <b>{verifiedRequest.officialLetterNumber || verifiedRequest.requestNumber}</b> telah terdaftar resmi dan terverifikasi di database Tata Usaha {settings.schoolName}. Berkas fisik / digital diterbitkan langsung oleh Staf TU.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {searched && !verifiedRequest && (
        <div className="bg-rose-50 border border-rose-300 rounded-3xl p-8 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-rose-900">DOKUMEN TIDAK VALID / PALSU</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Kode verifikasi "<b>{queryCode}</b>" tidak ditemukan di arsip surat resmi Tata Usaha. Harap waspada terhadap indikasi pemalsuan dokumen.
          </p>
        </div>
      )}

      {/* Preview File Modal */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{previewModalFile.fileName}</h3>
                  <span className="text-[10px] text-slate-400 block font-medium">Pratinjau Berkas Surat Resmi</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewModalFile.fileUrl, previewModalFile.fileName)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>
                <a
                  href={previewModalFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                  title="Buka di Tab Baru"
                >
                  <Maximize2 className="w-4 h-4" />
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

