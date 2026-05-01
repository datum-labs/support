import { PriorityBadge } from './priority-badge';
import { render, screen } from '@/tests/setup/unit/test.utils';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@datum-cloud/datum-ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

describe('PriorityBadge', () => {
  const cases = [
    { priority: 'low', label: 'Low', colorClass: 'bg-gray-100' },
    { priority: 'medium', label: 'Medium', colorClass: 'bg-yellow-100' },
    { priority: 'high', label: 'High', colorClass: 'bg-orange-100' },
    { priority: 'urgent', label: 'Urgent', colorClass: 'bg-red-100' },
  ];

  cases.forEach(({ priority, label, colorClass }) => {
    test(`renders "${label}" with correct color class for priority "${priority}"`, () => {
      render(<PriorityBadge priority={priority} />);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent(label);
      expect(badge).toHaveAttribute('data-variant', 'outline');
      expect(badge).toHaveClass(colorClass);
    });
  });

  test('falls back to raw value and gray class for unknown priority', () => {
    render(<PriorityBadge priority="critical" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('critical');
    expect(badge).toHaveClass('bg-gray-100');
  });

  test('renders "Unknown" when priority is undefined', () => {
    render(<PriorityBadge />);
    expect(screen.getByTestId('badge')).toHaveTextContent('Unknown');
  });
});
