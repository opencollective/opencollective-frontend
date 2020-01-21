import React, { Fragment, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { formatCurrency } from '../../lib/utils';

import Container from '../Container';
import StyledButton from '../StyledButton';
import SendMoneyToCollectiveBtn from '../SendMoneyToCollectiveBtn';
import { H2, P } from '../Text';
import Modal, { ModalBody, ModalHeader, ModalFooter } from '../StyledModal';

const EditCollectiveEmptyBalance = ({ collective, LoggedInUser }) => {
  const [modal, setModal] = useState({ type: 'Transfer', show: false, isApproved: false });

  if (!collective.host) {
    return null;
  }

  const confirmTransfer = () => {
    setModal({ ...modal, show: true, isApproved: false });
  };

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start" mb={2}>
      <H2>
        <FormattedMessage id="collective.balance.title" defaultMessage={'Empty Collective balance'} />
      </H2>
      <P>
        <FormattedMessage
          id="collective.balance.description"
          defaultMessage={
            'Transfer remaining balance to the fiscal host. Collective balance must be zero to archive it or change hosts. Alternatively, you can submit an expense or donate to another Collective.'
          }
        />
      </P>
      {!collective.host.hostCollective && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            id="collective.balance.notAvailable"
            defaultMessage={
              "The host doesn't support this feature. Submit an expense, donate to another Collective or contact support if you're blocked."
            }
          />{' '}
        </P>
      )}
      {collective.host.hostCollective && (
        <Fragment>
          {collective.stats.balance > 0 && (
            <SendMoneyToCollectiveBtn
              fromCollective={collective}
              toCollective={collective.host.hostCollective}
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
                  amount: formatCurrency(0, collective.currency),
                  collective: collective.host.hostCollective.name,
                }}
              />
            </StyledButton>
          )}
          <Modal show={modal.show} width="570px" onClose={() => setModal({ ...modal, show: false, isApproved: false })}>
            <ModalHeader>
              <FormattedMessage
                id="collective.emptyBalance.header"
                values={{ action: modal.type }}
                defaultMessage={'{action} Balance'}
              />
            </ModalHeader>
            <ModalBody>
              <P>
                <FormattedMessage
                  id="collective.emptyBalance.body"
                  values={{ collective: collective.host.hostCollective.name, action: modal.type.toLowerCase() }}
                  defaultMessage={'Are you sure you want to {action} to {collective}?'}
                />
              </P>
            </ModalBody>
            <ModalFooter>
              <Container display="flex" justifyContent="flex-end">
                <StyledButton mx={20} onClick={() => setModal({ ...modal, show: false, isApproved: false })}>
                  <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
                </StyledButton>
                <StyledButton
                  buttonStyle="primary"
                  data-cy="action"
                  onClick={() => setModal({ ...modal, show: false, isApproved: true })}
                >
                  <FormattedMessage id="confirm" defaultMessage={'Confirm'} />
                </StyledButton>
              </Container>
            </ModalFooter>
          </Modal>
        </Fragment>
      )}
    </Container>
  );
};

EditCollectiveEmptyBalance.propTypes = {
  collective: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
};

export default EditCollectiveEmptyBalance;
