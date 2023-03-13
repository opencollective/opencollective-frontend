import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { FormattedMessage } from 'react-intl';

import { parseDateInterval } from '../../lib/date-utils';

import ExportTransactionsCSVModal from '../ExportTransactionsCSVModal';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';

const TransactionsDownloadCSV = ({ collective, query }) => {
  const [displayModal, setDisplayModal] = React.useState(false);
  let dateFrom, dateTo;
  if (query.period) {
    ({ from: dateFrom, to: dateTo } = parseDateInterval(query.period));
  }

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
          mb="8px"
          p="6px 10px"
          isBorderless
          flexGrow={1}
        >
          <FormattedMessage id="transactions.downloadcsvbutton" defaultMessage="Download CSV" />
          <IconDownload size="13px" style={{ marginLeft: '8px' }} />
        </StyledButton>
      </StyledTooltip>
      {displayModal && (
        <ExportTransactionsCSVModal
          dateFrom={dateFrom}
          dateTo={dateTo}
          collective={collective}
          onClose={() => setDisplayModal(false)}
        />
      )}
    </React.Fragment>
  );
};

TransactionsDownloadCSV.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    legacyId: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
  client: PropTypes.object,
  query: PropTypes.shape({
    period: PropTypes.string,
  }),
};

export default withApollo(TransactionsDownloadCSV);
