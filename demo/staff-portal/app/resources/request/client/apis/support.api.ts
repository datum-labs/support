import type {
  ComMiloApisSupportV1Alpha1SupportTicket,
  ComMiloApisSupportV1Alpha1SupportMessage,
  ComMiloApisSupportV1Alpha1UserReference,
} from '@openapi/support.miloapis.com/v1alpha1';
import {
  listSupportMiloapisComV1Alpha1SupportTicket,
  readSupportMiloapisComV1Alpha1SupportTicket,
  createSupportMiloapisComV1Alpha1SupportTicket,
  patchSupportMiloapisComV1Alpha1SupportTicket,
  deleteSupportMiloapisComV1Alpha1SupportTicket,
  listSupportMiloapisComV1Alpha1SupportMessage,
  createSupportMiloapisComV1Alpha1SupportMessage,
} from '@openapi/support.miloapis.com/v1alpha1';

export interface TicketListParams {
  fieldSelector?: string;
  limit?: number;
  continue?: string;
  status?: string;
  orgName?: string;
  ownerName?: string;
}

export const ticketListQuery = async (params?: TicketListParams) => {
  const selectors: string[] = [];
  if (params?.status) selectors.push(`spec.status=${params.status}`);
  if (params?.orgName) selectors.push(`spec.organizationRef.name=${params.orgName}`);
  if (params?.ownerName) selectors.push(`spec.ownerRef.name=${params.ownerName}`);
  if (params?.fieldSelector) selectors.push(params.fieldSelector);

  const response = await listSupportMiloapisComV1Alpha1SupportTicket({
    fieldSelector: selectors.length ? selectors.join(',') : undefined,
    limit: params?.limit,
    continue: params?.continue,
  });
  return response.data;
};

export const ticketDetailQuery = async (name: string) => {
  const response = await readSupportMiloapisComV1Alpha1SupportTicket(name);
  return response.data;
};

export const ticketCreateMutation = async (
  body: Omit<ComMiloApisSupportV1Alpha1SupportTicket, 'apiVersion' | 'kind'>
) => {
  const response = await createSupportMiloapisComV1Alpha1SupportTicket({
    apiVersion: 'support.miloapis.com/v1alpha1',
    kind: 'SupportTicket',
    ...body,
  });
  return response.data;
};

export const ticketPatchMutation = async (
  name: string,
  patch: Partial<ComMiloApisSupportV1Alpha1SupportTicket['spec']>
) => {
  const response = await patchSupportMiloapisComV1Alpha1SupportTicket(name, { spec: patch });
  return response.data;
};

export const ticketDeleteMutation = async (name: string) => {
  return deleteSupportMiloapisComV1Alpha1SupportTicket(name);
};

export const messageListQuery = async (ticketName: string) => {
  const response = await listSupportMiloapisComV1Alpha1SupportMessage({
    fieldSelector: `spec.ticketRef=${ticketName}`,
  });
  return response.data;
};

export const messageCreateMutation = async (
  ticketName: string,
  body: string,
  authorRef: ComMiloApisSupportV1Alpha1UserReference,
  internal: boolean = false
) => {
  const response = await createSupportMiloapisComV1Alpha1SupportMessage({
    apiVersion: 'support.miloapis.com/v1alpha1',
    kind: 'SupportMessage',
    metadata: { generateName: 'msg-' },
    spec: {
      ticketRef: ticketName,
      body,
      authorRef,
      authorType: 'staff',
      internal,
    },
  });
  return response.data;
};
