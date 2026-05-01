import { usePatchTicketMutation, useTicketDetailQuery } from '@/resources/request/client/queries/support.queries';
import { Card, CardContent, CardHeader, CardTitle } from '@datum-cloud/datum-ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@datum-cloud/datum-ui/select';
import { toast } from '@datum-cloud/datum-ui/toast';
import { t } from '@lingui/core/macro';
import type { ComMiloApisSupportV1Alpha1SupportTicketSpec } from '@openapi/support.miloapis.com/v1alpha1';

const STATUSES: Array<{ value: string; label: string }> = [
  { value: 'open', label: t`Open` },
  { value: 'in-progress', label: t`In Progress` },
  { value: 'waiting-on-customer', label: t`Waiting on Customer` },
  { value: 'resolved', label: t`Resolved` },
  { value: 'closed', label: t`Closed` },
];

const PRIORITIES: Array<{ value: string; label: string }> = [
  { value: 'low', label: t`Low` },
  { value: 'medium', label: t`Medium` },
  { value: 'high', label: t`High` },
  { value: 'urgent', label: t`Urgent` },
];

export function TicketActions({ ticketName }: { ticketName: string }) {
  const { data: ticket } = useTicketDetailQuery(ticketName);
  const patch = usePatchTicketMutation(ticketName);

  async function handlePatch(fields: Partial<ComMiloApisSupportV1Alpha1SupportTicketSpec>) {
    try {
      await patch.mutateAsync(fields);
      toast.success(t`Ticket updated`);
    } catch {
      toast.error(t`Failed to update ticket`);
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{t`Actions`}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t`Status`}</label>
          <Select
            value={ticket?.spec.status ?? 'open'}
            onValueChange={(v) => handlePatch({ status: v as any })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t`Priority`}</label>
          <Select
            value={ticket?.spec.priority ?? 'medium'}
            onValueChange={(v) => handlePatch({ priority: v as any })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
