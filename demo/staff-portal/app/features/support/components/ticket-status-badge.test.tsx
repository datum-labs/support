import { TicketStatusBadge } from './ticket-status-badge';
import { render, screen } from '@/tests/setup/unit/test.utils';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@datum-cloud/datum-ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

describe('TicketStatusBadge', () => {
  const cases = [
    { status: 'open', label: 'Open', variant: 'default' },
    { status: 'in-progress', label: 'In Progress', variant: 'secondary' },
    { status: 'waiting-on-customer', label: 'Waiting on Customer', variant: 'outline' },
    { status: 'resolved', label: 'Resolved', variant: 'secondary' },
    { status: 'closed', label: 'Closed', variant: 'outline' },
  ];

  cases.forEach(({ status, label, variant }) => {
    test(`renders "${label}" for status "${status}"`, () => {
      render(<TicketStatusBadge status={status} />);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent(label);
      expect(badge).toHaveAttribute('data-variant', variant);
    });
  });

  test('falls back to the raw value and outline variant for unknown status', () => {
    render(<TicketStatusBadge status="pending-review" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('pending-review');
    expect(badge).toHaveAttribute('data-variant', 'outline');
  });

  test('renders "Unknown" when status is undefined', () => {
    render(<TicketStatusBadge />);
    expect(screen.getByTestId('badge')).toHaveTextContent('Unknown');
  });
});
