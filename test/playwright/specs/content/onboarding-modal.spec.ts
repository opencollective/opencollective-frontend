import { expect, test } from '../../fixtures';
import { attemptTag } from '../../helpers/attempt';

const socialLinks = [
  'https://opencollective.com/testCollective',
  'https://twitter.com/testCollective',
  'https://github.com/testCollective',
];

// The recipe's Account is unused: only its signed-in user matters, who creates a new Collective.
test('user creates a Collective and completes it through the onboarding modal', async ({ page, recipes, mail }) => {
  const tag = attemptTag(recipes.attempt);
  const slug = `pw-onboarding-${tag}`;
  await page.goto('/create/community');
  await page.locator('input[name="name"]').fill(`New collective ${tag}`);
  await page.locator('input[name="slug"]').fill(slug);
  await page.locator('input[name="description"]').fill('short description for new collective');
  await page.getByTestId('custom-checkbox').click();
  await page.locator('button[type="submit"]').click();

  await expect(page.getByTestId('onboarding-collective-created')).toContainText(
    `New collective ${tag} has been created!`,
  );
  await page.getByTestId('step-forward-button').click();

  // Admins: the creator only, then an invited new user who is removed again.
  const admins = page.getByTestId('profile-card').locator('> *');
  await expect(admins).toHaveCount(1);
  await page.getByTestId('admin-picker').click();
  // The invitation button sits in a picker entry marked as disabled: check it is shown, then click it anyway.
  const inviteUser = page.getByTestId('collective-type-picker-USER');
  await expect(inviteUser).toBeVisible();
  await inviteUser.click({ force: true });
  const miniForm = page.getByTestId('create-collective-mini-form');
  await miniForm.locator('input[name="email"]').fill(mail.address('invited-admin'));
  await miniForm.locator('input[name="name"]').fill('AmazingNewUser');
  await miniForm.locator('button[type="submit"]').click();
  await expect(admins).toHaveCount(2);
  await expect(page.getByTestId('name-of-admins').filter({ hasText: 'AmazingNewUser' })).toBeVisible();
  await page.getByTestId('remove-user').locator('> button').click();
  await expect(admins).toHaveCount(1);
  await page.getByTestId('step-forward-button').click();

  for (const link of socialLinks) {
    await page.getByRole('button', { name: 'Add social link' }).click();
    await expect(page.getByTestId('social-link-inputs')).toBeVisible();
    await page.keyboard.type(link);
  }
  await page.getByTestId('finish-button').click();
  await expect(page.getByTestId('welcome-collective')).toContainText('Welcome to your new Collective!');
  await page.getByTestId('close-button').click();
  await expect(page.getByTestId('welcome-collective')).toHaveCount(0);

  await expect(page).toHaveURL(new RegExp(`/${slug}`));
  const links = page.locator('a[rel~="me"]');
  for (const [index, link] of socialLinks.entries()) {
    await expect(links.nth(index)).toHaveAttribute('href', link);
  }
});
