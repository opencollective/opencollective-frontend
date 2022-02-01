import PropTypes from 'prop-types';

export const AmountPropTypeShape = PropTypes.shape({
  value: PropTypes.number,
  valueInCents: PropTypes.number,
  currency: PropTypes.string,
});
