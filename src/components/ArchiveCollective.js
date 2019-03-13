import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { addArchiveCollectiveMutation } from '../graphql/mutations';
import withIntl from '../lib/withIntl';

import { H2, P } from './Text';
import Container from './Container';
import StyledButton from './StyledButton';
import MessageBox from './MessageBox';
import Modal from './Modal';

const ArchiveCollective = ({ collective, archiveCollective }) => {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [isArchived, setIsArchived] = useState(collective.isArchived);

  const collectiveType = collective.type === 'ORGANIZATION' ? 'Organization' : 'Collective';
  const handleArchiveCollective = async ({ archiveCollective, id }) => {
    setShowModal(false);
    try {
      setArchiving(true);
      await archiveCollective(id);
      setArchiving(false);
      setIsArchived(true);
    } catch (err) {
      console.error('>>> archiveCollective error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      setError(errorMsg);
      setArchiving(false);
    }
  };

  return (
    <Container>
      <H2>
        <FormattedMessage
          values={{ type: collectiveType }}
          id="collective.archive.title"
          defaultMessage={'Archive this {type}.'}
        />
      </H2>
      <P>
        <FormattedMessage
          values={{ type: collectiveType.toLowerCase() }}
          id="collective.archive.description"
          defaultMessage={'Mark this {type} as archived, delete all tiers and cancel all subscriptions.'}
        />
      </P>
      {error && <P color="#ff5252">{error}</P>}
      {!isArchived && (
        <StyledButton onClick={() => setShowModal(true)} loading={archiving}>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.archive.button"
            defaultMessage={'Archive this {type}.'}
          />
        </StyledButton>
      )}
      {isArchived && (
        <MessageBox withIcon type="info">
          <FormattedMessage
            values={{ type: collectiveType }}
            id="collective.archive.archivedMessage"
            defaultMessage={'{type} already archived.'}
          />
        </MessageBox>
      )}
      <Modal
        onClose={() => setShowModal(false)}
        show={showModal}
        className="confirm-ArchiveCollective"
        title={`Are you sure you want to archive ${collectiveType.toLocaleLowerCase()}?`}
      >
        <Container display="flex" justifyContent="space-between" width={1} mt={4}>
          <StyledButton onClick={() => setShowModal(false)}>
            <FormattedMessage id="collective.archive.cancel.btn" defaultMessage={'Cancel'} />
          </StyledButton>
          <StyledButton
            buttonStyle="primary"
            onClick={() => handleArchiveCollective({ archiveCollective, id: collective.id })}
          >
            <FormattedMessage id="collective.archive.confirm.btn" defaultMessage={'Archive'} />
          </StyledButton>
        </Container>
      </Modal>
    </Container>
  );
};

ArchiveCollective.propTypes = {
  collective: PropTypes.object.isRequired,
  archiveCollective: PropTypes.func,
};

export default withIntl(addArchiveCollectiveMutation(ArchiveCollective));
