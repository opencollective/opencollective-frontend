import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { simpleDateToISOString } from '../../../lib/date-utils';

import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import StyledButton from '../../StyledButton';

const prepareDateArgs = dateInterval => {
  if (!dateInterval) {
    return {};
  } else {
    return {
      dateFrom: simpleDateToISOString(dateInterval.from, false, dateInterval.timezoneType),
      dateTo: simpleDateToISOString(dateInterval.to, true, dateInterval.timezoneType),
    };
  }
};

const HostCSVDownloadButton = ({ host, collectives, dateInterval }) => {
  const [displayModal, setDisplayModal] = React.useState(false);
  const { dateFrom, dateTo } = prepareDateArgs(dateInterval);

  return (
    <React.Fragment>
      <StyledButton
        buttonStyle="primary"
        buttonSize="small"
        py="7px"
        minWidth={140}
        width="100%"
        onClick={() => setDisplayModal(true)}
        disabled={!host}
      >
        <FormattedMessage defaultMessage="Export CSV" />
      </StyledButton>
      {displayModal && (
        <ExportTransactionsCSVModal
          dateFrom={dateFrom}
          dateTo={dateTo}
          host={host}
          accounts={collectives}
          onClose={() => setDisplayModal(false)}
        />
      )}
    </React.Fragment>
  );
};

HostCSVDownloadButton.propTypes = {
  collectives: PropTypes.arrayOf(PropTypes.shape({ slug: PropTypes.string.isRequired })),
  dateInterval: PropTypes.object,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
  }),
};

export default HostCSVDownloadButton;
