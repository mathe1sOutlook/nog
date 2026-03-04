'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCompare, Clock } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  status: string;
  created_at: string;
  total_matched: number | null;
  total_divergences: number | null;
  total_production_records: number | null;
}

interface ActivityFeedProps {
  sessions: Session[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function ActivityFeed({ sessions }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Atividade recente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma conferencia ainda</p>
        )}
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/conference/${s.id}`}
            className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
          >
            <span className="mt-0.5 rounded-lg border bg-card p-1.5 shadow-sm">
              <GitCompare className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(s.created_at)}</span>
                {s.status === 'completed' && (
                  <>
                    <span>·</span>
                    <span>{s.total_matched ?? 0} matches</span>
                    {(s.total_divergences ?? 0) > 0 && (
                      <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                        {s.total_divergences} div
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
