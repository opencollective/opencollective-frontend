import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import AssignVirtualCardModal from './edit-collective/AssignVirtualCardModal';
import { useToast } from './ui/useToast';
import StyledButton from './StyledButton';

const AssignVirtualCardBtn = ({ children, collective, host }) => {
  const [showModal, setShowModal] = React.useState(false);
  const { toast } = useToast();

  const handleAssignCardSuccess = () => {
    toast({
      variant: 'success',
      message: (
        <FormattedMessage id="Host.VirtualCards.AssignCard.Success" defaultMessage="Card successfully assigned" />
      ),
    });
    setShowModal(false);
  };

  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      {showModal && (
        <AssignVirtualCardModal
          host={host}
          collective={collective}
          onClose={() => setShowModal(false)}
          onSuccess={handleAssignCardSuccess}
        />
      )}
    </Fragment>
  );
};

AssignVirtualCardBtn.propTypes = {
  children: PropTypes.func.isRequired,
  collective: PropTypes.object.isRequired,
  host: PropTypes.object.isRequired,
};

const DefaultAddFundsButton = props => (
  <StyledButton {...props}>
    <FormattedMessage id="menu.assignCard" defaultMessage="Assign a Card" />
  </StyledButton>
);

AssignVirtualCardBtn.defaultProps = {
  children: DefaultAddFundsButton,
};

export default AssignVirtualCardBtn;
