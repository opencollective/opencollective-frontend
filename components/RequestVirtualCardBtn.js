import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import RequestVirtualCardModal from './edit-collective/RequestVirtualCardModal';
import StyledButton from './StyledButton';

const RequestVirtualCardBtn = ({ children, collective, host }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      <RequestVirtualCardModal
        host={host}
        collective={collective}
        onClose={() => setShowModal(false)}
        setShow={setShowModal}
        show={showModal}
      />
    </Fragment>
  );
};

RequestVirtualCardBtn.propTypes = {
  children: PropTypes.func.isRequired,
  collective: PropTypes.object.isRequired,
  host: PropTypes.object.isRequired,
};

const DefaultAddFundsButton = props => (
  <StyledButton {...props}>
    <FormattedMessage id="menu.assignCard" defaultMessage="Assign a Card" />
  </StyledButton>
);

RequestVirtualCardBtn.defaultProps = {
  children: DefaultAddFundsButton,
};

export default RequestVirtualCardBtn;
