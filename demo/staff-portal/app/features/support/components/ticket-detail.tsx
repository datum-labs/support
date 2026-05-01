import { DateTime } from '@/components/date';
import { useTicketDetailQuery } from '@/resources/request/client/queries/support.queries';
import { Card, CardContent, CardHeader, CardTitle } from '@datum-cloud/datum-ui/card';
import { t } from '@lingui/core/macro';
import { PriorityBadge } from './priority-badge';
import { TicketStatusBadge } from './ticket-status-badge';

export function TicketDetail({ ticketName }: { ticketName: string }) {
  const { data: ticket, isLoading } = useTicketDetailQuery(ticketName);

  if (isLoading) return <div className="p-4 text-muted-foreground">{t`Loading...`}</div>;
  if (!ticket) return <div className="p-4 text-destructive">{t`Ticket not found.`}</div>;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: t`Status`, value: <TicketStatusBadge status={ticket.spec.status} /> },
    { label: t`Priority`, value: <PriorityBadge priority={ticket.spec.priority} /> },
    { label: t`Reporter`, value: ticket.spec.reporterRef.displayName || ticket.spec.reporterRef.email || ticket.spec.reporterRef.name },
    { label: t`Organization`, value: ticket.spec.organizationRef?.name ?? '—' },
    { label: t`Owner`, value: ticket.spec.ownerRef?.displayName || ticket.spec.ownerRef?.name || t`Unassigned` },
    { label: t`Tags`, value: ticket.spec.tags?.join(', ') || '—' },
    { label: t`Created`, value: <DateTime date={ticket.metadata?.creationTimestamp} /> },
    { label: t`Messages`, value: ticket.status?.messageCount ?? 0 },
  ];

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">{ticket.spec.title}</h1>

      <Card className="shadow-none">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t`Details`}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {rows.map(({ label, value }) => (
              <>
                <dt className="font-medium text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </>
            ))}
          </dl>
        </CardContent>
      </Card>

      {ticket.spec.description && (
        <Card className="shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t`Description`}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="whitespace-pre-wrap text-sm">{ticket.spec.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
