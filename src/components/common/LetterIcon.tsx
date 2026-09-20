import React from 'react';
import {
  FileText,
  FileSignature,
  FileSpreadsheet,
  FileCheck,
  GraduationCap,
  Award,
  Briefcase,
  BookOpen,
  Clock,
  School,
  FileBadge,
  Scroll,
  FilePlus,
  FileQuestion,
  ShieldCheck,
  Mail,
  LucideIcon,
} from 'lucide-react';

export interface LetterIconOption {
  name: string;
  label: string;
  category: string;
  IconComponent: LucideIcon;
}

export const AVAILABLE_LETTER_ICONS: LetterIconOption[] = [
  { name: 'FileText', label: 'Surat Keterangan / Dokumen Umum', category: 'Keterangan', IconComponent: FileText },
  { name: 'FileSignature', label: 'Surat Rekomendasi / Pernyataan', category: 'Rekomendasi', IconComponent: FileSignature },
  { name: 'FileSpreadsheet', label: 'Surat Pindah / Mutasi Siswa', category: 'Mutasi', IconComponent: FileSpreadsheet },
  { name: 'FileCheck', label: 'Surat Berkelakuan Baik', category: 'Keterangan', IconComponent: FileCheck },
  { name: 'GraduationCap', label: 'Surat Alumni / Kelulusan / Ijazah', category: 'Alumni', IconComponent: GraduationCap },
  { name: 'Clock', label: 'Surat Dispensasi / Izin Kegiatan', category: 'Dispensasi', IconComponent: Clock },
  { name: 'Briefcase', label: 'Surat Pengantar PKL / Magang / Kerja', category: 'PKL & Magang', IconComponent: Briefcase },
  { name: 'Award', label: 'Sertifikat / Piagam / Prestasi', category: 'Prestasi', IconComponent: Award },
  { name: 'BookOpen', label: 'Surat Penelitian / Akademik / Beasiswa', category: 'Akademik', IconComponent: BookOpen },
  { name: 'School', label: 'Keterangan Lembaga / Sekolah', category: 'Lembaga', IconComponent: School },
  { name: 'FileBadge', label: 'Surat Tugas Resmi / Delegasi', category: 'Resmi', IconComponent: FileBadge },
  { name: 'Scroll', label: 'SK Resmi / Piagam Pengesahan', category: 'Resmi', IconComponent: Scroll },
  { name: 'ShieldCheck', label: 'Bebas Pelanggaran / Sanksi', category: 'Keterangan', IconComponent: ShieldCheck },
  { name: 'Mail', label: 'Surat Pemberitahuan / Undangan', category: 'Umum', IconComponent: Mail },
  { name: 'FilePlus', label: 'Permohonan / Formulir Baru', category: 'Umum', IconComponent: FilePlus },
  { name: 'FileQuestion', label: 'Surat Khusus / Permintaan Lain', category: 'Khusus', IconComponent: FileQuestion },
];

export const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  FileSignature,
  FileSpreadsheet,
  FileCheck,
  GraduationCap,
  Clock,
  Briefcase,
  Award,
  BookOpen,
  School,
  FileBadge,
  Scroll,
  ShieldCheck,
  Mail,
  FilePlus,
  FileQuestion,
};

interface LetterIconProps {
  iconName?: string;
  className?: string;
  size?: number;
}

export const LetterIcon: React.FC<LetterIconProps> = ({
  iconName,
  className = 'w-6 h-6',
  size,
}) => {
  const IconComponent = (iconName && ICON_MAP[iconName]) ? ICON_MAP[iconName] : FileText;
  return <IconComponent className={className} size={size} />;
};
