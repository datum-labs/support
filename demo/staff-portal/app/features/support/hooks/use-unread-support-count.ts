import { useApp } from '@/providers/app.provider';
import { useTicketListQuery } from '@/resources/request/client/queries/support.queries';
import { useMemo } from 'react';

const POLL_INTERVAL = 30_000;

export function useUnreadSupportCount(): number {
  const { principalId, isOnCall } = useApp();

  const { data } = useTicketListQuery(undefined, isOnCall ? POLL_INTERVAL : undefined);

  return useMemo(() => {
    if (!isOnCall || !principalId || !data?.items) return 0;
    return data.items.filter((ticket) => {
      const lastActivity = ticket.status?.lastActivity ?? ticket.metadata?.creationTimestamp;
      if (!lastActivity) return false;
      const lastRead = ticket.status?.readState?.[principalId];
      if (!lastRead) return true;
      return new Date(lastActivity) > new Date(lastRead);
    }).length;
  }, [data?.items, isOnCall, principalId]);
}
