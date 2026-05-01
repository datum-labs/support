import type { Route } from './+types/messages';
import { MessageThread, ReplyForm } from '@/features/support';
import { metaObject } from '@/utils/helpers';
import { t } from '@lingui/core/macro';
import { useParams } from 'react-router';

export const meta: Route.MetaFunction = () => metaObject(t`Messages`);

export default function TicketMessagesPage() {
  const { ticketName } = useParams<{ ticketName: string }>();
  const name = ticketName ?? '';

  const authorRef = { name: 'staff', displayName: 'Support Staff' };

  return (
    <div className="flex flex-col">
      <MessageThread ticketName={name} />
      <ReplyForm ticketName={name} authorRef={authorRef} />
    </div>
  );
}
