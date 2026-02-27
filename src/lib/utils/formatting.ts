/**
 * Format number as Brazilian Real currency (R$ X.XXX,XX)
 */
export function formatBRL(value: number | null | undefined): string {
  if (value == null) return 'R$ —';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format number as percentage with 2 decimal places
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Format date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

/**
 * Format number with thousands separator (Brazilian)
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format currency difference with sign and color class
 */
export function formatDifference(value: number | null | undefined): {
  text: string;
  className: string;
} {
  if (value == null) return { text: '—', className: 'text-muted-foreground' };
  const text = formatBRL(value);
  if (value > 0) return { text: `+${text}`, className: 'text-green-600' };
  if (value < 0) return { text, className: 'text-red-600' };
  return { text, className: 'text-muted-foreground' };
}
