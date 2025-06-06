import React from 'react';
import { withApollo } from '@apollo/client/react/hoc';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import omit from 'lodash/omit';
import { FormattedMessage } from 'react-intl';

import { parseDateInterval } from '../../lib/date-utils';

import ExportTransactionsCSVModal from '../ExportTransactionsCSVModal';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';

const TransactionsDownloadCSV = ({ collective, query, ...props }) => {
  const [displayModal, setDisplayModal] = React.useState(false);

  return (
    <React.Fragment>
      <StyledTooltip
        content={
          <FormattedMessage
            id="Transactions.DownloadCSV.Description"
            defaultMessage="Use the filters to define the transactions you would like to download."
          />
        }
      >
        <StyledButton
          data-cy="download-csv"
          onClick={() => setDisplayModal(true)}
          buttonSize="small"
          minWidth={140}
          height={38}
          p="6px 10px"
          isBorderless
          flexGrow={1}
          {...props}
        >
          <FormattedMessage id="transactions.downloadcsvbutton" defaultMessage="Download CSV" />
          <IconDownload size="13px" style={{ marginLeft: '8px' }} />
        </StyledButton>
      </StyledTooltip>
      {displayModal && (
        <ExportTransactionsCSVModal
          dateInterval={query.period && parseDateInterval(query.period)}
          filters={omit(query, ['period', 'collectiveSlug'])}
          collective={collective}
          onClose={() => setDisplayModal(false)}
        />
      )}
    </React.Fragment>
  );
};

export default withApollo(TransactionsDownloadCSV);
