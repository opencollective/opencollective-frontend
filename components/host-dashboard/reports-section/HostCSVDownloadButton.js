import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ExportTransactionsCSVModal from '../../ExportTransactionsCSVModal';
import { Button } from '../../ui/Button';

const HostCSVDownloadButton = ({ host, collectives, dateInterval }) => {
  const [displayModal, setDisplayModal] = React.useState(false);

  return (
    <React.Fragment>
      <Button size="sm" variant="outline" className="" onClick={() => setDisplayModal(true)} disabled={!host}>
        <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
      </Button>
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
