import { verifyFieldLength } from '../../lib/form-utils';

export const validateOauthApplicationValues = (intl, values) => {
  const errors = {};
  verifyFieldLength(intl, errors, values, 'name', 3, 100);
  return errors;
};
