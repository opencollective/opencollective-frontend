import { createHash, randomUUID } from 'crypto';
import { readFileSync } from 'fs';

import type { TestInfo } from '@playwright/test';
import { z } from 'zod';

const envelope = {
  recipe: z.string(),
  attempt: z.object({
    runId: z.string(),
    testId: z.string(),
    retry: z.number(),
    workerIndex: z.number(),
    nonce: z.string(),
  }),
  requestId: z.string(),
};

/** One user administering one unhosted Account. */
const accountScenario = z.object({
  ...envelope,
  account: z.object({ id: z.string(), slug: z.string(), name: z.string() }),
  user: z.object({ id: z.string(), email: z.string(), slug: z.string() }),
  urls: z.object({ profile: z.string(), info: z.string(), conversations: z.string(), newConversation: z.string() }),
  auth: z.object({ token: z.string() }),
});

/**
 * Shared by every multi-party recipe: references keyed by the role label the
 * recipe documents (`actors.submitter`, `accounts.collective`, ...). Each actor
 * carries a private session token; the `actor` option picks who is signed in.
 */
const graphScenario = z.object({
  ...envelope,
  actors: z.record(
    z.object({
      id: z.string(),
      legacyId: z.number(),
      slug: z.string(),
      name: z.string(),
      email: z.string(),
      token: z.string(),
    }),
  ),
  accounts: z.record(
    z.object({ id: z.string(), legacyId: z.number(), slug: z.string(), name: z.string(), type: z.string() }),
  ),
  expenses: z.record(
    z.object({ id: z.string(), legacyId: z.number(), description: z.string(), status: z.string(), url: z.string() }),
  ),
  urls: z.record(z.string()),
});

// Written out rather than inferred: this project compiles without `strict`, where inference makes every field optional.
type Envelope = {
  recipe: string;
  attempt: { runId: string; testId: string; retry: number; workerIndex: number; nonce: string };
  requestId: string;
};
type AccountScenario = Envelope & {
  account: { id: string; slug: string; name: string };
  user: { id: string; email: string; slug: string };
  urls: { profile: string; info: string; conversations: string; newConversation: string };
  auth: { token: string };
};
export type GraphScenario = Envelope & {
  actors: Record<string, { id: string; legacyId: number; slug: string; name: string; email: string; token: string }>;
  accounts: Record<string, { id: string; legacyId: number; slug: string; name: string; type: string }>;
  expenses: Record<string, { id: string; legacyId: number; description: string; status: string; url: string }>;
  urls: Record<string, string>;
};

/** Inputs and result of each named API recipe (`server/e2e` in the API). Add a recipe by adding its entry here and in `schemas`. */
type Contracts = {
  'account-profile': { inputs: { name: string }; scenario: AccountScenario };
  'account-conversation': { inputs: { name: string }; scenario: AccountScenario };
  /**
   * Actors `hostAdmin`, `submitter` (administers nothing unless `payeeOrganization`), optional `invitee`.
   * Accounts `host`, `collective`, optional `collective2`, `organization`. Expenses: optional `prior`.
   * URLs `collective`, `newExpense`, `submittedExpenses`.
   */
  'expense-submission': {
    inputs: {
      collective?: { country: string; vat: { type: 'OWN' | 'HOST'; number: string } };
      secondCollective?: boolean;
      payeeOrganization?: boolean;
      priorExpense?: boolean;
      invitee?: boolean;
    };
    scenario: GraphScenario;
  };
  /**
   * Actors `hostAdmin`, `drafter` (Collective admin), `payeeAdmin`. Accounts `host`, `collective`, `payee`.
   * Expenses: `draft`. URLs: `draft` (the invitation link).
   */
  'expense-draft-invite': {
    inputs: { description: string; currency: 'USD' | 'EUR'; items: Array<{ description: string; amount: number }> };
    scenario: GraphScenario;
  };
};

const schemas: Record<Recipe, z.ZodTypeAny> = {
  'account-profile': accountScenario,
  'account-conversation': accountScenario,
  'expense-submission': graphScenario,
  'expense-draft-invite': graphScenario,
};

type Recipe = keyof Contracts;
export type Inputs<R extends Recipe> = Contracts[R]['inputs'];
export type Scenario<R extends Recipe = Recipe> = Contracts[R]['scenario'];
/** Recipes returning the shared multi-party shape. */
export type GraphRecipe = { [R in Recipe]: Scenario<R> extends GraphScenario ? R : never }[Recipe];

/** One transport per test attempt, with stable request IDs within that attempt. */
export class FixtureRecipes {
  readonly attempt: Scenario['attempt'];
  private readonly token: string;
  readonly endpoint: string;
  /** Wall time of every arrangement in this attempt, for attributable setup timings. */
  readonly timings: Array<{ recipe: Recipe; requestId: string; setupMs: number }> = [];

  constructor(testInfo: TestInfo) {
    const ownerFile = process.env.PLAYWRIGHT_FIXTURE_OWNER_FILE;
    const runId = process.env.PLAYWRIGHT_RUN_ID;
    if (!ownerFile || !runId || !process.env.API_URL) {
      throw new Error('Fixtures require an owned stack. Run test/playwright/run-local.sh (or --reuse).');
    }
    this.token = JSON.parse(readFileSync(ownerFile, 'utf8')).token;
    this.endpoint = `${process.env.API_URL}/e2e/fixtures`;
    this.attempt = {
      runId,
      testId: createHash('sha256').update(testInfo.testId).digest('hex').slice(0, 32),
      retry: testInfo.retry,
      workerIndex: testInfo.workerIndex,
      nonce: randomUUID(),
    };
  }

  async request<R extends Recipe>(recipe: R, inputs: Inputs<R>, requestId: string = recipe) {
    // Node fetch keeps launcher/authentication secrets outside Playwright traces.
    // Retry only transport failures: the same identity recovers the DB receipt.
    const body = JSON.stringify({ attempt: this.attempt, requestId, recipe, inputs });
    for (let tries = 0; ; tries++) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(30_000),
        });
        const content = await response.text();
        return new Response(content, { status: response.status, headers: response.headers });
      } catch {
        if (tries >= 1) {
          throw new Error(
            `Fixture transport failed for ${recipe}/${requestId}; retry the same request identity to recover committed setup.`,
          );
        }
      }
    }
  }

  async arrange<R extends Recipe>(recipe: R, inputs: Inputs<R>, requestId: string = recipe): Promise<Scenario<R>> {
    const startedAt = performance.now();
    const response = await this.request(recipe, inputs, requestId);
    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(
        `Fixture ${recipe}/${requestId}: ${error?.code || response.status}: ${error?.message || 'Setup failed'}`,
      );
    }
    const parsed = schemas[recipe].safeParse(await response.json());
    if (
      !parsed.success ||
      parsed.data.recipe !== recipe ||
      parsed.data.requestId !== requestId ||
      JSON.stringify(parsed.data.attempt) !== JSON.stringify(this.attempt)
    ) {
      throw new Error('Fixture response does not match the typed recipe contract. Rebuild the companion API.');
    }
    this.timings.push({ recipe, requestId, setupMs: Math.round(performance.now() - startedAt) });
    return parsed.data as Scenario<R>;
  }
}
