import React, { useEffect } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { useFormik } from 'formik';
import { debounce } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import roles from '../../lib/constants/roles';
import { graphqlAmountValueInCents } from '../../lib/currency-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Account, VirtualCard, VirtualCardRequest } from '../../lib/graphql/types/v2/schema';
import { VirtualCardLimitInterval } from '../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import {
  VirtualCardLimitIntervalDescriptionsI18n,
  VirtualCardLimitIntervalI18n,
} from '../../lib/virtual-cards/constants';

import CollectivePicker, { FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { P, Span } from '../Text';
import { useToast } from '../ui/useToast';
import { StripeVirtualCardComplianceStatement } from '../virtual-cards/StripeVirtualCardComplianceStatement';

const editVirtualCardMutation = gql`
  mutation EditVirtualCard(
    $virtualCard: VirtualCardReferenceInput!
    $name: String!
    $limitAmount: AmountInput
    $limitInterval: VirtualCardLimitInterval
    $assignee: AccountReferenceInput!
  ) {
    editVirtualCard(
      virtualCard: $virtualCard
      name: $name
      limitAmount: $limitAmount
      limitInterval: $limitInterval
      assignee: $assignee
    ) {
      id
      name
      spendingLimitAmount
      spendingLimitInterval
      assignee {
        id
        name
        slug
        imageUrl
      }
    }
  }
`;

const createVirtualCardMutation = gql`
  mutation CreateVirtualCard(
    $name: String!
    $limitAmount: AmountInput!
    $limitInterval: VirtualCardLimitInterval!
    $account: AccountReferenceInput!
    $assignee: AccountReferenceInput!
    $virtualCardRequest: VirtualCardRequestReferenceInput
  ) {
    createVirtualCard(
      name: $name
      limitAmount: $limitAmount
      limitInterval: $limitInterval
      account: $account
      assignee: $assignee
      virtualCardRequest: $virtualCardRequest
    ) {
      id
      name
      last4
      data
      virtualCardRequest {
        id
        status
      }
    }
  }
`;

// TODO : refactor this mutation
const collectiveMembersQuery = gql`
  query CollectiveMembers($slug: String!) {
    account(slug: $slug) {
      id
      members(role: ADMIN) {
        nodes {
          id
          account {
            id
            name
            imageUrl
            slug
          }
        }
      }
    }
  }
`;

export const virtualCardsAssignedToCollectiveQuery = gql`
  query VirtualCardsAssignedToCollective($hostSlug: String!, $collectiveSlug: String!) {
    host(slug: $hostSlug) {
      id
      allCards: hostedVirtualCards(collectiveAccountIds: [{ slug: $collectiveSlug }], status: [ACTIVE, INACTIVE]) {
        totalCount
      }
      cardsMissingReceipts: hostedVirtualCards(
        collectiveAccountIds: [{ slug: $collectiveSlug }]
        status: [ACTIVE, INACTIVE]
        hasMissingReceipts: true
      ) {
        totalCount
      }
    }
  }
`;

const VirtualCardPoliciesQuery = gql`
  query VirtualCardPolicies($slug: String) {
    account(slug: $slug) {
      id
      policies {
        id
        MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL {
          ALL_TIME {
            valueInCents
          }
          DAILY {
            valueInCents
          }
          MONTHLY {
            valueInCents
          }
          PER_AUTHORIZATION {
            valueInCents
          }
          WEEKLY {
            valueInCents
          }
          YEARLY {
            valueInCents
          }
        }
      }
    }
  }
`;

const throttledCall = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 750);

type EditVirtualCardModalProps = {
  host: Account;
  collective?: Account;
  virtualCard?: VirtualCard;
  virtualCardRequest?: VirtualCardRequest;
  onSuccess: (el: React.ReactNode) => void;
  onClose: () => void;
  modalProps?: any;
};

export default function EditVirtualCardModal({
  host,
  collective,
  virtualCard,
  onSuccess,
  onClose,
  modalProps,
  virtualCardRequest,
}: EditVirtualCardModalProps) {
  const { toast } = useToast();

  const { data: policyData, loading: isLoadingPolicy } = useQuery(VirtualCardPoliciesQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: host.slug,
    },
  });

  const MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL =
    policyData?.account?.policies?.MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL;

  const isEditing = virtualCard?.id ? true : false;
  const formMutation = isEditing ? editVirtualCardMutation : createVirtualCardMutation;

  const [submitForm, { loading: isBusy }] = useMutation(formMutation, {
    context: API_V2_CONTEXT,
  });
  const [getCollectiveUsers, { loading: isLoadingUsers, data: users }] = useLazyQuery(collectiveMembersQuery, {
    context: API_V2_CONTEXT,
  });

  const { LoggedInUser } = useLoggedInUser();
  const isHostAdmin = LoggedInUser?.hasRole(roles.ADMIN, host);

  const canEditLimit = isHostAdmin && (!isEditing || virtualCard.provider === 'STRIPE');
  const currency = virtualCard?.currency ?? host.currency ?? 'USD';

  const formik = useFormik({
    initialValues: {
      collective: isEditing ? undefined : collective,
      cardName: virtualCard?.name,
      assignee: virtualCard?.assignee,
      limitAmount: canEditLimit ? virtualCard?.spendingLimitAmount : undefined,
      limitInterval: canEditLimit
        ? (virtualCard?.spendingLimitInterval ?? VirtualCardLimitInterval.MONTHLY)
        : undefined,
    },
    async onSubmit(values) {
      const { assignee, cardName, limitAmount, limitInterval, collective } = values;

      try {
        const variables = {
          virtualCard: isEditing ? { id: virtualCard.id } : undefined,
          account: isEditing
            ? undefined
            : typeof collective.id === 'string'
              ? { id: collective.id }
              : { legacyId: collective.id },
          name: cardName,
          assignee: { id: assignee.id },
          limitAmount: undefined,
          limitInterval: undefined,
          virtualCardRequest: virtualCardRequest ? { id: virtualCardRequest.id } : undefined,
        };

        if (canEditLimit) {
          variables.limitAmount = {
            currency,
            valueInCents: limitAmount,
            value: limitAmount / 100,
          };

          variables.limitInterval = limitInterval;
        }

        await submitForm({ variables });
      } catch (e) {
        toast({
          variant: 'error',
          message: (
            <FormattedMessage
              defaultMessage="Error submiting form: {error}"
              id="FAV3Ng"
              values={{
                error: e.message,
              }}
            />
          ),
        });
        return;
      }

      onSuccess?.(<FormattedMessage defaultMessage="Card successfully updated" id="Nd9ioQ" />);
      handleClose();
    },
    validate(values: any) {
      const errors: any = {};
      if (!isEditing && !values.collective) {
        errors.collective = 'Required';
      }

      if (!values.assignee) {
        errors.assignee = 'Required';
      }
      if (!values.cardName) {
        errors.cardName = 'Required';
      }
      if (canEditLimit && !values.limitAmount) {
        errors.limitAmount = 'Required';
      }
      if (values.limitInterval) {
        const maximumLimitForInterval = graphqlAmountValueInCents(
          MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL[values.limitInterval],
        );
        if (values.limitAmount > maximumLimitForInterval * 100) {
          errors.limitAmount = `Limit for this interval should not exceed ${maximumLimitForInterval} ${currency}`;
        }
      }
      return errors;
    },
  });

  const { data: virtualCardsAssignedToCollectiveData, loading: isLoadingVirtualCardsAssignedToCollective } = useQuery<{
    host: {
      allCards: {
        totalCount: number;
      };
      cardsMissingReceipts: {
        totalCount: number;
      };
    };
  }>(virtualCardsAssignedToCollectiveQuery, {
    context: API_V2_CONTEXT,
    variables: {
      collectiveSlug: formik.values?.collective?.slug,
      hostSlug: host.slug,
    },
    skip: !formik.values?.collective?.slug,
  });

  const cardCollective = isEditing ? virtualCard.account : formik.values.collective;

  useEffect(() => {
    if (cardCollective?.slug) {
      throttledCall(getCollectiveUsers, { slug: cardCollective.slug });
    }
  }, [cardCollective]);

  const intl = useIntl();

  const handleClose = () => {
    onClose?.();
  };

  const virtualCardLimitOptions = Object.keys(VirtualCardLimitInterval).map(interval => ({
    value: interval,
    label: intl.formatMessage(VirtualCardLimitIntervalI18n[interval]),
  }));

  const collectiveUsers = users?.account?.members.nodes.map(node => node.account);

  return (
    <StyledModal onClose={handleClose} {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose} hideCloseIcon={false}>
          {isEditing ? (
            <FormattedMessage defaultMessage="Edit virtual card" id="TtzWuE" />
          ) : (
            <FormattedMessage defaultMessage="Create virtual card" id="FRM4fb" />
          )}
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            {isEditing ? (
              <FormattedMessage
                defaultMessage="Edit virtual card for a collective with the information below."
                id="9nfFQ7"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Create virtual card for a collective with the information below."
                id="NW8fj9"
              />
            )}
          </P>
          <StyledHr borderColor="black.300" mt={3} />
          <Flex flexDirection="column" mt={3}>
            {!isEditing && (
              <React.Fragment>
                <StyledInputField
                  mb={3}
                  labelFontSize="13px"
                  labelFontWeight="bold"
                  label={
                    <FormattedMessage defaultMessage="Which collective will be assigned to this card?" id="goAEwY" />
                  }
                  htmlFor="collective"
                  error={formik.touched.collective && formik.errors.collective}
                >
                  {inputProps => (
                    <CollectivePickerAsync
                      {...inputProps}
                      hostCollectiveIds={[host.legacyId]}
                      name="collective"
                      id="collective"
                      collective={formik.values.collective}
                      isDisabled={!!collective || isBusy}
                      customOptions={[
                        {
                          value: host,
                          label: host.name,
                          [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
                        },
                      ]}
                      onChange={option => {
                        formik.setFieldValue('collective', option.value);
                        formik.setFieldValue('assignee', null);
                      }}
                      filterResults={collectives => collectives.filter(c => c.isActive)}
                    />
                  )}
                </StyledInputField>
                {virtualCardsAssignedToCollectiveData &&
                  virtualCardsAssignedToCollectiveData.host.allCards.totalCount > 0 && (
                    <MessageBox
                      mb={3}
                      type={
                        virtualCardsAssignedToCollectiveData.host.cardsMissingReceipts.totalCount > 0
                          ? 'error'
                          : 'warning'
                      }
                    >
                      <FormattedMessage
                        defaultMessage="This collective already has {allCardsCount} other cards assigned to it. {missingReceiptsCardsCount, plural, =0 {} other {# of the {allCardsCount} cards have missing receipts.}}"
                        id="Ox+jio"
                        values={{
                          allCardsCount: virtualCardsAssignedToCollectiveData.host.allCards.totalCount,
                          missingReceiptsCardsCount:
                            virtualCardsAssignedToCollectiveData.host.cardsMissingReceipts.totalCount,
                        }}
                      />
                      <Box mt={3}>
                        <StyledLink
                          href={`/dashboard/${host.slug}/host-virtual-cards?collective=${formik.values?.collective?.slug}`}
                        >
                          <FormattedMessage defaultMessage="View Assigned Cards" id="PO4Kx4" />
                        </StyledLink>
                      </Box>
                    </MessageBox>
                  )}
              </React.Fragment>
            )}

            <StyledInputField
              labelFontSize="13px"
              labelFontWeight="bold"
              label={<FormattedMessage defaultMessage="Who is this card assigned to?" id="agYvVC" />}
              htmlFor="assignee"
              error={formik.touched.assignee && formik.errors.assignee}
            >
              {inputProps => (
                <CollectivePicker
                  {...inputProps}
                  name="assignee"
                  id="assignee"
                  groupByType={false}
                  collectives={collectiveUsers}
                  collective={formik.values.assignee}
                  isDisabled={isLoadingUsers || isBusy}
                  onChange={option => formik.setFieldValue('assignee', option.value)}
                />
              )}
            </StyledInputField>

            <StyledInputField
              mt={3}
              labelFontWeight="bold"
              labelFontSize="13px"
              label={<FormattedMessage defaultMessage="Card name" id="8oufoc" />}
              htmlFor="cardName"
              error={formik.touched.cardName && formik.errors.cardName}
            >
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  name="cardName"
                  id="cardName"
                  placeholder={intl.formatMessage({ defaultMessage: 'e.g Card for Subscription', id: 'vREsbj' })}
                  onChange={formik.handleChange}
                  value={formik.values.cardName}
                  disabled={isBusy}
                  guide={false}
                />
              )}
            </StyledInputField>

            {canEditLimit && (
              <React.Fragment>
                <Flex mt={3} width="100%" alignItems="flex-start" justifyContent="space-between">
                  <StyledInputField
                    flex="1 1 60%"
                    labelFontSize="13px"
                    labelFontWeight="bold"
                    label={
                      <FormattedMessage
                        defaultMessage="Limit Interval <link>(Read More)</link>"
                        id="vV7hmB"
                        values={{
                          link: getI18nLink({
                            as: Link,
                            openInNewTab: true,
                            href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/virtual-cards',
                          }),
                        }}
                      />
                    }
                    htmlFor="limitInterval"
                  >
                    {inputProps => (
                      <StyledSelect
                        {...inputProps}
                        inputId="limitInterval"
                        data-cy="limitInterval"
                        error={formik.touched.limitAmount && Boolean(formik.errors.limitAmount)}
                        onBlur={() => formik.setFieldTouched('limitInterval', true)}
                        onChange={({ value }) => formik.setFieldValue('limitInterval', value)}
                        isLoading={isBusy}
                        options={virtualCardLimitOptions}
                        value={virtualCardLimitOptions.find(option => option.value === formik.values.limitInterval)}
                      />
                    )}
                  </StyledInputField>
                  <StyledInputField
                    ml={3}
                    labelFontSize="13px"
                    labelFontWeight="bold"
                    label={<FormattedMessage defaultMessage="Card Limit" id="ehbxf1" />}
                    htmlFor="limitAmount"
                  >
                    {inputProps => (
                      <StyledInputAmount
                        {...inputProps}
                        id="limitAmount"
                        placeholder="0.00"
                        error={formik.touched.limitAmount && Boolean(formik.errors.limitAmount)}
                        currency={currency}
                        prepend={currency}
                        onChange={value => formik.setFieldValue('limitAmount', value)}
                        value={formik.values.limitAmount}
                        disabled={isBusy}
                      />
                    )}
                  </StyledInputField>
                </Flex>
                <Box pt={2}>
                  <Span ml={1}>
                    {intl.formatMessage(VirtualCardLimitIntervalDescriptionsI18n[formik.values.limitInterval])}
                  </Span>
                </Box>
                {formik.touched.limitAmount && formik.errors.limitAmount && (
                  <Box pt={2}>
                    <ExclamationCircle color="#E03F6A" size={16} />
                    <Span ml={1} color="black.700" fontSize="14px">
                      {formik.errors.limitAmount}
                    </Span>
                  </Box>
                )}
              </React.Fragment>
            )}
          </Flex>
          <Box mt={3}>
            <StripeVirtualCardComplianceStatement />
          </Box>
        </ModalBody>
        <ModalFooter isFullWidth>
          <Flex justifyContent="flex-end" flexWrap="wrap">
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isBusy}
              disabled={isLoadingPolicy || isLoadingVirtualCardsAssignedToCollective}
              type="submit"
              textTransform="capitalize"
            >
              {isEditing ? (
                <FormattedMessage id="actions.update" defaultMessage="Update" />
              ) : (
                <FormattedMessage defaultMessage="Create virtual card" id="FRM4fb" />
              )}
            </StyledButton>
          </Flex>
        </ModalFooter>
      </form>
    </StyledModal>
  );
}
