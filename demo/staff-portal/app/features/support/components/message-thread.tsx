import { DateTime } from '@/components/date';
import { MarkdownBody } from '@/components/markdown-body';
import { MarkdownEditor } from '@/components/markdown-editor';
import { useMessageListQuery, useUpdateMessageMutation } from '@/resources/request/client/queries/support.queries';
import { toast } from '@datum-cloud/datum-ui/toast';
import { t } from '@lingui/core/macro';
import { cn } from '@datum-cloud/datum-ui/utils';
import { useState } from 'react';

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
  const updateMessage = useUpdateMessageMutation(ticketName);

  const save = async () => {
    if (!draft.trim()) return;
    try {
      await updateMessage.mutateAsync({ name, body: draft.trim() });
      setEditing(false);
    } catch {
      toast.error(t`Failed to save edit`);
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
            {updateMessage.isPending ? t`Saving…` : t`Save`}
          </button>
          <button
            onClick={() => { setDraft(body); setEditing(false); }}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
            {t`Cancel`}
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

export function MessageThread({ ticketName }: { ticketName: string }) {
  const { data, isLoading } = useMessageListQuery(ticketName);
  const messages = data?.items ?? [];

  if (isLoading) return <div className="p-4 text-muted-foreground">{t`Loading messages...`}</div>;
  if (!messages.length) return <div className="p-4 text-muted-foreground">{t`No messages yet.`}</div>;

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((msg) => {
        const isInternal = msg.spec.internal;
        const isStaff = msg.spec.authorType === 'staff';
        const msgName = msg.metadata?.name ?? '';

        return (
          <div
            key={msgName}
            className={cn(
              'rounded-lg border p-4 text-sm',
              isInternal
                ? 'border-yellow-300 bg-yellow-50'
                : isStaff
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white'
            )}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {msg.spec.authorRef.displayName || msg.spec.authorRef.name}
                </span>
                {isInternal && (
                  <span className="rounded bg-yellow-200 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                    {t`Staff note`}
                  </span>
                )}
                {isStaff && !isInternal && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                    {t`Staff`}
                  </span>
                )}
              </div>
              <DateTime
                date={msg.status?.createdAt ?? msg.metadata?.creationTimestamp}
                className="text-xs text-muted-foreground"
              />
            </div>
            <EditableMessage name={msgName} body={msg.spec.body} ticketName={ticketName} />
          </div>
        );
      })}
    </div>
  );
}
