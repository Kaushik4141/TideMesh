import React from 'react';
import type { SeverityLevel } from '@/types/dashboard';
import { SEVERITY_CONFIG } from '@/lib/tokens';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: SeverityLevel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function RiskBadge({
  level,
  className,
  size = 'md',
  showIcon = true,
}: RiskBadgeProps) {
  const config = SEVERITY_CONFIG[level] || SEVERITY_CONFIG.LOW;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold tracking-wider uppercase rounded border select-none',
        config.bgColor,
        config.borderColor,
        config.textColor,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Icon className={cn('shrink-0', iconSizes)} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
