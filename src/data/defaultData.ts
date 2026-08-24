import {
  LetterType,
  FormField,
  SchoolSettings,
  SubmissionRequest,
  LetterTemplate,
  User,
  AuditLog,
  FAQItem,
  ComplaintTicket
} from '../types';

export const INITIAL_SETTINGS: SchoolSettings = {
  schoolName: 'SMK NEGERI 1 BATUMANDI',
  schoolSubTitle: 'DINAS PENDIDIKAN DAN KEBUDAYAAN PROVINSI KALIMANTAN SELATAN',
  schoolNPSN: '30302145',
  address: 'Jl. Ahmad Yani Km. 4.5, Batumandi, Kab. Balangan, Kalimantan Selatan 71663',
  phone: '(0526) 2021088',
  email: 'tusmkn1batumandi@gmail.com',
  website: 'https://smkn1batumandi.sch.id',
  headmasterName: 'Drs. H. Ahmad Rizky, M.Pd.',
  headmasterNIP: '19750812 199903 1 004',
  tuHeadName: 'Siti Rahmah, S.Kom.',
  tuHeadNIP: '19820315 200801 2 009',
  logoUrl: 'https://smkn1batumandi.sch.id/wp-content/uploads/2022/10/cropped-cropped-logo-web-removebg-preview.png',
  digitalStampUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=150&q=80',
  digitalSignatureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
  letterNumberPattern: '420/{SEQ}/TU-SMK/{YEAR}',
  currentSeqNumber: 14,
  themePrimaryColor: '#1e40af', // Blue 800
  spreadsheetId: '1lQ4BNn0l9Qjp06g-QS0ilD1I8-2nX4pK7a4qbRv34OI',
  webAppUrl: '',
  autoSync: true,
  emailNotificationsEnabled: true,
  waNotificationsEnabled: true,
  waAdminNumber: '081234567890',
  classes: [
    'X (Sepuluh)',
    'X-A (Sepuluh A)',
    'X-B (Sepuluh B)',
    'XI (Sebelas)',
    'XI-A (Sebelas A)',
    'XI-B (Sebelas B)',
    'XII (Dua Belas)',
    'XII-A (Dua Belas A)',
    'XII-B (Dua Belas B)',
    'Alumni / Lulus'
  ],
  majors: [
    'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
    'Broadcasting dan Perfilman (BP)',
    'Akuntansi dan Keuangan Lembaga (AKL)',
    'Desain Komunikasi Visual (DKV)',
    'Desain Pemodelan dan Informasi Bangunan (DPIB)',
    'Teknik Alat Berat (TAB)'
  ],
  operatingHours: {
    isRamadanMode: false,
    monThuHours: '08.00 - 15.00 WITA',
    friHours: '08.00 - 11.30 WITA',
    ramadanHours: '08.00 - 13.00 WITA',
    ramadanNote: 'Khusus Selama Bulan Suci Ramadhan',
    generalNote: 'Sabtu, Minggu & Hari Libur Nasional Tutup'
  },
};

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
    name: 'Administrator TU Utama',
    role: 'super_admin',
    email: 'admin.tu@smkn1batumandi.sch.id',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'u2',
    username: 'staf_tu',
    password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
    name: 'Budi Santoso (Staf TU)',
    role: 'admin_tu',
    email: 'budi.tu@smkn1batumandi.sch.id',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    createdAt: '2026-01-05T08:00:00Z',
  },
];

export const INITIAL_LETTER_TYPES: LetterType[] = [
  {
    id: 'lt-1787536998956',
    code: 'SKAS',
    name: 'Surat Keterangan Aktif Sekolah',
    description: 'Surat yang menerangkan bahwa siswa masih aktif terdaftar mengikuti kegiatan pembelajaran.',
    processingTimeDays: 1,
    iconName: 'FileText',
    color: 'bg-blue-600',
    active: true,
    order: 1,
    templateId: 'tpl-1',
  },
];

export const INITIAL_FORM_FIELDS: FormField[] = [];

export const INITIAL_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl-1',
    letterTypeId: 'lt-1',
    title: 'Surat Keterangan Aktif Sekolah',
    headerTitle: 'PEMERINTAH PROVINSI KALIMANTAN SELATAN\nDINAS PENDIDIKAN DAN KEBUDAYAAN',
    headerSubTitle: 'SMK NEGERI 1 BATUMANDI',
    headerAddress: 'Jl. A. Yani Km. 4.5 Batumandi, Kab. Balangan | Telp: (0526) 2021088 | Email: tusmkn1batumandi@gmail.com',
    contentHtml: `
<p style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 2px;"><u>SURAT KETERANGAN AKTIF SEKOLAH</u></p>
<p style="text-align: center; margin-top: 0; font-size: 11pt;">Nomor: {{nomor_surat}}</p>

<br/>
<p>Yang bertanda tangan di bawah ini Kepala SMK Negeri 1 Batumandi Kabupaten Balangan, menerangkan bahwa:</p>

<table style="width: 100%; margin-left: 20px; line-height: 1.8;">
  <tr><td style="width: 200px;">Nama Lengkap</td><td>: <b>{{nama}}</b></td></tr>
  <tr><td>NIS / NISN</td><td>: {{nis}} / {{nisn}}</td></tr>
  <tr><td>Kelas / Tingkat</td><td>: {{kelas}}</td></tr>
  <tr><td>Konsentrasi Keahlian</td><td>: {{jurusan}}</td></tr>
  <tr><td>Nama Orang Tua / Wali</td><td>: {{nama_ortu}}</td></tr>
</table>

<br/>
<p>Adalah benar siswa yang bersangkutan terdaftar dan <b>masih aktif</b> mengikuti kegiatan proses belajar mengajar pada SMK Negeri 1 Batumandi Tahun Ajaran 2025/2026.</p>

<p>Demikian Surat Keterangan Aktif Sekolah ini dibuat dengan sebenarnya untuk dipergunakan sebagai syarat <b>{{keperluan}}</b>.</p>
`,
    footerTitle: 'Batumandi, {{tanggal_surat}}\nKepala SMK Negeri 1 Batumandi,',
    showQrCode: true,
    showDigitalStamp: true,
    showDigitalSignature: true,
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'tpl-2',
    letterTypeId: 'lt-2',
    title: 'Surat Keterangan Kelulusan / Alumni',
    headerTitle: 'PEMERINTAH PROVINSI KALIMANTAN SELATAN\nDINAS PENDIDIKAN DAN KEBUDAYAAN',
    headerSubTitle: 'SMK NEGERI 1 BATUMANDI',
    headerAddress: 'Jl. A. Yani Km. 4.5 Batumandi, Kab. Balangan | Telp: (0526) 2021088',
    contentHtml: `
<p style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 2px;"><u>SURAT KETERANGAN ALUMNI / KELULUSAN</u></p>
<p style="text-align: center; margin-top: 0; font-size: 11pt;">Nomor: {{nomor_surat}}</p>

<br/>
<p>Kepala SMK Negeri 1 Batumandi dengan ini menerangkan bahwa:</p>

<table style="width: 100%; margin-left: 20px; line-height: 1.8;">
  <tr><td style="width: 200px;">Nama Alumni</td><td>: <b>{{nama}}</b></td></tr>
  <tr><td>NISN</td><td>: {{nisn}}</td></tr>
  <tr><td>Tahun Lulus</td><td>: {{tahun_lulus}}</td></tr>
  <tr><td>Program Keahlian</td><td>: {{jurusan}}</td></tr>
</table>

<br/>
<p>Telah dinyatakan <b>LULUS</b> dari SMK Negeri 1 Batumandi dan terdata resmi dalam Buku Induk Alumni Sekolah.</p>

<p>Surat keterangan ini diterbitkan untuk dipergunakan sebagaimana mestinya.</p>
`,
    footerTitle: 'Batumandi, {{tanggal_surat}}\nKepala Sekolah,',
    showQrCode: true,
    showDigitalStamp: true,
    showDigitalSignature: true,
    updatedAt: '2026-08-01T10:00:00Z',
  },
];

export const DEMO_SAMPLE_SUBMISSIONS: SubmissionRequest[] = [
  {
    id: 'demo-sample-001',
    requestNumber: 'SRT-CONTOH-0001',
    letterTypeId: 'lt-1',
    letterTypeName: 'Surat Keterangan Aktif Sekolah',
    applicantName: 'Siswa Percontohan (Demo)',
    applicantEmail: 'siswa.demo@smkn1batumandi.sch.id',
    applicantPhone: '081234567890',
    applicantRole: 'siswa',
    status: 'Selesai',
    formData: {
      nama: 'Siswa Percontohan (Demo)',
      nis: '20241001',
      nisn: '0061234567',
      kelas: 'XII (Dua Belas)',
      jurusan: 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
      nama_ortu: 'Bambang Sudarmo',
      keperluan: 'Kelengkapan Berkas Beasiswa Pendidikan Prestasi & Administrasi',
    },
    qrVerificationCode: 'VERIF-SRT-CONTOH-0001-DEMO',
    officialLetterNumber: '421.5/CONTOH-001/SMKN1BTM/2026',
    officialLetterDate: '2026-08-01T08:00:00Z',
    digitalSignatureApplied: true,
    createdAt: '2026-08-01T07:30:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
    timeline: [
      {
        status: 'Menunggu',
        timestamp: '2026-08-01T07:30:00Z',
        actor: 'Sistem Publik',
        note: 'Permohonan surat contoh berhasil dikirim ke sistem.',
      },
      {
        status: 'Diproses',
        timestamp: '2026-08-01T07:45:00Z',
        actor: 'Staf TU SMKN 1 Batumandi',
        note: 'Permohonan telah diverifikasi dan disetujui oleh Petugas Tata Usaha.',
      },
      {
        status: 'Selesai',
        timestamp: '2026-08-01T08:00:00Z',
        actor: 'Kepala Sekolah',
        note: 'Surat resmi telah diterbitkan dengan Nomor: 421.5/CONTOH-001/SMKN1BTM/2026',
      },
    ],
  },
];

// Initial submissions for real database starts empty so it only holds real data from user/spreadsheet
export const INITIAL_SUBMISSIONS: SubmissionRequest[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-06T03:00:00Z',
    username: 'admin',
    userRole: 'super_admin',
    action: 'LOGIN',
    details: 'Berhasil login ke Sistem Admin TU',
    ipAddress: '180.252.11.45',
  },
  {
    id: 'log-2',
    timestamp: '2026-08-05T11:00:00Z',
    username: 'admin',
    userRole: 'super_admin',
    action: 'VERIFY_SURAT',
    details: 'Menyetujui & menerbitkan Nomor Surat 420/001/TU-SMK/2026 untuk permohonan SRT-202608-0001',
    ipAddress: '180.252.11.45',
  },
  {
    id: 'log-3',
    timestamp: '2026-08-05T09:15:00Z',
    username: 'operator',
    userRole: 'admin_tu',
    action: 'UPDATE_STATUS',
    details: 'Mengubah status SRT-202608-0002 menjadi Diproses',
    ipAddress: '180.252.14.88',
  },
];

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Pengajuan Surat',
    question: 'Berapa lama proses verifikasi dan penerbitan surat di Tata Usaha?',
    answer: 'Secara umum, Surat Keterangan Aktif Sekolah dan Bebas Pustaka membutuhkan waktu 1 hari kerja (24 jam). Untuk Surat Alumni, Rekomendasi, dan Pengantar PKL membutuhkan waktu 1-2 hari kerja.',
  },
  {
    id: 'faq-2',
    category: 'Pelacakan Status',
    question: 'Bagaimana cara mengecek status surat yang sudah diajukan?',
    answer: 'Anda cukup memasukkan Nomor Permohonan (contoh: SRT-CONTOH-0001) atau melakukan Scan QR Code bukti pengajuan pada halaman "Cek Status Surat".',
  },
  {
    id: 'faq-3',
    category: 'Keabsahan & Tanda Tangan',
    question: 'Apakah surat digital ini memiliki kekuatan hukum yang sah?',
    answer: 'Ya. Setiap surat resmi yang diterbitkan dilengkapi dengan QR Verification Code dan Tanda Tangan Digital/Stempel Resmi Sekolah yang dapat diverifikasi keasliannya di halaman Verifikasi.',
  },
  {
    id: 'faq-4',
    category: 'Biaya Layanan',
    question: 'Apakah ada biaya administrasi pembuatan surat di TU?',
    answer: 'Seluruh pelayanan administrasi persuratan bagi siswa dan alumni SMK Negeri 1 Batumandi bersifat GRATIS (Rp 0) tanpa dipungut biaya apapun.',
  },
];

export const INITIAL_COMPLAINTS: ComplaintTicket[] = [];
