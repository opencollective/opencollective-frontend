import React, { useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { addArchiveCollectiveMutation, addUnarchiveCollectiveMutation } from '../../lib/graphql/mutations';

import { H2, P } from '../Text';
import Container from '../Container';
import StyledButton from '../StyledButton';
import MessageBox from '../MessageBox';
import Modal, { ModalBody, ModalHeader, ModalFooter } from '../StyledModal';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { CollectiveType } from '../../lib/constants/collectives';

const getCollectiveType = type => {
  switch (type) {
    case 'ORGANIZATION':
      return 'Organization';
    case 'COLLECTIVE':
      return 'Collective';
    case 'EVENT':
      return 'Event';
    default:
      return 'Account';
  }
};

const archiveMessages = defineMessages({
  [CollectiveType.EVENT]: {
    id: 'archive.event.confirmation',
    defaultMessage: 'Are you sure you want to archive this event?',
  },
  [CollectiveType.COLLECTIVE]: {
    id: 'archive.collective.confirmation',
    defaultMessage: 'Are you sure you want to archive this collective?',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'archive.organization.confirmation',
    defaultMessage: 'Are you sure you want to archive this organization?',
  },
  _default: {
    id: 'archive.account.confirmation',
    defaultMessage: 'Are you sure you want to archive this account?',
  },
});

const unarchiveMessages = defineMessages({
  [CollectiveType.EVENT]: {
    id: 'unarchive.event.confirmation',
    defaultMessage: 'Are you sure you want to unarchive this event?',
  },
  [CollectiveType.COLLECTIVE]: {
    id: 'unarchive.collective.confirmation',
    defaultMessage: 'Are you sure you want to unarchive this collective?',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'unarchive.organization.confirmation',
    defaultMessage: 'Are you sure you want to unarchive this organization?',
  },
  _default: {
    id: 'unarchive.account.confirmation',
    defaultMessage: 'Are you sure you want to unarchive this account?',
  },
});

const ArchiveCollective = ({ collective, archiveCollective, unarchiveCollective }) => {
  const collectiveType = getCollectiveType(collective.type);
  const defaultAction = isArchived ? 'Archive' : 'Unarchive';
  const [modal, setModal] = useState({ type: defaultAction, show: false });
  const intl = useIntl();
  const [archiveStatus, setArchiveStatus] = useState({
    processing: false,
    isArchived: collective.isArchived,
    error: null,
    confirmationMsg: '',
  });

  const { processing, isArchived, error, confirmationMsg } = archiveStatus;
  const handleArchiveCollective = async ({ archiveCollective, id }) => {
    setModal({ type: 'Archive', show: false });
    try {
      setArchiveStatus({ ...archiveStatus, processing: true });
      await archiveCollective(id);
      setArchiveStatus({
        ...archiveStatus,
        processing: false,
        isArchived: true,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setArchiveStatus({ ...archiveStatus, processing: false, error: errorMsg });
    }
  };

  const handleUnarchiveCollective = async ({ unarchiveCollective, id }) => {
    setModal({ type: 'Unarchive', show: false });
    try {
      setArchiveStatus({ ...archiveStatus, processing: true });
      await unarchiveCollective(id);
      setArchiveStatus({
        ...archiveStatus,
        processing: false,
        isArchived: false,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setArchiveStatus({ ...archiveStatus, processing: false, error: errorMsg });
    }
  };

  const hasBalance = collective.stats.balance > 0 && collective.type === 'COLLECTIVE';

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start">
      <H2>
        <FormattedMessage
          values={{ type: collectiveType }}
          id="collective.archive.title"
          defaultMessage={'Archive this {type}'}
        />
      </H2>
      {!isArchived && (
        <P>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.archive.description"
            defaultMessage={
              'Archiving {type, select, EVENT {this event}  COLLECTIVE {this collective} ORGANIZATION {this organization} other {this account}} means it will visually appear inactive and no new activity will be allowed.'
            }
          />
          &nbsp;
          {collective.type === 'COLLECTIVE' && (
            <FormattedMessage
              id="collective.archive.subscriptions"
              defaultMessage={'Recurring financial contributions will be automatically canceled.'}
            />
          )}
        </P>
      )}
      {error && <P color="#ff5252">{error}</P>}
      {!isArchived && (
        <StyledButton
          onClick={() => setModal({ type: 'Archive', show: true })}
          loading={processing}
          disabled={collective.isHost || hasBalance ? true : false}
        >
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.archive.title"
            defaultMessage={'Archive this {type}'}
          />
        </StyledButton>
      )}
      {!isArchived && hasBalance && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.archive.availableBalance"
            defaultMessage={
              "Only Collectives with a balance of zero can be archived. To pay out the funds, submit an expense, donate to another Collective, or send the funds to your fiscal host using the 'empty balance' option."
            }
          />
        </P>
      )}
      {!isArchived && collective.isHost && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            id="collective.archive.isHost"
            defaultMessage={"You can't archive your collective while being a Host, please deactivate as Host first."}
          />
        </P>
      )}
      {isArchived && confirmationMsg && (
        <MessageBox withIcon type="info" mb={4}>
          <FormattedMessage
            values={{ message: confirmationMsg }}
            id="collective.archive.archivedConfirmMessage"
            defaultMessage={'{message}.'}
          />
        </MessageBox>
      )}

      {isArchived && (
        <StyledButton onClick={() => setModal({ type: 'Unarchive', show: true })} loading={processing}>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.unarchive.button"
            defaultMessage={'Unarchive this {type}'}
          />
        </StyledButton>
      )}

      <Modal show={modal.show} width="570px" onClose={() => setModal({ ...modal, show: false })}>
        <ModalHeader>
          {modal.type === 'Unarchive' ? (
            <FormattedMessage
              id="unarchive.modal.header"
              defaultMessage="Unarchive {name}"
              values={{ name: collective.name }}
            />
          ) : (
            <FormattedMessage
              id="archive.modal.header"
              defaultMessage="Archive {name}"
              values={{ name: collective.name }}
            />
          )}
        </ModalHeader>
        <ModalBody>
          <P>
            {modal.type === 'Unarchive'
              ? intl.formatMessage(unarchiveMessages[collective.type] || unarchiveMessages._default)
              : intl.formatMessage(archiveMessages[collective.type] || archiveMessages._default)}
          </P>
        </ModalBody>
        <ModalFooter>
          <Container display="flex" justifyContent="flex-end">
            <StyledButton mx={20} onClick={() => setModal({ ...modal, show: false })}>
              <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
            </StyledButton>
            <StyledButton
              buttonStyle="primary"
              data-cy="action"
              onClick={() => {
                if (modal.type === 'Unarchive') {
                  handleUnarchiveCollective({ unarchiveCollective, id: collective.id });
                } else {
                  handleArchiveCollective({ archiveCollective, id: collective.id });
                }
              }}
            >
              {modal.type === 'Unarchive' ? (
                <FormattedMessage id="collective.unarchive.confirm.btn" defaultMessage={'Unarchive'} />
              ) : (
                <FormattedMessage id="collective.archive.confirm.btn" defaultMessage={'Archive'} />
              )}
            </StyledButton>
          </Container>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

ArchiveCollective.propTypes = {
  collective: PropTypes.object.isRequired,
  archiveCollective: PropTypes.func,
  unarchiveCollective: PropTypes.func,
};

export default addArchiveCollectiveMutation(addUnarchiveCollectiveMutation(ArchiveCollective));
