import { PolicyBinding } from '@/resources/policy-bindings';
import type { DataTableFeatures } from '@datum-cloud/datum-ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

export type { PolicyBinding };
export type PolicyBindingColumn = ColumnDef<DataTableFeatures, PolicyBinding>;
