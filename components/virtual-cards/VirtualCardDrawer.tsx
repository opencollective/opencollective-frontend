import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { VirtualCard as GraphQLVirtualCard } from '../../lib/graphql/types/v2/graphql';
import { VirtualCardStatus } from '../../lib/graphql/types/v2/graphql';
import { getAvailableLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import { accountHoverCardFields } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import { Drawer, DrawerActions, DrawerHeader } from '../Drawer';
import EditVirtualCardModal from '../edit-collective/EditVirtualCardModal';
import { ActionsButton, CardContainer, CardDetails, StateLabel } from '../edit-collective/VirtualCard';
import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import { InfoList, InfoListItem } from '../ui/InfoList';
import { useToast } from '../ui/useToast';

import { StripeVirtualCardComplianceStatement } from './StripeVirtualCardComplianceStatement';

type VirtualCardDrawerProps = {
  open: boolean;
  onClose: () => void;
  virtualCardId: string;
  canEditVirtualCard?: boolean;
  canDeleteVirtualCard?: boolean;
  onDeleteRefetchQuery?: string;
};

const virtualCardQuery = gql`
  query VirtualCardDrawer($virtualCard: VirtualCardReferenceInput!) {
    virtualCard(virtualCard: $virtualCard) {
      id
      name
      last4
      data
      privateData
      provider
      spendingLimitAmount
      spendingLimitInterval
      spendingLimitRenewsOn
      remainingLimit
      currency
      createdAt
      status
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
        slug
        stripe {
          username
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

export default function VirtualCardDrawer(props: VirtualCardDrawerProps) {
  const intl = useIntl();
  const { toast } = useToast();

  const [isEditingVirtualCard, setIsEditingVirtualCard] = React.useState(false);

  const query = useQuery<{ virtualCard: GraphQLVirtualCard }>(virtualCardQuery, {
    context: API_V2_CONTEXT,
    skip: !props.open,
    variables: {
      virtualCard: {
        id: props.virtualCardId,
      },
    },
  });

  const handleEditSuccess = React.useCallback(
    message => {
      setIsEditingVirtualCard(false);
      toast({
        variant: 'success',
        message: message,
      });
    },
    [toast],
  );

  const { loading, data, error } = query;
  const virtualCard = data?.virtualCard;

  return (
    <Drawer
      maxWidth="512px"
      open={props.open}
      onClose={props.onClose}
      showActionsContainer
      data-cy="virtual-card-drawer"
    >
      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBox type="error" withIcon mt={2}>
          {i18nGraphqlException(intl, error)}
        </MessageBox>
      ) : (
        virtualCard && (
          <React.Fragment>
            <DrawerHeader title={virtualCard?.name} onClose={props.onClose} />
            <CardContainer mt="24px" width="366px" height="248px" flexDirection="column">
              <div />
              <Box flexGrow={1} m="24px 24px 0 24px">
                <Flex fontSize="16px" lineHeight="24px" fontWeight="500" justifyContent="space-between">
                  <Box>{virtualCard.name}</Box>
                  {/* @ts-expect-error StateLabel is not typed */}
                  <StateLabel isActive={virtualCard.status === VirtualCardStatus.ACTIVE}>
                    {virtualCard.status}
                  </StateLabel>
                </Flex>
                <CardDetails virtualCard={virtualCard} />
              </Box>
            </CardContainer>

            <InfoList className="mt-8 sm:grid-cols-2">
              <InfoListItem
                className="sm:col-span-2"
                title={<FormattedMessage defaultMessage="Account" />}
                value={
                  <LinkCollective
                    collective={virtualCard.account}
                    className="flex items-center gap-2 font-medium hover:underline"
                    withHoverCard
                  >
                    <Avatar collective={virtualCard.account} radius={24} /> {virtualCard.account.name}
                  </LinkCollective>
                }
              />

              <InfoListItem
                title={<FormattedMessage defaultMessage="Assigned to" />}
                value={
                  <LinkCollective
                    collective={virtualCard.assignee}
                    className="flex items-center gap-2 font-medium hover:underline"
                    withHoverCard
                    hoverCardProps={{ includeAdminMembership: { accountSlug: virtualCard.account.slug } }}
                  >
                    <Avatar collective={virtualCard.assignee} radius={24} /> {virtualCard.assignee.name}
                  </LinkCollective>
                }
              />

              <InfoListItem
                title={<FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />}
                value={<DateTime dateStyle="medium" value={virtualCard.createdAt} />}
              />
              <InfoListItem
                title={<FormattedMessage defaultMessage="Available balance" />}
                value={getAvailableLimitShortString(
                  intl,
                  virtualCard.currency,
                  virtualCard.remainingLimit,
                  virtualCard.spendingLimitAmount,
                  virtualCard.spendingLimitInterval,
                  {
                    AvailableAmount: I18nBold,
                    AmountSeparator: v => <strong>&nbsp;{v}&nbsp;</strong>,
                    LimitAmount: v => <span className="italic text-slate-600">{v}</span>,
                    LimitInterval: v => <span className="italic text-slate-600">{v}</span>,
                  },
                )}
              />

              {virtualCard.spendingLimitRenewsOn && (
                <InfoListItem
                  title={<FormattedMessage defaultMessage="Renews on" />}
                  value={<DateTime dateStyle="medium" value={virtualCard.spendingLimitRenewsOn} />}
                />
              )}
              <InfoListItem className="sm:col-span-2" value={<StripeVirtualCardComplianceStatement />} />
            </InfoList>
          </React.Fragment>
        )
      )}

      {virtualCard && props.open && (
        <DrawerActions>
          <Flex justifyContent="space-between" width="100%">
            <ActionsButton
              virtualCard={virtualCard}
              host={virtualCard.host}
              onError={error => toast({ variant: 'error', message: i18nGraphqlException(intl, error) })}
              canDeleteVirtualCard={props.canDeleteVirtualCard}
              onDeleteRefetchQuery={props.onDeleteRefetchQuery}
              hideViewTransactions
              // eslint-disable-next-line react/display-name
              as={React.forwardRef((props, ref: React.ForwardedRef<HTMLButtonElement>) => {
                return (
                  <StyledButton {...props} ref={ref}>
                    <FormattedMessage defaultMessage="More actions" />
                  </StyledButton>
                );
              })}
            />

            <Flex gap="8px">
              <StyledButton
                as={Link}
                href={`/${virtualCard.account.slug}/transactions?virtualCard=${virtualCard?.id}`}
                buttonStyle="secondary"
              >
                <FormattedMessage defaultMessage="View transactions" />
              </StyledButton>
              <StyledButton buttonStyle="primary" onClick={() => setIsEditingVirtualCard(true)}>
                <FormattedMessage defaultMessage="Edit Card Details" />
              </StyledButton>
            </Flex>
          </Flex>
          {isEditingVirtualCard && (
            <EditVirtualCardModal
              host={virtualCard.host}
              onSuccess={handleEditSuccess}
              onClose={() => setIsEditingVirtualCard(false)}
              virtualCard={virtualCard}
            />
          )}
        </DrawerActions>
      )}
    </Drawer>
  );
}
