import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Lock } from '@styled-icons/feather/Lock';
import { FormattedMessage } from 'react-intl';

import Avatar from '../../../Avatar';
import Container from '../../../Container';
import { Box, Flex } from '../../../Grid';
import LinkCollective from '../../../LinkCollective';
import StyledButton from '../../../StyledButton';
import StyledCheckbox from '../../../StyledCheckbox';
import StyledLink from '../../../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../../StyledModal';
import StyledTextarea from '../../../StyledTextarea';
import { P, Span } from '../../../Text';

const ApplicationMessageModal = ({ collective, onClose, onConfirm, ...modalProps }) => {
  const [message, _setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const setMessage = useCallback(_setMessage, [_setMessage]);

  return (
    <StyledModal onClose={onClose} width="576px" {...modalProps} trapFocus>
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
          {collective.admins.totalCount > 0 && (
            <Box mt={[3, 0]}>
              <Flex alignItems="center">
                <Span color="black.500" fontSize="12px" fontWeight="500" letterSpacing="0.06em">
                  <FormattedMessage id="Admins" defaultMessage="Admins" />
                </Span>
              </Flex>
              <Flex mt={2} alignItems="center">
                {collective.admins.nodes.slice(0, 6).map(admin => (
                  <Box key={admin.id} mr={1}>
                    <LinkCollective collective={admin.account}>
                      <Avatar collective={admin.account} radius="24px" />
                    </LinkCollective>
                  </Box>
                ))}
                {collective.admins.totalCount > 6 && (
                  <Container ml={2} pt="0.7em" fontSize="12px" color="black.600">
                    + {collective.admins.totalCount - 6}
                  </Container>
                )}
              </Flex>
            </Box>
          )}
        </Flex>
      </ModalHeader>
      <ModalBody>
        <P fontSize="16px" lineHeight="24px" mb={2}>
          <FormattedMessage
            id="SendMessageTo"
            defaultMessage="Send a message to {accountName}"
            values={{ accountName: collective.name }}
          />
        </P>
        <P color="black.700" lineHeight="20px" mb={2}>
          <FormattedMessage
            id="HostApplicationMessageInfo"
            defaultMessage="The message will be public by default. If you want it to be private, tick the private checkbox."
          />
        </P>
        <Container>
          <StyledTextarea
            width="100%"
            resize="none"
            autoSize={true}
            minHeight={200}
            value={message}
            onChange={({ target }) => setMessage(target.value)}
            showCount
            minLength={3}
            maxLength={3000}
          />
          <Box mt={2}>
            <StyledCheckbox
              name="private"
              checked={isPrivate}
              onChange={({ checked }) => setIsPrivate(checked)}
              label={
                <Span>
                  <Lock size="1em" />
                  &nbsp;
                  <Span css={{ verticalAlign: 'middle' }}>
                    <FormattedMessage
                      id="ApplicationMessageModal.Private"
                      defaultMessage="Private (email to the Collective admins)"
                    />
                  </Span>
                </Span>
              }
            />
          </Box>
        </Container>
      </ModalBody>
      <ModalFooter isFullWidth>
        <Container display="flex" justifyContent="flex-end">
          <StyledButton buttonStyle="secondary" mx={20} minWidth={95} onClick={onClose}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
          <StyledButton
            buttonStyle="primary"
            data-cy="action"
            minWidth={95}
            onClick={() => onConfirm(message, isPrivate, () => setMessage(''))}
            disabled={!message}
          >
            <FormattedMessage id="SendMessage" defaultMessage="Send message" />
          </StyledButton>
        </Container>
      </ModalFooter>
    </StyledModal>
  );
};

ApplicationMessageModal.propTypes = {
  collective: PropTypes.object.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ApplicationMessageModal;
