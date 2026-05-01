import type { Route } from './+types/layout';
import { SubLayout } from '@/components/sub-layout';
import { authenticator } from '@/modules/auth';
import { supportTicketDetailQuery } from '@/resources/request/server';
import { supportRoutes } from '@/utils/config/routes.config';
import type { ComMiloApisSupportV1Alpha1SupportTicket } from '@openapi/support.miloapis.com/v1alpha1';
import { useLingui } from '@lingui/react/macro';
import { MessageSquare, FileText } from 'lucide-react';
import { Outlet, useLoaderData } from 'react-router';

export const handle = {
  breadcrumb: (data: ComMiloApisSupportV1Alpha1SupportTicket) => {
    return <span>{data?.spec?.title || data?.metadata?.name}</span>;
  },
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const session = await authenticator.getSession(request);
  return supportTicketDetailQuery(session?.accessToken ?? '', params.ticketName ?? '');
};

export default function Layout() {
  const { t } = useLingui();
  const data = useLoaderData<typeof loader>();
  const ticketName = data?.metadata?.name ?? '';

  const menuItems = [
    {
      title: t`Details`,
      href: supportRoutes.detail(ticketName),
      icon: FileText,
    },
    {
      title: t`Messages`,
      href: supportRoutes.messages(ticketName),
      icon: MessageSquare,
    },
  ];

  return (
    <SubLayout>
      <SubLayout.SidebarLeft>
        <SubLayout.SidebarMenu menuItems={menuItems} />
      </SubLayout.SidebarLeft>
      <SubLayout.Content>
        <Outlet />
      </SubLayout.Content>
    </SubLayout>
  );
}
