import type { Route } from './+types/index';
import { TicketActions, TicketDetail } from '@/features/support';
import { metaObject } from '@/utils/helpers';
import { t } from '@lingui/core/macro';
import { useParams } from 'react-router';

export const meta: Route.MetaFunction = () => metaObject(t`Ticket Details`);

export default function TicketDetailPage() {
  const { ticketName } = useParams<{ ticketName: string }>();

  return (
    <div className="flex gap-4 p-4">
      <div className="min-w-0 flex-1">
        <TicketDetail ticketName={ticketName ?? ''} />
      </div>
      <div className="w-64 shrink-0">
        <TicketActions ticketName={ticketName ?? ''} />
      </div>
    </div>
  );
}
