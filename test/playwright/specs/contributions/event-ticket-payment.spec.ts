import type { Page } from '@playwright/test';

import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import { toast } from '../../helpers/notifications';
import { contribute, fillCardElement, newCardElement } from '../../helpers/stripe';

/**
 * Paying Event tickets by card, on a host showing Stripe's card element (`opensource`). The Event's admin
 * creates the ticket from the dashboard, then gets it from the Event's page and pays with a new card.
 */
const test = scenarioTest('stripe-contribution', {
  inputs: { host: 'opensource', event: true },
  actor: 'collectiveAdmin',
});

/** Creates a ticket from the Event's dashboard, then opens its contribution flow from the Event's page. */
async function createTicketAndRsvp(
  page: Page,
  url: string,
  ticket: { name: string; amount: string; minimumAmount?: string },
) {
  await page.goto(url);
  await page.getByTestId('admin-panel-container').getByTestId('create-ticket').click();
  await page.getByTestId('name').fill(ticket.name);
  if (ticket.minimumAmount) {
    await page.getByTestId('amountType').click();
    await page.getByTestId('select-option').filter({ hasText: 'Flexible' }).click();
  }
  await page.locator('input[data-cy=amount]').fill(ticket.amount);
  if (ticket.minimumAmount) {
    await page.locator('input[data-cy=minimumAmount]').fill(ticket.minimumAmount);
  }
  await page.getByTestId('confirm-btn').click();
  await expect(toast(page, 'Ticket created.')).toBeVisible();
  await page.getByTestId('public-profile-link').click();
  await page.getByRole('button', { name: 'RSVP' }).click();
  await expect(page.getByTestId('contribution-quantity')).toBeVisible();
}

/** From the payment step: pays with a new card and waits for the success page. */
async function payTicket(page: Page, label: string) {
  await fillCardElement(await newCardElement(page));
  await expect(page.getByTestId('cf-next-step').filter({ hasText: label })).toBeVisible();
  await contribute(page);
}

test.describe('Paying Event tickets with a card', { tag: STRIPE_TAG }, () => {
  test('a ticket at a fixed amount', async ({ page, scenario }) => {
    await createTicketAndRsvp(page, scenario.urls.eventTickets, { name: 'Paying Ticket', amount: '10' });
    await expect(page.getByTestId('amount-picker')).toHaveCount(0);
    await page.getByTestId('cf-next-step').click();
    await page.getByTestId('input-legalName').fill('John Doe');
    await page.getByTestId('cf-next-step').click();
    await payTicket(page, 'Get ticket');
  });

  test('a ticket at a flexible amount', async ({ page, scenario }) => {
    await createTicketAndRsvp(page, scenario.urls.eventTickets, {
      name: 'Flexible Paying Ticket',
      amount: '10',
      minimumAmount: '5',
    });
    await expect(page.getByTestId('amount-picker')).toBeVisible();
    await page.getByTestId('cf-next-step').click();
    await page.getByTestId('input-legalName').fill('John Doe');
    await page.getByTestId('cf-next-step').click();
    await payTicket(page, 'Get ticket');
  });

  test.describe('Collective charging VAT', () => {
    test.use({ inputs: { host: 'opensource', event: true, vat: true } });

    test('VAT follows the country and VAT number of the contributor, then the tickets are paid', async ({
      page,
      scenario,
    }) => {
      const eventName = scenario.accounts.event.name;
      await createTicketAndRsvp(page, scenario.urls.eventTickets, { name: 'Ticket with VAT', amount: '10' });
      await page.locator('input[type=number][name=quantity]').fill('8');
      await page.getByTestId('cf-next-step').click();
      await page.getByTestId('input-legalName').fill('John Doe');
      await page.getByTestId('cf-next-step').click();

      const line = (label: string) => page.getByTestId('ContributionSummary-AmountLine').filter({ hasText: label });
      const vat = page.getByTestId('VAT-amount');
      const next = page.getByTestId('cf-next-step');
      const country = page.getByTestId('country-select');
      const pickCountry = async (name: string) => {
        await country.click();
        await page.getByTestId('select-option').filter({ hasText: name }).click();
      };
      const vatNumber = page.locator('input[name=taxIdNumber]');
      /** Submits the step: once valid, the payment step shows; go back to the taxes. */
      const submitValid = async () => {
        await next.click();
        await expect(page.getByText('Choose payment method')).toBeVisible();
        await page.getByTestId('cf-prev-step').click();
      };

      await expect(line(`Contribution to ${eventName} - "Ticket with VAT"`)).toContainText('$10.00');
      await expect(line('Quantity')).toContainText('8');
      await expect(line('Total charge')).toContainText('$80.00');

      // Outside the EU: no VAT
      await expect(country).toContainText('Please select your country');
      await pickCountry('Algeria');
      await expect(vat).toContainText('$0.00');
      await expect(line('Total charge')).toContainText('$80.00');
      await expect(next).toBeEnabled();

      // In another EU country: VAT, unless the contributor has a valid VAT number
      await pickCountry('France');
      await expect(vat).toContainText('$16.80');
      await expect(line('Total charge')).toContainText('$96.80');
      await expect(next).toBeEnabled();

      // An empty VAT number form blocks the step until removed
      await page.getByText('Enter VAT number (if you have one)').click();
      await next.click();
      await expect(page.getByText('Invalid VAT number')).toBeVisible();
      await page.getByTestId('remove-vat-btn').click();
      await submitValid();

      // An invalid number is refused, a valid one is formatted and removes the VAT
      await page.getByText('Enter VAT number (if you have one)').click();
      await vatNumber.fill('424242');
      await next.click();
      await expect(page.getByText('Invalid VAT number')).toBeVisible();
      await vatNumber.fill('FR-XX999999999');
      await submitValid();
      await expect(next).toBeEnabled();
      await expect(page.getByText('FRXX999999999')).toBeVisible();
      await expect(vat).toContainText('$0.00');
      await expect(line('Total charge')).toContainText('80.00');

      // The number can be changed
      await page.getByText('Change VAT number').click();
      await expect(vatNumber).toHaveValue('FRXX999999999');
      await vatNumber.fill('FR-XX-999999998');
      await submitValid();
      await expect(page.getByText('FRXX999999998')).toBeVisible();

      // In the Collective's own country, VAT applies even with a VAT number, which must match the country
      await pickCountry('Belgium');
      await expect(vat).toContainText('$16.80');
      await expect(line('Total charge')).toContainText('$96.80');
      await page.getByText('Enter VAT number (if you have one)').click();
      await vatNumber.fill('FRXX999999998');
      await next.click();
      await expect(page.getByText("The VAT number doesn't match the country")).toBeVisible();
      await vatNumber.fill('BE-0414445663');
      await submitValid();
      await expect(page.getByText('BE0414445663')).toBeVisible();
      await expect(vat).toContainText('$16.80');
      await expect(line('Total charge')).toContainText('$96.80');

      await next.click();
      await payTicket(page, 'Get tickets');
    });
  });
});
