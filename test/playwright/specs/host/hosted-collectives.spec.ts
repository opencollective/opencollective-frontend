import type { Page } from '@playwright/test';
import * as cheerio from 'cheerio';

import { expect, scenarioTest } from '../../fixtures';
import { attemptTag, isolationProbe } from '../../helpers/attempt';
import { toast } from '../../helpers/notifications';
import { createVendorInline } from '../../helpers/vendor-picker';

const test = scenarioTest('fiscal-host', { inputs: {}, actor: 'hostAdmin' });

/** Opens the "Create collective" dialog of the hosted Collectives dashboard and fills in the new Collective. */
async function startCreatingCollective(page: Page, url: string, { name, slug }: { name: string; slug: string }) {
  await page.goto(url);
  await page.getByTestId('create-collective-btn').click();
  const form = page.getByTestId('create-collective-form');
  await form.locator('input[name="collective.name"]').fill(name);
  // The slug is suggested from the name: replace it for a predictable one.
  await form.locator('input[name="collective.slug"]').fill(slug);
  await form.locator('input[name="collective.description"]').fill('A collective created from the host dashboard');
  return form;
}

/** Opens one action of a hosted Collective's "more actions" menu on the hosted Collectives dashboard. */
async function hostedCollectiveAction(page: Page, slug: string, action: 'unhost' | 'add-funds') {
  await page.getByTestId(`collective-${slug}`).getByTestId('more-actions-btn').click();
  await page.getByTestId(`actions-${action}`).click();
}

test('host admin creates a Collective with an invited admin, who joins from the emailed invitation', async ({
  page,
  scenario,
  mail,
  openBrowserAs,
}, testInfo) => {
  const tag = attemptTag(scenario.attempt);
  const collective = { name: `Hosted ${tag}`, slug: `pw-hosted-${tag}` };
  const invitee = { name: `Invitee ${tag}`, email: mail.address('invitee') };

  const form = await startCreatingCollective(page, scenario.urls.hostedCollectives, collective);
  await form.getByTestId('add-team-member').click();
  const inviteForm = page.getByTestId('invite-user-modal-form');
  await inviteForm.locator('input[name="name"]').fill(invitee.name);
  await inviteForm.locator('input[name="email"]').fill(invitee.email);
  await inviteForm.getByRole('button', { name: 'Add User' }).click();
  await expect(inviteForm).toBeHidden();
  await expect(form).toContainText(invitee.name);
  await form.locator('textarea[name="privateNote"]').fill('Welcome to the collective!');
  await page.getByTestId('create-collective-submit').click();
  await expect(toast(page, 'Collective created successfully!')).toBeVisible();
  await expect(page.getByTestId(`collective-${collective.slug}`)).toContainText(collective.name);
  isolationProbe(testInfo, 'leave a created Collective and a pending invitation behind and retry on a new host.');

  const message = await mail.waitForMessage({ to: invitee.email, subject: `Invitation to join ${collective.name}` });
  const $ = cheerio.load(message.html);
  expect($('body').text()).toContain('Welcome to the collective!');
  const href = $('a')
    .filter((_, link) => /^(Sign up and view invitation|View invitation)$/.test($(link).text().trim()))
    .first()
    .attr('href');
  expect(href, 'The invitation has a link to view it').toBeTruthy();

  // The invitee has no session yet: they sign in with their address, complete their profile, then accept.
  const invited = await openBrowserAs(null);
  const link = new URL(href);
  await invited.goto(`${link.pathname}${link.search}`);
  await expect(invited).toHaveURL(/\/signin/);
  // The profile form can only be saved once it has loaded who is completing it; until then it ignores "Create
  // Profile" without a message.
  const profileLoaded = invited.waitForResponse(
    response => response.request().postDataJSON?.()?.operationName === 'CompleteProfileInfo',
  );
  await invited.locator('input[name=email]').fill(invitee.email);
  await invited.locator('button[type=submit]').click();
  await expect(invited).toHaveURL(/\/signup\/profile/);
  await profileLoaded;
  const profileForm = invited.getByTestId('complete-profile-form');
  await profileForm.locator('input[name="name"]').fill(invitee.name);
  await profileForm.locator('button[type="submit"]').click();
  await expect(invited).toHaveURL(/\/member-invitations/);
  const invitation = invited.getByTestId('member-invitation-card').filter({ hasText: collective.name });
  await invitation.getByTestId('member-invitation-accept-btn').click();
  // The new admin lands on the Collective's dashboard.
  await expect(invited).toHaveURL(new RegExp(`/dashboard/${collective.slug}`));
  await expect(invited.getByText('Collective admin')).toBeVisible();
});

test('host admin creates a Collective that they administer alone', async ({ page, scenario }) => {
  const tag = attemptTag(scenario.attempt);
  const collective = { name: `Self-admin ${tag}`, slug: `pw-self-admin-${tag}` };
  await startCreatingCollective(page, scenario.urls.hostedCollectives, collective);
  await page.getByTestId('include-self-as-admin').click();
  await page.getByTestId('create-collective-submit').click();
  await expect(toast(page, 'Collective created successfully!')).toBeVisible();
  await expect(page.getByTestId(`collective-${collective.slug}`)).toContainText(collective.name);
});

test('host admin un-hosts a Collective without balance', async ({ page, scenario }, testInfo) => {
  const { collective } = scenario.accounts;
  await page.goto(scenario.urls.hostedCollectives);
  await hostedCollectiveAction(page, collective.slug, 'unhost');
  await page.locator('textarea#unhost-account-message').fill('Un-hosting this collective');
  await page.getByRole('button', { name: 'Un-host Collective' }).click();
  await expect(page.getByTestId(`collective-${collective.slug}`)).toHaveCount(0);
  isolationProbe(testInfo, 'leave an un-hosted Collective behind and retry on a new host.');

  await page.reload();
  await expect(page.getByTestId('create-collective-btn')).toBeVisible();
  await expect(page.getByTestId(`collective-${collective.slug}`)).toHaveCount(0);
});

test('host admin adds funds to a Collective, which can then no longer be un-hosted', async ({
  page,
  scenario,
}, testInfo) => {
  const { collective } = scenario.accounts;
  await page.goto(scenario.urls.hostedCollectives);
  await hostedCollectiveAction(page, collective.slug, 'add-funds');
  const form = page.getByTestId('add-funds-form');

  // An empty form is refused.
  await page.getByTestId('add-funds-submit-btn').click();
  await expect(form).toContainText('This field is required');

  await page.getByTestId('add-funds-amount').fill('20');
  await page.getByTestId('add-funds-description').fill('E2E test - add funds');
  // The source is a vendor created on the spot. "Create vendor" is disabled while the search runs: clicking it
  // too early did nothing in Cypress, which then submitted without a source.
  await page.locator('#addFunds-fromAccount').click();
  await createVendorInline(page, { name: `Donor ${attemptTag(scenario.attempt)}` }, { picker: 'addFundsSource' });
  await page.getByText('I confirm that').click();
  await page.getByTestId('add-funds-submit-btn').click();
  await expect(page.getByTestId('funds-added')).toContainText('Funds Added ✅');
  isolationProbe(testInfo, 'leave funds on a Collective behind and retry on a new host.');
  await page.getByTestId('add-platform-tip-btn').click();
  await expect(page.getByTestId('funds-added')).toBeHidden();

  await hostedCollectiveAction(page, collective.slug, 'unhost');
  await expect(page.getByText("The Collective's balance must be zero to un-host")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Un-host Collective' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId(`collective-${collective.slug}`)).toBeVisible();
});
