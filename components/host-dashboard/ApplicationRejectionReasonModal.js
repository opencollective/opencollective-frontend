import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Lock } from '@styled-icons/feather/Lock';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Avatar, { ContributorAvatar } from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import LinkContributor from '../LinkContributor';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { P, Span } from '../Text';

const messages = defineMessages({
  placeholder: {
    id: 'appRejectionReason.placeholder',
    defaultMessage: 'Why is this application being rejected?',
  },
});

const ApplicationRejectionReasonModal = ({ collective, onClose, onConfirm, ...modalProps }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const intl = useIntl();
  const isLegacyAPI = !collective.admins;
  const admins = collective.admins?.nodes || collective.coreContributors; // compatibility with GQLV1
  const totalAdminCount = collective.admins?.totalCount || admins.length;

  return (
    <Modal onClose={onClose} width="576px" {...modalProps}>
      <ModalHeader hideCloseIcon>
        <Flex justifyContent="space-between" flexDirection={['column', 'row']} width="100%">
          <Flex>
            <Avatar collective={collective} radius={40} />
            <Box ml={3}>
              <P fontSize="16px" lineHeight="24px" fontWeight="bold">
                {collective.name}
              </P>
              {collective.website && (
                <P fontSize="12px" lineHeight="16px" fontWeight="400">
                  <StyledLink href={collective.website} color="black.700" openInNewTabNoFollow>
                    {collective.website}
                  </StyledLink>
                </P>
              )}
            </Box>
          </Flex>
          {totalAdminCount > 0 && (
            <Box mt={[3, 0]}>
              <Flex alignItems="center">
                <Span color="black.500" fontSize="12px" fontWeight="500" letterSpacing="0.06em">
                  <FormattedMessage id="Admins" defaultMessage="Admins" />
                </Span>
              </Flex>
              <Flex mt={2} alignItems="center">
                {admins.slice(0, 6).map(admin => (
                  <Box key={admin.id} mr={1}>
                    {isLegacyAPI ? (
                      <LinkContributor contributor={admin}>
                        <ContributorAvatar contributor={admin} radius="24px" />
                      </LinkContributor>
                    ) : (
                      <LinkCollective collective={admin.account}>
                        <Avatar collective={admin.account} radius="24px" />
                      </LinkCollective>
                    )}
                  </Box>
                ))}
                {totalAdminCount > 6 && (
                  <Container ml={2} pt="0.7em" fontSize="12px" color="black.600">
                    + {totalAdminCount - 6}
                  </Container>
                )}
              </Flex>
            </Box>
          )}
        </Flex>
      </ModalHeader>
      <ModalBody>
        <P color="red.900" fontSize="16px" lineHeight="24px" mb={2} mt={26}>
          <FormattedMessage
            id="OptionalFieldLabel"
            defaultMessage="{field} (optional)"
            values={{
              field: (
                <FormattedMessage
                  id="ApplicationRejectionReasonModal.Help"
                  defaultMessage="Help {accountName} understand why you rejected their application"
                  values={{ accountName: collective.name }}
                />
              ),
            }}
          />
        </P>
        <P color="black.700" lineHeight="20px" mb={2}>
          <FormattedMessage
            id="PrivateMessageToCollectiveAdmins"
            defaultMessage="The message will be sent as a private email to the admins."
          />
          &nbsp;&nbsp;
          <Lock size="1.1em" />
        </P>
        <Container>
          <StyledTextarea
            width="100%"
            resize="none"
            autoSize={true}
            minHeight={200}
            value={rejectionReason}
            onChange={({ target }) => setRejectionReason(target.value)}
            placeholder={intl.formatMessage(messages.placeholder)}
          />
          <P mt={1} fontSize="11px" color="black.600">
            <FormattedMessage id="forms.optional" defaultMessage="Optional" />
          </P>
        </Container>
      </ModalBody>
      <ModalFooter isFullWidth>
        <Container display="flex" justifyContent="flex-end">
          <StyledButton buttonStyle="dangerSecondary" mx={20} minWidth={95} onClick={onClose}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
          <StyledButton buttonStyle="danger" data-cy="action" minWidth={95} onClick={() => onConfirm(rejectionReason)}>
            <FormattedMessage id="actions.reject" defaultMessage="Reject" />
          </StyledButton>
        </Container>
      </ModalFooter>
    </Modal>
  );
};

ApplicationRejectionReasonModal.propTypes = {
  collective: PropTypes.object.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ApplicationRejectionReasonModal;
