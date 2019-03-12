import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { addArchiveCollectiveMutation } from '../graphql/mutations';
import { H2, P } from './Text';
import Container from './Container';
import StyledButton from './StyledButton';
import MessageBox from './MessageBox';
import Modal from './Modal';
import { Router } from '../server/pages';

const ArchiveCollective = ({ collective, archiveCollective }) => {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const collectiveType = collective.type === 'ORGANIZATION' ? 'Organization' : 'Collective';
  const handleArchiveCollective = async ({ archiveCollective, id }) => {
    setShowModal(false);
    try {
      setArchiving(true);
      await archiveCollective(id);
      setArchiving(false);
      Router.pushRoute('collective', {
        slug: collective.slug,
        status: 'collectiveArchived',
      });
    } catch (err) {
      console.error('>>> archiveCollective error: ', JSON.stringify(err));
      setError(`An error occur while archiving your ${collectiveType.toLocaleLowerCase()}. Please try again later.`);
      setArchiving(false);
    }
  };

  return (
    <Container>
      <H2>Archive this {collectiveType}.</H2>
      <P>Mark this {collectiveType.toLocaleLowerCase()} as archived, delete all tiers and cancel all subscriptions.</P>
      {error && <P color="#ff5252">{error}</P>}
      {!collective.isArchived && (
        <StyledButton onClick={() => setShowModal(true)} loading={archiving}>
          Archive this {collectiveType.toLocaleLowerCase()}
        </StyledButton>
      )}
      {collective.isArchived && (
        <MessageBox withIcon type="info">
          {collectiveType} already archived.
        </MessageBox>
      )}
      <Modal
        onClose={() => setShowModal(false)}
        show={showModal}
        className="confirm-ArchiveCollective"
        title={`Are you sure you want to archive ${collectiveType.toLocaleLowerCase()}?`}
      >
        <Container display="flex" justifyContent="space-between" width={1} mt={4}>
          <StyledButton onClick={() => setShowModal(false)}>Cancel</StyledButton>
          <StyledButton
            buttonStyle="primary"
            onClick={() => handleArchiveCollective({ archiveCollective, id: collective.id })}
          >
            Archive
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

export default addArchiveCollectiveMutation(ArchiveCollective);
