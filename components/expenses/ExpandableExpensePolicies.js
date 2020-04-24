import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '../Grid';
import { defineMessages, useIntl } from 'react-intl';
import Markdown from 'react-markdown';
import Collapse from '../Collapse';
import { H5 } from '../Text';
import Container from '../Container';

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
          <Container fontSize="Caption" color="black.800" lineHeight="Paragraph" mb={2}>
            <Markdown source={host.expensePolicy} />
          </Container>
        )}
        {collective && collective.expensePolicy && (
          <Container fontSize="Caption" color="black.800" lineHeight="Paragraph">
            <Markdown source={collective.expensePolicy} />
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
