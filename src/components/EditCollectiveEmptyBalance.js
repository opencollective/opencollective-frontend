import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { formatCurrency } from '../lib/utils';

import Container from './Container';
import StyledButton from './StyledButton';
import SendMoneyToCollectiveBtn from './SendMoneyToCollectiveBtn';
import { H2, P } from './Text';

const EditCollectiveEmptyBalance = ({ collective, LoggedInUser }) => {
  if (!collective.host || !collective.host.hostCollective) {
    return null;
  }
  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start" mb={2}>
      <H2>
        <FormattedMessage id="collective.balance.title" defaultMessage={'Empty Collective balance'} />
      </H2>
      <P>
        <FormattedMessage
          id="collective.balance.description"
          defaultMessage={
            'Transfer remaining balance to the fiscal host. Collective balance must be zero to archive it or change hosts. Alternatively, you can submit an expense or donate to another Collective.'
          }
        />
      </P>
      {collective.stats.balance > 0 && (
        <SendMoneyToCollectiveBtn
          fromCollective={collective}
          toCollective={collective.host.hostCollective}
          LoggedInUser={LoggedInUser}
          amount={collective.stats.balance}
          currency={collective.currency}
        />
      )}
      {collective.stats.balance === 0 && (
        <StyledButton disabled={true}>
          <FormattedMessage
            id="SendMoneyToCollective.btn"
            defaultMessage="Send {amount} to {collective}"
            values={{
              amount: formatCurrency(0, collective.currency),
              collective: collective.host.hostCollective.name,
            }}
          />
        </StyledButton>
      )}
    </Container>
  );
};

EditCollectiveEmptyBalance.propTypes = {
  collective: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
};

export default EditCollectiveEmptyBalance;
