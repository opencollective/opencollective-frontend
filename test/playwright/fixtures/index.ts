import { test as base } from '@playwright/test';

import { LOCAL_STORAGE_KEYS } from '../../../lib/local-storage';

import { FixtureRecipes, type GraphRecipe, type GraphScenario, type Inputs, type Scenario } from './transport';

export { expect } from '@playwright/test';

type AccountRecipe = 'account-profile' | 'account-conversation';

/** Committed references and attempt metadata only: authentication handles stay out of evidence. */
const withoutCredentials = (scenario: Scenario) =>
  JSON.stringify(scenario, (key, value) => (key === 'token' || key === 'auth' ? undefined : value), 2);

const authored = base.extend<{ recipes: FixtureRecipes; session: string | null }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright declares fixture dependencies through destructuring.
  recipes: async ({}, provide, testInfo) => {
    const recipes = new FixtureRecipes(testInfo);
    await provide(recipes);
    // Lets reports separate fixture setup from browser execution for each attempt.
    await testInfo.attach('fixture-timings', {
      body: JSON.stringify(recipes.timings),
      contentType: 'application/json',
    });
  },
  /** Session token the browser starts with; `null` starts logged out. Derived by the test flavours below. */
  session: null,
  storageState: async ({ session, baseURL }, provide) => {
    await provide({
      cookies: [],
      origins: session
        ? [
            {
              origin: new URL(baseURL).origin,
              localStorage: [{ name: LOCAL_STORAGE_KEYS.ACCESS_TOKEN, value: session }],
            },
          ]
        : [],
    });
  },
});

/** Journeys of one user administering one unhosted Account; select the recipe with `test.use({ recipe })`. */
export const test = authored.extend<{ recipe: AccountRecipe; scenario: Scenario<AccountRecipe> }>({
  recipe: ['account-profile', { option: true }],
  scenario: async ({ recipes, recipe }, provide, testInfo) => {
    const scenario = await recipes.arrange(recipe, {
      name: `Playwright ${recipe} ${recipes.attempt.nonce.slice(0, 8)}`,
    });
    await testInfo.attach('scenario', { body: withoutCredentials(scenario), contentType: 'application/json' });
    await provide(scenario);
  },
  session: async ({ scenario }, provide) => {
    await provide(scenario.auth.token);
  },
});

/**
 * Journeys over a multi-party recipe. Each attempt arranges `inputs` once and
 * starts signed in as `actor` (a label from `scenario.actors`), or logged out
 * when `actor` is `null`. Override either per file or describe block with
 * `test.use({ inputs, actor })`.
 */
export const scenarioTest = <R extends GraphRecipe>(recipe: R, defaults: { inputs: Inputs<R>; actor: string | null }) =>
  authored.extend<{ inputs: Inputs<R>; actor: string | null; scenario: GraphScenario }>({
    // `never`: Playwright cannot tell an option value from a fixture function while R is still generic.
    inputs: [defaults.inputs as never, { option: true }],
    actor: [defaults.actor, { option: true }],
    scenario: async ({ recipes, inputs }, provide, testInfo) => {
      const scenario: GraphScenario = await recipes.arrange(recipe, inputs);
      await testInfo.attach('scenario', { body: withoutCredentials(scenario), contentType: 'application/json' });
      await provide(scenario);
    },
    session: async ({ scenario, actor }, provide) => {
      if (actor !== null && !scenario.actors[actor]) {
        throw new Error(`Recipe ${recipe} arranged no actor "${actor}" (${Object.keys(scenario.actors).join(', ')}).`);
      }
      await provide(actor === null ? null : scenario.actors[actor].token);
    },
  });
