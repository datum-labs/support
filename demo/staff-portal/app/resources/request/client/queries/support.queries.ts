import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ComMiloApisSupportV1Alpha1SupportTicket } from '@openapi/support.miloapis.com/v1alpha1';
import {
  messageCreateMutation,
  messagePatchMutation,
  messageListQuery,
  ticketDetailQuery,
  ticketListQuery,
  ticketPatchMutation,
  type TicketListParams,
} from '../apis/support.api';
import type { ComMiloApisSupportV1Alpha1UserReference } from '@openapi/support.miloapis.com/v1alpha1';

export const supportQueryKeys = {
  all: ['support'] as const,
  tickets: {
    list: (params?: TicketListParams) => ['support', 'tickets', 'list', params] as const,
    detail: (name: string) => ['support', 'tickets', name] as const,
  },
  messages: {
    list: (ticketName: string) => ['support', 'messages', ticketName] as const,
  },
};

export function useTicketListQuery(params?: TicketListParams) {
  return useQuery({
    queryKey: supportQueryKeys.tickets.list(params),
    queryFn: () => ticketListQuery(params),
  });
}

export function useTicketDetailQuery(name: string) {
  return useQuery({
    queryKey: supportQueryKeys.tickets.detail(name),
    queryFn: () => ticketDetailQuery(name),
    enabled: !!name,
  });
}

export function useMessageListQuery(ticketName: string) {
  return useQuery({
    queryKey: supportQueryKeys.messages.list(ticketName),
    queryFn: () => messageListQuery(ticketName),
    enabled: !!ticketName,
  });
}

export function usePatchTicketMutation(ticketName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ComMiloApisSupportV1Alpha1SupportTicket['spec']>) =>
      ticketPatchMutation(ticketName, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportQueryKeys.tickets.detail(ticketName) });
      qc.invalidateQueries({ queryKey: supportQueryKeys.tickets.list() });
    },
  });
}

export function useCreateMessageMutation(ticketName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      authorRef,
      internal,
    }: {
      body: string;
      authorRef: ComMiloApisSupportV1Alpha1UserReference;
      internal?: boolean;
    }) => messageCreateMutation(ticketName, body, authorRef, internal ?? false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportQueryKeys.messages.list(ticketName) });
      qc.invalidateQueries({ queryKey: supportQueryKeys.tickets.detail(ticketName) });
    },
  });
}

export function useUpdateMessageMutation(ticketName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, body }: { name: string; body: string }) =>
      messagePatchMutation(name, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportQueryKeys.messages.list(ticketName) });
    },
  });
}
