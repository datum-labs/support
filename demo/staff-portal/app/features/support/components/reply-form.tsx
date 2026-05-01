import { useCreateMessageMutation } from '@/resources/request/client/queries/support.queries';
import { Button } from '@datum-cloud/datum-ui/button';
import { Checkbox } from '@datum-cloud/datum-ui/checkbox';
import { Form } from '@datum-cloud/datum-ui/form';
import { toast } from '@datum-cloud/datum-ui/toast';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import z from 'zod';

interface ReplyFormProps {
  ticketName: string;
  authorRef: { name: string; displayName?: string; email?: string };
}

export function ReplyForm({ ticketName, authorRef }: ReplyFormProps) {
  const { t } = useLingui();
  const [isInternal, setIsInternal] = useState(false);
  const createMessage = useCreateMessageMutation(ticketName);

  const schema = z.object({
    body: z.string().min(1, t`Reply cannot be empty`),
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await createMessage.mutateAsync({
        body: values.body,
        authorRef,
        internal: isInternal,
      });
      toast.success(isInternal ? t`Internal note added` : t`Reply sent`);
    } catch {
      toast.error(t`Failed to send reply`);
    }
  };

  return (
    <div className="border-t p-4">
      <Form
        schema={schema}
        defaultValues={{ body: '' }}
        onSubmit={onSubmit}
        className="space-y-3">
        {({ form }) => (
          <>
            <Form.Field
              control={form.control}
              name="body"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <textarea
                      {...field}
                      rows={4}
                      placeholder={isInternal ? t`Write an internal note...` : t`Write a reply...`}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={isInternal}
                  onCheckedChange={(v) => setIsInternal(v === true)}
                />
                <span className="text-muted-foreground">
                  <Trans>Staff-only note (not visible to customer)</Trans>
                </span>
              </label>
              <Button
                type="submit"
                loading={createMessage.isPending}
                className={isInternal ? 'bg-yellow-600 hover:bg-yellow-700' : undefined}>
                {isInternal ? <Trans>Add note</Trans> : <Trans>Send reply</Trans>}
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
}
