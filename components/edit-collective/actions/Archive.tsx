import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { adminPanelQuery } from '../../dashboard/queries';
import { getI18nLink } from '../../I18nFormatters';
import MessageBox from '../../MessageBox';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';
import { Button } from '../../ui/Button';
import SettingsSectionTitle from '../sections/SettingsSectionTitle';

const archiveCollectiveMutation = gqlV1/* GraphQL */ `
  mutation ArchiveCollective($id: Int!) {
    archiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

const unarchiveCollectiveMutation = gqlV1/* GraphQL */ `
  mutation UnarchiveCollective($id: Int!) {
    unarchiveCollective(id: $id) {
      id
      isArchived
    }
  }
`;

const ArchiveCollective = ({ collective }) => {
  const [archiveStatus, setArchiveStatus] = useState({
    processing: false,
    isArchived: collective.isArchived,
    error: null,
    confirmationMsg: '',
  });
  const { processing, isArchived, error, confirmationMsg } = archiveStatus;
  const defaultAction = isArchived ? 'Archive' : 'Unarchive';
  const [modal, setModal] = useState({ type: defaultAction, show: false });

  const adminPanelMutationParams = {
    refetchQueries: [{ query: adminPanelQuery, variables: { slug: collective.slug }, context: API_V2_CONTEXT }],
  };
  const [archiveCollective] = useMutation(archiveCollectiveMutation, adminPanelMutationParams);
  const [unarchiveCollective] = useMutation(unarchiveCollectiveMutation, adminPanelMutationParams);

  const handleArchiveCollective = async ({ id }) => {
    setModal({ type: 'Archive', show: false });
    try {
      setArchiveStatus({ ...archiveStatus, processing: true });
      await archiveCollective({ variables: { id } });
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

  const handleUnarchiveCollective = async ({ id }) => {
    setModal({ type: 'Unarchive', show: false });
    try {
      setArchiveStatus({ ...archiveStatus, processing: true });
      await unarchiveCollective({ variables: { id } });
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

  const hasBalance = collective.stats.balance > 0 && (collective.type === 'COLLECTIVE' || collective.type === 'FUND');

  const closeModal = () => setModal({ ...modal, show: false });

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start" mb={50}>
      <SettingsSectionTitle>
        <FormattedMessage
          id="collective.archive.title"
          defaultMessage="Archive {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}"
          values={{ type: collective.type }}
        />
      </SettingsSectionTitle>
      {!isArchived && (
        <P mb={3} lineHeight="16px" fontSize="14px">
          <FormattedMessage
            id="collective.archive.description"
            defaultMessage="Archiving {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}} means it will visually appear inactive and no new activity will be allowed."
            values={{ type: collective.type }}
          />
          &nbsp;
          {collective.type === 'COLLECTIVE' && (
            <FormattedMessage
              id="collective.archive.subscriptions"
              defaultMessage="Recurring financial contributions will be automatically canceled, and all pending expenses will be marked as canceled."
            />
          )}
        </P>
      )}
      {error && (
        <P my={3} color="#ff5252">
          {error}
        </P>
      )}
      {!isArchived && (
        <Button
          onClick={() => setModal({ type: 'Archive', show: true })}
          loading={processing}
          disabled={collective.isHost || hasBalance}
          variant="outline"
        >
          <FormattedMessage
            id="collective.archive.title"
            defaultMessage="Archive {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}"
            values={{ type: collective.type }}
          />
        </Button>
      )}
      {!isArchived && hasBalance && (
        <P color="rgb(224, 183, 0)" my={1}>
          <FormattedMessage
            id="collective.archive.availableBalance"
            defaultMessage="Only {type, select, EVENT {Events} PROJECT {Projects} FUND {Funds} COLLECTIVE {Collectives} other {Accounts}} with a balance of zero can be archived. To pay out the funds, submit an expense, donate to another Collective, or send the funds to your Fiscal Host using the 'empty balance' option."
            values={{ type: collective.type }}
          />
        </P>
      )}
      {!isArchived && collective.isHost && (
        <P color="rgb(224, 183, 0)" my={1}>
          {collective.type === CollectiveType.COLLECTIVE ? (
            <FormattedMessage
              id="collective.archive.selfHosted"
              defaultMessage={`To archive this Independent Collective, first go to your <SettingsLink>Fiscal Host settings</SettingsLink> and click 'Reset Fiscal Host'.`}
              values={{ SettingsLink: getI18nLink({ href: `/dashboard/${collective.host?.slug}/host` }) }}
            />
          ) : (
            <FormattedMessage
              id="collective.archive.isHost"
              defaultMessage="You can't archive {type, select, ORGANIZATION {your Organization} other {your account}} while being a Host. Please deactivate as Host first (in your Fiscal Hosting settings)."
              values={{ type: collective.type }}
            />
          )}
        </P>
      )}
      {isArchived && confirmationMsg && (
        <MessageBox withIcon type="info" mb={4}>
          {confirmationMsg}
        </MessageBox>
      )}

      {isArchived && (
        <Button variant="outline" onClick={() => setModal({ type: 'Unarchive', show: true })} loading={processing}>
          <FormattedMessage
            id="collective.unarchive.button"
            defaultMessage="Unarchive {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}"
            values={{ type: collective.type }}
          />
        </Button>
      )}

      {modal.show && (
        <StyledModal onClose={closeModal}>
          <ModalHeader onClose={closeModal}>
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
              {modal.type !== 'Unarchive' && (
                <React.Fragment>
                  <FormattedMessage
                    id="archive.account.confirmation"
                    defaultMessage="Are you sure you want to archive {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}?"
                    values={{ type: collective.type }}
                  />
                  <MessageBox fontSize={13} type="warning" withIcon mt={4}>
                    <FormattedMessage
                      defaultMessage="Note that archiving will cancel all active recurring contributions."
                      id="kyC4C+"
                    />
                  </MessageBox>
                </React.Fragment>
              )}
              {modal.type === 'Unarchive' && (
                <FormattedMessage
                  id="unarchive.account.confirmation"
                  defaultMessage="Are you sure you want to unarchive {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}?"
                  values={{ type: collective.type }}
                />
              )}
            </P>
          </ModalBody>
          <ModalFooter showDivider={false}>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setModal({ ...modal, show: false })}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                buttonStyle="primary"
                data-cy="action"
                onClick={() => {
                  if (modal.type === 'Unarchive') {
                    handleUnarchiveCollective({ id: collective.id });
                  } else {
                    handleArchiveCollective({ id: collective.id });
                  }
                }}
              >
                {modal.type === 'Unarchive' ? (
                  <FormattedMessage id="collective.unarchive.confirm.btn" defaultMessage="Unarchive" />
                ) : (
                  <FormattedMessage id="collective.archive.confirm.btn" defaultMessage="Archive" />
                )}
              </Button>
            </div>
          </ModalFooter>
        </StyledModal>
      )}
    </Container>
  );
};

ArchiveCollective.propTypes = {
  collective: PropTypes.object.isRequired,
  archiveCollective: PropTypes.func,
  unarchiveCollective: PropTypes.func,
};

export default ArchiveCollective;
