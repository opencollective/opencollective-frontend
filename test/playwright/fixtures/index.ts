import { type BrowserContext, type Page, test as base } from '@playwright/test';

import { LOCAL_STORAGE_KEYS } from '../../../lib/local-storage';

import { attemptTag } from '../helpers/attempt';
import { Mailbox } from '../helpers/mail';

import {
  FixtureRecipes,
  type GraphRecipe,
  type GraphScenario,
  type Inputs,
  type Scenario,
  scenarioEvidence,
} from './transport';

export { expect } from '@playwright/test';

type AccountRecipe = 'account-profile' | 'account-conversation';

/**
 * Session cookies as the API sets them at sign-in (`setAuthCookie`): the token's header and payload, and its
 * signature in an HTTP-only cookie. Requests that bypass the GraphQL client, such as protected file content
 * through `/api/files`, authenticate with these.
 */
const sessionCookies = (session: string, baseURL: string) => {
  const [header, payload, signature] = session.split('.');
  const common = { domain: new URL(baseURL).hostname, path: '/', expires: -1, secure: true, sameSite: 'Lax' as const };
  return [
    { ...common, name: 'accessTokenPayload', value: `${header}.${payload}`, httpOnly: false },
    { ...common, name: 'accessTokenSignature', value: signature, httpOnly: true },
  ];
};

type Cookie = ReturnType<typeof sessionCookies>[number];

/** Tag of journeys that pay through live Stripe test mode: see "Live Stripe journeys" in docs/e2e.md. */
export const STRIPE_TAG = '@stripe';

/** Browser storage of a visitor signed in with this session token, or of a logged-out visitor. */
const storageFor = (session: string | null, baseURL: string, extraCookies: Cookie[] = []) => ({
  cookies: [...(session ? sessionCookies(session, baseURL) : []), ...extraCookies],
  origins: session
    ? [{ origin: new URL(baseURL).origin, localStorage: [{ name: LOCAL_STORAGE_KEYS.ACCESS_TOKEN, value: session }] }]
    : [],
});

const authored = base.extend<{
  recipes: FixtureRecipes;
  session: string | null;
  mail: Mailbox;
  stripeCookies: Cookie[];
}>({
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
  /**
   * For tests tagged `@stripe`: the cookie that makes the Stripe objects the API creates for this attempt its
   * own, so the webhooks about them reach the handlers. Retires the attempt afterwards (its late events are
   * then dropped) and attaches what it owned. Fails when the launcher did not verify live Stripe.
   */
  stripeCookies: async ({ recipes, baseURL }, provide, testInfo) => {
    if (!testInfo.tags.includes(STRIPE_TAG)) {
      await provide([]);
      return;
    }
    if (process.env.PLAYWRIGHT_STRIPE !== 'verified') {
      throw new Error(
        `${STRIPE_TAG} journeys need live Stripe test mode, which the launcher did not verify ` +
          `(PLAYWRIGHT_STRIPE=${process.env.PLAYWRIGHT_STRIPE || 'unset'}). Run them through npm run e2e with ` +
          'STRIPE_WEBHOOK_KEY and the Stripe CLI (docs/e2e.md, "Live Stripe journeys").',
      );
    }
    // A live provider answers every step, and a webhook decides the outcome: give them twice the time
    testInfo.setTimeout(testInfo.timeout * 2);
    const { hostname } = new URL(baseURL);
    await provide([
      {
        name: 'oc_e2e_attempt',
        value: recipes.stripeAttemptCookie,
        domain: hostname,
        path: '/',
        expires: -1,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    const ownership = await recipes.retireStripeAttempt();
    await testInfo.attach('stripe-ownership', {
      body: JSON.stringify(ownership, null, 2),
      contentType: 'application/json',
    });
  },
  storageState: async ({ session, baseURL, stripeCookies }, provide) => {
    await provide(storageFor(session, baseURL, stripeCookies));
  },
  /** This attempt's view of the shared inbox: see `helpers/mail.ts`. */
  mail: async ({ recipes }, provide, testInfo) => {
    const mail = new Mailbox(recipes.attempt.nonce);
    await provide(mail);
    if (mail.timings.length) {
      // Delivery waits, so reports can tell waiting for mail from driving the browser.
      await testInfo.attach('mail-timings', { body: JSON.stringify(mail.timings), contentType: 'application/json' });
    }
  },
});

/** Journeys of one user administering one unhosted Account; select the recipe with `test.use({ recipe })`. */
export const test = authored.extend<{ recipe: AccountRecipe; scenario: Scenario<AccountRecipe> }>({
  recipe: ['account-profile', { option: true }],
  scenario: async ({ recipes, recipe }, provide, testInfo) => {
    const scenario = await recipes.arrange(recipe, {
      name: `Playwright ${recipe} ${attemptTag(recipes.attempt)}`,
    });
    await testInfo.attach('scenario', {
      body: JSON.stringify(scenarioEvidence(scenario), null, 2),
      contentType: 'application/json',
    });
    await provide(scenario);
  },
  session: async ({ scenario }, provide) => {
    await provide(scenario.auth.token);
  },
});

const sessionOf = (recipe: string, scenario: GraphScenario, actor: string | null) => {
  if (actor !== null && !scenario.actors[actor]) {
    throw new Error(`Recipe ${recipe} arranged no actor "${actor}" (${Object.keys(scenario.actors).join(', ')}).`);
  }
  return actor === null ? null : scenario.actors[actor].token;
};

/**
 * Journeys over a multi-party recipe. Each attempt arranges `inputs` once and
 * starts signed in as `actor` (a label from `scenario.actors`), or logged out
 * when `actor` is `null`. Override either per file or describe block with
 * `test.use({ inputs, actor })`.
 */
export const scenarioTest = <R extends GraphRecipe>(recipe: R, defaults: { inputs: Inputs<R>; actor: string | null }) =>
  authored.extend<{
    inputs: Inputs<R>;
    actor: string | null;
    scenario: GraphScenario;
    /**
     * Opens a separate browser for another party of the scenario (a label from
     * `scenario.actors`), or for a logged-out visitor with `null`. It shares
     * nothing with `page` and closes with the attempt.
     */
    openBrowserAs: (actor: string | null) => Promise<Page>;
  }>({
    // `never`: Playwright cannot tell an option value from a fixture function while R is still generic.
    inputs: [defaults.inputs as never, { option: true }],
    actor: [defaults.actor, { option: true }],
    scenario: async ({ recipes, inputs }, provide, testInfo) => {
      const scenario: GraphScenario = await recipes.arrange(recipe, inputs);
      await testInfo.attach('scenario', {
        body: JSON.stringify(scenarioEvidence(scenario), null, 2),
        contentType: 'application/json',
      });
      await provide(scenario);
    },
    session: async ({ scenario, actor }, provide) => {
      await provide(sessionOf(recipe, scenario, actor));
    },
    openBrowserAs: async ({ browser, scenario, baseURL, stripeCookies }, provide) => {
      const contexts: BrowserContext[] = [];
      await provide(async actor => {
        const context = await browser.newContext({
          storageState: storageFor(sessionOf(recipe, scenario, actor), baseURL, stripeCookies),
        });
        contexts.push(context);
        return context.newPage();
      });
      await Promise.all(contexts.map(context => context.close()));
    },
  });
