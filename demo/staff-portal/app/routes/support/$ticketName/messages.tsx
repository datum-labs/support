import type { Route } from './+types/messages';
import { MessageThread, ReplyForm } from '@/features/support';
import { useApp } from '@/providers/app.provider';
import { useMarkTicketReadMutation } from '@/resources/request/client/queries/support.queries';
import { metaObject } from '@/utils/helpers';
import { t } from '@lingui/core/macro';
import { useEffect } from 'react';
import { useParams } from 'react-router';

export const meta: Route.MetaFunction = () => metaObject(t`Messages`);

export default function TicketMessagesPage() {
  const { ticketName } = useParams<{ ticketName: string }>();
  const name = ticketName ?? '';
  const { principalId } = useApp();
  const markRead = useMarkTicketReadMutation();

  useEffect(() => {
    if (name && principalId) {
      markRead.mutate({ ticketName: name, principalId });
    }
  // Only run on mount or when the ticket changes — not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const authorRef = { name: 'staff', displayName: 'Support Staff' };

  return (
    <div className="flex flex-col">
      <MessageThread ticketName={name} />
      <ReplyForm ticketName={name} authorRef={authorRef} />
    </div>
  );
}
