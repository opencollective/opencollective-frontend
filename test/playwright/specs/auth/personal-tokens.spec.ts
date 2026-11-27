import type { Locator, Page } from '@playwright/test';
import dayjs from 'dayjs';

import { expect, scenarioTest } from '../../fixtures';
import { completeTwoFactorPrompt, newTotpSecret, totpCode } from '../../helpers/auth';
import { toast } from '../../helpers/notifications';

const test = scenarioTest('individual', { inputs: {}, actor: 'user' });

const inDays = (days: number) => dayjs().add(days, 'day').format('YYYY-MM-DD');

/** Fills a token form: name, scopes added to the selected ones, expiry date. */
async function fillToken(
  page: Page,
  form: Locator,
  { name, scopes, expiresAt }: { name: string; scopes: string[]; expiresAt: string },
) {
  await form.locator('input[name=name]').fill(name);
  await form.getByTestId('personal-token-scope').click();
  for (const scope of scopes) {
    await page.keyboard.type(scope);
    await page.keyboard.press('Enter');
  }
  await form.locator('input[name=expiresAt]').fill(expiresAt);
}

async function submitNewToken(page: Page, token: { name: string; scopes: string[]; expiresAt: string }) {
  await page.getByTestId('create-personal-token-btn').click();
  const modal = page.getByTestId('create-personal-token-modal');
  await fillToken(page, modal, token);
  await modal.locator('button[type=submit]').click();
}

const openSettings = (page: Page, name: string) =>
  page.getByTestId('personal-token').filter({ hasText: name }).getByRole('link', { name: 'Settings' }).click();

test('user creates, edits, lists and deletes personal tokens', async ({ page, scenario }) => {
  await page.goto(scenario.urls.forDevelopers);
  const list = page.getByTestId('personal-tokens-list');
  await expect(list).toContainText("You don't have any tokens yet");

  await submitNewToken(page, { name: 'My first token', scopes: ['host', 'transactions'], expiresAt: inDays(1) });
  await expect(toast(page, 'Personal token "My first token" created')).toBeVisible();
  const settings = page.getByTestId('personal-token-settings');
  await expect(settings.locator('h3')).toHaveText('My first token');
  await expect(page.getByTestId('personalToken-token')).toBeVisible();
  await page.getByTestId('go-back-link').click();
  await expect(list).toContainText('My first token');

  await openSettings(page, 'My first token');
  await fillToken(page, settings, { name: 'My first token (edited)', scopes: ['email'], expiresAt: inDays(2) });
  await settings.locator('button[type=submit]').click();
  await expect(toast(page, 'Personal token "My first token (edited)" updated')).toBeVisible();
  await page.getByTestId('go-back-link').click();
  await expect(page.getByTestId('personal-token')).toContainText('My first token (edited)');

  await submitNewToken(page, { name: 'My second token', scopes: ['host', 'account'], expiresAt: inDays(1) });
  await expect(toast(page, 'Personal token "My second token" created')).toBeVisible();
  await expect(page.getByTestId('personalToken-token')).toBeVisible();
  await page.getByTestId('go-back-link').click();
  // Newest first
  const tokens = page.getByTestId('personal-token');
  await expect(tokens).toHaveCount(2);
  await expect(tokens.first()).toContainText('My second token');
  await expect(tokens.last()).toContainText('My first token (edited)');

  await openSettings(page, 'My second token');
  await page.getByTestId('personalToken-delete').click();
  await page.getByTestId('confirmation-modal-continue').click();
  await expect(toast(page, 'Personal token "My second token" deleted')).toBeVisible();
  await expect(list).toBeVisible();
  await expect(tokens).toHaveCount(1);
  await expect(tokens.first()).toContainText('My first token (edited)');
});

test.describe('with two-factor authentication', () => {
  const secret = newTotpSecret();
  test.use({ inputs: { twoFactorSecret: secret } });

  test('creating a personal token asks for the authenticator code', async ({ page, scenario }) => {
    const name = 'My first token with 2fa';
    await page.goto(scenario.urls.forDevelopers);
    await submitNewToken(page, { name, scopes: ['host', 'transactions'], expiresAt: inDays(1) });
    await completeTwoFactorPrompt(page, totpCode(secret));
    await expect(toast(page, `Personal token "${name}" created`)).toBeVisible();
    await expect(page.getByTestId('personalToken-token')).toBeVisible();
    await expect(page.getByTestId('personal-token-settings').locator('h3')).toHaveText(name);
    await page.getByTestId('go-back-link').click();
    await expect(page.getByTestId('personal-tokens-list')).toContainText(name);
  });
});
