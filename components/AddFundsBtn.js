import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import AddFundsModal from './host-dashboard/AddFundsModal';
import StyledButton from './StyledButton';

const AddFundsBtn = ({ children, collective, host }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      <AddFundsModal
        collective={collective}
        host={host}
        show={showModal}
        setShow={setShowModal}
        onClose={() => setShowModal(null)}
      />
    </Fragment>
  );
};

AddFundsBtn.propTypes = {
  children: PropTypes.func.isRequired,
  collective: PropTypes.object.isRequired,
  host: PropTypes.object.isRequired,
};

const DefaultAddFundsButton = props => (
  <StyledButton {...props}>
    <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
  </StyledButton>
);

AddFundsBtn.defaultProps = {
  children: DefaultAddFundsButton,
};

export default AddFundsBtn;
