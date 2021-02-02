import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import AddPrepaidBudgetModal from './AddPrepaidBudgetModal';
import StyledButton from './StyledButton';

const AddPrepaidBudgetBtn = ({ children, collective }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      <AddPrepaidBudgetModal
        collective={collective}
        show={showModal}
        setShow={setShowModal}
        onClose={() => setShowModal(null)}
      />
    </Fragment>
  );
};

AddPrepaidBudgetBtn.propTypes = {
  children: PropTypes.func.isRequired,
  collective: PropTypes.object.isRequired,
};

const DefaultAddPrepaidBudgetBtn = props => (
  <StyledButton {...props}>
    <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
  </StyledButton>
);

AddPrepaidBudgetBtn.defaultProps = {
  children: DefaultAddPrepaidBudgetBtn,
};

export default AddPrepaidBudgetBtn;
