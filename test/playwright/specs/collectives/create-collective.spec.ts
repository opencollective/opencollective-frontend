import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { attemptTag } from '../../helpers/attempt';

// A signed-up user (who already administers a Collective, `scenario.accounts.collective`) on the creation form.
const test = scenarioTest('collective-admin', { inputs: {}, actor: 'admin' });

async function fillCollectiveForm(page: Page, { name, description }: { name: string; description: string }) {
  await page.goto('/create');
  await page.getByTestId('ccf-category-picker-button-community').click();
  await page.getByTestId('ccf-form-name').locator('input').fill(name);
  await page.getByTestId('ccf-form-description').locator('input, textarea').fill(description);
}

async function submitCollectiveForm(page: Page) {
  // The terms checkbox can be reset by a late re-render of the form: tick it until it holds.
  const terms = page.getByRole('button', { name: /I agree with the terms of service/ }).locator('input[type=checkbox]');
  await expect(async () => {
    if (!(await terms.isChecked())) {
      await page.getByTestId('custom-checkbox').click();
    }
    await expect(terms).toBeChecked({ timeout: 1_000 });
  }).toPass();
  await page.getByTestId('ccf-form-submit').click();
}

const slugInput = (page: Page) => page.getByTestId('ccf-form-slug').first().locator('input');

test('user creates a Collective and lands on its onboarding', async ({ page, scenario }) => {
  const tag = attemptTag(scenario.attempt);
  await fillCollectiveForm(page, { name: `Bees are neat ${tag}`, description: 'We are going to save the bees' });
  // The address is suggested from the name.
  await expect(slugInput(page)).toHaveValue(`bees-are-neat-${tag}`);
  await submitCollectiveForm(page);
  await expect(page).toHaveURL(new RegExp(`/bees-are-neat-${tag}/onboarding(\\?|$)`));
});

test('an address already taken by another Account is refused', async ({ page, scenario }) => {
  await fillCollectiveForm(page, { name: 'Bees are neat', description: 'I just really like them' });
  await slugInput(page).fill(scenario.accounts.collective.slug);
  await submitCollectiveForm(page);
  await expect(page.getByTestId('ccf-error-message')).toContainText(
    'An account already exists for this URL, please choose another one.',
  );
});

test('the tags chosen at creation are shown on the new Collective page', async ({ page, scenario }) => {
  const tag = attemptTag(scenario.attempt);
  const slug = `bees-are-vicious-${tag}`;
  const customTag = `tag-${tag}`;
  await fillCollectiveForm(page, { name: `Bees are vicious ${tag}`, description: 'I do not like them' });
  await page.getByTestId('tags-select').click();
  await page.getByTestId('tags-select-option-meetup').click();
  // New tags can be created once the search for matching ones has answered.
  await page.getByTestId('tags-select-input').pressSequentially(customTag);
  await page.getByTestId(`tags-select-option-${customTag}`).click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('ccf-form-tags')).toContainText(customTag);
  await submitCollectiveForm(page);
  await expect(page).toHaveURL(new RegExp(`/${slug}/onboarding(\\?|$)`));

  await page.goto(`/${slug}`);
  const tags = page.getByTestId('collective-tags');
  await expect(tags).toContainText(customTag);
  await expect(tags).toContainText('meetup');
  await expect(tags).toContainText('COLLECTIVE');
});
