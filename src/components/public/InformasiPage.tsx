import React from 'react';
import { SchoolSettings, FAQItem } from '../../types';
import { INITIAL_FAQS } from '../../data/defaultData';
import { Info, HelpCircle, FileText, CheckCircle2, Clock, ShieldCheck, Phone } from 'lucide-react';

interface InformasiPageProps {
  settings: SchoolSettings;
  onOpenSubmitModal: () => void;
}

export const InformasiPage: React.FC<InformasiPageProps> = ({ settings, onOpenSubmitModal }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Pusat Informasi & Panduan
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">Informasi Persuratan Tata Usaha</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Panduan lengkap mengenai persyaratan dokumen, estimasi durasi penerbitan, serta jawaban atas pertanyaan umum.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Waktu Pelayanan</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pengajuan online dapat diakses 24 Jam. Proses verifikasi & penerbitan oleh Staf TU dilakukan pada jam kerja: {
              settings.operatingHours?.isRamadanMode
                ? `Senin - Jumat (${settings.operatingHours.ramadanHours} - Mode Ramadhan)`
                : `Senin - Kamis (${settings.operatingHours?.monThuHours || '08.00 - 15.00 WITA'}) & Jumat (${settings.operatingHours?.friHours || '08.00 - 11.30 WITA'})`
            }.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Keabsahan Dokumen</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Setiap surat dibubuhi Nomor Surat Resmi, QR Verification Code, serta Tanda Tangan & Stempel Digital Kepala Sekolah.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Bebas Biaya (Rp 0)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seluruh proses pengajuan dan penerbitan surat bagi siswa aktif maupun alumni tidak dipungut biaya dalam bentuk apapun.
          </p>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
          <HelpCircle className="w-5 h-5 text-blue-700" />
          <h2 className="text-xl font-bold text-slate-900">Pertanyaan Sering Diajukan (FAQ)</h2>
        </div>

        <div className="space-y-4">
          {INITIAL_FAQS.map((faq) => (
            <div key={faq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">{faq.category}</span>
              <h4 className="font-bold text-slate-900 text-sm">{faq.question}</h4>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
