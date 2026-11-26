import type { Page } from '@playwright/test';
import * as cheerio from 'cheerio';

import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import { contribute, fillCardElement, newCardElement } from '../../helpers/stripe';

/**
 * Guest contributions (not signed in) by card, on a host showing Stripe's card element (`opensource`), live in
 * test mode. Guests are new addresses of the attempt, or the address of the scenario's `contributor`.
 */
const test = scenarioTest('stripe-contribution', { inputs: { host: 'opensource' }, actor: null });

const success = (page: Page) => page.getByTestId('order-success');
const emailInput = (page: Page) => page.locator('input[name=email]');
const invalid = (page: Page, name: string) => page.locator(`input[name="${name}"]:invalid`);

/** Opens the donation page with a custom amount, or a preset one (`$10`). */
async function donate(page: Page, url: string, amount: string) {
  await page.goto(url);
  if (amount.startsWith('$')) {
    await page.getByTestId('amount-picker').getByRole('button', { name: amount, exact: true }).click();
  } else {
    await page.getByTestId('amount-picker-btn-other').click();
    await page.locator('input[name=custom-amount]').fill(amount);
  }
}

/** From the guest profile step (filled), pays with a new card and waits for the success page. */
async function payAsGuest(page: Page, label: string) {
  await page.getByTestId('cf-next-step').click();
  await fillCardElement(await newCardElement(page));
  await expect(page.getByTestId('cf-next-step').filter({ hasText: label })).toBeVisible();
  await contribute(page);
}

test.describe('Guest contributions with a card', { tag: STRIPE_TAG }, () => {
  test('guest contributes monthly with the address of an existing user, who is thanked by email', async ({
    page,
    scenario,
    mail,
  }) => {
    const { collective } = scenario.accounts;
    const { email } = scenario.actors.contributor;
    await donate(page, scenario.urls.donate, '400.42');
    await page.locator('#interval button', { hasText: 'Monthly' }).click();
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByText('Contribute as a guest')).toBeVisible();
    await emailInput(page).fill(email);
    await page.getByTestId('input-name').fill('Jack London');
    await page.getByTestId('input-legalName').fill('Very Legal Organization');
    await payAsGuest(page, 'Contribute $400.42');

    await expect(success(page)).toContainText(`You are now supporting ${collective.name}.`);
    await expect(success(page)).toContainText('$400.42 USD');
    const message = await mail.waitForMessage({
      to: email,
      subject: `Thank you for your contribution to ${collective.name}`,
    });
    expect(message.html).toContain('If you need help, contact');
  });

  test('guest contributes once, then joins with the address they gave', async ({ page, scenario, mail }) => {
    const email = mail.address('guest');
    await donate(page, scenario.urls.donate, '$10');
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByText('Contribute as a guest')).toBeVisible();

    // The address is required, and must be one
    await page.getByTestId('cf-next-step').click();
    await expect(invalid(page, 'email')).toHaveCount(1);
    await emailInput(page).fill('xxxxxxxxxxx');
    await page.getByTestId('cf-next-step').click();
    await expect(invalid(page, 'email')).toHaveCount(1);
    await emailInput(page).fill(email);
    await payAsGuest(page, 'Contribute $10');
    await expect(success(page)).toContainText(`You are now supporting ${scenario.accounts.collective.name}.`);
    await expect(success(page)).toContainText('$10.00 USD');

    // Joining starts from the address of the contribution and verifies it with an emailed code
    await page.getByTestId('join-opencollective-link').click();
    const form = page.getByTestId('signup-form');
    await expect(form.locator('input[name="email"]')).toHaveValue(email);
    await form.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(url => url.pathname === '/signup/verify' && url.searchParams.get('email') === email);
    await expect(form).toContainText(`Enter the code sent to ${email}.`);
    const confirmation = await mail.waitForMessage({ to: email, subject: 'Email Confirmation' });
    const otp = cheerio.load(confirmation.html)('h3 > span').text().trim();
    await form.locator('input[data-slot="input-otp"]').fill(otp);
    await expect(page).toHaveURL(/\/signup\/profile/);
  });

  test('guest makes several contributions in one session, giving more details as the amount grows', async ({
    page,
    scenario,
    mail,
  }) => {
    const { collective } = scenario.accounts;
    const firstEmail = mail.address('first-guest');
    const secondEmail = mail.address('second-guest');
    const joinLink = (email: string) => `/signup?email=${encodeURIComponent(email)}`;

    // $10: an address is enough
    await donate(page, scenario.urls.donate, '$10');
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByText('Contribute as a guest')).toBeVisible();
    await page.locator('input[name=name]').fill('Rick Astley');
    await emailInput(page).fill(firstEmail);
    await payAsGuest(page, 'Contribute $10');
    await expect(success(page)).toContainText(`You are now supporting ${collective.name}.`);
    await expect(success(page)).toContainText('$10.00 USD');
    await expect(page.getByTestId('join-opencollective-link')).toHaveAttribute('href', joinLink(firstEmail));

    // $500: the legal name becomes required, the name stays optional
    await donate(page, scenario.urls.donate, '500');
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByText('Contribute as a guest')).toBeVisible();
    await page.getByTestId('cf-next-step').click();
    await expect(invalid(page, 'name')).toHaveCount(0);
    await expect(invalid(page, 'legalName')).toHaveCount(1);
    await expect(invalid(page, 'email')).toHaveCount(1);
    await page.getByTestId('input-name').fill('Rick Astley');
    await page.getByTestId('input-legalName').fill('Very Legal Organization');
    await emailInput(page).fill(firstEmail);
    await payAsGuest(page, 'Contribute $500');
    await expect(success(page)).toContainText('$500.00 USD');
    await expect(page.getByTestId('join-opencollective-link')).toHaveAttribute('href', joinLink(firstEmail));

    // $5,000: the address is required too, once a country is picked
    await donate(page, scenario.urls.donate, '5000');
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByText('Contribute as a guest')).toBeVisible();
    await page.getByTestId('cf-next-step').click();
    await expect(invalid(page, 'name')).toHaveCount(0);
    await expect(invalid(page, 'legalName')).toHaveCount(1);
    await expect(invalid(page, 'email')).toHaveCount(1);
    await page.getByTestId('cf-content').getByTestId('country-select').click();
    await page.getByTestId('select-option').filter({ hasText: 'France' }).click();
    await expect(invalid(page, 'address1')).toHaveCount(1);
    await expect(invalid(page, 'postalCode')).toHaveCount(1);
    await expect(invalid(page, 'city')).toHaveCount(1);
    await page.locator('input[name=name]').fill('Rick');
    await page.getByTestId('input-legalName').fill('Rick Astley');
    await emailInput(page).fill(secondEmail);
    await page.locator('input[name="address1"]').fill('323 Logic Street');
    await page.locator('input[name="postalCode"]').fill('83740');
    await page.locator('input[name="city"]').fill("La Cadière d'Azur");
    await payAsGuest(page, 'Contribute $5,000');
    await expect(success(page)).toContainText('$5,000.00 USD');
    await expect(page.getByTestId('join-opencollective-link')).toHaveAttribute('href', joinLink(secondEmail));
  });
});
