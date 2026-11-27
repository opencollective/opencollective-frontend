import { expect, scenarioTest } from '../../fixtures';
import { toast } from '../../helpers/notifications';

/**
 * Ordering tickets of an Event without a payment: paying tickets need a card and stay in Cypress
 * (`40-stripe-contribution-event-tickets.test.js`) until live Stripe journeys exist in Playwright.
 */
const test = scenarioTest('contribution-flow', { inputs: { event: 'upcoming' }, actor: 'admin' });

test('Event admin creates a free ticket and gets one without paying', async ({ page, scenario }) => {
  const { event } = scenario.accounts;
  await page.goto(scenario.urls.eventTickets);

  // A free ticket
  await page.getByTestId('admin-panel-container').getByTestId('create-ticket').click();
  await page.getByTestId('name').fill('Free ticket');
  await page.locator('input[data-cy=amount]').fill('0');
  await page.getByTestId('confirm-btn').click();
  await expect(toast(page, 'Ticket created.')).toBeVisible();

  // Getting it from the Event's page: a quantity, no amount, no payment step
  await page.getByTestId('public-profile-link').click();
  await expect(page).toHaveURL(new RegExp(`/events/${event.slug}$`));
  await page.getByRole('button', { name: 'RSVP' }).click();
  await expect(page.getByTestId('contribution-quantity')).toBeVisible();
  await expect(page.getByTestId('amount-picker')).toHaveCount(0);
  await page.getByTestId('cf-next-step').click();
  await page.getByTestId('input-legalName').fill('John Doe');
  await page.getByTestId('cf-next-step').filter({ hasText: 'Get ticket' }).click();

  await expect(page.getByTestId('order-success')).toBeVisible({ timeout: 20_000 });
});

test.describe('Event that is over', () => {
  test.use({ inputs: { event: 'past' }, actor: null });

  test('visitor cannot contribute or get tickets once the Event is over', async ({ page, scenario }) => {
    await page.goto(scenario.urls.event);
    await expect(page.getByRole('heading', { name: scenario.accounts.event.name })).toBeVisible();
    await expect(page.getByTestId('financial-contributions')).toHaveCount(0);
    await expect(page.getByTestId('Tickets')).toHaveCount(0);
  });
});
