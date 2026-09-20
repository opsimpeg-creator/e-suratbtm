import React, { useState } from 'react';
import { LetterType, LetterTemplate, SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { FileCode, Save, Sparkles, Eye, Check, RefreshCw } from 'lucide-react';

interface TemplateEngineProps {
  letterTypes: LetterType[];
  settings: SchoolSettings;
  onRefresh: () => void;
}

export const TemplateEngine: React.FC<TemplateEngineProps> = ({
  letterTypes,
  settings,
  onRefresh,
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string>(letterTypes[0]?.id || '');

  const template = StorageService.getTemplateForLetterType(selectedTypeId);

  const [title, setTitle] = useState(template?.title || '');
  const [headerTitle, setHeaderTitle] = useState(template?.headerTitle || settings.schoolSubTitle);
  const [headerSubTitle, setHeaderSubTitle] = useState(template?.headerSubTitle || settings.schoolName);
  const [contentHtml, setContentHtml] = useState(template?.contentHtml || '');
  const [footerTitle, setFooterTitle] = useState(template?.footerTitle || 'Kepala Sekolah,');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    const tpl = StorageService.getTemplateForLetterType(typeId);
    if (tpl) {
      setTitle(tpl.title);
      setHeaderTitle(tpl.headerTitle);
      setHeaderSubTitle(tpl.headerSubTitle);
      setContentHtml(tpl.contentHtml);
      setFooterTitle(tpl.footerTitle);
    } else {
      setTitle('SURAT KETERANGAN RESMI');
      setHeaderTitle(settings.schoolSubTitle);
      setHeaderSubTitle(settings.schoolName);
      setContentHtml('<p>Yang bertanda tangan di bawah ini Kepala Sekolah, menerangkan bahwa...</p>');
      setFooterTitle('Kepala Sekolah,');
    }
  };

  const handleInsertTag = (tag: string) => {
    setContentHtml((prev) => prev + ` ${tag} `);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LetterTemplate = {
      id: template?.id || 'tpl-' + Date.now(),
      letterTypeId: selectedTypeId,
      title,
      headerTitle,
      headerSubTitle,
      headerAddress: settings.address,
      contentHtml,
      footerTitle,
      showQrCode: true,
      showDigitalStamp: true,
      showDigitalSignature: true,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveTemplate(updated);
    onRefresh();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const tags = [
    '{{nama}}',
    '{{nis}}',
    '{{nisn}}',
    '{{kelas}}',
    '{{jurusan}}',
    '{{nomor_surat}}',
    '{{tanggal_surat}}',
    '{{keperluan}}',
    '{{tahun_lulus}}',
    '{{nama_ortu}}',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Engine Template Surat</span>
          <h2 className="text-xl font-extrabold text-slate-900">Pengaturan Draf & Format Tag Surat</h2>
          <p className="text-xs text-slate-500">
            Sesuaikan isi redaksi surat resmi yang otomatis menggantikan tag placeholder saat diterbitkan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">Jenis Surat:</label>
          <select
            value={selectedTypeId}
            onChange={(e) => handleSelectType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-blue-300 font-bold text-xs bg-blue-50 text-blue-900"
          >
            {letterTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Editor */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Template surat berhasil diperbarui!</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Judul Dokumen Surat *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-extrabold text-slate-900 text-sm uppercase"
                required
              />
            </div>

            {/* Quick Placeholder Tag Buttons */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Klik untuk Sisipkan Tag Otomatis:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-800 border border-slate-300 rounded-lg font-mono font-bold text-[11px] transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Textarea */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Isi Konten Redaksi Surat (HTML / Text) *</label>
              <textarea
                rows={12}
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 leading-relaxed bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Template</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Template Preview Box */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-xl space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-700" />
                <span>Pratinjau Hasil Cetak Dokumen</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">PREVIEW REAL-TIME</span>
            </div>

            {/* Document Render Canvas */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-800 space-y-4 font-serif">
              {/* Kop Surat Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5 font-sans">
                <h4 className="font-bold text-slate-600 text-[10px] uppercase">{headerTitle}</h4>
                <h3 className="font-extrabold text-blue-900 text-sm uppercase">{headerSubTitle}</h3>
                <p className="text-[9px] text-slate-500">{settings.address}</p>
              </div>

              <div className="text-center space-y-1">
                <h4 className="font-extrabold underline text-slate-900 text-xs uppercase">{title}</h4>
                <p className="font-mono text-[10px] text-slate-500">Nomor: 420/001/TU-SMK/2026</p>
              </div>

              {/* Redaksi Body Render */}
              <div
                className="leading-relaxed space-y-2 text-[10px]"
                dangerouslySetInnerHTML={{
                  __html: contentHtml
                    .replace(/{{nama}}/g, '<b>Muhammad Rizky Pratama</b>')
                    .replace(/{{nis}}/g, '20241042')
                    .replace(/{{nisn}}/g, '0071234567')
                    .replace(/{{kelas}}/g, 'XI (Sebelas)')
                    .replace(/{{jurusan}}/g, 'Rekayasa Perangkat Lunak')
                    .replace(/{{nomor_surat}}/g, '420/001/TU-SMK/2026')
                    .replace(/{{tanggal_surat}}/g, '5 Agustus 2026')
                    .replace(/{{keperluan}}/g, 'Syarat Tunjangan Gaji Ortu'),
                }}
              />

              <div className="pt-4 flex justify-between items-end font-sans">
                <div className="w-16 h-16 border border-slate-300 rounded-lg flex items-center justify-center text-[9px] text-slate-400">
                  QR Code
                </div>
                <div className="text-right">
                  <p>Batumandi, 5 Agustus 2026</p>
                  <p className="font-bold">{footerTitle}</p>
                  <div className="h-10"></div>
                  <p className="font-bold underline">{settings.headmasterName}</p>
                  <p className="text-[9px] text-slate-500">NIP. {settings.headmasterNIP}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
