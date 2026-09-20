import React, { useState, useMemo } from 'react';
import { SubmissionRequest, SchoolSettings, ArchiveDocument, ArchiveStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import { ArchiveStatusBadge } from './ArchiveStatusBadge';
import {
  Archive,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FileDown,
  Info,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Paperclip,
  Eye,
  User,
  X
} from 'lucide-react';

interface ArchiveManagementProps {
  submissions: SubmissionRequest[];
  settings: SchoolSettings;
  onRefresh: () => void;
  onOpenRequestDetail?: (req: SubmissionRequest) => void;
}

export const ArchiveManagement: React.FC<ArchiveManagementProps> = ({
  submissions,
  settings,
  onRefresh,
  onOpenRequestDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aktif' | 'Inaktif' | 'Permanen'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ArchiveDocument | null>(null);

  // Helper for WhatsApp
  const formatPhoneNumberForWa = (phone: string): string => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const getWhatsAppUrl = (phone: string, message: string): string => {
    const formattedPhone = formatPhoneNumberForWa(phone);
    if (!formattedPhone) return '#';
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  // Helper for downloading files
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

  // Compute archive documents from storage & submissions
  const archiveDocs: ArchiveDocument[] = useMemo(() => {
    return StorageService.getArchivedDocuments();
  }, [submissions]);

  // Statistics
  const totalCount = archiveDocs.length;
  const aktifCount = archiveDocs.filter((d) => d.archiveStatus === 'Aktif').length;
  const inaktifCount = archiveDocs.filter((d) => d.archiveStatus.toLowerCase().includes('inaktif')).length;
  const permanenCount = archiveDocs.filter((d) => d.archiveStatus === 'Permanen').length;

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return archiveDocs.filter((doc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        doc.officialLetterNumber.toLowerCase().includes(q) ||
        doc.requestNumber.toLowerCase().includes(q) ||
        doc.applicantName.toLowerCase().includes(q) ||
        doc.letterTypeName.toLowerCase().includes(q) ||
        (doc.notes && doc.notes.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === 'Aktif') {
        matchesStatus = doc.archiveStatus === 'Aktif';
      } else if (statusFilter === 'Inaktif') {
        matchesStatus = doc.archiveStatus.toLowerCase().includes('inaktif');
      } else if (statusFilter === 'Permanen') {
        matchesStatus = doc.archiveStatus === 'Permanen';
      }

      const matchesType = typeFilter === 'all' || doc.letterTypeName === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [archiveDocs, searchQuery, statusFilter, typeFilter]);

  // Unique letter types in archives for filter dropdown
  const uniqueLetterTypes = useMemo(() => {
    const set = new Set<string>();
    archiveDocs.forEach((d) => {
      if (d.letterTypeName) set.add(d.letterTypeName);
    });
    return Array.from(set).sort();
  }, [archiveDocs]);

  // Handle Sync to Sheet Arsip
  const handleSyncArchive = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await AppsScriptService.syncArchiveToSpreadsheet();
      setSyncMessage(res.message);
      StorageService.addAuditLog('admin', 'SYNC_ARCHIVE_SPREADSHEET', res.message);
      onRefresh();
    } catch (err: any) {
      setSyncMessage(`Gagal sinkronisasi arsip: ${err?.message || 'Koneksi terputus'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  // Export to Excel / CSV with exact 11 columns
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'NoSuratResmi',
      'NoPermohonan',
      'NamaPemohon',
      'JenisSurat',
      'TanggalTerbit',
      'TglMulaiKegiatan',
      'TglSelesaiKegiatan',
      'StatusArsip',
      'FileUrl',
      'Keterangan',
    ];

    const rows = filteredDocs.map((doc) => [
      `"${doc.id}"`,
      `"${doc.officialLetterNumber || ''}"`,
      `"${doc.requestNumber || ''}"`,
      `"${(doc.applicantName || '').replace(/"/g, '""')}"`,
      `"${(doc.letterTypeName || '').replace(/"/g, '""')}"`,
      `"${doc.issueDate || ''}"`,
      `"${doc.activityStartDate || ''}"`,
      `"${doc.activityEndDate || ''}"`,
      `"${doc.archiveStatus || ''}"`,
      `"${doc.fileUrl || ''}"`,
      `"${(doc.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sheet_Arsip_Surat_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-semibold text-purple-200">
            <Archive className="w-3.5 h-3.5 text-purple-300" />
            <span>Pusat Arsip Surat Keluar & Pelacakan Masa Berlaku</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Arsip Dokumen & Surat Selesai
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
            Menyimpan rekam jejak surat resmi yang telah disahkan TU {settings.schoolName || 'sekolah'} dengan 11 kolom standar Sheet Arsip, memantau masa aktif kegiatan dispensasi/rekomendasi, dan menandai arsip inaktif secara otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={handleSyncArchive}
            disabled={isSyncing}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
            title="Kirim dan sinkronkan dokumen arsip ke Sheet Arsip di Google Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 text-purple-200 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Sheet Arsip'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
            title="Download arsip dalam format CSV/Excel sesuai 11 kolom Sheet Arsip"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Export 11 Kolom Excel</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2"
            title="Buka Google Spreadsheet Target"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Sheet Arsip</span>
          </a>
        </div>
      </div>

      {syncMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center gap-2.5 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Arsip */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer space-y-3 shadow-2xs group ${
            statusFilter === 'all' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition">
              Total Arsip Dokumen
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900">{totalCount}</h3>
            <span className="text-[11px] text-purple-600 font-semibold">11 Kolom Standar</span>
          </div>
        </div>

        {/* Aktif */}
        <div
          onClick={() => setStatusFilter('Aktif')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer space-y-3 shadow-2xs group ${
            statusFilter === 'Aktif' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition">
              Arsip Masih Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-emerald-700">{aktifCount}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Kegiatan berlangsung</span>
          </div>
        </div>

        {/* Inaktif */}
        <div
          onClick={() => setStatusFilter('Inaktif')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer space-y-3 shadow-2xs group ${
            statusFilter === 'Inaktif' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition">
              Inaktif / Kadaluarsa
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-amber-700">{inaktifCount}</h3>
            <span className="text-[11px] text-amber-600 font-semibold">Kegiatan selesai</span>
          </div>
        </div>

        {/* Permanen */}
        <div
          onClick={() => setStatusFilter('Permanen')}
          className={`bg-white p-5 rounded-2xl border transition cursor-pointer space-y-3 shadow-2xs group ${
            statusFilter === 'Permanen' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition">
              Arsip Permanen
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-blue-700">{permanenCount}</h3>
            <span className="text-[11px] text-blue-600 font-semibold">Berlaku seterusnya</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Surat, No. Tiket, Nama Siswa, atau Keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          {/* Letter Type Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Semua Jenis Surat</option>
              {uniqueLetterTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Status Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 mr-1">Status Arsip:</span>
          {[
            { id: 'all', label: 'Semua Status', count: totalCount },
            { id: 'Aktif', label: 'Aktif', count: aktifCount },
            { id: 'Inaktif', label: 'Inaktif / Selesai Kegiatan', count: inaktifCount },
            { id: 'Permanen', label: 'Permanen', count: permanenCount },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === st.id
                  ? 'bg-purple-900 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{st.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === st.id ? 'bg-purple-800 text-purple-200' : 'bg-slate-200 text-slate-600'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 11 Columns Archive Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700 relative">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3.5 whitespace-nowrap">No</th>
                <th className="p-3.5 whitespace-nowrap">ID Permohonan</th>
                <th className="p-3.5 whitespace-nowrap">No. Surat Resmi</th>
                <th className="p-3.5 whitespace-nowrap">No. Permohonan</th>
                <th className="p-3.5 whitespace-nowrap">Nama Pemohon</th>
                <th className="p-3.5 whitespace-nowrap">Jenis Surat</th>
                <th className="p-3.5 whitespace-nowrap">Tgl Terbit</th>
                <th className="p-3.5 whitespace-nowrap">Tgl Mulai Kegiatan</th>
                <th className="p-3.5 whitespace-nowrap">Tgl Selesai Kegiatan</th>
                <th className="p-3.5 whitespace-nowrap">Status Arsip</th>
                <th className="p-3.5 whitespace-nowrap text-center">Dokumen / File</th>
                <th className="p-3.5 whitespace-nowrap text-right">Keterangan / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Tidak ada dokumen arsip yang sesuai filter.</p>
                      <p className="text-xs text-slate-400">
                        Pastikan permohonan surat telah diproses hingga berstatus <b>Selesai</b> untuk masuk ke Sheet Arsip.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr
                    key={doc.id || idx}
                    className="hover:bg-purple-50/40 transition group"
                  >
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{doc.id}</td>
                    <td className="p-3.5 font-mono font-bold text-purple-950">
                      {doc.officialLetterNumber || <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="p-3.5 font-mono text-blue-700 font-semibold">
                      {doc.requestNumber}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {doc.applicantName}
                    </td>
                    <td className="p-3.5 text-slate-800 whitespace-nowrap">
                      {doc.letterTypeName}
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {doc.issueDate ? (
                        (() => {
                          try {
                            return new Date(doc.issueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            });
                          } catch {
                            return doc.issueDate;
                          }
                        })()
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {doc.activityStartDate ? (
                        (() => {
                          try {
                            return new Date(doc.activityStartDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            });
                          } catch {
                            return doc.activityStartDate;
                          }
                        })()
                      ) : (
                        <span className="text-slate-300 italic">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {doc.activityEndDate ? (
                        <span className="font-semibold text-slate-800">
                          {(() => {
                            try {
                              return new Date(doc.activityEndDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              });
                            } catch {
                              return doc.activityEndDate;
                            }
                          })()}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">-</span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <ArchiveStatusBadge
                        status={doc.archiveStatus}
                        endDate={doc.activityEndDate}
                        showDate={false}
                      />
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold transition text-[11px]"
                          title="Buka / Unduh Berkas PDF Resmi"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">Tidak ada</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white font-bold transition text-xs border border-purple-200 hover:border-purple-600 shadow-2xs group cursor-pointer"
                        title="Buka Rincian Dokumen Arsip & Jawaban Formulir Pemohon"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Rincian Arsip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <div>
            Menampilkan <b>{filteredDocs.length}</b> dari <b>{archiveDocs.length}</b> dokumen arsip resmi {settings.schoolName || 'sekolah'}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Aktif: Berlaku</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span>
            <span>Inaktif: Kadaluarsa</span>
            <span className="inline-block w-2 h-2 rounded-full bg-slate-400 ml-2"></span>
            <span>Permanen: Tanpa batas</span>
          </div>
        </div>
      </div>

      {/* Info Card: Penjelasan Aturan Masa Berlaku */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Aturan Standar Masa Berlaku Dokumen & Struktur Sheet Arsip</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Dokumen Temporal (Dispensasi / Rekomendasi)</span>
            </h4>
            <p>
              Surat yang mencakup kegiatan temporal secara otomatis mengekstrak tanggal mulai dan tanggal selesai kegiatan dari isian formulir.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
              <li><b>Status Aktif:</b> Tanggal hari ini belum melewati batas akhir tanggal kegiatan.</li>
              <li><b>Status Inaktif / Selesai Kegiatan:</b> Tanggal hari ini telah melewati batas akhir tanggal kegiatan (dokumen dianggap kadaluarsa/selesai masa pakainya).</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Dokumen Permanen (Keterangan Aktif / Kelakuan Baik)</span>
            </h4>
            <p>
              Surat identitas atau surat keterangan siswa tanpa tanggal batas kegiatan berlaku permanen atau sampai status kelulusan siswa berganti.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
              <li><b>Status Permanen:</b> Tidak memiliki batas tanggal kadaluarsa, tetap tersimpan selamanya dalam buku register arsip resmi.</li>
              <li>Dapat disinkronkan kapan saja ke Google Spreadsheet tanpa mengubah nomor surat resmi.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Detail Arsip (Read-Only) */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-scaleUp my-auto flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                  <Archive className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {selectedDoc.letterTypeName}
                    </h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                      Arsip Selesai
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    No. Surat: <span className="text-purple-300 font-bold">{selectedDoc.officialLetterNumber}</span> • Resi: <span className="text-blue-300">{selectedDoc.requestNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto">
              {/* 1. Legalitas & Masa Berlaku (11 Kolom Standar Sheet Arsip) */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Status Legalitas Dokumen Arsip</span>
                  </div>
                  <ArchiveStatusBadge status={selectedDoc.archiveStatus} endDate={selectedDoc.activityEndDate} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 font-bold block">Nomor Surat Resmi Sekolah:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      {selectedDoc.officialLetterNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Tanggal Terbit TU:</span>
                    <span className="font-bold text-slate-800">
                      {selectedDoc.issueDate || (submissions.find((s) => s.id === selectedDoc.id || s.requestNumber === selectedDoc.requestNumber)?.officialLetterDate) || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Masa Berlaku Kegiatan:</span>
                    <span className="font-bold text-slate-800">
                      {selectedDoc.activityStartDate ? (
                        `${selectedDoc.activityStartDate} s.d. ${selectedDoc.activityEndDate || selectedDoc.activityStartDate}`
                      ) : (
                        <span className="text-slate-500 font-medium">Permanen (Tidak terikat rentang tanggal)</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Standar Buku Register:</span>
                    <span className="font-semibold text-emerald-700">Tersinkron Sheet Arsip (11 Kolom)</span>
                  </div>
                </div>

                {selectedDoc.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">Catatan Staf TU:</span>
                    <p className="p-2.5 bg-white rounded-xl text-slate-700 border border-slate-200 text-xs">
                      {selectedDoc.notes}
                    </p>
                  </div>
                )}

                {/* File Download Bar */}
                {selectedDoc.fileUrl && (
                  <div className="pt-2">
                    <a
                      href={selectedDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Buka / Unduh Dokumen PDF Resmi</span>
                    </a>
                  </div>
                )}
              </div>

              {/* 2. Identitas Pemohon Asli */}
              {(() => {
                const linkedSubmission = submissions.find(
                  (s) => s.id === selectedDoc.id || s.requestNumber === selectedDoc.requestNumber || (selectedDoc.officialLetterNumber && s.officialLetterNumber === selectedDoc.officialLetterNumber)
                );

                return (
                  <>
                    <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Identitas Pemohon</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-bold block">Nama Lengkap Pemohon:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {linkedSubmission?.applicantName || selectedDoc.applicantName}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Status Role:</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase inline-block">
                            {linkedSubmission?.applicantRole || 'SISWA'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Email Pemohon:</span>
                          <span className="font-medium text-slate-700">
                            {linkedSubmission?.applicantEmail || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Nomor WhatsApp:</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-bold text-slate-800">
                              {linkedSubmission?.applicantPhone || '-'}
                            </span>
                            {linkedSubmission?.applicantPhone && (
                              <a
                                href={getWhatsAppUrl(
                                  linkedSubmission.applicantPhone,
                                  `Yth. *${linkedSubmission.applicantName}*,\n\nMengenai arsip surat *${selectedDoc.letterTypeName}* (No. Surat Resmi: *${selectedDoc.officialLetterNumber}* / No. Tiket: *${selectedDoc.requestNumber}*).\n\nTerima kasih.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] inline-flex items-center gap-1 shadow-2xs transition"
                                title="Buka Chat WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Chat WA</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Jawaban Formulir & Berkas Lampiran Pemohon */}
                    <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <FileText className="w-4 h-4 text-slate-700" />
                        <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Jawaban Formulir & Lampiran Berkas</span>
                      </div>

                      {linkedSubmission?.formData && Object.keys(linkedSubmission.formData).length > 0 ? (
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                          {(() => {
                            const formDataEntries = Object.entries(linkedSubmission.formData);
                            const isHttpUrl = (str: string) => typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://'));

                            const filteredEntries = formDataEntries.filter(([k]) => {
                              if (k.startsWith('_')) return false;
                              if (k.toLowerCase().includes('drivelink')) {
                                const cleanKeyName = k.toLowerCase().replace(/drivelink/i, '').trim();
                                const hasPrimaryKey = formDataEntries.some(([otherKey]) => {
                                  const otherLower = otherKey.toLowerCase();
                                  return !otherLower.includes('drivelink') && (otherLower.includes(cleanKeyName) || (cleanKeyName.length > 2 && otherLower.includes(cleanKeyName)));
                                });
                                if (hasPrimaryKey) return false;
                              }
                              return true;
                            });

                            return filteredEntries.map(([k, v]) => {
                              const valStr = String(v);
                              const isValUrl = isHttpUrl(valStr);

                              let driveUrlFromFormData: string | undefined = undefined;
                              if (!isValUrl) {
                                const matchingDriveKey = formDataEntries.find(([otherKey, otherVal]) => {
                                  const otherLower = otherKey.toLowerCase();
                                  return otherLower.includes('drivelink') && 
                                         (otherLower.includes(k.toLowerCase()) || k.toLowerCase().includes(otherLower.replace(/drivelink/i, '').trim())) &&
                                         isHttpUrl(String(otherVal));
                                });
                                if (matchingDriveKey) {
                                  driveUrlFromFormData = String(matchingDriveKey[1]);
                                }
                              }

                              const uploadedFiles = linkedSubmission.uploadedFiles as Record<string, { fileName: string; fileUrl: string; fileSize?: string }> | undefined;
                              const uploadedObj = uploadedFiles?.[k] || 
                                Object.values(uploadedFiles || {}).find((f) => f?.fileName === valStr);

                              const isFileField = k.toLowerCase().includes('file') || 
                                                  k.toLowerCase().includes('scan') || 
                                                  k.toLowerCase().includes('ijazah') || 
                                                  k.toLowerCase().includes('lampiran') ||
                                                  k.toLowerCase().includes('kk') ||
                                                  k.toLowerCase().includes('ktp') ||
                                                  isValUrl ||
                                                  driveUrlFromFormData !== undefined ||
                                                  valStr.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/i);

                              const fileUrl = uploadedObj?.fileUrl || (isValUrl ? valStr : driveUrlFromFormData) || 
                                (isFileField ? `data:text/plain;charset=utf-8,${encodeURIComponent(`Lampiran: ${v}\nNomor Permohonan: ${linkedSubmission.requestNumber}`)}` : null);

                              const isLink = fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'));

                              return (
                                <div key={k} className="border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                  <span className="text-slate-400 uppercase text-[10px] font-bold block">{k.replace(/_/g, ' ')}</span>
                                  <p className="font-bold text-slate-900 break-words mt-0.5">{valStr}</p>
                                  
                                  {isFileField && fileUrl && (
                                    <div className="mt-2 bg-white p-2.5 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                                          <Paperclip className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-slate-800 text-xs truncate">{uploadedObj?.fileName || valStr}</p>
                                          <span className="text-[10px] text-slate-400 block font-medium">
                                            {uploadedObj?.fileSize ? `Ukuran: ${uploadedObj.fileSize}` : (isLink ? 'Google Drive / Tautan Berkas' : 'Lampiran Berkas')}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-2xs"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>Lihat</span>
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadFile(fileUrl, uploadedObj?.fileName || `${k}_${selectedDoc.requestNumber}.pdf`)}
                                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition border border-slate-300"
                                        >
                                          <FileDown className="w-3 h-3" />
                                          <span>Unduh</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic py-1">
                          Data isian formulir terintegrasi dalam rekam arsip resmi sekolah.
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* 4. Banner Rekam Arsip Sah */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-xs">Dokumen Resmi Sah & Telah Selesai</h4>
                  <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                    Surat permohonan ini telah diverifikasi dan disahkan oleh Staf TU {settings.schoolName || 'sekolah'}, serta tercatat dalam rekam 11 kolom Buku Register Sheet Arsip. Tampilan ini berstatus <b>Read-Only</b> demi menjaga keabsahan arsip.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition text-xs cursor-pointer"
              >
                Tutup Detail Arsip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveManagement;
