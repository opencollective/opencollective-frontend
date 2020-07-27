import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';

import ApplicationRejectionReasonModal from './ApplicationRejectionReasonModal';

const ApproveCollectiveMutation = gql`
  mutation approveCollective($id: Int!) {
    approveCollective(id: $id) {
      id
      isActive
      isApproved
      host {
        id
        name
        slug
        type
        settings
      }
    }
  }
`;

const AcceptRejectButtons = ({ collective }) => {
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  return (
    <Fragment>
      <Mutation mutation={ApproveCollectiveMutation}>
        {(approveCollective, { loading }) => (
          <StyledButton
            m={1}
            loading={loading}
            onClick={() => approveCollective({ variables: { id: collective.id } })}
            data-cy={`${collective.slug}-approve`}
            buttonStyle="success"
            minWidth={125}
          >
            <FormattedMessage id="actions.approve" defaultMessage="Approve" />
          </StyledButton>
        )}
      </Mutation>
      <StyledButton buttonStyle="danger" minWidth={125} m={1} onClick={() => setShowRejectionModal(true)}>
        <FormattedMessage id="actions.reject" defaultMessage="Reject" />
      </StyledButton>
      {showRejectionModal && (
        <ApplicationRejectionReasonModal
          show={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          collectiveId={collective.id}
        />
      )}
    </Fragment>
  );
};

AcceptRejectButtons.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string,
  }),
  host: PropTypes.shape({
    slug: PropTypes.string,
  }),
};

export default AcceptRejectButtons;
