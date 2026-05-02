import { useMessages, useCreateMessage } from '@/resources/support';
import { useApp } from '@/providers/app.provider';
import { mergeMeta, metaObject } from '@/utils/helpers/meta.helper';
import { toast } from '@datum-cloud/datum-ui/toast';
import { cn } from '@datum-cloud/datum-ui/utils';
import { MetaFunction, useParams } from 'react-router';
import { useState } from 'react';

export const handle = {
  breadcrumb: () => <span>Messages</span>,
};

export const meta: MetaFunction = mergeMeta(() => metaObject('Messages'));

export default function TicketMessagesPage() {
  const { ticketName } = useParams<{ ticketName: string }>();
  const { user } = useApp();

  const { data: messages = [], isLoading } = useMessages(ticketName ?? '');
  const createMessage = useCreateMessage(ticketName ?? '');

  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const authorRef = {
    name: user?.sub ?? user?.email ?? 'customer',
    displayName:
      user?.fullName ??
      ([user?.givenName, user?.familyName].filter(Boolean).join(' ') || undefined),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    setSubmitting(true);
    try {
      await createMessage.mutateAsync({ body: body.trim(), authorRef });
      toast.success('Reply sent');
      setBody('');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Messages</h2>

      {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {!isLoading && messages.length === 0 && (
        <p className="text-muted-foreground text-sm">No messages yet. Send the first reply below.</p>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isStaff = msg.authorType === 'staff';
            return (
              <div
                key={msg.name}
                className={cn(
                  'rounded-lg border p-4 text-sm',
                  isStaff ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                )}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">
                    {msg.authorRef.displayName || msg.authorRef.name}
                    {isStaff && (
                      <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                        Support
                      </span>
                    )}
                  </span>
                  {msg.createdAt && (
                    <span className="text-muted-foreground text-xs">
                      {msg.createdAt.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Write a reply..."
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50">
            {submitting ? 'Sending...' : 'Send reply'}
          </button>
        </form>
      </div>
    </div>
  );
}
