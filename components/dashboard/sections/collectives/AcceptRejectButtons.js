import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Ban, Check, Info } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../../../Grid';
import StyledButton from '../../../StyledButton';
import StyledTooltip from '../../../StyledTooltip';
import { Span } from '../../../Text';

import ApplicationRejectionReasonModal from './ApplicationRejectionReasonModal';

const AcceptRejectButtons = ({
  collective,
  isLoading,
  onApprove,
  onReject,
  disabled,
  disabledMessage,
  customButton,
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [action, setAction] = useState(null);
  return (
    <Flex alignItems="baseline" gap="10px">
      {disabledMessage && (
        <StyledTooltip content={disabledMessage}>
          <Span color="black.600">
            <Info size={24} />
          </Span>
        </StyledTooltip>
      )}
      {customButton ? (
        customButton({
          onClick: () => {
            setAction('APPROVE');
            onApprove();
          },
          disabled: disabled || isLoading,
          loading: isLoading && action === 'APPROVE',
          children: <FormattedMessage id="actions.approve" defaultMessage="Approve" />,
        })
      ) : (
        <StyledButton
          minWidth={100}
          buttonStyle="successSecondary"
          disabled={disabled || isLoading}
          loading={isLoading && action === 'APPROVE'}
          data-cy={`${collective.slug}-approve`}
          onClick={() => {
            setAction('APPROVE');
            onApprove();
          }}
        >
          <Check size={14} className="inline-block" />
          &nbsp; <FormattedMessage id="actions.approve" defaultMessage="Approve" />
        </StyledButton>
      )}

      {customButton ? (
        customButton({
          onClick: () => setShowRejectModal(true),
          disabled: isLoading,
          loading: isLoading && action === 'REJECT',
          children: <FormattedMessage id="actions.reject" defaultMessage="Reject" />,
        })
      ) : (
        <StyledButton
          minWidth={100}
          buttonStyle="dangerSecondary"
          onClick={() => setShowRejectModal(true)}
          disabled={isLoading}
          loading={isLoading && action === 'REJECT'}
          data-cy={`${collective.slug}-reject`}
        >
          <Ban size={14} className="inline-block" />
          &nbsp; <FormattedMessage id="actions.reject" defaultMessage="Reject" />
        </StyledButton>
      )}
      {showRejectModal && (
        <ApplicationRejectionReasonModal
          collective={collective}
          onClose={() => setShowRejectModal(false)}
          onConfirm={message => {
            setAction('REJECT');
            setShowRejectModal(false);
            onReject(message);
          }}
        />
      )}
    </Flex>
  );
};

AcceptRejectButtons.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.string,
    slug: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  disabledMessage: PropTypes.string,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  customButton: PropTypes.func,
};

export default AcceptRejectButtons;
