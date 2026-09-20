import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { StorageService } from '../../services/storage';
import { Search, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const logs = StorageService.getAuditLogs();

  const filteredLogs = logs.filter(
    (l) =>
      l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Keamanan & Jejak Audit</span>
          <h2 className="text-xl font-extrabold text-slate-900">Log Aktivitas Staf Tata Usaha</h2>
          <p className="text-xs text-slate-500">
            Seluruh aktivitas login, pembuatan, pengubahan, dan pencetakan surat dicatat secara permanen.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari log aktivitas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700 relative">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="p-4 bg-slate-50">Waktu (WITA)</th>
                <th className="p-4 bg-slate-50">Pengguna (User)</th>
                <th className="p-4 bg-slate-50">Role Hak Akses</th>
                <th className="p-4 bg-slate-50">Tindakan (Action)</th>
                <th className="p-4 bg-slate-50">Rincian Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    Belum ada catatan log aktivitas yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{log.username}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-blue-800">{log.action}</td>
                    <td className="p-4 text-slate-600">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
            >
              <option value={10}>10 log</option>
              <option value={25}>25 log</option>
              <option value={50}>50 log</option>
              <option value={100}>100 log</option>
            </select>
            <span className="text-slate-500 ml-2">
              {totalItems > 0 ? `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalItems} log` : '0 log'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

