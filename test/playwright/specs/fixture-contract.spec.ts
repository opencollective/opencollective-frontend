import { createHash } from 'crypto';

import { expect, test } from '../fixtures';
import { scenarioEvidence } from '../fixtures/transport';

test('fixture authorization fails closed', async ({ recipes }) => {
  const unauthorized = await fetch(recipes.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  expect(unauthorized.status).toBe(401);
  for (const token of ['invalid', 'é'.repeat(64), '0'.repeat(64)]) {
    const invalidToken = await fetch(recipes.endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(invalidToken.status).toBe(401);
  }
});

test('concurrent requests recover the committed result after a discarded response and reject conflicts', async ({
  recipes,
}) => {
  const inputs = { name: 'Recoverable Account' };
  const [first, concurrent] = await Promise.all([
    recipes.request('account-profile', inputs, 'recover'),
    recipes.request('account-profile', inputs, 'recover'),
  ]);
  expect(first.ok).toBeTruthy();
  expect(concurrent.ok).toBeTruthy();
  // Simulate losing the response: its body is never consumed by the author.
  const [recovered, duplicate, independent] = await Promise.all([
    recipes.arrange('account-profile', inputs, 'recover'),
    recipes.arrange('account-profile', inputs, 'recover'),
    recipes.arrange('account-conversation', { name: 'Independent Account' }, 'peer'),
  ]);
  const { auth: duplicateAuth, ...duplicateReferences } = duplicate;
  const { auth: recoveredAuth, ...recoveredReferences } = recovered;
  expect(duplicateReferences).toEqual(recoveredReferences);
  const tokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');
  expect(tokenDigest(duplicateAuth.token)).toBe(tokenDigest(recoveredAuth.token));
  expect(independent.account.id).not.toBe(recovered.account.id);
  expect(independent.user.email).not.toBe(recovered.user.email);
  const conflict = await recipes.request('account-profile', { name: 'Conflicting Account' }, 'recover');
  expect(conflict.status).toBe(409);
  expect((await conflict.json()).error.code).toBe('REQUEST_CONFLICT');
});

test('scenario evidence holds named references and no credential, whatever key carries it', async ({ recipes }) => {
  const scenario = await recipes.arrange('account-profile', { name: 'Evidence Account' }, 'evidence');
  const evidence = JSON.stringify(
    scenarioEvidence({
      ...scenario,
      apiKey: 'secret-at-the-top',
      user: { ...scenario.user, password: 'secret-in-a-handle' },
      urls: { ...scenario.urls, profile: `${scenario.urls.profile}?key=secret-in-a-link` },
    } as typeof scenario),
  );
  expect(evidence).not.toContain('secret-');
  expect(evidence).not.toContain(scenario.auth.token);
  expect(JSON.parse(evidence)).toMatchObject({
    recipe: 'account-profile',
    attempt: recipes.attempt,
    account: scenario.account,
    user: scenario.user,
    urls: scenario.urls,
  });
});
