import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '../Grid';

import { Span } from '../Text';
import Currency from '../Currency';

const AmountCurrency = ({ abbreviate = false, currency, precision = 0, amount, ...styles }) => (
  <Flex alignItems="baseline" className="AmountCurrency">
    <Span fontWeight="bold" fontSize="1.6rem">
      <Currency value={amount} currency={currency} abbreviate={abbreviate} precision={precision} {...styles} />
    </Span>
    <Box ml={1}>
      <Span color="#9D9FA3" fontSize="1.4rem" letterSpacing="-0.2px" className="currency">
        {currency}
      </Span>
    </Box>
    <Box ml={2}>
      <object type="image/svg+xml" data={`/static/icons/${amount < 0 ? 'debit' : 'credit'}-arrow.svg`} height="16" />
    </Box>
  </Flex>
);

AmountCurrency.propTypes = {
  abbreviate: PropTypes.bool,
  currency: PropTypes.string,
  precision: PropTypes.number,
  amount: PropTypes.number,
};

export default AmountCurrency;
