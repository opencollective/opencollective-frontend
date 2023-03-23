import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { manageContributionsQuery } from '../../recurring-contributions/graphql/queries';
import { H2 } from '../../Text';
import TransactionsComponent from '../../transactions/transactions-new';
import { AdminSectionProps } from '../types';

const Transactions = ({ account }: AdminSectionProps) => {
  return (
    <React.Fragment>
      {/* <H2 fontSize="24px" fontWeight="700" lineHeight="32px" mb={3}>
        <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
      </H2> */}
      <TransactionsComponent account={account} />
    </React.Fragment>
  );
};

export default Transactions;
