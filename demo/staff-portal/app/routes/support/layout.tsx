import { Trans } from '@lingui/react/macro';
import { Outlet } from 'react-router';

export const handle = {
  breadcrumb: () => <Trans>Support</Trans>,
};

export default function SupportLayout() {
  return <Outlet />;
}
