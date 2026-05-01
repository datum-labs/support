import { useTicket } from '@/resources/support';
import { paths } from '@/utils/config/paths.config';
import { getPathWithParams } from '@/utils/helpers/path.helper';
import { mergeMeta, metaObject } from '@/utils/helpers/meta.helper';
import { Badge } from '@datum-cloud/datum-ui/badge';
import { Button } from '@datum-cloud/datum-ui/button';
import { MetaFunction, useNavigate, useParams } from 'react-router';

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  'waiting-on-customer': 'Waiting on Us',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const meta: MetaFunction = mergeMeta(() => metaObject('Ticket Details'));

export default function TicketDetailPage() {
  const { orgId, ticketName } = useParams<{ orgId: string; ticketName: string }>();
  const navigate = useNavigate();

  const { data: ticket, isLoading } = useTicket(ticketName ?? '');

  if (isLoading) return <p className="text-muted-foreground text-sm p-4">Loading...</p>;
  if (!ticket) return <p className="text-destructive text-sm p-4">Ticket not found.</p>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold">{ticket.title}</h1>
        <Button
          type="secondary"
          theme="outline"
          size="small"
          onClick={() =>
            navigate(
              getPathWithParams(paths.org.detail.support.messages, {
                orgId: orgId ?? '',
                ticketName: ticket.name,
              })
            )
          }>
          View messages
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm rounded-lg border p-4">
        <dt className="text-muted-foreground font-medium">Status</dt>
        <dd>
          <Badge variant="outline">{STATUS_LABEL[ticket.status] ?? ticket.status}</Badge>
        </dd>
        <dt className="text-muted-foreground font-medium">Priority</dt>
        <dd>{PRIORITY_LABEL[ticket.priority] ?? ticket.priority}</dd>
        <dt className="text-muted-foreground font-medium">Messages</dt>
        <dd>{ticket.messageCount ?? 0}</dd>
        {ticket.createdAt && (
          <>
            <dt className="text-muted-foreground font-medium">Opened</dt>
            <dd>{ticket.createdAt.toLocaleDateString()}</dd>
          </>
        )}
      </dl>

      {ticket.description && (
        <div className="rounded-lg border p-4">
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">Description</h2>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>
      )}
    </div>
  );
}
