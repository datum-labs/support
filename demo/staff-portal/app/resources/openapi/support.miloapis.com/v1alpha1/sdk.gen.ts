// Hand-written SDK for support.miloapis.com/v1alpha1.
// Mirrors the @hey-api/openapi-ts generated pattern used by other API groups.

import { httpClient } from '@/modules/axios/axios.client';
import type {
  ComMiloApisSupportV1Alpha1SupportTicket,
  ComMiloApisSupportV1Alpha1SupportTicketList,
  ComMiloApisSupportV1Alpha1SupportMessage,
  ComMiloApisSupportV1Alpha1SupportMessageList,
} from './types.gen';

const BASE = '/apis/support.miloapis.com/v1alpha1';

// ── SupportTicket ────────────────────────────────────────────────────────────

export const listSupportMiloapisComV1Alpha1SupportTicket = async (params?: {
  fieldSelector?: string;
  labelSelector?: string;
  limit?: number;
  continue?: string;
}) => {
  return httpClient.get<ComMiloApisSupportV1Alpha1SupportTicketList>(
    `${BASE}/supporttickets`,
    { params }
  );
};

export const readSupportMiloapisComV1Alpha1SupportTicket = async (name: string) => {
  return httpClient.get<ComMiloApisSupportV1Alpha1SupportTicket>(
    `${BASE}/supporttickets/${name}`
  );
};

export const createSupportMiloapisComV1Alpha1SupportTicket = async (
  body: ComMiloApisSupportV1Alpha1SupportTicket
) => {
  return httpClient.post<ComMiloApisSupportV1Alpha1SupportTicket>(
    `${BASE}/supporttickets`,
    body
  );
};

export const patchSupportMiloapisComV1Alpha1SupportTicket = async (
  name: string,
  patch: Partial<{ spec: Partial<ComMiloApisSupportV1Alpha1SupportTicket['spec']> }>
) => {
  return httpClient.patch<ComMiloApisSupportV1Alpha1SupportTicket>(
    `${BASE}/supporttickets/${name}`,
    patch,
    { params: { fieldManager: 'datum-staff-portal' }, headers: { 'Content-Type': 'application/merge-patch+json' } }
  );
};

export const deleteSupportMiloapisComV1Alpha1SupportTicket = async (name: string) => {
  return httpClient.delete(`${BASE}/supporttickets/${name}`);
};

// ── SupportMessage ───────────────────────────────────────────────────────────

export const listSupportMiloapisComV1Alpha1SupportMessage = async (params?: {
  fieldSelector?: string;
  labelSelector?: string;
  limit?: number;
  continue?: string;
}) => {
  return httpClient.get<ComMiloApisSupportV1Alpha1SupportMessageList>(
    `${BASE}/supportmessages`,
    { params }
  );
};

export const readSupportMiloapisComV1Alpha1SupportMessage = async (name: string) => {
  return httpClient.get<ComMiloApisSupportV1Alpha1SupportMessage>(
    `${BASE}/supportmessages/${name}`
  );
};

export const createSupportMiloapisComV1Alpha1SupportMessage = async (
  body: ComMiloApisSupportV1Alpha1SupportMessage
) => {
  return httpClient.post<ComMiloApisSupportV1Alpha1SupportMessage>(
    `${BASE}/supportmessages`,
    body
  );
};
