import { Badge } from '@datum-cloud/datum-ui/badge';

type TicketStatus = 'open' | 'in-progress' | 'waiting-on-customer' | 'resolved' | 'closed';

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'secondary' },
  'waiting-on-customer': { label: 'Waiting on Customer', variant: 'outline' },
  resolved: { label: 'Resolved', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'outline' },
};

export function TicketStatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[status as TicketStatus] ?? { label: status ?? 'Unknown', variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
