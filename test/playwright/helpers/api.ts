/**
 * Asks the product's GraphQL API a question as one of the scenario's actors,
 * with that actor's own session and permissions. For persisted outcomes of a
 * browser journey that the product shows on no page; anything a user can see
 * is asserted in the browser instead. Runs in Node, so the session stays out
 * of browser traces.
 */
export async function queryAs<Data>(
  actor: { token: string },
  query: string,
  variables: Record<string, unknown> = {},
): Promise<Data> {
  const response = await fetch(`${process.env.API_URL}/graphql/v2`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${actor.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  });
  const { data, errors } = await response.json();
  if (!response.ok || errors?.length) {
    throw new Error(`GraphQL query failed (${response.status}): ${errors?.map(error => error.message).join('; ')}`);
  }
  return data;
}
