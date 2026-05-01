import { DateTime } from '@/components/date';
import { useMessageListQuery } from '@/resources/request/client/queries/support.queries';
import { t } from '@lingui/core/macro';
import { cn } from '@datum-cloud/datum-ui/utils';

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

        return (
          <div
            key={msg.metadata?.name}
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
            <p className="whitespace-pre-wrap">{msg.spec.body}</p>
          </div>
        );
      })}
    </div>
  );
}
