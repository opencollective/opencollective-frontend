import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { VirtualCardRequest } from '../../lib/graphql/types/v2/graphql';
import { VirtualCardRequestStatus } from '../../lib/graphql/types/v2/graphql';
import { getSpendingLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import { accountHoverCardFields } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import { Drawer, DrawerActions, DrawerHeader } from '../Drawer';
import EditVirtualCardModal from '../edit-collective/EditVirtualCardModal';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledTag from '../StyledTag';
import { InfoList, InfoListItem } from '../ui/InfoList';
import { useToast } from '../ui/useToast';
import { StripeVirtualCardComplianceStatement } from '../virtual-cards/StripeVirtualCardComplianceStatement';

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
        ...AccountHoverCardFields
      }
      assignee {
        id
        name
        email
        slug
        imageUrl
        ...AccountHoverCardFields
      }
      host {
        id
        name
        slug
        imageUrl
      }
    }
  }
  ${accountHoverCardFields}
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
  const { toast } = useToast();

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
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  }, [rejectRequestMutation, intl]);
  const loading = rejectRequestMutationResult.loading;

  if (!virtualCardRequest || virtualCardRequest.status !== VirtualCardRequestStatus.PENDING) {
    return null;
  }

  return (
    <React.Fragment>
      <DrawerActions>
        <div className="flex w-full justify-end gap-2">
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
        </div>
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
            <DrawerHeader
              title={virtualCardRequest?.purpose}
              statusTag={
                <StyledTag
                  width="100px"
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
              }
              onClose={props.onClose}
            />

            <InfoList className="sm:grid-cols-2">
              <InfoListItem
                title={<FormattedMessage defaultMessage="Account" />}
                value={
                  <LinkCollective
                    collective={virtualCardRequest.account}
                    className="flex items-center gap-2 font-medium hover:underline"
                    withHoverCard
                  >
                    <Avatar collective={virtualCardRequest.account} radius={24} /> {virtualCardRequest.account.name}
                  </LinkCollective>
                }
              />
              <InfoListItem
                title={<FormattedMessage defaultMessage="Assigned to" />}
                value={
                  <LinkCollective
                    collective={virtualCardRequest.assignee}
                    className="flex items-center gap-2 font-medium hover:underline"
                    withHoverCard
                    hoverCardProps={{ includeAdminMembership: { accountSlug: virtualCardRequest.account.slug } }}
                  >
                    <Avatar collective={virtualCardRequest.assignee} radius={24} /> {virtualCardRequest.assignee.name}
                  </LinkCollective>
                }
              />
              <InfoListItem
                title={<FormattedMessage id="VirtualCards.SpendingLimit" defaultMessage="Spending Limit" />}
                value={getSpendingLimitShortString(
                  intl,
                  virtualCardRequest.currency,
                  virtualCardRequest.spendingLimitAmount,
                  virtualCardRequest.spendingLimitInterval,
                  {
                    LimitAmount: v => <span className="italic text-slate-600">{v}</span>,
                    LimitInterval: v => <span className="italic text-slate-600">{v}</span>,
                  },
                )}
              />

              <InfoListItem
                title={<FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />}
                value={<DateTime dateStyle="medium" value={virtualCardRequest.createdAt} />}
              />
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage id="expense.notes" defaultMessage="Notes" />}
                value={<p className="whitespace-pre-line">{virtualCardRequest.notes}</p>}
              />
              <InfoListItem className="sm:col-span-2" value={<StripeVirtualCardComplianceStatement />} />
            </InfoList>

            <VirtualCardRequestDrawerActions virtualCardRequest={virtualCardRequest} />
          </React.Fragment>
        )
      )}
    </Drawer>
  );
}
