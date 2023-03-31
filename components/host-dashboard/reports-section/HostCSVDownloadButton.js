import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import StyledButton from '../../StyledButton';

const HostCSVDownloadButton = ({ host, collectives, dateInterval }) => {
  const [displayModal, setDisplayModal] = React.useState(false);

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
          dateInterval={dateInterval}
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
