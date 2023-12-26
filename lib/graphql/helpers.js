export { gql, gql as gqlV1 } from '@apollo/client';

/** To pass as a context to your query/mutation to use API v2 */
export const API_V2_CONTEXT = { apiVersion: '2' };

export function fakeTag(literals, ...expressions) {
  let string = '';

  for (const [index, literal] of literals.entries()) {
    string += literal;

    if (index in expressions) {
      string += expressions[index];
    }
  }

  return string;
}
