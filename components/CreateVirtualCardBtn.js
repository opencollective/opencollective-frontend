import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import CreateVirtualCardModal from './edit-collective/CreateVirtualCardModal';
import StyledButton from './StyledButton';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const CreateVirtualCardBtn = ({ children, host, collective }) => {
  const [showModal, setShowModal] = React.useState(false);
  const { addToast } = useToasts();

  const handleCreateCardSuccess = () => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: <FormattedMessage defaultMessage="Card successfully created" />,
    });
    setShowModal(false);
  };

  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      <CreateVirtualCardModal
        host={host}
        collective={collective}
        onClose={() => setShowModal(false)}
        setShow={setShowModal}
        onSuccess={handleCreateCardSuccess}
        show={showModal}
      />
    </Fragment>
  );
};

CreateVirtualCardBtn.propTypes = {
  children: PropTypes.func.isRequired,
  host: PropTypes.object.isRequired,
  collective: PropTypes.object.isRequired,
};

const DefaultButton = props => (
  <StyledButton {...props}>
    <FormattedMessage defaultMessage="Create a Card" />
  </StyledButton>
);

CreateVirtualCardBtn.defaultProps = {
  children: DefaultButton,
};

export default CreateVirtualCardBtn;
