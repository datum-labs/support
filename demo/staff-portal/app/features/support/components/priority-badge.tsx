import { Badge } from '@datum-cloud/datum-ui/badge';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function PriorityBadge({ priority }: { priority?: string }) {
  const cfg = PRIORITY_CONFIG[priority as Priority] ?? { label: priority ?? 'Unknown', className: 'bg-gray-100 text-gray-700' };
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
