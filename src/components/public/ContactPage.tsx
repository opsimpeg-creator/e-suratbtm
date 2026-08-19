import React from 'react';
import { SchoolSettings } from '../../types';
import { Phone, Mail, MapPin, Globe, MessageSquare, Send, Clock, Moon, Calendar } from 'lucide-react';

interface ContactPageProps {
  settings: SchoolSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Hubungi Loket TU
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">Kontak & Layanan Pengaduan</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Apabila Anda memiliki kendala pengajuan surat atau membutuhkan informasi lebih lanjut, hubungi petugas Tata Usaha kami.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact info list */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Informasi Kontak</h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-500 block">Alamat Sekolah:</span>
                <span className="font-bold text-slate-800">{settings.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-500 block">Telepon Kantor TU:</span>
                <span className="font-bold text-slate-800">{settings.phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-500 block">Email Resmi:</span>
                <span className="font-bold text-slate-800">{settings.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-500 block">Website Sekolah:</span>
                <a href={settings.website} target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">
                  {settings.website}
                </a>
              </div>
            </div>

            {/* Jam Kerja Loket Card */}
            <div className="pt-2">
              <div className={`p-4 rounded-2xl border ${
                settings.operatingHours?.isRamadanMode
                  ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-2 font-extrabold text-xs mb-2 border-b border-slate-200/60 pb-1.5">
                  {settings.operatingHours?.isRamadanMode ? (
                    <>
                      <Moon className="w-4 h-4 text-amber-600" />
                      <span>Jam Kerja Loket (Mode Ramadhan)</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-blue-700" />
                      <span>Jadwal Jam Kerja Loket TU</span>
                    </>
                  )}
                </div>

                {settings.operatingHours?.isRamadanMode ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Senin - Jumat:</span>
                      <span>{settings.operatingHours.ramadanHours}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 italic">
                      *{settings.operatingHours.ramadanNote || 'Khusus Bulan Suci Ramadhan'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Senin - Kamis:</span>
                      <span className="font-bold text-slate-900">{settings.operatingHours?.monThuHours || '08.00 - 15.00 WITA'}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Jumat:</span>
                      <span className="font-bold text-slate-900">{settings.operatingHours?.friHours || '08.00 - 11.30 WITA'}</span>
                    </div>
                  </div>
                )}
                <div className="pt-2 text-[10px] text-slate-500 font-semibold border-t border-slate-200/60 mt-2">
                  {settings.operatingHours?.generalNote || 'Sabtu, Minggu & Hari Libur Nasional Tutup'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/${settings.waAdminNumber}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Buka Chat WhatsApp Fast Response Staf TU</span>
            </a>
          </div>
        </div>

        {/* Message Form Simulation */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Kirim Pesan / Pengaduan</h2>

          <form onSubmit={(e) => { e.preventDefault(); alert('Pesan Anda berhasil terkirim ke Tata Usaha!'); }} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-bold mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Masukkan nama Anda..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-bold mb-1">Email / No. HP</label>
              <input
                type="text"
                placeholder="Kontak balasan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-bold mb-1">Isi Pesan / Kendala</label>
              <textarea
                rows={4}
                placeholder="Tuliskan pertanyaan atau kendala..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pesan</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
