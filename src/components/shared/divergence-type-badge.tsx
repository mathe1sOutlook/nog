import { Badge } from '@/components/ui/badge';
import type { DivergenceType } from '@/lib/types/database';
import { DIVERGENCE_TYPE_LABELS } from '@/lib/utils/constants';

interface DivergenceTypeBadgeProps {
  type: DivergenceType;
}

export function DivergenceTypeBadge({ type }: DivergenceTypeBadgeProps) {
  return (
    <Badge variant="secondary" className="text-xs font-normal">
      {DIVERGENCE_TYPE_LABELS[type]}
    </Badge>
  );
}
