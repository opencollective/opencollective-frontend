import type { Frame, FrameLocator, Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { queryAs } from './api';

/**
 * Live Stripe test-mode helpers for journeys tagged `@stripe` (see "Live Stripe journeys" in docs/e2e.md).
 * Stripe renders its fields in cross-origin iframes: reach them through frame locators, never by waiting.
 */

/** The Stripe Payment Element (or card element) inside `scope`: the first Stripe-rendered iframe. */
export const stripeElement = (scope: Page | Locator): FrameLocator =>
  scope.locator('.__PrivateStripeElement iframe').first().contentFrame();

/** Stripe's test card that always succeeds without authentication. */
export async function fillTestCard(element: FrameLocator) {
  // Typed like a person: Stripe formats these fields as they change.
  await element.locator('#payment-numberInput').pressSequentially('4242424242424242');
  await element.locator('#payment-expiryInput').pressSequentially('1235');
  await element.locator('#payment-cvcInput').pressSequentially('123');
  await element.locator('#payment-countryInput').selectOption('US');
  await element.locator('#payment-postalCodeInput').pressSequentially('90210');
}

/**
 * Opens the contribution flow at `url` and goes to its payment step, as a guest giving `guestEmail` or as the
 * signed-in visitor (who contributes as themselves) without it.
 */
export async function goToPaymentStep(page: Page, url: string, guestEmail?: string) {
  await page.goto(url);
  await page.getByTestId('cf-next-step').click();
  if (guestEmail) {
    await page.locator('input[type="email"]').fill(guestEmail);
  } else {
    await expect(page.getByText('Contribute as')).toBeVisible();
  }
  await page.getByTestId('cf-next-step').click();
  await expect(page.getByTestId('PaymentMethodList')).toBeVisible();
}

/** Chooses a new payment method in the payment step and returns the Payment Element it shows. */
export async function chooseNewPaymentMethod(page: Page): Promise<FrameLocator> {
  await page.getByTestId('PaymentMethodList').getByText('New payment method').click();
  return stripeElement(page);
}

/**
 * Picks a payment method type in the Payment Element: its tab when Stripe shows one, otherwise the entry of
 * the "more payment methods" menu. Which one Stripe shows depends on the space it has and the methods enabled.
 */
export async function choosePaymentMethodType(element: FrameLocator, type: string) {
  const tab = element.locator(`#${type}-tab`);
  const menu = element.locator('.p-AdditionalPaymentMethods-menu select, select.p-AdditionalPaymentMethods-menu');
  await expect(tab.or(menu).first()).toBeVisible();
  if (await tab.isVisible()) {
    await tab.click();
  } else {
    await menu.selectOption(type);
  }
}

/**
 * The frame of a Stripe-hosted overlay (such as the bank account picker of Financial Connections) that shows
 * `selector`. Stripe mounts it as a top-level iframe whose URL is not part of its contract.
 */
export async function stripeOverlayFrame(page: Page, selector: string, timeout = 30_000): Promise<Frame> {
  let found: Frame | undefined;
  await expect
    .poll(
      async () => {
        for (const frame of page.frames()) {
          if (
            frame !== page.mainFrame() &&
            (await frame
              .locator(selector)
              .count()
              .catch(() => 0)) > 0
          ) {
            found = frame;
            return true;
          }
        }
        return false;
      },
      { timeout, message: `No Stripe overlay showing ${selector}` },
    )
    .toBe(true);
  return found;
}

/** The contribution shown on the success page of the contribution flow, once it is there. */
export async function contributionOnSuccessPage(page: Page): Promise<number> {
  await expect(page.getByTestId('order-success').first()).toContainText('Thank you!', { timeout: 60_000 });
  const id = await page.locator('[data-cy^="contribution-id-"]').first().getAttribute('data-cy');
  return Number(id.replace('contribution-id-', ''));
}

/**
 * Waits until the contribution reaches one of `statuses`, as `observer` (an actor who may see it, such as an
 * admin of the Collective) reads it from the API. Asynchronous payment methods only get there through Stripe's
 * webhooks, which must pass this stack's ownership gate.
 */
export async function expectContributionStatus(
  observer: { token: string },
  legacyId: number,
  statuses: RegExp,
  timeout = 60_000,
) {
  const status = async () => {
    const { order } = await queryAs<{ order: { status: string } }>(
      observer,
      'query ContributionStatus($legacyId: Int!) { order(order: { legacyId: $legacyId }) { status } }',
      { legacyId },
    );
    return order.status;
  };
  await expect
    .poll(status, { timeout, intervals: [1_000], message: `Contribution ${legacyId} never reached ${statuses}` })
    .toMatch(statuses);
}
