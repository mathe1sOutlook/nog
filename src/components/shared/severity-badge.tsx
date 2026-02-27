import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Severity } from '@/lib/types/database';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '@/lib/utils/constants';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const colors = SEVERITY_COLORS[severity];
  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, className)}
    >
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}
