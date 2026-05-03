import { paths } from '@/utils/config/paths.config';
import { getPathWithParams } from '@/utils/helpers/path.helper';
import { useParams, Navigate } from 'react-router';

/**
 * Messages are now shown inline on the ticket detail page.
 * Redirect any existing links here to the unified detail view.
 */
export default function TicketMessagesRedirect() {
  const { orgId, ticketName } = useParams<{ orgId: string; ticketName: string }>();
  return (
    <Navigate
      to={getPathWithParams(paths.org.detail.support.detail, {
        orgId: orgId ?? '',
        ticketName: ticketName ?? '',
      })}
      replace
    />
  );
}
