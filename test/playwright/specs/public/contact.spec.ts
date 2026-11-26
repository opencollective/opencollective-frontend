import { expect, scenarioTest } from '../../fixtures';

/**
 * `collective` is an active hosted Collective administered by `hostAdmin`; `submitter` has no role on it and also
 * administers `organization`.
 */
const test = scenarioTest('expense-submission', { inputs: { payeeOrganization: true }, actor: 'submitter' });

const contactUrl = (account: { slug: string }) => `/${account.slug}/contact`;

test.describe('logged out', () => {
  test.use({ actor: null });

  test('visitor must sign in to contact a Collective', async ({ page, scenario }) => {
    await page.goto(contactUrl(scenario.accounts.collective));
    await expect(page.getByText('You need to be logged in to continue.')).toBeVisible();
    await expect(page.getByTestId('message')).toHaveCount(0);
  });
});

test('user sends a message that reaches the Collective admins', async ({ page, scenario, mail }) => {
  const { collective } = scenario.accounts;
  const subject = `Hello ${collective.slug}`;
  await page.goto(contactUrl(collective));
  await expect(
    page.getByText('Your email address will be shared with the admins who will receive this message.'),
  ).toBeVisible();
  await page.getByTestId('subject').fill(subject);
  await page.getByTestId('message').fill('Hello');
  // Too short to be sent.
  await expect(page.getByTestId('submit')).toBeDisabled();
  await page.getByTestId('message').fill('Hello Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
  await page.getByTestId('submit').click();
  await expect(page.getByText('Message sent').first()).toBeVisible();

  const message = await mail.waitForMessage({
    to: scenario.actors.hostAdmin.email,
    subject: `New message from ${scenario.actors.submitter.name} on Open Collective: ${subject}`,
  });
  expect(message.html).toContain('Lorem ipsum dolor sit amet');
});

test('user cannot contact an Organization or an inactive Collective', async ({ page, scenario, recipes }) => {
  const notAllowed = page.getByText("This Collective can't be contacted via Open Collective.");
  await page.goto(contactUrl(scenario.accounts.organization));
  await expect(notAllowed).toBeVisible();
  await expect(page.getByTestId('message')).toHaveCount(0);

  // An unhosted, hence inactive, Collective that the signed-in submitter does not administer.
  const { account: inactive } = await recipes.arrange(
    'account-profile',
    { name: `Inactive ${scenario.accounts.collective.slug}` },
    'inactive-collective',
  );
  await page.goto(contactUrl(inactive));
  await expect(notAllowed).toBeVisible();
  await expect(page.getByTestId('message')).toHaveCount(0);
});
