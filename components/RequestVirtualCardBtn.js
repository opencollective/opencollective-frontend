import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import RequestVirtualCardModal from './edit-collective/RequestVirtualCardModal';

const RequestVirtualCardBtn = ({ children, collective, host }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      {showModal && (
        <RequestVirtualCardModal
          host={host}
          collective={collective}
          onClose={() => setShowModal(false)}
          setShow={setShowModal}
          show
        />
      )}
    </Fragment>
  );
};

RequestVirtualCardBtn.propTypes = {
  children: PropTypes.func.isRequired,
  collective: PropTypes.object.isRequired,
  host: PropTypes.object.isRequired,
};

export default RequestVirtualCardBtn;
