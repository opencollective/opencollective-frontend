import { test as base } from '@playwright/test';

import { LOCAL_STORAGE_KEYS } from '../../../lib/local-storage';

import { FixtureRecipes, type Recipe, type Scenario } from './transport';

export { expect } from '@playwright/test';

export const test = base.extend<{ recipes: FixtureRecipes; recipe: Recipe; scenario: Scenario }>({
  recipe: ['account-profile', { option: true }],
  // eslint-disable-next-line no-empty-pattern -- Playwright declares fixture dependencies through destructuring.
  recipes: async ({}, provide, testInfo) => {
    await provide(new FixtureRecipes(testInfo));
  },
  scenario: async ({ recipes, recipe }, provide, testInfo) => {
    const scenario = await recipes.arrange(recipe, {
      name: `Playwright ${recipe} ${recipes.attempt.nonce.slice(0, 8)}`,
    });
    // Only committed references are attached. Authentication handles stay private.
    await testInfo.attach('scenario', {
      body: JSON.stringify(
        {
          attempt: scenario.attempt,
          requestId: scenario.requestId,
          account: scenario.account,
          user: scenario.user,
          urls: scenario.urls,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
    await provide(scenario);
  },
  storageState: async ({ scenario, baseURL }, provide) => {
    await provide({
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [{ name: LOCAL_STORAGE_KEYS.ACCESS_TOKEN, value: scenario.auth.token }],
        },
      ],
    });
  },
});
