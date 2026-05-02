import { useMessages, useCreateMessage, useUpdateMessage } from '@/resources/support';
import { useApp } from '@/providers/app.provider';
import { MarkdownBody } from '@/components/markdown-body';
import { MarkdownEditor } from '@/components/markdown-editor';
import { mergeMeta, metaObject } from '@/utils/helpers/meta.helper';
import { toast } from '@datum-cloud/datum-ui/toast';
import { cn } from '@datum-cloud/datum-ui/utils';
import { MetaFunction, useParams } from 'react-router';
import { useState } from 'react';

export const handle = {
  breadcrumb: () => <span>Messages</span>,
};

export const meta: MetaFunction = mergeMeta(() => metaObject('Messages'));

function EditableMessage({
  name,
  body,
  ticketName,
}: {
  name: string;
  body: string;
  ticketName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const updateMessage = useUpdateMessage(ticketName);

  const save = async () => {
    if (!draft.trim()) return;
    try {
      await updateMessage.mutateAsync({ name, body: draft.trim() });
      setEditing(false);
    } catch {
      toast.error('Failed to save edit');
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <MarkdownEditor value={draft} onChange={setDraft} onSubmit={save} rows={4} />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={updateMessage.isPending || !draft.trim()}
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50">
            {updateMessage.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setDraft(body); setEditing(false); }}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/body relative">
      <MarkdownBody content={body} />
      <button
        onClick={() => { setDraft(body); setEditing(true); }}
        className="absolute right-0 top-0 hidden rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground group-hover/body:block"
        title="Edit message">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  );
}

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

  const doSubmit = async () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
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
            const canEdit = msg.authorRef.name === (user?.sub ?? user?.email);
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
                {canEdit ? (
                  <EditableMessage name={msg.name} body={msg.body} ticketName={ticketName ?? ''} />
                ) : (
                  <MarkdownBody content={msg.body} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <MarkdownEditor
            value={body}
            onChange={setBody}
            onSubmit={doSubmit}
            disabled={submitting}
            placeholder="Write a reply…"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50">
            {submitting ? 'Sending…' : 'Send reply'}
          </button>
        </form>
      </div>
    </div>
  );
}
