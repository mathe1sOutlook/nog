import { cn } from '@/lib/utils';
import { formatBRL, formatDifference } from '@/lib/utils/formatting';

interface CurrencyDisplayProps {
  value: number | null | undefined;
  className?: string;
}

export function CurrencyDisplay({ value, className }: CurrencyDisplayProps) {
  return <span className={className}>{formatBRL(value)}</span>;
}

interface CurrencyDiffDisplayProps {
  value: number | null | undefined;
  className?: string;
}

export function CurrencyDiffDisplay({ value, className }: CurrencyDiffDisplayProps) {
  const { text, className: colorClass } = formatDifference(value);
  return <span className={cn(colorClass, className)}>{text}</span>;
}
