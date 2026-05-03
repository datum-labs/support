import { paths } from '@/utils/config/paths.config';
import { getPathWithParams } from '@/utils/helpers/path.helper';

describe('Support Tickets — cohesive ticket detail view', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should list support tickets for the personal org', () => {
    cy.getPersonalOrgId().then((orgId) => {
      cy.visit(getPathWithParams(paths.org.detail.support.root, { orgId }));
    });
    cy.contains('Support Tickets').should('be.visible');
    cy.contains('New ticket').should('be.visible');
  });

  it('should open a new ticket with markdown description and show it on the detail page', () => {
    cy.getPersonalOrgId().then((orgId) => {
      // Navigate to the new ticket form
      cy.visit(getPathWithParams(paths.org.detail.support.new, { orgId }));
      cy.get('input[name="title"], input[placeholder*="title" i]').type('Test ticket from Cypress');
      // Find the markdown editor textarea for description
      cy.get('textarea').first().type('## Summary\n\nThis is a **markdown** description.');
      // Submit
      cy.get('button[type="submit"]').click();

      // Should land on the detail page (redirect after creation)
      cy.url().should('match', /\/support\/[^/]+$/);

      // Header should show ticket title and ID
      cy.contains('Test ticket from Cypress').should('be.visible');
      cy.contains(/^#ticket-/).should('be.visible');

      // Description section should render markdown (not raw markdown)
      cy.contains('Summary').should('be.visible');
      cy.get('strong').contains('markdown').should('exist');

      // No separate "View messages" button
      cy.contains('View messages').should('not.exist');

      // Messages section heading should be visible
      cy.contains(/messages/i).should('be.visible');

      // Reply form should be present at the bottom
      cy.contains('Send reply').should('be.visible');
    });
  });

  it('should send a reply message on an existing ticket', () => {
    cy.getPersonalOrgId().then((orgId) => {
      cy.visit(getPathWithParams(paths.org.detail.support.root, { orgId }));
      // Open the first available ticket
      cy.get('li').first().click();
      cy.url().should('match', /\/support\/[^/]+$/);

      const reply = `Cypress reply at ${Date.now()}`;
      cy.get('textarea').last().type(reply);
      cy.contains('Send reply').click();

      // Message should appear in the thread
      cy.contains(reply).should('be.visible');
    });
  });

  it('/messages URL should redirect to the ticket detail page', () => {
    cy.getPersonalOrgId().then((orgId) => {
      cy.visit(getPathWithParams(paths.org.detail.support.root, { orgId }));
      cy.get('li').first().invoke('text').then(() => {
        cy.get('li').first().click();
        cy.url().then((detailUrl) => {
          // Visit the /messages sub-route
          cy.visit(`${detailUrl}/messages`);
          // Should redirect back to the ticket detail (no trailing /messages)
          cy.url().should('eq', detailUrl);
        });
      });
    });
  });
});
