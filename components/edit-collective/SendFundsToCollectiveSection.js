import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';

import SendMoneyToCollectiveBtn from '../SendMoneyToCollectiveBtn';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';
import { Button } from '../ui/Button';

const SendFundsToCollectiveSection = ({ collective, toCollective, LoggedInUser }) => {
  const { locale } = useIntl();
  const [modal, setModal] = useState({ type: 'Transfer', show: false, isApproved: false });

  const confirmTransfer = () => {
    setModal({ ...modal, show: true, isApproved: false });
  };

  const closeModal = () => setModal({ ...modal, show: false, isApproved: false });

  return (
    <Fragment>
      {collective.stats.balance > 0 && (
        <SendMoneyToCollectiveBtn
          fromCollective={collective}
          toCollective={toCollective}
          LoggedInUser={LoggedInUser}
          amount={collective.stats.balance}
          currency={collective.currency}
          confirmTransfer={confirmTransfer}
          isTransferApproved={modal.isApproved}
        />
      )}
      {collective.stats.balance === 0 && (
        <Button variant="outline" disabled={true}>
          <FormattedMessage
            id="SendMoneyToCollective.btn"
            defaultMessage="Send {amount} to {collective}"
            values={{
              amount: formatCurrency(0, collective.currency, { locale }),
              collective: toCollective.name,
            }}
          />
        </Button>
      )}
      {modal.show && (
        <StyledModal onClose={closeModal}>
          <ModalHeader onClose={closeModal}>
            <FormattedMessage
              id="collective.emptyBalance.header"
              values={{ action: modal.type }}
              defaultMessage="{action} Balance"
            />
          </ModalHeader>
          <ModalBody>
            <P>
              <FormattedMessage
                id="collective.emptyBalance.body"
                values={{ collective: toCollective.name, action: modal.type.toLowerCase() }}
                defaultMessage="Are you sure you want to {action} to {collective}?"
              />
            </P>
          </ModalBody>
          <ModalFooter showDivider={false}>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setModal({ ...modal, show: false, isApproved: false })}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                buttonStyle="primary"
                data-cy="action"
                onClick={() => setModal({ ...modal, show: false, isApproved: true })}
              >
                <FormattedMessage id="confirm" defaultMessage="Confirm" />
              </Button>
            </div>
          </ModalFooter>
        </StyledModal>
      )}
    </Fragment>
  );
};

SendFundsToCollectiveSection.propTypes = {
  collective: PropTypes.object.isRequired,
  toCollective: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
};

export default SendFundsToCollectiveSection;
