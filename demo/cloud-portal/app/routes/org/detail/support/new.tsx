import { useCreateTicket, createTicketSchema, type CreateTicketInput } from '@/resources/support';
import { useApp } from '@/providers/app.provider';
import { paths } from '@/utils/config/paths.config';
import { getPathWithParams } from '@/utils/helpers/path.helper';
import { mergeMeta, metaObject } from '@/utils/helpers/meta.helper';
import { Button } from '@datum-cloud/datum-ui/button';
import { Form } from '@datum-cloud/datum-ui/form';
import { toast } from '@datum-cloud/datum-ui/toast';
import { MetaFunction, useNavigate, useParams } from 'react-router';

export const handle = {
  breadcrumb: () => <span>New Ticket</span>,
};

export const meta: MetaFunction = mergeMeta(() => metaObject('New Support Ticket'));

export default function NewTicketPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useApp();

  const createTicket = useCreateTicket(orgId ?? '');

  const reporterRef = {
    name: user?.sub ?? user?.email ?? 'unknown',
    displayName: user?.fullName ?? ([user?.givenName, user?.familyName].filter(Boolean).join(' ') || undefined),
    email: user?.email,
  };

  const handleSubmit = async (values: CreateTicketInput) => {
    try {
      const ticket = await createTicket.mutateAsync({ input: values, reporterRef });
      toast.success('Ticket created', { description: ticket.title });
      navigate(
        getPathWithParams(paths.org.detail.support.detail, {
          orgId: orgId ?? '',
          ticketName: ticket.name,
        })
      );
    } catch {
      toast.error('Failed to create ticket');
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold">Open a Support Ticket</h1>
      <Form
        schema={createTicketSchema}
        defaultValues={{ title: '', description: '', priority: 'medium' }}
        onSubmit={handleSubmit}
        className="space-y-4">
        {({ form }) => (
          <>
            <Form.Field
              control={form.control}
              name="title"
              label="Subject"
              required
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Subject</Form.Label>
                  <Form.Control>
                    <Form.Input {...field} placeholder="Briefly describe your issue" />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description"
              label="Description"
              required
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Description</Form.Label>
                  <Form.Control>
                    <textarea
                      {...field}
                      rows={6}
                      placeholder="Describe the problem in detail..."
                      className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="priority"
              label="Priority"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Priority</Form.Label>
                  <Form.Control>
                    <select
                      {...field}
                      className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="primary"
                theme="solid"
                htmlType="submit"
                loading={createTicket.isPending}>
                Submit ticket
              </Button>
              <Button
                type="secondary"
                theme="outline"
                htmlType="button"
                onClick={() =>
                  navigate(getPathWithParams(paths.org.detail.support.root, { orgId: orgId ?? '' }))
                }>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
}
