import React, { useState, useEffect } from 'react';
import { SubmissionRequest, SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import { PdfGenerator } from '../../services/pdfGenerator';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Lock,
  Check,
  Eye,
  FileDown,
  ExternalLink,
  Paperclip,
  Maximize2,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Users,
  GraduationCap,
  Loader2
} from 'lucide-react';

interface VerifyLetterProps {
  settings: SchoolSettings;
  initialCode?: string;
}

export const VerifyLetter: React.FC<VerifyLetterProps> = ({ settings, initialCode }) => {
  const [queryCode, setQueryCode] = useState(initialCode || '');
  const [verifiedRequest, setVerifiedRequest] = useState<SubmissionRequest | null>(null);
  const [searched, setSearched] = useState(false);
  const [isVerifyingCloud, setIsVerifyingCloud] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<{ fileName: string; fileUrl: string; fileSize?: string } | null>(null);

  useEffect(() => {
    let codeToVerify = (initialCode || '').trim();
    if (!codeToVerify) {
      // Check URL query string
      const urlParams = new URLSearchParams(window.location.search);
      codeToVerify = (
        urlParams.get('verify') ||
        urlParams.get('code') ||
        urlParams.get('qr') ||
        urlParams.get('v') ||
        urlParams.get('verif') ||
        ''
      ).trim();
    }

    if (codeToVerify) {
      setQueryCode(codeToVerify);
      handleVerify(codeToVerify);
    }

    const handleStorageUpdate = () => {
      const activeCode = (codeToVerify || queryCode).trim();
      if (activeCode) {
        const found = StorageService.getSubmissionByQr(activeCode) || StorageService.getSubmissionByNumber(activeCode);
        if (found) {
          setVerifiedRequest(found);
        }
      }
    };
    window.addEventListener('tu_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('tu_storage_updated', handleStorageUpdate);
    };
  }, [initialCode]);

  const handleVerify = async (code: string) => {
    let c = (code || '').trim();
    if (!c) return;

    // Handle full URL pasted or passed
    if (c.includes('http://') || c.includes('https://') || c.includes('?')) {
      try {
        const urlStr = c.startsWith('http') ? c : `https://dummy.app/${c}`;
        const parsed = new URL(urlStr);
        const extracted = parsed.searchParams.get('verify') ||
                          parsed.searchParams.get('code') ||
                          parsed.searchParams.get('qr') ||
                          parsed.searchParams.get('v') ||
                          parsed.searchParams.get('verif');
        if (extracted) c = extracted.trim();
      } catch {
        // keep c
      }
    }

    setSearched(true);
    let found = StorageService.getSubmissionByQr(c) || StorageService.getSubmissionByNumber(c);
    setVerifiedRequest(found || null);

    // Jika belum ditemukan di browser lokal, atau berkas surat resmi belum sinkron di lokal,
    // langsung tarik sinkronisasi dari Google Apps Script / Spreadsheet
    if (!found || (!found.issuedDocumentUrl && !found.formData?._officialFileUrl)) {
      setIsVerifyingCloud(true);
      try {
        await AppsScriptService.fetchDataFromAppsScript(true);
        const refound = StorageService.getSubmissionByQr(c) || StorageService.getSubmissionByNumber(c);
        if (refound) {
          setVerifiedRequest(refound);
        }
      } catch (err) {
        console.warn('Verify letter cloud fetch notice:', err);
      } finally {
        setIsVerifyingCloud(false);
      }
    }
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
            disabled={isVerifyingCloud}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-md flex items-center justify-center gap-2"
          >
            {isVerifyingCloud ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            <span>{isVerifyingCloud ? 'Mengecek Database...' : 'Verifikasi Keabsahan'}</span>
          </button>
        </form>

        {isVerifyingCloud && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2.5 rounded-xl animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Sedang menyinkronkan data keabsahan dokumen dari Google Spreadsheet & Cloud Drive...</span>
          </div>
        )}

        <div className="text-xs text-slate-500 pt-1 space-y-1">
          <p className="flex items-center gap-1.5 font-medium text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600 inline" />
            Petunjuk: Masukkan Kode Verifikasi yang tertera di bawah Kode QR atau ketikkan Nomor Surat Resmi yang terbit.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] text-slate-400">Contoh Surat Terbit di Database:</span>
            <button
              type="button"
              onClick={() => {
                const sampleCode = '421.5/CONTOH-001/SMKN1BTM/2026';
                setQueryCode(sampleCode);
                handleVerify(sampleCode);
              }}
              className="font-mono text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-blue-700 px-2.5 py-1 rounded-lg font-bold border border-slate-200 transition cursor-pointer"
            >
              421.5/CONTOH-001/SMKN1BTM/2026
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Display */}
      {searched && verifiedRequest && (() => {
        // Find all collective participants associated with this official letter / QR code
        const collectiveList = StorageService.getCollectiveSubmissions(verifiedRequest);
        const isCollective = collectiveList.length > 1;

        // Calculate document validity status (Aktif, Inaktif/Selesai Kegiatan, Permanen)
        const validity = StorageService.calculateArchiveStatus(
          verifiedRequest.letterTypeName,
          verifiedRequest.formData || {},
          verifiedRequest.activityEndDate,
          verifiedRequest.isTemporalLetter
        );

        const isExpired = validity.isExpired;
        const isPermanent = validity.status === 'Permanen';
        const isTemporalActive = !isExpired && !isPermanent;

        return (
          <div
            className={`bg-white rounded-3xl shadow-2xl overflow-hidden border ${
              isExpired
                ? 'border-amber-400 ring-1 ring-amber-300'
                : 'border-emerald-400 ring-1 ring-emerald-300'
            }`}
          >
            {/* Header Banner - Differentiated by validity */}
            {isExpired ? (
              /* Amber/Slate Theme for Expired / Completed Activity */
              <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-amber-400/20 backdrop-blur-md flex items-center justify-center font-bold text-amber-200 border border-amber-300/40 shrink-0">
                    <Clock className="w-10 h-10 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="bg-amber-400/20 border border-amber-300/30 text-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        STATUS KEABSAHAN
                      </span>
                      <span className="bg-rose-500/30 border border-rose-400/40 text-rose-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        MASA BERLAKU BERAKHIR
                      </span>
                      {isCollective && (
                        <span className="bg-blue-500/40 border border-blue-400/50 text-blue-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-200" />
                          SURAT KOLEKTIF ({collectiveList.length} PESERTA)
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                      DOKUMEN ASLI (INAKTIF / SELESAI KEGIATAN)
                    </h2>
                    <p className="text-xs text-amber-100/90 mt-0.5 max-w-xl">
                      Dokumen ini <b>terbukti asli dan terdaftar resmi</b> di Tata Usaha {settings.schoolName}, namun masa berlaku izin/dispensasi kegiatan telah <b>selesai</b>.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/50 px-4 py-2.5 rounded-2xl border border-amber-400/30 text-center shrink-0">
                  <span className="text-[10px] text-amber-200 block uppercase font-bold">Tanggal Terbit</span>
                  <span className="text-sm font-extrabold text-white">
                    {verifiedRequest.officialLetterDate
                      ? new Date(verifiedRequest.officialLetterDate).toLocaleDateString('id-ID', { dateStyle: 'long' })
                      : new Date(verifiedRequest.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </span>
                </div>
              </div>
            ) : (
              /* Green Theme for Active or Permanent Validity */
              <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-emerald-300 border border-white/20 shrink-0">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="bg-white/20 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        STATUS KEABSAHAN
                      </span>
                      <span className="bg-emerald-400/30 border border-emerald-300/40 text-emerald-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {isPermanent ? 'BERLAKU PERMANEN' : 'MASIH AKTIF'}
                      </span>
                      {isCollective && (
                        <span className="bg-teal-500/40 border border-teal-300/50 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-200" />
                          SURAT KOLEKTIF ({collectiveList.length} PESERTA)
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                      {isPermanent ? 'DOKUMEN VALID & SAH (PERMANEN)' : 'DOKUMEN VALID & MASIH AKTIF'}
                    </h2>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      Surat ini terdaftar resmi di database Tata Usaha {settings.schoolName}.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-950/40 px-4 py-2.5 rounded-2xl border border-white/20 text-center shrink-0">
                  <span className="text-[10px] text-emerald-200 block uppercase font-bold">Tanggal Terbit</span>
                  <span className="text-sm font-extrabold text-white">
                    {verifiedRequest.officialLetterDate
                      ? new Date(verifiedRequest.officialLetterDate).toLocaleDateString('id-ID', { dateStyle: 'long' })
                      : new Date(verifiedRequest.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </span>
                </div>
              </div>
            )}

            {/* Notice Callout for Expired Status */}
            {isExpired && (
              <div className="bg-amber-50 border-b border-amber-200 p-4 sm:px-8 flex items-start gap-3">
                <div className="p-1.5 bg-amber-200/70 text-amber-900 rounded-xl shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-amber-950 block">Peringatan Keabsahan Waktu (Masa Berlaku Telah Berakhir):</span>
                  <p className="text-amber-800 mt-0.5 leading-relaxed">
                    Surat ini diterbitkan untuk kegiatan dengan batas waktu hingga{' '}
                    <span className="font-bold underline">
                      {validity.endDate
                        ? new Date(validity.endDate).toLocaleDateString('id-ID', { dateStyle: 'long' })
                        : 'periode kegiatan'}
                    </span>
                    . Karena masa kegiatan telah terlewati, surat ini <b>tidak lagi berlaku sebagai surat izin aktif</b> di luar tanggal tersebut dan kini berstatus sebagai <b>rekaman arsip historis sekolah</b>.
                  </p>
                </div>
              </div>
            )}

            {/* Letter Details Card */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-500 block">Nomor Surat Resmi:</span>
                    <span className="font-mono font-extrabold text-blue-800 text-base">
                      {verifiedRequest.officialLetterNumber || '-'}
                    </span>
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
                  {!isCollective ? (
                    <>
                      <div>
                        <span className="text-slate-500 block">Nama Pemilik Surat:</span>
                        <span className="font-bold text-slate-900 text-sm">{verifiedRequest.applicantName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">NIS / NISN:</span>
                        <span className="font-bold text-slate-800">
                          {verifiedRequest.formData?.nis || '-'} / {verifiedRequest.formData?.nisn || '-'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-slate-500 block">Format Penerbitan Dokumen:</span>
                      <span className="font-bold text-blue-900 text-sm flex items-center gap-1.5 mt-0.5">
                        <Users className="w-4 h-4 text-blue-700" />
                        Surat Kolektif ({collectiveList.length} Orang Terdaftar Resmi)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Satu nomor surat resmi ini diterbitkan untuk beberapa nama siswa peserta sekaligus. Rincian lengkap nama tercantum pada tabel di bawah.
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 block">Masa Berlaku / Rentang Kegiatan:</span>
                    {validity.startDate || validity.endDate ? (
                      <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-900">
                          {validity.startDate
                            ? new Date(validity.startDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                            : '-'}
                          {' s.d. '}
                          {validity.endDate
                            ? new Date(validity.endDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                            : '-'}
                        </span>
                        {isExpired ? (
                          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            Berakhir
                          </span>
                        ) : (
                          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Berlangsung
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-700">
                        Permanen (Tidak terikat batasan waktu kegiatan)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status Keabsahan & Stempel Legalisir:</span>
                    {isExpired ? (
                      <span className="font-bold text-amber-700 flex items-center gap-1">
                        <Check className="w-4 h-4 text-amber-600" />
                        Terdaftar Asli di Database TU (Arsip Historis)
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Tercetak Resmi dengan Legalisir & Stempel TU
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Collective Students Table Display (Shown whenever multiple students share this official letter) */}
              {isCollective && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                        Daftar Peserta / Siswa Penerima Surat Ini ({collectiveList.length} Orang)
                      </h3>
                    </div>
                    <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                      Tercantum dalam Dokumen Surat Resmi yang Sama
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3 text-center w-12">No</th>
                          <th className="py-3 px-4">Nama Siswa / Penerima</th>
                          <th className="py-3 px-4">Kelas / Progli</th>
                          <th className="py-3 px-4">NIS / NISN</th>
                          <th className="py-3 px-4 text-center">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {collectiveList.map((st, idx) => {
                          const sClass =
                            st.formData?.kelas ||
                            st.formData?.progli ||
                            st.formData?.jurusan ||
                            st.formData?.kelas_jurusan ||
                            '-';
                          const sNis = st.formData?.nis || '-';
                          const sNisn = st.formData?.nisn || '-';
                          const sKet = st.formData?.keterangan || st.formData?.status_peserta || 'Peserta';

                          return (
                            <tr
                              key={st.id || idx}
                              className="hover:bg-blue-50/40 transition-colors"
                            >
                              <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{st.applicantName}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  No. Permohonan: {st.requestNumber}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-700">
                                {sClass !== '-' ? (
                                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                                    {sClass}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-mono">
                                {sNis} / {sNisn}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                                  {sKet}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                            onClick={async () => {
                              if (docUrl) {
                                handleOpenPreview(docUrl, docName);
                              } else {
                                try {
                                  const tpl = StorageService.getTemplateForLetterType(verifiedRequest.letterTypeId);
                                  const blobUrl = await PdfGenerator.getOfficialLetterPdfBlobUrl(verifiedRequest, tpl, settings);
                                  setPreviewModalFile({
                                    fileName: docName,
                                    fileUrl: blobUrl,
                                  });
                                } catch (e) {
                                  console.error('Error previewing letter:', e);
                                }
                              }
                            }}
                            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                            title="Lihat Dokumen Surat Resmi"
                          >
                            {isHttp ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span>{isHttp ? 'Buka Link' : 'Lihat Surat'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (docUrl) {
                                handleDownloadFile(docUrl, docName);
                              } else {
                                try {
                                  const tpl = StorageService.getTemplateForLetterType(verifiedRequest.letterTypeId);
                                  await PdfGenerator.generateOfficialLetterPdf(verifiedRequest, tpl, settings);
                                } catch (e) {
                                  console.error('Error downloading letter:', e);
                                }
                              }
                            }}
                            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
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
                  <div
                    className={`p-5 rounded-2xl space-y-2 text-xs border ${
                      isExpired
                        ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                        : 'bg-emerald-50/70 border-emerald-200 text-slate-700'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 font-extrabold ${
                        isExpired ? 'text-amber-900' : 'text-emerald-900'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${isExpired ? 'text-amber-600' : 'text-emerald-600'}`}
                      />
                      <span>Konfirmasi Keabsahan Data Database Tata Usaha</span>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      Dokumen surat atas nama <b>{verifiedRequest.applicantName}</b> dengan Nomor{' '}
                      <b>{verifiedRequest.officialLetterNumber || verifiedRequest.requestNumber}</b> telah terdaftar resmi dan terverifikasi di database Tata Usaha {settings.schoolName}. Berkas fisik / digital diterbitkan langsung oleh Staf TU.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

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