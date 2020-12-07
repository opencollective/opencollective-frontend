import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import Collapse from '../Collapse';
import Container from '../Container';
import { Box } from '../Grid';
import HTMLContent from '../HTMLContent';
import { H5 } from '../Text';

const msg = defineMessages({
  policies: {
    id: 'ExpensePolicies',
    defaultMessage: 'Expense policies',
  },
});

const ExpandableExpensePolicies = ({ host, collective, ...props }) => {
  const { formatMessage } = useIntl();
  const hostPolicy = host && host.expensePolicy;
  const collectivePolicy = collective && collective.expensePolicy;

  if (!collectivePolicy && !hostPolicy) {
    return null;
  }

  return (
    <Box {...props}>
      <Collapse title={<H5>{formatMessage(msg.policies)}</H5>} defaultIsOpen>
        {host && host.expensePolicy && (
          <Container mb={2}>
            <HTMLContent fontSize="12px" color="black.800" lineHeight="20px" content={host.expensePolicy} />
          </Container>
        )}
        {collective && collective.expensePolicy && (
          <Container>
            <HTMLContent fontSize="12px" color="black.800" lineHeight="20px" content={collective.expensePolicy} />
          </Container>
        )}
      </Collapse>
    </Box>
  );
};

ExpandableExpensePolicies.propTypes = {
  collective: PropTypes.shape({
    expensePolicy: PropTypes.string,
  }),
  host: PropTypes.shape({
    expensePolicy: PropTypes.string,
  }),
};

export default ExpandableExpensePolicies;
