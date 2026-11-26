import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { GraphScenario } from '../../fixtures/transport';
import { attemptTag, isolationProbe } from '../../helpers/attempt';

const test = scenarioTest('fiscal-host', { inputs: { openToApplications: true, applicant: true }, actor: null });

/** As the host admin, approves a Collective's pending application from the host applications dashboard. */
async function approveApplication(page: Page, scenario: GraphScenario, slug: string) {
  await page.goto(scenario.urls.hostApplications);
  await page.getByRole('button', { name: /^Pending/ }).click();
  await page.getByTestId(`${slug}-table-actions`).click();
  await page.getByTestId(`${slug}-view-details`).click();
  await page.getByTestId(`${slug}-approve`).click();
  await expect(page.getByTestId(`host-application-header-${slug}`)).toContainText('Approved');
}

test('visitor signs in while applying with a new Collective, which the host admin approves', async ({
  page,
  scenario,
  openBrowserAs,
}, testInfo) => {
  const name = `Cavies United ${attemptTag(scenario.attempt)}`;
  const slug = `pw-cavies-${attemptTag(scenario.attempt)}`;

  await page.goto(scenario.urls.hostProfile);
  await expect(page.getByText('We are fiscally hosting this Collective')).toBeVisible();
  await page.locator('[data-cy="host-apply-btn"]:visible').click();
  await page.getByTestId('host-apply-modal-next').click();
  await page.getByTestId('host-apply-collective-picker').click();
  // The link works, but sits in a picker entry marked as disabled, which Playwright would wait out.
  const newCollective = page.getByTestId('host-apply-new-collective-link');
  await expect(newCollective).toBeVisible();
  await newCollective.click({ force: true });

  // Applying needs an account: the visitor signs in on the way.
  await page.locator('#email').fill(scenario.actors.applicant.email);
  await page.getByTestId('signin-btn').click();

  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="slug"]').fill(slug);
  await page.locator('input[name="description"]').fill('We will rule the world with our cute squeaks');
  await page.getByTestId('checkbox-tos').click();
  await page.locator('button[type="submit"]').click();
  await expect(page.getByTestId('onboarding-collective-created')).toContainText(`${name} has been created!`);
  isolationProbe(testInfo, 'leave a pending application behind and retry on a new host.');

  const hostAdmin = await openBrowserAs('hostAdmin');
  await approveApplication(hostAdmin, scenario, slug);
});

test.describe('Collective without a host', () => {
  test.use({ inputs: { openToApplications: true, applicantCollective: true }, actor: 'applicant' });

  test('Collective admin finds the host and applies from "accept financial contributions"', async ({
    page,
    scenario,
  }) => {
    const { host, applicantCollective } = scenario.accounts;
    await page.goto(`/${applicantCollective.slug}/accept-financial-contributions/host`);
    // The host may already be listed before the search: wait for the list to answer the search, which re-renders
    // it (and would close a dialog opened from the earlier list).
    const searched = page.waitForResponse(response => {
      const request = response.request().postDataJSON?.();
      return request?.operationName === 'FindAFiscalHost' && request.variables?.searchTerm === host.name;
    });
    await page.getByPlaceholder(/Search/).fill(host.name);
    await searched;
    const card = page.getByTestId(`${host.slug}-collective-card`);
    await card.getByText('Learn more').click();

    // The dialog presents the host before asking to apply.
    await expect(page.getByText('Host since')).toBeVisible();
    await page.getByTestId('host-apply-modal-next').click();
    await page.getByTestId('afc-host-submit-button').click();
    await expect(page).toHaveURL(/\/success/);
    await expect(page.getByText(`You have applied to be hosted by ${host.name}`)).toBeVisible();
    await expect(page.getByTestId('afc-success-host-settings-link')).toHaveCount(0);
  });
});
