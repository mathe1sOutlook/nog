'use client';

import { Bell, CheckCheck, GitCompare, Upload, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, useUnreadCount, useMarkRead } from '@/lib/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const typeIcons: Record<string, typeof Bell> = {
  conference_completed: GitCompare,
  upload_completed: Upload,
  upload_failed: Upload,
  critical_divergence: AlertTriangle,
  system: Info,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const { markOne, markAll } = useMarkRead();
  const router = useRouter();

  const recent = notifications?.slice(0, 8) ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {unreadCount! > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notificacoes</p>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Ler todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Sem notificacoes
          </div>
        ) : (
          recent.map((n) => {
            const Icon = typeIcons[n.type] ?? Bell;
            return (
              <DropdownMenuItem
                key={n.id}
                className={cn('flex items-start gap-2 px-3 py-2', !n.read && 'bg-primary/5')}
                onClick={() => {
                  if (!n.read) markOne.mutate(n.id);
                  if (n.link) router.push(n.link);
                }}
              >
                <Icon className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  n.type === 'critical_divergence' ? 'text-rose-500' : 'text-muted-foreground',
                )} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-xs', !n.read && 'font-semibold')}>{n.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{n.message}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
