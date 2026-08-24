import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { SubmissionRequest, SchoolSettings, LetterTemplate } from '../types';

export const PdfGenerator = {
  /**
   * Builds jsPDF document for Bukti Pengajuan Surat
   */
  async buildProofDoc(request: SubmissionRequest, settings: SchoolSettings): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Outer Border
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, 190, 277);

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.text(settings.schoolName, 105, 22, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('BUKTI PENGAJUAN TATA USAHA SURAT ONLINE', 105, 29, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 33, 190, 33);

    // Request Number Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(20, 38, 170, 24, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('NOMOR PERMOHONAN PENGAJUAN:', 25, 46);

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(request.requestNumber, 25, 55);

    // Status Badge
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(`STATUS: ${request.status.toUpperCase()}`, 140, 50);

    // Table Data Pemohon
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('DATA PEMOHON SURAT', 20, 72);

    let y = 80;
    const items = [
      ['Nama Lengkap Pemohon', request.applicantName],
      ['Role / Status', request.applicantRole.toUpperCase()],
      ['Jenis Surat', request.letterTypeName],
      ['Email Pemohon', request.applicantEmail],
      ['Nomor HP / WhatsApp', request.applicantPhone],
      ['Tanggal Pengajuan', new Date(request.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })],
    ];

    doc.setFontSize(10);
    items.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`:  ${value}`, 75, y);
      y += 8;
    });

    // Form Details Section
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('RINCIAN ISIAN FORMULIR', 20, y);
    y += 8;

    doc.setFontSize(9);
    Object.entries(request.formData || {}).forEach(([key, val]) => {
      if (y > 230 || key.startsWith('_')) return;
      const displayKey = key.replace(/_/g, ' ').toUpperCase();
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${displayKey}:`, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(String(val), 75, y);
      y += 7;
    });

    // QR Code Generation
    y = 210;
    doc.setFillColor(248, 250, 252);
    doc.rect(20, y, 170, 50, 'F');

    try {
      const qrData = request.qrVerificationCode || request.requestNumber;
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 200 });
      doc.addImage(qrDataUrl, 'PNG', 25, y + 5, 40, 40);
    } catch (e) {
      console.error('Error rendering QR Code in PDF:', e);
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('PETUNJUK LACAK & VERIFIKASI', 72, y + 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const notes = [
      '1. Simpan Bukti Pengajuan ini atau catat Nomor Permohonan Anda.',
      '2. Cek status permohonan secara real-time di website dengan memindai QR Code.',
      '3. Surat yang telah selesai dapat langsung dilihat atau diunduh melalui menu Cek Status.',
      '4. Bebas biaya administrasi (Gratis Rp 0).',
    ];

    let noteY = y + 19;
    notes.forEach((n) => {
      doc.text(n, 72, noteY);
      noteY += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dicetak otomatis dari Sistem E-Surat TU ${settings.schoolName} pada ${new Date().toLocaleString('id-ID')}`, 105, 280, { align: 'center' });

    return doc;
  },

  /**
   * Returns Blob URL for Bukti Pengajuan PDF preview
   */
  async getProofPdfBlobUrl(request: SubmissionRequest, settings: SchoolSettings): Promise<string> {
    const doc = await this.buildProofDoc(request, settings);
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  },

  /**
   * Downloads Bukti Pengajuan PDF
   */
  async generateProofPdf(request: SubmissionRequest, settings: SchoolSettings): Promise<void> {
    const doc = await this.buildProofDoc(request, settings);
    doc.save(`Bukti_Pengajuan_${request.requestNumber}.pdf`);
  },

  /**
   * Builds jsPDF document for Official Letter (Surat Resmi)
   */
  async buildOfficialLetterDoc(
    request: SubmissionRequest,
    template: LetterTemplate | undefined,
    settings: SchoolSettings
  ): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Kop Surat (Header)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text((settings.schoolSubTitle || 'PEMERINTAH PROVINSI KALIMANTAN SELATAN\nDINAS PENDIDIKAN DAN KEBUDAYAAN').toUpperCase(), 105, 16, { align: 'center' });

    doc.setFontSize(15);
    doc.setTextColor(30, 64, 175);
    doc.text((settings.schoolName || 'SMK NEGERI 1 BATUMANDI').toUpperCase(), 105, 24, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(settings.address || 'Jl. Ahmad Yani KM. 8.5 Batumandi, Kab. Balangan', 105, 30, { align: 'center' });
    doc.text(`Telp: ${settings.phone || '-'} | Email: ${settings.email || '-'} | Website: ${settings.website || '-'}`, 105, 34, { align: 'center' });

    // Double Kop Lines
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(1.2);
    doc.line(20, 37, 190, 37);
    doc.setLineWidth(0.4);
    doc.line(20, 38.5, 190, 38.5);

    // Document Title
    const title = template?.title || request.letterTypeName;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), 105, 48, { align: 'center' });

    // Underline for Title
    const titleWidth = doc.getTextWidth(title.toUpperCase());
    doc.setLineWidth(0.5);
    doc.line(105 - titleWidth / 2, 49.5, 105 + titleWidth / 2, 49.5);

    // Letter Number
    const letterNum = request.officialLetterNumber || `420/001/TU-SMK/${new Date().getFullYear()}`;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nomor: ${letterNum}`, 105, 55, { align: 'center' });

    // Letter Body Intro
    let y = 68;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    doc.text('Yang bertanda tangan di bawah ini Kepala ' + settings.schoolName + ', menerangkan bahwa:', 20, y);
    y += 10;

    // Student Data Table
    const applicantFullName = request.applicantName || request.formData?.nama || request.formData?.nama_lengkap || request.formData?.NamaPemohon || 'Pemohon';
    const nis = request.formData?.nis || request.formData?.NIS || request.formData?.nomor_induk || '-';
    const nisn = request.formData?.nisn || request.formData?.NISN || '-';
    const kelas = request.formData?.kelas || request.formData?.Kelas || '-';
    const jurusan = request.formData?.jurusan || request.formData?.Jurusan || request.formData?.konsentrasi_keahlian || '-';
    const keperluan = request.formData?.keperluan || request.formData?.Keperluan || request.formData?.tujuan || 'Administrasi Tata Usaha Sekolah';

    const dataRows: [string, string][] = [
      ['Nama Lengkap', applicantFullName],
      ['NIS / NISN', `${nis} / ${nisn}`],
      ['Kelas / Jurusan', `${kelas} (${jurusan})`],
      ['Keperluan', keperluan],
    ];

    dataRows.forEach(([lbl, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(lbl, 25, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`:   ${val}`, 70, y);
      y += 8;
    });

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    const paragraphText = `Adalah benar siswa/alumni yang terdaftar resmi pada ${settings.schoolName} dan saat ini berstatus aktif/alumni sesuai catatan database kesiswaan. Surat Keterangan ini diterbitkan dan diberikan kepada yang bersangkutan untuk dipergunakan sebagaimana mestinya.`;
    const splitText = doc.splitTextToSize(paragraphText, 170);
    doc.text(splitText, 20, y);

    y += splitText.length * 6 + 15;

    // Signature Area
    const dateStr = request.officialLetterDate
      ? new Date(request.officialLetterDate).toLocaleDateString('id-ID', { dateStyle: 'long' })
      : new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Batumandi, ${dateStr}`, 130, y);
    y += 5;
    doc.text('Kepala Sekolah,', 130, y);

    // Digital QR Code & Stamp Verification
    const qrText = request.qrVerificationCode || request.officialLetterNumber || request.requestNumber;
    try {
      const qrDataUrl = await QRCode.toDataURL(`https://esurat-tu.smkn1batumandi.sch.id/verify?code=${qrText}`, { margin: 1, width: 150 });
      doc.addImage(qrDataUrl, 'PNG', 20, y - 5, 30, 30);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Pindai untuk verifikasi keabsahan', 20, y + 27);
    } catch (e) {
      console.error(e);
    }

    // Digital Signature / Stamp Box
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 64, 175);
    doc.text('[Tanda Tangan & Stempel Digital]', 130, y + 18);

    y += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(settings.headmasterName || 'Drs. H. Gt. Ridwan Syahrani', 130, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`NIP. ${settings.headmasterNIP || '19670512 199403 1 008'}`, 130, y + 5);

    return doc;
  },

  /**
   * Returns Blob URL for Official Letter PDF preview modal
   */
  async getOfficialLetterPdfBlobUrl(
    request: SubmissionRequest,
    template: LetterTemplate | undefined,
    settings: SchoolSettings
  ): Promise<string> {
    const doc = await this.buildOfficialLetterDoc(request, template, settings);
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  },

  /**
   * Downloads Official School Letter PDF (Surat Resmi PDF)
   */
  async generateOfficialLetterPdf(
    request: SubmissionRequest,
    template: LetterTemplate | undefined,
    settings: SchoolSettings
  ): Promise<void> {
    const doc = await this.buildOfficialLetterDoc(request, template, settings);
    doc.save(`Surat_Resmi_${request.requestNumber}.pdf`);
  },
};

