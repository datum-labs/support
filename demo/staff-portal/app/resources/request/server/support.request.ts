import { http } from '@/modules/axios/axios.server';
import type { ComMiloApisSupportV1Alpha1SupportTicket } from '@openapi/support.miloapis.com/v1alpha1';

export const supportTicketDetailQuery = async (token: string, ticketName: string) => {
  // In demo mode, use the static DEMO_TOKEN so server-side requests reach the
  // support API with a token the milo-apiserver accepts.
  const effectiveToken = process.env.DEMO_TOKEN || token;
  const response = await http.get<ComMiloApisSupportV1Alpha1SupportTicket>(
    `/apis/support.miloapis.com/v1alpha1/supporttickets/${ticketName}`,
    { headers: { Authorization: `Bearer ${effectiveToken}` } }
  );
  return response.data;
};
