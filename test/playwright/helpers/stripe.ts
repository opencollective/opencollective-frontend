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
async function typeInto(field: Locator, keys: string, expected: string | RegExp) {
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

/** Stripe test card numbers (https://docs.stripe.com/testing#cards). */
export const TEST_CARDS = {
  /** Succeeds without authentication. */
  valid: '4242424242424242',
  /** Declined by the bank. */
  declined: '4000000000000002',
  /** Asks for 3D Secure 2 authentication on the first payment. */
  threeDSecure: '4000000000003220',
  /** Asks for 3D Secure authentication on every payment, including off-session ones. */
  alwaysAuthenticate: '4000002760003184',
} as const;

/**
 * Fills Stripe's card element, the card form of hosts that did not opt in to the Payment Element (and of the
 * payment methods dashboard). `complete: false` types the number only, as someone who stopped there.
 */
export async function fillCardElement(
  element: FrameLocator,
  number: string = TEST_CARDS.valid,
  { complete = true } = {},
) {
  const formatted = number.replace(/(\d{4})(?=\d)/g, '$1 ');
  // While typing, Stripe may already show the separator that follows: compare the digits
  await typeInto(element.locator('input[name="cardnumber"]'), number, new RegExp(`^${formatted}\\s?$`));
  if (complete) {
    await typeInto(element.locator('input[name="exp-date"]'), '1235', '12 / 35');
    await typeInto(element.locator('input[name="cvc"]'), '123', '123');
    // Stripe only asks for a ZIP code for cards issued where it is used
    const postal = element.locator('input[name="postal"]');
    if (await postal.isVisible()) {
      await typeInto(postal, '90210', '90210');
    }
  }
}

/** The card element of the contribution flow's payment step, for a contributor without a saved payment method. */
export async function newCardElement(page: Page): Promise<FrameLocator> {
  await expect(page.getByTestId('PaymentMethodList').getByText('New credit/debit card')).toBeVisible();
  return stripeElement(page.getByTestId('PaymentMethodList'));
}

/**
 * Answers Stripe's 3D Secure test challenge, which Stripe opens in a frame over the page, with "Complete"
 * (`approve`) or "Fail".
 */
export async function completeThreeDSecure(page: Page, approve: boolean) {
  const selector = approve ? '#test-source-authorize-3ds' : '#test-source-fail-3ds';
  const visibleButton = async () => {
    for (const frame of page.frames()) {
      const button = frame.locator(selector);
      if (await button.isVisible().catch(() => false)) {
        return button;
      }
    }
    return null;
  };
  // The challenge page is nested in Stripe frames and may still be loading: answer until it closes
  await expect(async () => {
    const button = await visibleButton();
    expect(button, `No visible 3D Secure challenge showing ${selector}`).not.toBeNull();
    await button.click({ timeout: 5_000 });
    await expect.poll(async () => (await visibleButton()) === null, { timeout: 10_000 }).toBe(true);
  }).toPass({ timeout: 60_000 });
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
