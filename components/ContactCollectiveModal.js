import React from 'react';
import PropTypes from 'prop-types';

import CollectiveContactForm from './CollectiveContactForm';
import Modal, { ModalHeader } from './StyledModal';

const ContactCollectiveModal = ({ collective, onClose, show }) => {
  return (
    <Modal role="alertdialog" width="578px" show={show} onClose={onClose} trapFocus>
      <ModalHeader />
      <CollectiveContactForm collective={collective} isModal onClose={onClose} />
    </Modal>
  );
};

ContactCollectiveModal.propTypes = {
  /** the collective that is contacted */
  collective: PropTypes.object,
  /** a boolean to determine when to show modal */
  show: PropTypes.bool.isRequired,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
};

export default ContactCollectiveModal;
