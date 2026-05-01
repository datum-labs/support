// Schema exports
export {
  supportTicketSchema,
  supportMessageSchema,
  createTicketSchema,
  createMessageSchema,
  type SupportTicket,
  type SupportMessage,
  type CreateTicketInput,
  type CreateMessageInput,
} from './support.schema';

// Adapter exports
export {
  toSupportTicket,
  toSupportTicketList,
  toSupportMessage,
  toSupportMessageList,
} from './support.adapter';

// Service exports
export { createSupportService, supportKeys, type SupportService } from './support.service';

// Query hook exports
export { useTickets, useTicket, useMessages, useCreateTicket, useCreateMessage } from './support.queries';
