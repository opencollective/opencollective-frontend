import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Avatar from '../Avatar';
import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal from '../ConfirmationModal';
import Container from '../Container';
import { Flex } from '../Grid';
import Link from '../Link';
import OrdersPickerAsync from '../OrdersPickerAsync';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import StyledSelect from '../StyledSelect';
import StyledTag from '../StyledTag';
import { P, Span } from '../Text';
import { useToast } from '../ui/useToast';

const moveOrdersMutation = gql`
  mutation MoveOrdersMutation($orders: [OrderReferenceInput!]!, $tier: TierReferenceInput) {
    moveOrders(orders: $orders, tier: $tier) {
      id
      legacyId
      description
      createdAt
      amount {
        valueInCents
        currency
      }
      tier {
        id
        legacyId
      }
      fromAccount {
        id
        name
        slug
        isIncognito
        imageUrl(height: 48)
        ... on Individual {
          isGuest
        }
      }
      toAccount {
        id
        slug
        name
      }
    }
  }
`;

const accountTiersQuery = gql`
  query MoveContributionsTiersQuery($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      settings
      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            legacyId
            slug
            name
          }
        }
      }
    }
  }
`;

const getCallToAction = (selectedOrdersOptions, newTier) => {
  const base = `Move ${selectedOrdersOptions.length} contributions`;
  if (newTier === 'custom') {
    return `${base} to the "custom contribution" tier`;
  } else {
    return !newTier ? base : `${base} to "${newTier.name}" (#${newTier.legacyId})`;
  }
};

const getTierOption = tier => {
  return { value: tier, label: `#${tier.legacyId} - ${tier.name}` };
};

const getTiersOptions = (tiers, accountSettings) => {
  if (!tiers) {
    return [];
  }

  const tiersOptions = tiers.map(getTierOption);
  if (!accountSettings?.disableCustomContributions) {
    tiersOptions.unshift({ value: 'custom', label: 'Custom contribution' });
  }

  return tiersOptions;
};

const MoveReceivedContributions = () => {
  // Local state and hooks
  const intl = useIntl();
  const { toast } = useToast();
  const [receiverAccount, setReceiverAccount] = React.useState(null);
  const [hasConfirmationModal, setHasConfirmationModal] = React.useState(false);
  const [selectedOrdersOptions, setSelectedOrderOptions] = React.useState([]);
  const [newTier, setNewTier] = React.useState(false);
  const isValid = Boolean(receiverAccount && selectedOrdersOptions.length && newTier);
  const callToAction = getCallToAction(selectedOrdersOptions, newTier);

  // Fetch tiers
  const tiersQueryVariables = { accountSlug: receiverAccount?.slug };
  const tiersQueryOptions = { skip: !receiverAccount, variables: tiersQueryVariables, context: API_V2_CONTEXT };
  const { data: tiersData, loading: tiersLoading } = useQuery(accountTiersQuery, tiersQueryOptions);
  const tiersNodes = tiersData?.account.tiers?.nodes;
  const accountSettings = tiersData?.account.settings;
  const tiersOptions = React.useMemo(() => getTiersOptions(tiersNodes, accountSettings), [tiersNodes, accountSettings]);

  // Move contributions mutation
  const mutationOptions = { context: API_V2_CONTEXT };
  const [submitMoveContributions] = useMutation(moveOrdersMutation, mutationOptions);
  const moveContributions = async () => {
    try {
      // Prepare variables
      const ordersInputs = selectedOrdersOptions.map(({ value }) => ({ id: value.id }));
      const mutationVariables = {
        orders: ordersInputs,
        tier: newTier === 'custom' ? { isCustom: true } : { id: newTier.id },
      };

      // Submit
      await submitMoveContributions({ variables: mutationVariables });
      toast({ variant: 'success', title: 'Contributions moved successfully', message: callToAction });
      // Reset form and purge cache
      setHasConfirmationModal(false);
      setReceiverAccount(null);
      setNewTier(null);
      setSelectedOrderOptions([]);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <div>
      <StyledInputField htmlFor="receiverAccount" label="Account that received the contributions" flex="1 1">
        {({ id }) => (
          <CollectivePickerAsync
            inputId={id}
            collective={receiverAccount}
            isClearable
            onChange={option => {
              setReceiverAccount(option?.value || null);
              setSelectedOrderOptions([]);
              setNewTier(null);
            }}
          />
        )}
      </StyledInputField>

      <StyledInputField htmlFor="contributions" label="Select contributions" flex="1 1" mt={3}>
        {({ id }) => (
          <OrdersPickerAsync
            value={selectedOrdersOptions}
            inputId={id}
            onChange={options => setSelectedOrderOptions(options)}
            disabled={!receiverAccount}
            closeMenuOnSelect={false}
            account={receiverAccount}
            filter="INCOMING"
            includeIncognito
            isMulti
            isClearable
          />
        )}
      </StyledInputField>

      <StyledInputField htmlFor="tier" label="Select destination tier" flex="1 1" mt={3}>
        {({ id }) => (
          <StyledSelect
            inputId={id}
            disabled={!tiersData}
            isLoading={tiersLoading}
            onChange={({ value }) => setNewTier(value)}
            options={tiersOptions}
            value={!newTier ? null : getTierOption(newTier)}
          />
        )}
      </StyledInputField>

      <StyledButton
        mt={4}
        width="100%"
        buttonStyle="primary"
        disabled={!isValid}
        onClick={() => setHasConfirmationModal(true)}
      >
        {callToAction}
      </StyledButton>

      {hasConfirmationModal && (
        <ConfirmationModal
          header={callToAction}
          continueHandler={moveContributions}
          onClose={() => setHasConfirmationModal(false)}
        >
          <P>
            You&apos;re about to move {selectedOrdersOptions.length} orders to{' '}
            {newTier === 'custom' ? (
              'the custom contribution tier'
            ) : (
              <StyledLink
                as={Link}
                href={`/${receiverAccount.slug}/contribute/${newTier.slug}-${newTier.legacyId}`}
                openInNewTab
              >
                {newTier.name} (#{newTier.legacyId})
              </StyledLink>
            )}
            .
          </P>
          <Container maxHeight={300} overflowY="auto" border="1px solid lightgrey" borderRadius="8px" mt={3}>
            {selectedOrdersOptions.map(({ value: order }, index) => (
              <Container
                key={order.id}
                title={order.description}
                borderTop={!index ? undefined : '1px solid lightgrey'}
                p={2}
              >
                <Flex alignItems="center" title={order.description}>
                  <Avatar collective={order.receiverAccount} size={24} />
                  <StyledTag fontSize="10px" mx={2} minWidth={75}>
                    #{order.legacyId}
                  </StyledTag>
                  <Flex flexDirection="column">
                    <Span fontSize="13px">
                      {intl.formatDate(order.createdAt)}
                      {' - '}
                      {formatCurrency(order.amount.valueInCents, order.amount.currency, {
                        locale: intl.locale,
                      })}{' '}
                      contribution to @{order.toAccount.slug}
                    </Span>
                    <Span fontSize="13px">
                      Current tier:{' '}
                      {order.tier ? (
                        <StyledLink
                          as={Link}
                          href={`/${order.toAccount.slug}/contribute/${order.tier.slug}-${order.tier.legacyId}`}
                          openInNewTab
                        >
                          {order.tier.name}
                        </StyledLink>
                      ) : (
                        'Custom contribution'
                      )}
                    </Span>
                  </Flex>
                </Flex>
              </Container>
            ))}
          </Container>
        </ConfirmationModal>
      )}
    </div>
  );
};

MoveReceivedContributions.propTypes = {};

export default MoveReceivedContributions;
