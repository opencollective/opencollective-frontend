import React from 'react';
import PropTypes from 'prop-types';

import CollectiveContactForm from './CollectiveContactForm';
import StyledModal, { ModalHeader } from './StyledModal';

const ContactCollectiveModal = ({ collective, onClose }) => {
  return (
    <StyledModal role="alertdialog" width="578px" onClose={onClose} trapFocus>
      <ModalHeader />
      <CollectiveContactForm collective={collective} isModal onClose={onClose} />
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
