import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import EditVirtualCardModal from './edit-collective/EditVirtualCardModal';
import { useToast } from './ui/useToast';
import StyledButton from './StyledButton';

const CreateVirtualCardBtn = ({ children, host, collective }) => {
  const [showModal, setShowModal] = React.useState(false);
  const { toast } = useToast();

  const handleCreateCardSuccess = () => {
    toast({
      variant: 'success',
      message: <FormattedMessage defaultMessage="Card successfully created" id="YdC/Ok" />,
    });
    setShowModal(false);
  };

  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      {showModal && (
        <EditVirtualCardModal
          host={host}
          collective={collective}
          onClose={() => setShowModal(false)}
          onSuccess={handleCreateCardSuccess}
        />
      )}
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
    <FormattedMessage defaultMessage="Create a Card" id="xLybrm" />
  </StyledButton>
);

CreateVirtualCardBtn.defaultProps = {
  children: DefaultButton,
};

export default CreateVirtualCardBtn;
