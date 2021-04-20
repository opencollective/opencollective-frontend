import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import AssignVirtualCardModal from './edit-collective/AssignVirtualCardModal';
import StyledButton from './StyledButton';

const AssignVirtualCardBtn = ({ children, collective, host }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      <AssignVirtualCardModal
        host={host}
        collective={collective}
        onClose={() => setShowModal(false)}
        setShow={setShowModal}
        show={showModal}
      />
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
