import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import { defineMessages, useIntl } from 'react-intl';
import Markdown from 'react-markdown';
import Collapse from '../Collapse';
import { H5, P } from '../Text';

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
      <Collapse title={<H5>{formatMessage(msg.policies)}</H5>}>
        {host && host.expensePolicy && (
          <P fontSize="Caption" color="black.800" lineHeight="Paragraph" mb={2}>
            <Markdown source={host.expensePolicy} />
          </P>
        )}
        {collective && collective.expensePolicy && (
          <P fontSize="Caption" color="black.800" lineHeight="Paragraph">
            <Markdown source={collective.expensePolicy} />
          </P>
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
