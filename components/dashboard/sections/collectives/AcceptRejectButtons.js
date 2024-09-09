import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Ban, Check, Info } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';

import { Flex } from '../../../Grid';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../../StyledModal';
import StyledTooltip from '../../../StyledTooltip';
import { P, Span } from '../../../Text';
import { Button } from '../../../ui/Button';

import ApplicationRejectionReasonModal from './ApplicationRejectionReasonModal';

const AcceptRejectButtons = ({
  collective,
  isLoading,
  onApprove,
  onReject,
  disabled,
  disabledMessage,
  customButton,
  editCollectiveMutation,
}) => {
  const { LoggedInUser } = useLoggedInUser();
  const isHostAdmin = LoggedInUser?.isHostAdmin(collective);
  const isCollectiveAdmin = LoggedInUser?.isAdminOfCollective(collective);

  const [isConfirmingWithdraw, setIsConfirmingWithdraw] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [action, setAction] = useState(null);

  const withdrawApplication = React.useCallback(async () => {
    setAction('WITHDRAW');
    try {
      await editCollectiveMutation({
        id: collective?.legacyId,
        HostCollectiveId: null,
      });
    } finally {
      setIsConfirmingWithdraw(false);
    }
  }, [editCollectiveMutation, collective?.legacyId]);

  return (
    <Flex alignItems="baseline" gap="10px">
      {disabledMessage && (
        <StyledTooltip content={disabledMessage}>
          <Span color="black.600">
            <Info size={24} />
          </Span>
        </StyledTooltip>
      )}
      {isHostAdmin && (
        <React.Fragment>
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
            <Button
              minWidth={100}
              variant="outline"
              disabled={disabled || isLoading}
              loading={isLoading && action === 'APPROVE'}
              data-cy={`${collective.slug}-approve`}
              onClick={() => {
                setAction('APPROVE');
                onApprove();
              }}
              className="border-[#51E094] text-[#256643] hover:bg-[#51E094] hover:text-white"
            >
              <Check size={14} className="inline-block" />
              &nbsp; <FormattedMessage id="actions.approve" defaultMessage="Approve" />
            </Button>
          )}

          {customButton ? (
            customButton({
              onClick: () => setShowRejectModal(true),
              disabled: isLoading,
              loading: isLoading && action === 'REJECT',
              children: <FormattedMessage id="actions.reject" defaultMessage="Reject" />,
            })
          ) : (
            <Button
              minWidth={100}
              variant="outlineDestructive"
              onClick={() => setShowRejectModal(true)}
              disabled={isLoading}
              loading={isLoading && action === 'REJECT'}
              data-cy={`${collective.slug}-reject`}
            >
              <Ban size={14} className="inline-block" />
              &nbsp; <FormattedMessage id="actions.reject" defaultMessage="Reject" />
            </Button>
          )}
        </React.Fragment>
      )}
      {isCollectiveAdmin && editCollectiveMutation && (
        <Button
          minWidth={100}
          variant="outlineDestructive"
          onClick={() => setIsConfirmingWithdraw(true)}
          disabled={isLoading}
          loading={isLoading && action === 'WITHDRAW'}
          data-cy={`${collective.slug}-withdraw`}
        >
          <Ban size={14} className="inline-block" />
          &nbsp; <FormattedMessage defaultMessage="Withdraw" id="PXAur5" />
        </Button>
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
      {isConfirmingWithdraw && (
        <StyledModal onClose={() => setIsConfirmingWithdraw(false)}>
          <ModalHeader onClose={() => setIsConfirmingWithdraw(false)}>
            <FormattedMessage
              id="collective.editHost.header"
              values={{ name: collective.name }}
              defaultMessage="Withdraw application to {name}"
            />
          </ModalHeader>
          <ModalBody mb={0}>
            <P>
              <FormattedMessage
                id="collective.editHost.withdrawApp"
                values={{ name: collective.name }}
                defaultMessage="Are you sure you want to withdraw your application to {name}?"
              />
            </P>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-end gap-2">
              <div className="mx-5">
                <Button variant="outline" onClick={() => setIsConfirmingWithdraw(false)}>
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </Button>
              </div>
              <Button
                variant="destructive"
                loading={isLoading && action === 'WITHDRAW'}
                onClick={withdrawApplication}
                data-cy="continue"
              >
                <FormattedMessage
                  id="collective.editHost.header"
                  values={{ name: collective.name }}
                  defaultMessage="Withdraw application to {name}"
                />
              </Button>
            </div>
          </ModalFooter>
        </StyledModal>
      )}
    </Flex>
  );
};

AcceptRejectButtons.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    slug: PropTypes.string,
    name: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  disabledMessage: PropTypes.string,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  customButton: PropTypes.func,
  editCollectiveMutation: PropTypes.func,
};

export default AcceptRejectButtons;
