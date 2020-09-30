import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ConfirmationModal from '../ConfirmationModal';
import { P } from '../Text';

const ChangeTierWarningModal = ({ show, onClose, tierName, onConfirm }) => {
  return (
    <ConfirmationModal
      show={show}
      width="100%"
      maxWidth="570px"
      onClose={onClose}
      header={<FormattedMessage id="Frequency.change" defaultMessage="Change frequency?" />}
      continueHandler={onConfirm}
    >
      <P fontSize="14px" lineHeight="18px" mt={2}>
        <FormattedMessage
          id="contribute.changeFrequency.warning"
          defaultMessage="If you change the frequency, you will not contribute to this specific {tierName} tier"
          values={{ tierName: <q>{tierName}</q> }}
        />
      </P>
    </ConfirmationModal>
  );
};

ChangeTierWarningModal.propTypes = {
  /** a boolean to know when to show modal */
  show: PropTypes.bool.isRequired,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  tierName: PropTypes.string.isRequired,
};

export default ChangeTierWarningModal;
