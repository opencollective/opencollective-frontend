import React, { Fragment } from 'react';

import RequestVirtualCardModal from './edit-collective/RequestVirtualCardModal';

const RequestVirtualCardBtn = ({ children, collective, host }) => {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      {showModal && <RequestVirtualCardModal host={host} collective={collective} onClose={() => setShowModal(false)} />}
    </Fragment>
  );
};

export default RequestVirtualCardBtn;
