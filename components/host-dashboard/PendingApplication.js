import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { ExternalLink } from '@styled-icons/feather/ExternalLink';
import { Mail } from '@styled-icons/feather/Mail';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { padding } from 'styled-system';

import { getCollectiveMainTag } from '../../lib/collective.lib';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { i18nOCFApplicationFormLabel } from '../../lib/i18n/ocf-form';
import { CustomScrollbarCSS } from '../../lib/styled-components-shared-styles';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import I18nCollectiveTags from '../I18nCollectiveTags';
import CommentIcon from '../icons/CommentIcon';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import StyledRoundButton from '../StyledRoundButton';
import StyledTag from '../StyledTag';
import { P, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

import AcceptRejectButtons from './AcceptRejectButtons';
import ApplicationMessageModal from './ApplicationMessageModal';

const ApplicationBody = styled.div`
  height: 267px;
  overflow-y: auto;

  ${padding}
  ${CustomScrollbarCSS}

  @media (pointer: fine) {
    &::-webkit-scrollbar {
      width: 4px;
      border-radius: 8px;
    }
  }
`;

const CollectiveCardBody = styled.div`
  padding: 8px 16px 16px 16px;
  overflow-y: auto;
  height: 100%;
  ${CustomScrollbarCSS}
  @media (pointer: fine) {
    &::-webkit-scrollbar {
      width: 4px;
      border-radius: 8px;
    }
  }
`;

export const processApplicationAccountFields = gqlV2/* GraphQL */ `
  fragment ProcessHostApplicationFields on AccountWithHost {
    isActive
    approvedAt
    isApproved
    host {
      id
    }
  }
`;

export const processApplicationMutation = gqlV2/* GraphQL */ `
  mutation ProcessHostApplication(
    $host: AccountReferenceInput!
    $account: AccountReferenceInput!
    $action: ProcessHostApplicationAction!
    $message: String
  ) {
    processHostApplication(host: $host, account: $account, action: $action, message: $message) {
      account {
        id
        ... on AccountWithHost {
          ...ProcessHostApplicationFields
        }
      }
      conversation {
        id
        slug
      }
    }
  }
  ${processApplicationAccountFields}
`;

const msg = defineMessages({
  approved: {
    id: 'HostApplication.Approved',
    defaultMessage: '{name} has been approved',
  },
  rejected: {
    id: 'HostApplication.Rejected',
    defaultMessage: '{name} has been rejected',
  },
});

const ACTIONS = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SEND_PRIVATE_MESSAGE: 'SEND_PRIVATE_MESSAGE',
  SEND_PUBLIC_MESSAGE: 'SEND_PUBLIC_MESSAGE',
};

const StatusTag = ({ status }) => {
  const tagProps = { textTransform: 'uppercase', mr: 2 };

  switch (status) {
    case 'PENDING':
      return (
        <StyledTag {...tagProps} type="warning">
          <FormattedMessage id="Pending" defaultMessage="Pending" />
        </StyledTag>
      );
    case 'APPROVED':
      return (
        <StyledTag {...tagProps} type="success">
          <FormattedMessage id="PendingApplication.Approved" defaultMessage="Approved" />
        </StyledTag>
      );
    case 'REJECTED':
      return (
        <StyledTag {...tagProps} type="error">
          <FormattedMessage id="PendingApplication.Rejected" defaultMessage="Rejected" />
        </StyledTag>
      );
    default:
      return null;
  }
};

StatusTag.propTypes = {
  status: PropTypes.oneOf(['PENDING', 'REJECTED', 'APPROVED']),
};

const getStatus = (isDone, latestAction) => {
  if (!isDone) {
    return 'PENDING';
  } else if (latestAction === ACTIONS.REJECT) {
    return 'REJECTED';
  } else if (latestAction === ACTIONS.APPROVE) {
    return 'APPROVED';
  }
};

const getSuccessToast = (intl, action, collective, result) => {
  if (action === ACTIONS.SEND_PRIVATE_MESSAGE || action === ACTIONS.SEND_PUBLIC_MESSAGE) {
    const conversation = get(result, 'data.processHostApplication.conversation');
    return {
      type: TOAST_TYPE.SUCCESS,
      duration: 10000,
      title: conversation ? (
        <FormattedMessage id="Conversation.created" defaultMessage="Conversation created" />
      ) : (
        <FormattedMessage id="MessageSent" defaultMessage="Message sent" />
      ),
      message: conversation && (
        <StyledLink
          as={Link}
          openInNewTab
          route="conversation"
          params={{ collectiveSlug: collective.slug, id: conversation.id, slug: conversation.slug }}
        >
          <FormattedMessage id="Conversation.view" defaultMessage="View conversation" />
          &nbsp;
          <ExternalLink size="1em" style={{ verticalAlign: 'middle' }} />
        </StyledLink>
      ),
    };
  } else if (action === ACTIONS.APPROVE) {
    return {
      type: TOAST_TYPE.SUCCESS,
      message: intl.formatMessage(msg.approved, { name: collective.name }),
    };
  } else if (action === ACTIONS.REJECT) {
    return {
      type: TOAST_TYPE.SUCCESS,
      message: intl.formatMessage(msg.rejected, { name: collective.name }),
    };
  } else {
    return { type: TOAST_TYPE.SUCCESS };
  }
};

const PendingApplication = ({ host, application, ...props }) => {
  const intl = useIntl();
  const [isDone, setIsDone] = React.useState(false);
  const [latestAction, setLatestAction] = React.useState(null);
  const [showContactModal, setShowContactModal] = React.useState(false);
  const { addToast } = useToasts();
  const collective = application.account;
  const [callProcessApplication, { loading }] = useMutation(processApplicationMutation, {
    context: API_V2_CONTEXT,
  });

  const processApplication = async (action, message, onSuccess) => {
    setIsDone(false);
    setLatestAction(action);
    try {
      const variables = { host: { id: host.id }, account: { id: collective.id }, action, message };
      const result = await callProcessApplication({ variables });
      addToast(getSuccessToast(intl, action, collective, result));
      if (action === ACTIONS.APPROVE || action === ACTIONS.REJECT) {
        setIsDone(true);
      }
      if (onSuccess) {
        onSuccess();
      }
      return result;
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <Container
      id={`application-${collective.legacyId}`}
      display="flex"
      flexDirection={['column', 'row']}
      border="1px solid #DCDEE0"
      borderRadius="16px"
    >
      <StyledCollectiveCard
        collective={collective}
        bodyHeight={258}
        width={['100%', 224]}
        borderRadius={[16, '16px 0 0 16px']}
        borderWidth="0"
        showWebsite
        tag={
          <Flex mt={12}>
            <StatusTag status={getStatus(isDone, latestAction)} />
            <StyledTag variant="rounded-right">
              <I18nCollectiveTags
                tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags, collective.type)}
              />
            </StyledTag>
          </Flex>
        }
        {...props}
      >
        <CollectiveCardBody>
          {collective.admins.totalCount > 0 && (
            <Box>
              <Flex alignItems="center">
                <Span
                  color="black.500"
                  fontSize="9px"
                  textTransform="uppercase"
                  fontWeight="500"
                  letterSpacing="0.06em"
                >
                  <FormattedMessage id="Admins" defaultMessage="Admins" />
                </Span>
                <StyledHr borderColor="black.300" flex="1 1" ml={2} />
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
          {collective.description && (
            <Box mt={3}>
              <Flex alignItems="center">
                <Span
                  color="black.500"
                  fontSize="9px"
                  textTransform="uppercase"
                  fontWeight="500"
                  letterSpacing="0.06em"
                >
                  <FormattedMessage id="OurPurpose" defaultMessage="Our purpose" />
                </Span>
                <StyledHr borderColor="black.300" flex="1 1" ml={2} />
              </Flex>
              <P mt={1} fontSize="12px" lineHeight="18px" color="black.800">
                {collective.description}
              </P>
            </Box>
          )}
        </CollectiveCardBody>
      </StyledCollectiveCard>
      <Container
        background="white"
        flex="1 1"
        borderLeft={[null, '1px solid #DCDEE0']}
        borderRadius={[16, '0 16px 16px 0']}
        minWidth={300}
        display="flex"
        flexDirection="column"
        alignItems="space-between"
        height={332}
      >
        <Container px="4px" position="relative">
          <ApplicationBody p={[12, 22]}>
            <Flex alignItems="center" mb={3}>
              <CommentIcon size={16} />
              <Span fontSize="11px" fontWeight="500" color="black.500" textTransform="uppercase" mx={2}>
                <FormattedMessage id="PendingApplication.Message" defaultMessage="Message for fiscal host" />
              </Span>
              <StyledHr borderColor="black.200" flex="1 1" />
            </Flex>
            {application.message && (
              <P
                as="q"
                fontSize={['14px', '16px']}
                lineHeight="24px"
                fontStyle="italic"
                color="black.800"
                fontWeight="400"
              >
                {application.message}
              </P>
            )}
            {!application.message && !application.customData && (
              <P color="black.500">
                <FormattedMessage id="NoMessage" defaultMessage="No message provided" />
              </P>
            )}
            {application.customData &&
              Object.keys(application.customData).map(key => (
                <Container my={3} key={key}>
                  <Span fontSize="11px" fontWeight="500" color="black.500" textTransform="uppercase" mx={2}>
                    {i18nOCFApplicationFormLabel(intl, key)}
                  </Span>
                  <pre>{application.customData[key]}</pre>
                </Container>
              ))}
          </ApplicationBody>
        </Container>
        {!isDone && (
          <Container
            display="flex"
            p={3}
            justifyContent="space-between"
            alignItems="center"
            borderTop="1px solid #DCDEE0"
            boxShadow="0px -2px 4px 0px rgb(49 50 51 / 6%)"
          >
            <Flex alignItems="center">
              <StyledRoundButton size={32} onClick={() => setShowContactModal(true)}>
                <Mail size={15} color="#4E5052" />
              </StyledRoundButton>
            </Flex>
            <AcceptRejectButtons
              collective={collective}
              isLoading={loading}
              onApprove={() => processApplication(ACTIONS.APPROVE)}
              onReject={message => processApplication(ACTIONS.REJECT, message)}
            />
          </Container>
        )}
      </Container>
      <ApplicationMessageModal
        show={showContactModal}
        collective={collective}
        onClose={() => setShowContactModal(false)}
        onConfirm={(message, isPrivate, resetMessage) => {
          setShowContactModal(false);
          const action = isPrivate ? ACTIONS.SEND_PRIVATE_MESSAGE : ACTIONS.SEND_PUBLIC_MESSAGE;
          processApplication(action, message, resetMessage);
        }}
      />
    </Container>
  );
};

PendingApplication.propTypes = {
  host: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  application: PropTypes.shape({
    message: PropTypes.string,
    customData: PropTypes.object,
    account: PropTypes.shape({
      id: PropTypes.string.isRequired,
      legacyId: PropTypes.number,
      slug: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      isApproved: PropTypes.bool,
      tags: PropTypes.array,
      type: PropTypes.string,
      host: PropTypes.shape({
        id: PropTypes.string,
      }),
      admins: PropTypes.shape({
        totalCount: PropTypes.number,
        nodes: PropTypes.array,
      }),
    }).isRequired,
  }),
};

export default PendingApplication;
