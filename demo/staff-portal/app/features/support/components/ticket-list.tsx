import { DataTableToolbar } from '@/components/data-table-toolbar';
import { DateTime } from '@/components/date';
import { useTicketListQuery } from '@/resources/request/client/queries/support.queries';
import { supportRoutes } from '@/utils/config/routes.config';
import { Card, CardContent } from '@datum-cloud/datum-ui/card';
import { DataTable } from '@datum-cloud/datum-ui/data-table';
import { t } from '@lingui/core/macro';
import type { ComMiloApisSupportV1Alpha1SupportTicket } from '@openapi/support.miloapis.com/v1alpha1';
import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router';
import { PriorityBadge } from './priority-badge';
import { TicketStatusBadge } from './ticket-status-badge';
import type { TicketListParams } from '@/resources/request/client/apis/support.api';

const columnHelper = createColumnHelper<ComMiloApisSupportV1Alpha1SupportTicket>();

export function TicketList({ params }: { params?: TicketListParams }) {
  const query = useTicketListQuery(params);
  const tickets = query.data?.items ?? [];

  const columns = [
    columnHelper.accessor('metadata.name', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`ID`} />,
      cell: ({ getValue }) => {
        const name = getValue() ?? '';
        return (
          <Link
            to={supportRoutes.detail(name)}
            className="font-mono text-xs text-blue-600 hover:underline">
            {name}
          </Link>
        );
      },
    }),
    columnHelper.accessor('spec.title', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Title`} />,
      cell: ({ getValue, row }) => (
        <Link
          to={supportRoutes.detail(row.original.metadata?.name ?? '')}
          className="font-medium hover:underline">
          {getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('spec.status', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Status`} />,
      cell: ({ getValue }) => <TicketStatusBadge status={getValue()} />,
    }),
    columnHelper.accessor('spec.priority', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Priority`} />,
      cell: ({ getValue }) => <PriorityBadge priority={getValue()} />,
    }),
    columnHelper.accessor('spec.reporterRef.email', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Reporter`} />,
      cell: ({ getValue, row }) => (
        <span title={getValue()}>
          {row.original.spec.reporterRef.displayName || getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('spec.ownerRef.displayName', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Owner`} />,
      cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">Unassigned</span>,
    }),
    columnHelper.accessor('spec.organizationRef.name', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Organization`} />,
      cell: ({ getValue }) => getValue() ?? '—',
    }),
    columnHelper.accessor('status.messageCount', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Messages`} />,
      cell: ({ getValue }) => getValue() ?? 0,
    }),
    columnHelper.accessor('status.lastActivity', {
      header: ({ column }) => <DataTable.ColumnHeader column={column} title={t`Last Activity`} />,
      cell: ({ getValue }) => <DateTime date={getValue()} />,
    }),
  ];

  return (
    <DataTable.Client
      loading={query.isLoading}
      data={tickets}
      columns={columns}
      pageSize={25}
      getRowId={(row) => row.metadata?.name ?? ''}
      defaultSort={[{ id: 'status.lastActivity', desc: true }]}
      searchFn={(row, search) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          (row.metadata?.name ?? '').toLowerCase().includes(q) ||
          (row.spec.title ?? '').toLowerCase().includes(q) ||
          (row.spec.reporterRef.email ?? '').toLowerCase().includes(q) ||
          (row.spec.organizationRef?.name ?? '').toLowerCase().includes(q)
        );
      }}>
      <Card className="m-4 py-4 shadow-none">
        <CardContent className="flex flex-col gap-2 px-4">
          <DataTableToolbar
            search={
              <DataTable.Search
                placeholder={t`Search tickets...`}
                className="w-full md:w-80"
              />
            }
          />
          <DataTable.Content
            headerClassName="bg-muted/50"
            className="border-t border-b border-solid"
            emptyMessage={t`No support tickets found.`}
          />
          <DataTable.Pagination className="pb-0" />
        </CardContent>
      </Card>
    </DataTable.Client>
  );
}
