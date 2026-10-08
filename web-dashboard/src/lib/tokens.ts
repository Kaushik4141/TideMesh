import { OctagonAlert, TriangleAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SeverityLevel } from '@/types/dashboard';

export const SEVERITY_CONFIG: Record<
  SeverityLevel,
  {
    label: SeverityLevel;
    colorHex: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    mapFill: string;
    mapStroke: string;
    icon: typeof OctagonAlert;
  }
> = {
  CRITICAL: {
    label: 'CRITICAL',
    colorHex: '#DC2626',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-600/30',
    mapFill: 'rgba(220, 38, 38, 0.28)',
    mapStroke: '#DC2626',
    icon: OctagonAlert,
  },
  HIGH: {
    label: 'HIGH',
    colorHex: '#F97316',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-500/30',
    mapFill: 'rgba(249, 115, 22, 0.28)',
    mapStroke: '#EA580C',
    icon: TriangleAlert,
  },
  ELEVATED: {
    label: 'ELEVATED',
    colorHex: '#EAB308',
    bgColor: 'bg-yellow-500/15',
    textColor: 'text-yellow-800 dark:text-yellow-500',
    borderColor: 'border-yellow-600/30',
    mapFill: 'rgba(234, 179, 8, 0.25)',
    mapStroke: '#CA8A04',
    icon: AlertCircle,
  },
  LOW: {
    label: 'LOW',
    colorHex: '#0EA5E9',
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-800 dark:text-sky-400',
    borderColor: 'border-sky-500/30',
    mapFill: 'none',
    mapStroke: '#64748B',
    icon: CheckCircle2,
  },
};
