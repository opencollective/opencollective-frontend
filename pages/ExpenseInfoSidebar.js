import { Flex, Box } from '@rebass/grid';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { isEmpty } from 'lodash';

import Container from '../components/Container';
import ExpandableExpensePolicies from '../components/expenses/ExpandableExpensePolicies';
import CreateExpenseFAQ from '../components/faqs/CreateExpenseFAQ';
import FormattedMoneyAmount from '../components/FormattedMoneyAmount';
import LinkCollective from '../components/LinkCollective';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import { H5, Strong, P } from '../components/Text';
import StyledTag from '../components/StyledTag';
import StyledInputTags from '../components/StyledInputTags';

/**
 * Provide some info (ie. collective balance, tags, policies, etc.) for the expense pages
 * in a sidebar.
 */
const ExpenseInfoSidebar = ({ isEditing, isLoading, host, collective, expense, onChangeTags }) => {
  const handleTagUpdate = tags => {
    const labels = tags.map(t => t.value.toUpperCase());
    onChangeTags(labels);
  };

  return (
    <Box width="100%">
      {(!isEmpty(expense?.tags) || isEditing) && (
        <Box mb={50}>
          <H5 mb={3}>
            <FormattedMessage id="Tags" defaultMessage="Tags" />
          </H5>
          {isLoading && <LoadingPlaceholder height={28} width="100%" />}
          {!isLoading && isEditing ? (
            <StyledInputTags onChange={handleTagUpdate} value={expense.tags} />
          ) : (
            <Flex flexWrap="wrap">
              {expense?.tags?.map(tag => (
                <StyledTag mb="8px" mr="8px" key={tag}>
                  {tag}
                </StyledTag>
              ))}
            </Flex>
          )}
        </Box>
      )}
      <Box display={['none', 'block']}>
        <H5 mb={3}>
          <FormattedMessage id="CollectiveBalance" defaultMessage="Collective balance" />
        </H5>
        <Container borderLeft="1px solid" borderColor="green.600" pl={3} fontSize="H5" color="black.500">
          {isLoading ? (
            <LoadingPlaceholder height={28} width={75} />
          ) : (
            <FormattedMoneyAmount
              currency={collective.currency}
              amount={collective.balance}
              amountStyles={{ color: 'black.800' }}
            />
          )}
        </Container>
        {host && (
          <P fontSize="SmallCaption" color="black.600" mt={2}>
            <FormattedMessage
              id="withColon"
              defaultMessage="{item}:"
              values={{ item: <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" /> }}
            />{' '}
            <LinkCollective collective={host}>
              <Strong color="black.600">{host.name}</Strong>
            </LinkCollective>
          </P>
        )}
      </Box>
      <ExpandableExpensePolicies host={host} collective={collective} mt={50} />
      <Box mt={50}>
        <CreateExpenseFAQ withBorderLeft withNewButtons titleProps={{ fontSize: 'H5', fontWeight: 500, mb: 3 }} />
      </Box>
    </Box>
  );
};

ExpenseInfoSidebar.propTypes = {
  isLoading: PropTypes.bool,
  isEditing: PropTypes.bool,
  onChangeTags: PropTypes.func,
  /** Must be provided if isLoading is false */
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
  }),
  host: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  expense: PropTypes.shape({
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default React.memo(ExpenseInfoSidebar);
