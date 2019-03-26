import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { addArchiveCollectiveMutation, addUnarchiveCollectiveMutation } from '../graphql/mutations';
import withIntl from '../lib/withIntl';

import { H2, P } from './Text';
import Container from './Container';
import StyledButton from './StyledButton';
import MessageBox from './MessageBox';
import Modal from './Modal';

const ArchiveCollective = ({ collective, archiveCollective, unarchiveCollective }) => {
  const collectiveType = collective.type === 'ORGANIZATION' ? 'Organization' : 'Collective';
  const defaultAction = isArchived ? 'Archive' : 'Unarchive';
  const [modal, setModal] = useState({ type: defaultAction, show: false });
  const [archiveStatus, setArchiveStatus] = useState({
    processing: false,
    isArchived: collective.isArchived,
    error: null,
    confirmationMesg: '',
  });

  const { processing, isArchived, error, confirmationMesg } = archiveStatus;
  const handleArchiveCollective = async ({ archiveCollective, id }) => {
    setModal({ type: 'Archive', show: false });
    try {
      setArchiveStatus({ ...archiveStatus, processing: true });
      await archiveCollective(id);
      setArchiveStatus({
        ...archiveStatus,
        processing: false,
        isArchived: true,
        confirmationMesg: `The ${collectiveType.toLowerCase()} was successfully archived`,
      });
    } catch (err) {
      console.error('>>> archiveCollective error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
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
        confirmationMesg: `The ${collectiveType.toLowerCase()} was successfully unarchived`,
      });
    } catch (err) {
      console.error('>>> archiveCollective error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      setArchiveStatus({ ...archiveStatus, processing: false, error: errorMsg });
    }
  };

  return (
    <Container display="flex" flexDirection="column" width={1}>
      <H2>
        <FormattedMessage
          values={{ type: collectiveType }}
          id="collective.archive.title"
          defaultMessage={'Archive this {type}.'}
        />
      </H2>
      {!isArchived && (
        <P>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.archive.description"
            defaultMessage={'Mark this {type} as archived, delete all tiers and cancel all subscriptions.'}
          />
        </P>
      )}
      {error && <P color="#ff5252">{error}</P>}
      {!isArchived && (
        <StyledButton width={0.3} onClick={() => setModal({ type: 'Archive', show: true })} loading={processing}>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.archive.button"
            defaultMessage={'Archive this {type}'}
          />
        </StyledButton>
      )}
      {isArchived && confirmationMesg && (
        <MessageBox withIcon width={0.6} type="info" mb={4}>
          <FormattedMessage
            values={{ message: confirmationMesg }}
            id="collective.archive.archivedConfirmMessage"
            defaultMessage={'{message}.'}
          />
        </MessageBox>
      )}

      {isArchived && (
        <StyledButton width={0.3} onClick={() => setModal({ type: 'Unarchive', show: true })} loading={processing}>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.unarchive.button"
            defaultMessage={'Unarchive this {type}'}
          />
        </StyledButton>
      )}
      <Modal
        onClose={() => setModal({ ...modal, show: false })}
        show={modal.show}
        className="confirm-ArchiveCollective"
        title={`Are you sure you want to ${modal.type.toLowerCase()} this ${collectiveType.toLocaleLowerCase()}?`}
      >
        <Container display="flex" justifyContent="space-between" width={1} mt={4}>
          <StyledButton onClick={() => setModal({ ...modal, show: false })}>
            <FormattedMessage id="collective.archive.cancel.btn" defaultMessage={'Cancel'} />
          </StyledButton>
          <StyledButton
            buttonStyle="primary"
            onClick={() => {
              if (modal.type === 'Unarchive') {
                handleUnarchiveCollective({ unarchiveCollective, id: collective.id });
              } else {
                handleArchiveCollective({ archiveCollective, id: collective.id });
              }
            }}
          >
            <FormattedMessage
              id="collective.archive.confirm.btn"
              values={{ action: modal.type }}
              defaultMessage={'{action}'}
            />
          </StyledButton>
        </Container>
      </Modal>
    </Container>
  );
};

ArchiveCollective.propTypes = {
  collective: PropTypes.object.isRequired,
  archiveCollective: PropTypes.func,
  unarchiveCollective: PropTypes.func,
};

export default withIntl(addArchiveCollectiveMutation(addUnarchiveCollectiveMutation(ArchiveCollective)));
