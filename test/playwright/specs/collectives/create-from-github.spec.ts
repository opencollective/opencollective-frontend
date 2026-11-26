import { expect, scenarioTest } from '../../fixtures';
import { attemptTag } from '../../helpers/attempt';

// Any signed-up user can apply to Open Collective's open source host with one of their GitHub repositories.
const test = scenarioTest('collective-admin', { inputs: {}, actor: 'admin' });

test('user picks a GitHub repository and creates its Collective with Open Source Collective', async ({
  page,
  scenario,
}) => {
  // GitHub stays stubbed, as in Cypress: the browser gets a repository list from the frontend's GitHub route and
  // the API accepts the `foofoo` token for test users. The repository name is unique to the attempt, since it
  // becomes the new Collective's address.
  const repository = `pw-repo-${attemptTag(scenario.attempt)}`;
  await page.route('**/api/ecosystems/repository*', route =>
    route.fulfill({ status: 404, json: { error: { message: 'Not found' } } }),
  );
  await page.route('**/api/github-repositories*', route =>
    route.fulfill({
      json: [
        {
          description: 'Adblock Plus browser extension',
          fork: true,
          // eslint-disable-next-line camelcase -- GitHub's field names
          full_name: `testuseradmingithub/${repository}`,
          name: repository,
          owner: { login: 'testuseradmingithub', type: 'Organization' },
          // eslint-disable-next-line camelcase -- GitHub's field names
          stargazers_count: 113,
        },
      ],
    }),
  );

  await page.goto('/opensource/apply/pick-repo?token=foofoo');
  await expect(page.getByTestId('connect-github-header')).toContainText('Pick a repository');
  await page.getByTestId('radio-select').first().check();
  await page.getByTestId('connect-github-continue').click();

  await page.getByTestId('ccf-form-description').fill('Blocks some ads');
  await page.getByTestId('ccf-form-message').fill('We need to gather some money');
  await page.getByTestId('ccf-form-submit').click();
  await expect(page.getByTestId('ccf-form')).toContainText('This must be checked');
  await page.getByTestId('checkbox-termsOfServiceOC').click();
  await page.getByTestId('ccf-form-submit').click();
  await expect(page).toHaveURL(new RegExp(`/${repository}/onboarding`));
});
