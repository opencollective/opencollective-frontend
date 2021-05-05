import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Ban } from '@styled-icons/fa-solid/Ban';
import { Check } from '@styled-icons/fa-solid/Check';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../Grid';
import StyledButton from '../StyledButton';

import ApplicationRejectionReasonModal from './ApplicationRejectionReasonModal';

const AcceptRejectButtons = ({ collective, isLoading, onApprove, onReject }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [action, setAction] = useState(null);
  return (
    <Flex>
      <StyledButton
        minWidth={100}
        buttonSize="tiny"
        buttonStyle="successSecondary"
        height={32}
        disabled={isLoading}
        loading={isLoading && action === 'APPROVE'}
        data-cy={`${collective.slug}-approve`}
        onClick={() => {
          setAction('APPROVE');
          onApprove();
        }}
      >
        <Check size={12} />
        &nbsp; <FormattedMessage id="actions.approve" defaultMessage="Approve" />
      </StyledButton>
      <StyledButton
        minWidth={100}
        buttonSize="tiny"
        buttonStyle="dangerSecondary"
        ml={3}
        height={32}
        onClick={() => setShowRejectModal(true)}
        disabled={isLoading}
        loading={isLoading && action === 'REJECT'}
        data-cy={`${collective.slug}-reject`}
      >
        <Ban size={12} />
        &nbsp; <FormattedMessage id="actions.reject" defaultMessage="Reject" />
      </StyledButton>
      <ApplicationRejectionReasonModal
        show={showRejectModal}
        collective={collective}
        onClose={() => setShowRejectModal(false)}
        onConfirm={message => {
          setAction('REJECT');
          setShowRejectModal(false);
          onReject(message);
        }}
      />
    </Flex>
  );
};

AcceptRejectButtons.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
};

export default AcceptRejectButtons;
