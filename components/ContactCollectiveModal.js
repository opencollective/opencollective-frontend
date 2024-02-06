import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import CollectiveContactForm from './CollectiveContactForm';
import StyledModal, { ModalHeader } from './StyledModal';
import { H2 } from './Text';

const ContactCollectiveModal = ({ collective, onClose }) => {
  const [hasData, setHasData] = React.useState(false);
  return (
    <StyledModal role="alertdialog" width="578px" onClose={onClose} hasUnsavedChanges={hasData}>
      <ModalHeader>
        <H2 mb={2} fontSize={'28px'}>
          <FormattedMessage
            id="ContactCollective"
            defaultMessage="Contact {collective}"
            values={{ collective: collective.name }}
          />
        </H2>
      </ModalHeader>
      <CollectiveContactForm
        collective={collective}
        isModal
        onClose={onClose}
        onChange={values => setHasData(Object.values(values).some(Boolean))}
      />
    </StyledModal>
  );
};

ContactCollectiveModal.propTypes = {
  /** the collective that is contacted */
  collective: PropTypes.object,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
};

export default ContactCollectiveModal;
