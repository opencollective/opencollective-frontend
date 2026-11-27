import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';
import { memberInvitation } from '../../helpers/mail';
import { toast } from '../../helpers/notifications';

// The admin of a hosted Collective with the default tiers, in its dashboard.
const test = scenarioTest('collective-admin', { inputs: {}, actor: 'admin' });

/** A choice of one of the product's select inputs, by the text of the option. */
const chooseOption = async (page: Page, select: string, option: string) => {
  await page.getByTestId(select).click();
  await page.getByTestId('select-option').filter({ hasText: option }).first().click();
};

test('admin invites a new user as admin, who signs up and accepts', async ({
  page,
  scenario,
  mail,
  openBrowserAs,
}, testInfo) => {
  const { collective } = scenario.accounts;
  const inviteeEmail = mail.address('invitee');
  await page.goto(scenario.urls.info);
  await page.getByTestId('menu-item-team').click();
  await page.getByTestId('invite-member-btn').click();

  // The invited person has no account yet: create them inline from the picker.
  await page.getByTestId('member-collective-picker').click();
  // The button works, but sits in a list entry that is marked as disabled, which Playwright would wait out.
  const newUserButton = page.getByTestId('collective-type-picker-USER');
  await expect(newUserButton).toBeVisible();
  await newUserButton.click({ force: true });
  const newUser = page.getByTestId('create-collective-mini-form');
  await newUser.locator('input[name="email"]').fill(inviteeEmail);
  await newUser.locator('input[name="name"]').fill('AmazingNewUser');
  await newUser.locator('button[type="submit"]').click();
  await expect(newUser).toHaveCount(0);
  // The role picker's own input sits outside the viewport: open it from the keyboard.
  await page.locator('#memberForm-role').focus();
  await page.keyboard.press('ArrowDown');
  await page.getByTestId('select-option').filter({ hasText: 'Admin' }).first().click();
  await page.getByTestId('confirmation-modal-continue').click();
  const members = page.getByTestId('members-table');
  await expect(members.getByText('Pending', { exact: true })).toBeVisible();
  isolationProbe(testInfo, 'leave a pending invitation behind and retry on a Collective without one.');

  const invitation = await memberInvitation(mail, { to: inviteeEmail, account: collective });
  expect(invitation.text).toContain(
    `${scenario.actors.admin.name} just invited you to the role of Administrator of ${collective.name} on Open Collective`,
  );

  // The invitation can be sent again.
  await members.getByTestId('member-actions-btn').first().click({ force: true });
  await page.getByTestId('resend-invite-btn').click({ force: true });
  await mail.waitForMessageCount({ to: inviteeEmail, subject: `Invitation to join ${collective.name}`, count: 2 });

  // The invitee follows the link in a browser of their own, signs up and accepts.
  const invitee = await openBrowserAs(null);
  await invitee.goto(invitation.link);
  await expect(invitee).toHaveURL(/\/signin/);
  await invitee.locator('input[name=email]').fill(inviteeEmail);
  await invitee.locator('button[type=submit]').click();
  await expect(invitee).toHaveURL(/\/signup\/profile/);
  const profile = invitee.getByTestId('complete-profile-form');
  await profile.locator('input[name="name"]').fill('AmazingNewUser');
  await profile.locator('button[type="submit"]').click();
  await expect(invitee.getByTestId('member-invitation-card')).toContainText(collective.name);
  await invitee.getByTestId('member-invitation-accept-btn').click();
  await expect(invitee).toHaveURL(new RegExp(`/dashboard/${collective.slug}$`));

  // The admin sees the invitation accepted.
  await page.reload();
  await expect(members).toContainText('AmazingNewUser');
  await expect(members.getByText('Pending', { exact: true })).toHaveCount(0);
});

test('admin edits the name, description and social links of the Collective', async ({ page, scenario }) => {
  const links = [
    'https://opencollective.com/',
    'https://twitter.com/opencollective',
    'https://github.com/opencollective',
  ];
  await page.goto(scenario.urls.info);
  await page.locator('input[name="name"]').fill(`${scenario.accounts.collective.name} edited`);
  await page.locator('input[name="description"]').fill('Description edited');
  for (const link of links) {
    await page.getByRole('button', { name: 'Add social link' }).click();
    await page.keyboard.type(link);
  }
  await page.getByTestId('save').click();
  await page.getByTestId('public-profile-link').click();

  await expect(page.getByTestId('collective-hero').getByTestId('collective-title')).toHaveText(
    `${scenario.accounts.collective.name} edited`,
  );
  for (const [index, link] of links.entries()) {
    await expect(page.getByTestId(`social-link-${index}`)).toHaveAttribute('href', link);
  }
});

test('admin creates, edits and deletes a tier', async ({ page, scenario }, testInfo) => {
  await page.goto(scenario.urls.info);
  await page.getByTestId('menu-item-tiers').click();
  const tiers = page.getByTestId('contribute-card-tier');
  await expect(tiers).toHaveCount(2);

  // A product needs a name and an amount.
  await page.getByTestId('create-contribute-tier').click();
  await page.getByTestId('confirm-btn').click();
  expect(
    await page.locator('input[name="name"]').evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBe(true);
  await chooseOption(page, 'select-type', 'Product');
  await page.getByTestId('name').fill('Tshirt');
  await page.getByTestId('description').fill('Made with love');
  await page.getByTestId('confirm-btn').click();
  await expect(page.getByTestId('edit-tier-modal-form')).toContainText('This field is required');
  await page.locator('input[data-cy=amount]').fill('25.00');
  await page.locator('input[data-cy=maxQuantity]').fill('100');
  await page.locator('input[data-cy=button]').fill('Buy it!');
  await page.getByTestId('confirm-btn').click();
  await expect(toast(page, 'Tier created.')).toBeVisible();
  isolationProbe(testInfo, 'leave a third tier behind and retry on a Collective with the two default tiers.');
  await expect(tiers).toHaveCount(3);
  const tshirt = tiers.last();
  await expect(tshirt).toContainText('Tshirt');
  await expect(tshirt).toContainText('LIMITED: 100 LEFT OUT OF 100');
  await expect(tshirt).toContainText('Made with love');
  await expect(tshirt).toContainText('$25 USD');

  // A flexible amount without default or minimum shows no amount.
  await tshirt.getByRole('button').click();
  await page.getByTestId('name').fill('Potatoes');
  await page.getByTestId('description').fill('Made with love!');
  await chooseOption(page, 'amountType', 'Flexible');
  await page.locator('[data-testid=currency1-input-amount]').fill('25');
  await page.locator('[data-testid=currency2-input-amount]').fill('50');
  await page.getByTestId('confirm-btn').click();
  await expect(toast(page, 'Tier updated.')).toBeVisible();
  await expect(tiers.last()).toContainText('Potatoes');
  await expect(tiers.last()).toContainText('LIMITED: 100 LEFT OUT OF 100');
  await expect(tiers.last()).toContainText('Made with love!');
  await expect(tiers.last()).not.toContainText('$25 USD');

  await tiers.last().getByRole('button').click();
  await page.getByTestId('delete-btn').click();
  await page.getByTestId('confirm-delete-btn').click();
  await expect(toast(page, 'Tier deleted.')).toBeVisible();
  await expect(tiers).toHaveCount(2);
});

test('admin of a Collective in Belgium enables VAT, which applies to its products', async ({ page, scenario }) => {
  await page.goto(scenario.urls.info);
  // The address search is Google's live autocomplete, as in Cypress.
  await page.locator('input[id=geosuggest__input]').fill('Belgium');
  await page.locator('.geosuggest__suggests > :nth-child(1)', { hasText: 'Belgium' }).click();
  await chooseOption(page, 'VAT', 'Use my own VAT number');
  const vatNumber = page.locator('input[name="settings.VAT.number"]');
  // The form re-renders once the country's tax settings arrive, which can drop what was typed: type it again.
  await expect(async () => {
    await vatNumber.fill('EU123456789');
    await expect(vatNumber).toHaveValue('EU123456789', { timeout: 1_000 });
  }).toPass();
  await page.getByTestId('save').click();
  await expect(toast(page, 'Account updated')).toBeVisible();

  // Through the menu: a settings page opened by its address after the dashboard can stay on its loading indicator.
  await page.getByTestId('menu-item-tiers').click();
  await page.getByTestId('contribute-card-tier').first().getByRole('button').click();
  await chooseOption(page, 'select-type', 'Product');
  await expect(page.getByTestId('edit-tier-modal-form')).toContainText('Value-added tax (VAT): 21%');
});
