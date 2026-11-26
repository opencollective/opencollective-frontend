import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { toast } from '../../helpers/notifications';
import { resetSignupRateLimits } from '../../helpers/rate-limits';

/**
 * The profile step of the contribution flow, for a visitor who is not signed in: signing in, or creating an
 * account, without leaving the flow. Completing a sign-up with the emailed code is
 * `signup-in-contribution-flow.spec.ts`.
 */
const test = scenarioTest('contribution-flow', { inputs: {}, actor: null });

/** Opens the flow of the scenario's Collective and goes on to the profile step, which starts with the guest form. */
async function openProfileStep(page: Page, donateUrl: string) {
  await page.goto(donateUrl);
  await page.getByTestId('cf-next-step').click();
  await expect(page.getByText('Contribute as a guest')).toBeVisible();
}

test('visitor goes back to the guest form, then the sign-up form checks the email address', async ({
  page,
  scenario,
  mail,
}) => {
  const content = page.getByTestId('cf-content');
  await openProfileStep(page, scenario.urls.donate);

  // From the guest form to the sign-in form, and back
  await page.getByTestId('cf-profile-signin-btn').click();
  await content.getByRole('button', { name: 'Go back to contribute as a guest' }).click();
  await expect(page.getByText('Contribute as a guest')).toBeVisible();

  // Signing in offers to create an account instead, with a way back
  await page.getByTestId('cf-profile-signin-btn').click();
  await content.getByRole('button', { name: 'Create an account' }).click();
  await expect(content.getByRole('button', { name: '← Go back', exact: true })).toBeVisible();

  await content.locator('input[name=name]').fill('Dummy Name');
  await content.getByTestId('checkbox-tosOptIn').getByTestId('custom-checkbox').click();

  // The browser refuses an address without "@"
  const email = content.locator('input[name=email]');
  await email.fill('IncorrectValue');
  await content.locator('button[type=submit]').click();
  await expect(
    page.getByText("Please include an '@' in the email address. 'IncorrectValue' is missing an '@'."),
  ).toBeVisible();

  // The API refuses an address the browser accepts
  await resetSignupRateLimits();
  await email.fill('Incorrect@value');
  await content.locator('button[type=submit]').click();
  await expect(toast(page, 'Invalid email address.')).toBeVisible();

  // A valid address moves on to the code step, still inside the flow
  const address = mail.address('signup');
  await email.fill(address);
  await content.locator('button[type=submit]').click();
  await expect(page.getByTestId('signup-code-form')).toContainText(`Enter the code sent to ${address}.`);
  await expect(content.getByRole('button', { name: 'Go back to contribute as a guest' })).toBeVisible();
});

test.describe('signing in', () => {
  test('the sign-in form only submits a valid email address', async ({ page, scenario }) => {
    const content = page.getByTestId('cf-content');
    await openProfileStep(page, scenario.urls.donate);
    await page.getByTestId('cf-profile-signin-btn').click();

    const submit = content.locator('button[type=submit]');
    await expect(submit).toBeDisabled();
    const email = content.locator('input[name=email]');
    await email.fill('zzzzzzzzzzzzz');
    await email.blur();
    await expect(
      page.getByText("Please include an '@' in the email address. 'zzzzzzzzzzzzz' is missing an '@'."),
    ).toBeVisible();
  });

  test('an unknown email address is offered to create an account', async ({ page, scenario, mail }) => {
    const content = page.getByTestId('cf-content');
    await openProfileStep(page, scenario.urls.donate);
    await page.getByTestId('cf-profile-signin-btn').click();

    const unknown = mail.address('unknown');
    await content.locator('input[name=email]').fill(unknown);
    await content.locator('button[type=submit]').click();
    await expect(
      page.getByText(
        `${unknown} does not exist on Open Collective. Would you like to create an account with this email?`,
      ),
    ).toBeVisible();
  });

  test.describe('as a user who administers an Organization', () => {
    test.use({ inputs: { contributorOrganization: true } });

    test('user signs in and can contribute as themselves or as their Organization', async ({ page, scenario }) => {
      const { contributor } = scenario.actors;
      const content = page.getByTestId('cf-content');
      await openProfileStep(page, scenario.urls.donate);
      await page.getByTestId('cf-profile-signin-btn').click();

      await content.locator('input[name=email]').fill(contributor.email);
      await content.locator('button[type=submit]').click();

      // Signed in straight away, back in the flow with their own profile selected
      await expect(page.getByText('Contribute as')).toBeVisible();
      const picker = page.getByTestId('contribute-profile-picker');
      await expect(picker).toContainText(contributor.name);
      await picker.click();
      // Long names are cut off in the list: find the Organization by its handle
      const organization = page
        .getByTestId('select-option')
        .filter({ hasText: `@${scenario.accounts.organization.slug}` });
      await expect(organization).toBeVisible();
    });
  });
});
