import { verifyFieldLength } from '../../lib/form-utils';
import { OAuthScope } from '../../lib/graphql/types/v2/graphql';

export const validatePersonalTokenValues = (intl, values) => {
  const errors = {};
  verifyFieldLength(intl, errors, values, 'name', 3, 100);
  return errors;
};

export const getScopesOptions = () => {
  const scopes = Object.values(OAuthScope);
  return scopes.map(scope => ({ label: scope, value: scope }));
};
