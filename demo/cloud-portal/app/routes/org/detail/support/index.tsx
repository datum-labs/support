import { useTickets, type SupportTicket } from '@/resources/support';
import { paths } from '@/utils/config/paths.config';
import { getPathWithParams } from '@/utils/helpers/path.helper';
import { mergeMeta, metaObject } from '@/utils/helpers/meta.helper';
import { Badge } from '@datum-cloud/datum-ui/badge';
import { Button } from '@datum-cloud/datum-ui/button';
import { Icon } from '@datum-cloud/datum-ui/icons';
import { PlusIcon, Ticket } from 'lucide-react';
import { MetaFunction, useNavigate, useParams } from 'react-router';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  open: { label: 'Open', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'secondary' },
  'waiting-on-customer': { label: 'Waiting', variant: 'outline' },
  resolved: { label: 'Resolved', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'outline' },
};

export const meta: MetaFunction = mergeMeta(() => metaObject('Support Tickets'));

export default function SupportIndexPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const { data: tickets = [], isLoading } = useTickets(orgId ?? '');

  function openNew() {
    navigate(getPathWithParams(paths.org.detail.support.new, { orgId: orgId ?? '' }));
  }

  function openTicket(ticket: SupportTicket) {
    navigate(
      getPathWithParams(paths.org.detail.support.detail, { orgId: orgId ?? '', ticketName: ticket.name })
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Support Tickets</h1>
        <Button type="primary" theme="solid" size="small" onClick={openNew} icon={<Icon icon={PlusIcon} className="size-4" />}>
          New ticket
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {!isLoading && tickets.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Icon icon={Ticket} className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">No support tickets yet.</p>
          <Button type="primary" theme="solid" size="small" onClick={openNew}>
            Open a ticket
          </Button>
        </div>
      )}

      {tickets.length > 0 && (
        <ul className="divide-border divide-y rounded-lg border">
          {tickets.map((ticket) => {
            const badge = STATUS_BADGE[ticket.status] ?? { label: ticket.status, variant: 'outline' as const };
            return (
              <li
                key={ticket.name}
                className="hover:bg-accent flex cursor-pointer items-center justify-between px-4 py-3 transition-colors"
                onClick={() => openTicket(ticket)}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ticket.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">#{ticket.name}</p>
                </div>
                <div className="ml-4 shrink-0">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
