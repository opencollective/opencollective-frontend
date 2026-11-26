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

/**
 * Types into a Stripe field like a person and checks what Stripe kept: a field it is still formatting or
 * focusing can drop keystrokes, so the field is typed again until it shows `expected`.
 */
async function typeInto(field: Locator, keys: string, expected: string) {
  await expect(async () => {
    await field.clear();
    await field.pressSequentially(keys);
    await expect(field).toHaveValue(expected, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

/** Stripe's test card that always succeeds without authentication. */
export async function fillTestCard(element: FrameLocator) {
  await typeInto(element.locator('#payment-numberInput'), '4242424242424242', '4242 4242 4242 4242');
  await typeInto(element.locator('#payment-expiryInput'), '1235', '12 / 35');
  await typeInto(element.locator('#payment-cvcInput'), '123', '123');
  await element.locator('#payment-countryInput').selectOption('US');
  await typeInto(element.locator('#payment-postalCodeInput'), '90210', '90210');
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

/**
 * Clicks the payment step's submit button ("Contribute") until `arrived` holds. The flow ignores a click made
 * before the Payment Element reported the payment details complete (seen right after a bank account was linked,
 * and under load): the button keeps its label instead of showing a spinner, and a person would click again.
 * A button showing a spinner is busy and is left alone.
 */
export async function submitPaymentStep(page: Page, arrived: () => Promise<boolean>, timeout = 90_000) {
  const submit = page.getByTestId('cf-next-step');
  await expect(async () => {
    if (await arrived()) {
      return;
    }
    if ((await submit.isVisible()) && (await submit.innerText()).trim()) {
      await submit.click({ timeout: 5_000 });
    }
    await expect.poll(arrived, { timeout: 15_000 }).toBe(true);
  }).toPass({ timeout });
}

/** The contribution shown on the success page of the contribution flow, once it is there. */
export async function contributionOnSuccessPage(page: Page): Promise<number> {
  await expect(page.getByTestId('order-success').first()).toContainText('Thank you!', { timeout: 60_000 });
  const id = await page.locator('[data-cy^="contribution-id-"]').first().getAttribute('data-cy');
  return Number(id.replace('contribution-id-', ''));
}

/** Submits the payment step and returns the contribution the success page shows. */
export async function contribute(page: Page): Promise<number> {
  const success = page.getByTestId('order-success').first();
  await submitPaymentStep(page, () => success.isVisible());
  return contributionOnSuccessPage(page);
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
