import React from 'react';
import { ArchiveStatus } from '../../types';
import { CheckCircle2, Clock, Archive, Calendar } from 'lucide-react';

interface ArchiveStatusBadgeProps {
  status: ArchiveStatus | string | { status: ArchiveStatus; isExpired?: boolean; endDate?: string };
  endDate?: string;
  showDate?: boolean;
  className?: string;
}

export const ArchiveStatusBadge: React.FC<ArchiveStatusBadgeProps> = ({
  status,
  endDate,
  showDate = false,
  className = '',
}) => {
  // Extract raw status string if object was passed
  const rawStatus = typeof status === 'object' && status !== null ? status.status : status;
  const effectiveEndDate = typeof status === 'object' && status !== null && status.endDate ? status.endDate : endDate;

  const normalized = (rawStatus || '').toString().toLowerCase();

  let badgeConfig: {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ReactNode;
  };

  if (normalized.includes('inaktif') || normalized.includes('selesai kegiatan')) {
    badgeConfig = {
      label: 'Inaktif',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-200',
      icon: <Clock className="w-3 h-3 text-amber-600" />,
    };
  } else if (normalized.includes('aktif')) {
    badgeConfig = {
      label: 'Aktif',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    };
  } else {
    // Default to Permanen
    badgeConfig = {
      label: 'Permanen',
      bgClass: 'bg-slate-50',
      textClass: 'text-slate-700',
      borderClass: 'border-slate-200',
      icon: <Archive className="w-3 h-3 text-slate-500" />,
    };
  }

  const formattedEndDate = effectiveEndDate
    ? (() => {
        try {
          return new Date(effectiveEndDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        } catch {
          return effectiveEndDate;
        }
      })()
    : null;

  return (
    <div className={`inline-flex flex-col items-start gap-0.5 ${className}`}>
      <span
        title={
          formattedEndDate
            ? `Status Arsip: ${rawStatus} (Batas Kegiatan: ${formattedEndDate})`
            : `Status Arsip: ${rawStatus}`
        }
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${badgeConfig.bgClass} ${badgeConfig.textClass} ${badgeConfig.borderClass}`}
      >
        {badgeConfig.icon}
        <span>{badgeConfig.label}</span>
      </span>
      {showDate && formattedEndDate && (
        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 pl-0.5">
          <Calendar className="w-2.5 h-2.5" />
          <span>s.d. {formattedEndDate}</span>
        </span>
      )}
    </div>
  );
};
export default ArchiveStatusBadge;
