import React, { useEffect } from 'react';
import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { useFormik } from 'formik';
import { debounce } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import roles from '../../lib/constants/roles';
import { graphqlAmountValueInCents } from '../../lib/currency-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Account, VirtualCard, VirtualCardLimitInterval } from '../../lib/graphql/types/v2/graphql';
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
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { P, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const editVirtualCardMutation = gql`
  mutation editVirtualCard(
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
  mutation createVirtualCard(
    $name: String!
    $limitAmount: AmountInput!
    $limitInterval: VirtualCardLimitInterval!
    $account: AccountReferenceInput!
    $assignee: AccountReferenceInput!
  ) {
    createVirtualCard(
      name: $name
      limitAmount: $limitAmount
      limitInterval: $limitInterval
      account: $account
      assignee: $assignee
    ) {
      id
      name
      last4
      data
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

const VirtualCardPoliciesQuery = gql`
  query VirtualCardPoliciesQuery($slug: String) {
    account(slug: $slug) {
      id
      policies {
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

export type EditVirtualCardModalProps = {
  host: Account;
  collective: Account;
  virtualCard: VirtualCard;
  onSuccess: (el: React.ReactNode) => void;
  onClose: () => void;
  modalProps: any;
};

export default function EditVirtualCardModal({
  host,
  collective,
  virtualCard,
  onSuccess,
  onClose,
  modalProps,
}: EditVirtualCardModalProps) {
  const { addToast } = useToasts();

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
      limitInterval: canEditLimit ? virtualCard?.spendingLimitInterval ?? VirtualCardLimitInterval.MONTHLY : undefined,
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
        addToast({
          type: TOAST_TYPE.ERROR,
          message: (
            <FormattedMessage
              defaultMessage="Error submiting form: {error}"
              values={{
                error: e.message,
              }}
            />
          ),
        });
        return;
      }

      onSuccess?.(<FormattedMessage defaultMessage="Card successfully updated" />);
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
    <StyledModal width="382px" onClose={handleClose} trapFocus {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose} hideCloseIcon={false}>
          {isEditing ? (
            <FormattedMessage defaultMessage="Edit virtual card" />
          ) : (
            <FormattedMessage defaultMessage="Create virtual card" />
          )}
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            {isEditing ? (
              <FormattedMessage defaultMessage="Edit virtual card for a collective with the information below." />
            ) : (
              <FormattedMessage defaultMessage="Create virtual card for a collective with the information below." />
            )}
          </P>
          <StyledHr borderColor="black.300" mt={3} />
          <Flex flexDirection="column" mt={3}>
            {!isEditing && (
              <StyledInputField
                mb={3}
                labelFontSize="13px"
                labelFontWeight="bold"
                label={<FormattedMessage defaultMessage="Which collective will be assigned to this card?" />}
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
            )}

            <StyledInputField
              labelFontSize="13px"
              labelFontWeight="bold"
              label={<FormattedMessage defaultMessage="Who is this card assigned to?" />}
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
              label={<FormattedMessage defaultMessage="Card name" />}
              htmlFor="cardName"
              error={formik.touched.cardName && formik.errors.cardName}
            >
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  name="cardName"
                  id="cardName"
                  placeholder={intl.formatMessage({ defaultMessage: 'e.g Card for Subscription' })}
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
                    flexGrow={1}
                    labelFontSize="13px"
                    labelFontWeight="bold"
                    label={
                      <FormattedMessage
                        defaultMessage="Limit Interval <link>(Read More)</link>"
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
                    label={<FormattedMessage defaultMessage="Card Limit" />}
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
        </ModalBody>
        <ModalFooter isFullWidth>
          <Flex justifyContent="flex-end" flexWrap="wrap">
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isBusy}
              disabled={isLoadingPolicy}
              type="submit"
              textTransform="capitalize"
            >
              {isEditing ? (
                <FormattedMessage id="actions.update" defaultMessage="Update" />
              ) : (
                <FormattedMessage defaultMessage="Create virtual card" />
              )}
            </StyledButton>
          </Flex>
        </ModalFooter>
      </form>
    </StyledModal>
  );
}
