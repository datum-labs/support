import { useMessages, useCreateMessage, createMessageSchema, type CreateMessageInput } from '@/resources/support';
import { useApp } from '@/providers/app.provider';
import { mergeMeta, metaObject } from '@/utils/helpers/meta.helper';
import { Button } from '@datum-cloud/datum-ui/button';
import { Form } from '@datum-cloud/datum-ui/form';
import { toast } from '@datum-cloud/datum-ui/toast';
import { cn } from '@datum-cloud/datum-ui/utils';
import { MetaFunction, useParams } from 'react-router';

export const handle = {
  breadcrumb: () => <span>Messages</span>,
};

export const meta: MetaFunction = mergeMeta(() => metaObject('Messages'));

export default function TicketMessagesPage() {
  const { ticketName } = useParams<{ ticketName: string }>();
  const { user } = useApp();

  const { data: messages = [], isLoading } = useMessages(ticketName ?? '');
  const createMessage = useCreateMessage(ticketName ?? '');

  const authorRef = {
    name: user?.sub ?? user?.email ?? 'customer',
    displayName:
      user?.fullName ??
      ([user?.givenName, user?.familyName].filter(Boolean).join(' ') || undefined),
  };

  const handleSubmit = async (values: CreateMessageInput) => {
    try {
      await createMessage.mutateAsync({ body: values.body, authorRef });
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
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
        <Form
          schema={createMessageSchema}
          defaultValues={{ body: '' }}
          onSubmit={handleSubmit}
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
                        placeholder="Write a reply..."
                        className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Button
                type="primary"
                theme="solid"
                htmlType="submit"
                loading={createMessage.isPending}>
                Send reply
              </Button>
            </>
          )}
        </Form>
      </div>
    </div>
  );
}
