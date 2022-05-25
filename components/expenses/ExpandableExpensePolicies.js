import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Collapse from '../Collapse';
import Container from '../Container';
import { Box } from '../Grid';
import HTMLContent from '../HTMLContent';
import { H5 } from '../Text';

const ExpandableExpensePolicies = ({ host, collective, ...props }) => {
  const hostPolicy = host?.expensePolicy;
  const parentPolicy = collective?.parent?.expensePolicy;
  const accountPolicy = collective?.expensePolicy;

  if (!accountPolicy && !parentPolicy && !hostPolicy) {
    return null;
  }

  return (
    <Box {...props}>
      <Collapse
        defaultIsOpen
        title={
          <H5>
            <FormattedMessage id="ExpensePolicies" defaultMessage="Expense policies" />
          </H5>
        }
      >
        {hostPolicy && (
          <Container mb={2}>
            <HTMLContent fontSize="12px" color="black.800" lineHeight="20px" content={hostPolicy} />
          </Container>
        )}
        {parentPolicy && collective.parent.id !== host?.id && parentPolicy !== accountPolicy && (
          <Container mb={2}>
            <HTMLContent
              data-cy="expense-policy-html"
              fontSize="12px"
              color="black.800"
              lineHeight="20px"
              content={parentPolicy}
            />
          </Container>
        )}
        {accountPolicy && collective.id !== host?.id && (
          <Container mb={2}>
            <HTMLContent
              data-cy="expense-policy-html"
              fontSize="12px"
              color="black.800"
              lineHeight="20px"
              content={accountPolicy}
            />
          </Container>
        )}
      </Collapse>
    </Box>
  );
};

ExpandableExpensePolicies.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.string,
    expensePolicy: PropTypes.string,
    parent: PropTypes.shape({
      id: PropTypes.string,
      expensePolicy: PropTypes.string,
    }),
  }),
  host: PropTypes.shape({
    id: PropTypes.string,
    expensePolicy: PropTypes.string,
  }),
};

export default ExpandableExpensePolicies;
