import PropTypes from 'prop-types';

export const AmountPropTypeShape = PropTypes.shape({
  value: PropTypes.number,
  valueInCents: PropTypes.number,
  currency: PropTypes.string,
  exchangeRate: PropTypes.shape({
    value: PropTypes.number,
    source: PropTypes.string,
    date: PropTypes.string,
    isApproximate: PropTypes.bool,
  }),
});
