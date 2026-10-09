import { createHash, randomUUID } from 'crypto';
import { readFileSync } from 'fs';

import type { TestInfo } from '@playwright/test';
import { z } from 'zod';

const recipes = ['account-profile', 'account-conversation'] as const;
const scenarioSchema = z.object({
  recipe: z.enum(recipes),
  attempt: z.object({
    runId: z.string(),
    testId: z.string(),
    retry: z.number(),
    workerIndex: z.number(),
    nonce: z.string(),
  }),
  requestId: z.string(),
  account: z.object({ id: z.string(), slug: z.string(), name: z.string() }),
  user: z.object({ id: z.string(), email: z.string(), slug: z.string() }),
  urls: z.object({ profile: z.string(), info: z.string(), conversations: z.string(), newConversation: z.string() }),
  auth: z.object({ token: z.string() }),
});

export type Scenario = z.infer<typeof scenarioSchema>;
export type Recipe = Scenario['recipe'];

/** One transport per test attempt, with stable request IDs within that attempt. */
export class FixtureRecipes {
  readonly attempt: Scenario['attempt'];
  private readonly token: string;
  readonly endpoint: string;

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

  async request(recipe: Recipe, inputs: { name: string }, requestId: string = recipe) {
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

  async arrange(recipe: Recipe, inputs: { name: string }, requestId: string = recipe): Promise<Scenario> {
    const response = await this.request(recipe, inputs, requestId);
    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(
        `Fixture ${recipe}/${requestId}: ${error?.code || response.status}: ${error?.message || 'Setup failed'}`,
      );
    }
    const parsed = scenarioSchema.safeParse(await response.json());
    if (
      !parsed.success ||
      parsed.data.recipe !== recipe ||
      parsed.data.requestId !== requestId ||
      JSON.stringify(parsed.data.attempt) !== JSON.stringify(this.attempt)
    ) {
      throw new Error('Fixture response does not match the typed recipe contract. Rebuild the companion API.');
    }
    return parsed.data;
  }
}
