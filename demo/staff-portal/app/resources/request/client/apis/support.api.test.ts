import { describe, expect, test, vi, beforeEach } from 'vitest';

// Mock the SDK before importing the API module so httpClient calls are intercepted.
vi.mock('@openapi/support.miloapis.com/v1alpha1', () => ({
  listSupportMiloapisComV1Alpha1SupportTicket: vi.fn().mockResolvedValue({ data: { items: [] } }),
  readSupportMiloapisComV1Alpha1SupportTicket: vi.fn().mockResolvedValue({ data: {} }),
  createSupportMiloapisComV1Alpha1SupportTicket: vi.fn().mockResolvedValue({ data: {} }),
  patchSupportMiloapisComV1Alpha1SupportTicket: vi.fn().mockResolvedValue({ data: {} }),
  deleteSupportMiloapisComV1Alpha1SupportTicket: vi.fn().mockResolvedValue({ data: null }),
  listSupportMiloapisComV1Alpha1SupportMessage: vi.fn().mockResolvedValue({ data: { items: [] } }),
  createSupportMiloapisComV1Alpha1SupportMessage: vi.fn().mockResolvedValue({ data: {} }),
}));

import { ticketListQuery, messageListQuery } from './support.api';
import { listSupportMiloapisComV1Alpha1SupportTicket, listSupportMiloapisComV1Alpha1SupportMessage } from '@openapi/support.miloapis.com/v1alpha1';

const listTickets = listSupportMiloapisComV1Alpha1SupportTicket as ReturnType<typeof vi.fn>;
const listMessages = listSupportMiloapisComV1Alpha1SupportMessage as ReturnType<typeof vi.fn>;

describe('ticketListQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  test('calls without fieldSelector when no params given', async () => {
    await ticketListQuery();
    expect(listTickets).toHaveBeenCalledWith(
      expect.objectContaining({ fieldSelector: undefined })
    );
  });

  test('builds fieldSelector from status param', async () => {
    await ticketListQuery({ status: 'open' });
    expect(listTickets).toHaveBeenCalledWith(
      expect.objectContaining({ fieldSelector: 'spec.status=open' })
    );
  });

  test('builds fieldSelector from orgName param', async () => {
    await ticketListQuery({ orgName: 'org-abc' });
    expect(listTickets).toHaveBeenCalledWith(
      expect.objectContaining({ fieldSelector: 'spec.organizationRef.name=org-abc' })
    );
  });

  test('builds fieldSelector from ownerName param', async () => {
    await ticketListQuery({ ownerName: 'me' });
    expect(listTickets).toHaveBeenCalledWith(
      expect.objectContaining({ fieldSelector: 'spec.ownerRef.name=me' })
    );
  });

  test('combines multiple field selectors with comma', async () => {
    await ticketListQuery({ status: 'in-progress', orgName: 'org-xyz', ownerName: 'agent-007' });
    const { fieldSelector } = listTickets.mock.calls[0][0];
    const parts = fieldSelector.split(',');
    expect(parts).toContain('spec.status=in-progress');
    expect(parts).toContain('spec.organizationRef.name=org-xyz');
    expect(parts).toContain('spec.ownerRef.name=agent-007');
  });

  test('appends extra fieldSelector from params', async () => {
    await ticketListQuery({ status: 'open', fieldSelector: 'spec.priority=urgent' });
    const { fieldSelector } = listTickets.mock.calls[0][0];
    expect(fieldSelector).toContain('spec.status=open');
    expect(fieldSelector).toContain('spec.priority=urgent');
  });
});

describe('messageListQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  test('scopes messages to ticket via fieldSelector', async () => {
    await messageListQuery('ticket-001');
    expect(listMessages).toHaveBeenCalledWith(
      expect.objectContaining({ fieldSelector: 'spec.ticketRef=ticket-001' })
    );
  });
});
