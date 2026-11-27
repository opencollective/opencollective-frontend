import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { attemptTag, isolationProbe } from '../../helpers/attempt';
import { toast } from '../../helpers/notifications';

// The admin of a hosted Collective, creating an event for it.
const test = scenarioTest('collective-admin', { inputs: {}, actor: 'admin' });

async function createTicket(page: Page, ticket: { name: string; description?: string; amount: string; max?: string }) {
  await page.getByTestId('create-ticket').click();
  await page.getByTestId('name').fill(ticket.name);
  if (ticket.description) {
    await page.getByTestId('description').fill(ticket.description);
  }
  await page.locator('input[data-cy=amount]').fill(ticket.amount);
  if (ticket.max) {
    await page.locator('input[data-cy=maxQuantity]').fill(ticket.max);
  }
  await page.getByTestId('confirm-btn').click();
  await expect(toast(page, 'Ticket created.')).toBeVisible();
}

test('admin creates an event with a location and tickets, edits it, then deletes it', async ({
  page,
  scenario,
}, testInfo) => {
  const tag = attemptTag(scenario.attempt);
  const title = `New event ${tag}`;
  const updatedTitle = `New event updated ${tag}`;

  await page.goto(scenario.urls.newEvent);
  await page.locator('input[name="name"]').fill(title);
  await page.locator('input[name="endsAt"]').fill('2050-01-20T13:00');
  await page.locator('input[name="description"]').fill('We are going to the Eiffel Tower');
  // The address search is Google's live autocomplete, as in Cypress.
  await page.locator('.geosuggest__input').fill('Eiffel Tower');
  await page.locator('.geosuggest__suggests > :nth-child(1)', { hasText: 'Gustave' }).click();
  const address = page.locator('#location [data-cy="location-address"]');
  for (const part of ['Gustave', 'Eiffel', '75007', 'Paris', 'FR']) {
    await expect(address).toContainText(part);
  }
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(toast(page, 'Your Event has been created.')).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\//);
  isolationProbe(testInfo, 'leave an event behind and retry on a Collective without events.');

  // One free and one paid ticket.
  await page.getByTestId('menu-item-tickets').click();
  await createTicket(page, { name: 'Free ticket', description: 'Free ticket for students', amount: '0', max: '10' });
  await createTicket(page, { name: 'Paid ticket', amount: '15' });

  // The event page shows the location and both tickets.
  await page.getByTestId('public-profile-link').click();
  await expect(page.locator('#location .address')).toContainText('Paris');
  await expect(page.locator('#location .address')).toContainText('75007');
  const tickets = page.getByTestId('Tickets').getByTestId('contribute-card-tier');
  await expect(tickets).toHaveCount(2);
  await expect(tickets.getByTestId('amount').filter({ hasText: '15' })).toHaveCount(1);

  // Rename it, swap the paid ticket for a sponsor tier.
  await page.getByTestId('go-to-dashboard-btn').click();
  await page.locator('[data-cy="menu-item-Settings"]:visible').click();
  await page.locator('[data-cy="menu-item-info"]:visible').click();
  await page.locator('input[name="name"]').fill(updatedTitle);
  await page.getByTestId('save').click();
  await expect(toast(page, 'Account updated')).toBeVisible();
  await page.getByTestId('menu-item-tickets').click();
  await page.getByTestId('contribute-card-tier').last().getByRole('button').click();
  await page.getByTestId('delete-btn').click();
  await page.getByTestId('confirm-delete-btn').click();
  await expect(toast(page, 'Ticket deleted.')).toBeVisible();
  await page.getByTestId('menu-item-tiers').click();
  await page.getByTestId('create-contribute-tier').click();
  await page.getByTestId('name').fill('Sponsor');
  await page.getByTestId('description').fill('Become a sponsor');
  await page.locator('input[data-cy=amount]').fill('200');
  await page.getByTestId('confirm-btn').click();
  await expect(toast(page, 'Tier created.')).toBeVisible();

  await page.getByTestId('public-profile-link').click();
  await expect(page.locator('h1[data-cy=collective-title]')).toHaveText(updatedTitle);
  await expect(page.getByTestId('Tickets').getByTestId('contribute-card-tier')).toHaveCount(1);
  await expect(page.getByTestId('financial-contributions').getByTestId('contribute-card-tier')).toHaveCount(1);

  // Deleting the event.
  await page.getByTestId('go-to-dashboard-btn').click();
  await page.locator('[data-cy="menu-item-Settings"]:visible').click();
  await page.locator('[data-cy="menu-item-advanced"]:visible').click();
  await page.getByRole('button', { name: 'Delete this Event' }).click();
  await page.getByTestId('delete').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your event has been deleted.' })).toBeVisible();
  await expect(page).toHaveURL(/\?type=EVENT$/);
});
