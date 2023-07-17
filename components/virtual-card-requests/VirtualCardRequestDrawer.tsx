import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { VirtualCardRequest, VirtualCardRequestStatus } from '../../lib/graphql/types/v2/graphql';
import { getSpendingLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import Avatar from '../Avatar';
import DateTime from '../DateTime';
import Drawer, { DrawerActions } from '../Drawer';
import EditVirtualCardModal from '../edit-collective/EditVirtualCardModal';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import StyledTag from '../StyledTag';
import { H4, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const InfoLabel = styled.p`
  color: var(--dark-700, #4d4f51);
  font-size: 12px;
  font-family: Inter;
  font-style: normal;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.72px;
  text-transform: uppercase;
`;

const InfoValue = styled.p`
  color: #4d4f51;
  font-size: 14px;
  font-family: Inter;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
`;

const virtualCardRequestQuery = gql`
  query VirtualCardRequest($virtualCardRequest: VirtualCardRequestReferenceInput!) {
    virtualCardRequest(virtualCardRequest: $virtualCardRequest) {
      id
      purpose
      notes
      status
      currency
      spendingLimitAmount {
        valueInCents
        currency
      }
      spendingLimitInterval
      createdAt
      account {
        id
        name
        slug
        imageUrl
      }
      assignee {
        id
        name
        email
        slug
        imageUrl
      }
      host {
        id
        name
        slug
        imageUrl
      }
    }
  }
`;

const RejectVirtualCardRequestMutation = gql`
  mutation RejectVirtualCardRequest($virtualCardRequest: VirtualCardRequestReferenceInput!) {
    rejectVirtualCardRequest(virtualCardRequest: $virtualCardRequest) {
      id
      status
    }
  }
`;

function VirtualCardRequestDrawerActions({ virtualCardRequest }: { virtualCardRequest: VirtualCardRequest }) {
  const intl = useIntl();
  const { addToast } = useToasts();

  const [isVirtualCardModalOpen, setIsVirtualCardModalOpen] = React.useState(false);

  const [rejectRequestMutation, rejectRequestMutationResult] = useMutation(RejectVirtualCardRequestMutation, {
    context: API_V2_CONTEXT,
    variables: {
      virtualCardRequest: {
        id: virtualCardRequest.id,
      },
    },
  });

  const rejectRequest = React.useCallback(async () => {
    try {
      await rejectRequestMutation();
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
    }
  }, [rejectRequestMutation, intl]);
  const loading = rejectRequestMutationResult.loading;

  if (!virtualCardRequest || virtualCardRequest.status !== VirtualCardRequestStatus.PENDING) {
    return null;
  }

  return (
    <React.Fragment>
      <DrawerActions>
        <Flex width="100%" gap="8px" justifyContent="flex-end">
          <StyledButton loading={loading} buttonStyle="danger" onClick={rejectRequest}>
            <FormattedMessage id="actions.reject" defaultMessage="Reject" />
          </StyledButton>
          <StyledButton
            disabled={loading}
            loading={isVirtualCardModalOpen}
            onClick={() => setIsVirtualCardModalOpen(true)}
          >
            <FormattedMessage id="actions.approve" defaultMessage="Approve" />
          </StyledButton>
        </Flex>
      </DrawerActions>
      {isVirtualCardModalOpen && (
        <EditVirtualCardModal
          host={virtualCardRequest.host}
          collective={virtualCardRequest.account}
          onClose={() => setIsVirtualCardModalOpen(false)}
          onSuccess={() => setIsVirtualCardModalOpen(false)}
          virtualCardRequest={virtualCardRequest}
          virtualCard={{
            spendingLimitAmount: virtualCardRequest.spendingLimitAmount.valueInCents,
            spendingLimitInterval: virtualCardRequest.spendingLimitInterval,
            name: virtualCardRequest.purpose,
            assignee: virtualCardRequest.assignee,
          }}
        />
      )}
    </React.Fragment>
  );
}

type VirtualCardRequestDrawerProps = {
  virtualCardRequestId: number;
  open: boolean;
  onClose: () => void;
};

export function VirtualCardRequestDrawer(props: VirtualCardRequestDrawerProps) {
  const intl = useIntl();
  const query = useQuery<{ virtualCardRequest: VirtualCardRequest }>(virtualCardRequestQuery, {
    skip: !props.open,
    context: API_V2_CONTEXT,
    variables: {
      virtualCardRequest: {
        legacyId: props.virtualCardRequestId,
      },
    },
  });

  const { loading, error, data } = query;
  const virtualCardRequest = data?.virtualCardRequest;

  return (
    <Drawer
      maxWidth="512px"
      open={props.open}
      onClose={props.onClose}
      data-cy="virtual-card-request-drawer"
      showActionsContainer={virtualCardRequest?.status === VirtualCardRequestStatus.PENDING}
    >
      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBox type="error">{i18nGraphqlException(intl, error)}</MessageBox>
      ) : (
        virtualCardRequest && (
          <React.Fragment>
            <H4 fontSize="20px" fontWeight="700">
              {virtualCardRequest?.purpose}
            </H4>
            <StyledTag
              width="100px"
              mb="32px"
              textTransform="uppercase"
              fontWeight="bold"
              fontSize="12px"
              type={
                virtualCardRequest.status === VirtualCardRequestStatus.PENDING
                  ? 'warning'
                  : virtualCardRequest.status === VirtualCardRequestStatus.APPROVED
                  ? 'success'
                  : 'error'
              }
            >
              {virtualCardRequest?.status}
            </StyledTag>
            <Flex gap="32px" flexDirection="column">
              <Box>
                <InfoLabel>
                  <FormattedMessage id="expense.notes" defaultMessage="Notes" />
                </InfoLabel>
                <InfoValue>{virtualCardRequest.notes}</InfoValue>
              </Box>
              <Flex gap="32px">
                <Box>
                  <InfoLabel>
                    <FormattedMessage id="VirtualCards.SpendingLimit" defaultMessage="Spending Limit" />
                  </InfoLabel>
                  <InfoValue>
                    {getSpendingLimitShortString(
                      intl,
                      virtualCardRequest.currency,
                      virtualCardRequest.spendingLimitAmount,
                      virtualCardRequest.spendingLimitInterval,
                      {
                        LimitAmount: v => (
                          <Span fontSize="14px" fontWeight="normal" color="black.600" fontStyle="italic">
                            {v}
                          </Span>
                        ),
                        LimitInterval: v => (
                          <Span fontSize="14px" fontWeight="normal" color="black.600" fontStyle="italic">
                            {v}
                          </Span>
                        ),
                      },
                    )}
                  </InfoValue>
                </Box>
              </Flex>

              <Flex gap="32px">
                <Box>
                  <InfoLabel>
                    <FormattedMessage defaultMessage="Assigned to" />
                  </InfoLabel>
                  <Flex alignItems="center" gridGap={2}>
                    <Avatar collective={virtualCardRequest.assignee} radius={24} />
                    <StyledLink
                      as={LinkCollective}
                      collective={virtualCardRequest.assignee}
                      color="black.700"
                      truncateOverflow
                      textDecoration="underline"
                    />
                  </Flex>
                </Box>
                <Box>
                  <InfoLabel>
                    <FormattedMessage id="Collective" defaultMessage="Collective" />
                  </InfoLabel>
                  <Flex alignItems="center" gridGap={2}>
                    <Avatar collective={virtualCardRequest.account} radius={24} />
                    <StyledLink
                      as={LinkCollective}
                      collective={virtualCardRequest.account}
                      color="black.700"
                      truncateOverflow
                      textDecoration="underline"
                    />
                  </Flex>
                </Box>
              </Flex>
              <Box>
                <InfoLabel>
                  <FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />
                </InfoLabel>
                <InfoValue>
                  <DateTime dateStyle="medium" value={virtualCardRequest.createdAt} />
                </InfoValue>
              </Box>
            </Flex>
            <VirtualCardRequestDrawerActions virtualCardRequest={virtualCardRequest} />
          </React.Fragment>
        )
      )}
    </Drawer>
  );
}
