import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import AddFundsModal from './dashboard/sections/collectives/AddFundsModal';
import StyledButton from './StyledButton';

const DefaultAddFundsButton = props => (
  <StyledButton {...props}>
    <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
  </StyledButton>
);

const AddFundsBtn = ({ children = DefaultAddFundsButton, collective }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      {showModal && <AddFundsModal collective={collective} onClose={() => setShowModal(null)} />}
    </Fragment>
  );
};

AddFundsBtn.propTypes = {
  children: PropTypes.func.isRequired,
  collective: PropTypes.object.isRequired,
};

export default AddFundsBtn;
