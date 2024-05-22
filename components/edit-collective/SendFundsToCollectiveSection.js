import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';

import Container from '../Container';
import SendMoneyToCollectiveBtn from '../SendMoneyToCollectiveBtn';
import StyledButton from '../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';

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
        <StyledButton disabled={true}>
          <FormattedMessage
            id="SendMoneyToCollective.btn"
            defaultMessage="Send {amount} to {collective}"
            values={{
              amount: formatCurrency(0, collective.currency, { locale }),
              collective: toCollective.name,
            }}
          />
        </StyledButton>
      )}
      {modal.show && (
        <StyledModal width="570px" onClose={closeModal}>
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
          <ModalFooter>
            <Container display="flex" justifyContent="flex-end">
              <StyledButton mx={20} onClick={() => setModal({ ...modal, show: false, isApproved: false })}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
              <StyledButton
                buttonStyle="primary"
                data-cy="action"
                onClick={() => setModal({ ...modal, show: false, isApproved: true })}
              >
                <FormattedMessage id="confirm" defaultMessage="Confirm" />
              </StyledButton>
            </Container>
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
