/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React from 'react';
import { useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { omit } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import { getGQLV2FrequencyFromInterval } from '../../lib/constants/intervals';
import { AmountTypes, TierTypes } from '../../lib/constants/tiers-types';
import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { Flex } from '../Grid';
import InputFieldPresets from '../InputFieldPresets';
import InputSwitch from '../InputSwitch';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledLink from '../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import StyledTextarea from '../StyledTextarea';

import ContributeTier from './ContributeTier';

const { FUND, PROJECT } = CollectiveType;
const { TIER, TICKET, MEMBERSHIP, SERVICE, PRODUCT, DONATION } = TierTypes;
const { FIXED, FLEXIBLE } = AmountTypes;

function getTierTypeOptions(intl, collectiveType) {
  const simplifiedTierTypes = [
    { value: TIER, label: intl.formatMessage({ id: 'tier.type.tier', defaultMessage: 'generic tier' }) },
    {
      value: MEMBERSHIP,
      label: intl.formatMessage({ id: 'tier.type.membership', defaultMessage: 'membership (recurring)' }),
    },
    {
      value: SERVICE,
      label: intl.formatMessage({ id: 'tier.type.service', defaultMessage: 'service (e.g., support)' }),
    },
    {
      value: PRODUCT,
      label: intl.formatMessage({ id: 'tier.type.product', defaultMessage: 'product (e.g., t-shirt)' }),
    },
    { value: DONATION, label: intl.formatMessage({ id: 'tier.type.donation', defaultMessage: 'donation (gift)' }) },
  ];

  const membershipTierType = {
    value: MEMBERSHIP,
    label: intl.formatMessage({ id: 'tier.type.membership', defaultMessage: 'membership (recurring)' }),
  };

  if (collectiveType === PROJECT) {
    return simplifiedTierTypes;
  }

  return [...simplifiedTierTypes, membershipTierType];
}

function getReceiptTemplates(host) {
  const receiptTemplates = host?.settings?.invoice?.templates;

  const receiptTemplateTitles = [];
  if (receiptTemplates?.default) {
    receiptTemplateTitles.push({
      value: 'default',
      label: receiptTemplates.default.title,
    });
  }
  if (receiptTemplates?.alternative) {
    receiptTemplateTitles.push({ value: 'alternative', label: receiptTemplates.alternative.title });
  }
  return receiptTemplateTitles;
}

function FormFields({ collective, types, values }) {
  const intl = useIntl();

  const tierTypeOptions = getTierTypeOptions(intl, collective.type);
  const intervalOptions = [
    { value: 'onetime', label: intl.formatMessage({ id: 'tier.interval.onetime', defaultMessage: 'one time' }) },
    { value: 'month', label: intl.formatMessage({ id: 'tier.interval.month', defaultMessage: 'monthly' }) },
    { value: 'year', label: intl.formatMessage({ id: 'tier.interval.year', defaultMessage: 'yearly' }) },
    { value: 'flexible', label: intl.formatMessage({ id: 'tier.interval.flexible', defaultMessage: 'flexible' }) },
  ];

  const amountTypeOptions = [
    { value: FIXED, label: intl.formatMessage({ id: 'tier.amountType.fixed', defaultMessage: 'fixed amount' }) },
    {
      value: FLEXIBLE,
      label: intl.formatMessage({ id: 'tier.amountType.flexible', defaultMessage: 'flexible amount' }),
    },
  ];

  const receiptTemplateOptions = getReceiptTemplates(collective.host);

  return (
    <React.Fragment>
      {(![FUND].includes(collective.type) || types?.length === 1) && (
        <StyledInputFormikField
          name="type"
          label={intl.formatMessage({ id: 'tier.type.label', defaultMessage: 'Type' })}
          labelFontWeight="bold"
          mt="3"
        >
          {({ field, form, loading }) => (
            <StyledSelect
              inputId={field.name}
              data-cy={field.name}
              error={field.error}
              onBlur={() => form.setFieldTouched(field.name, true)}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              isLoading={loading}
              options={tierTypeOptions}
              value={tierTypeOptions.find(option => option.value === field.value)}
            />
          )}
        </StyledInputFormikField>
      )}
      <StyledInputFormikField
        name="name"
        label={intl.formatMessage({ id: 'Fields.name', defaultMessage: 'Name' })}
        labelFontWeight="bold"
        mt="3"
      >
        {({ field }) => <StyledInput data-cy={field.name} placeholder="E.g. Donation" {...field} />}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="description"
        label={intl.formatMessage({
          id: 'Fields.description',
          defaultMessage: 'Description',
        })}
        labelFontWeight="bold"
        mt="3"
        required={false}
      >
        {({ field }) => <StyledTextarea data-cy={field.name} {...field} />}
      </StyledInputFormikField>
      {[DONATION, MEMBERSHIP, TIER, SERVICE].includes(values.type) && (
        <StyledInputFormikField
          name="interval"
          label={intl.formatMessage({
            id: 'tier.interval.label',
            defaultMessage: 'interval',
          })}
          labelFontWeight="bold"
          mt="3"
          required={false}
        >
          {({ field, form, loading }) => (
            <StyledSelect
              inputId={field.name}
              data-cy={field.name}
              error={field.error}
              onBlur={() => form.setFieldTouched(field.name, true)}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              isLoading={loading}
              options={intervalOptions}
              value={intervalOptions.find(option => option.value === field.value)}
            />
          )}
        </StyledInputFormikField>
      )}
      {values.interval !== FLEXIBLE && (
        <StyledInputFormikField
          name="amountType"
          label={intl.formatMessage({
            id: 'tier.amountType.label',
            defaultMessage: 'Amount type',
          })}
          labelFontWeight="bold"
          mt="3"
        >
          {({ field, form, loading }) => (
            <StyledSelect
              inputId={field.name}
              data-cy={field.name}
              error={field.error}
              onBlur={() => form.setFieldTouched(field.name, true)}
              onChange={({ value }) => form.setFieldValue(field.name, value)}
              isLoading={loading}
              options={amountTypeOptions}
              value={amountTypeOptions.find(option => option.value === field.value)}
            />
          )}
        </StyledInputFormikField>
      )}
      {values.amountType === FIXED && (
        <StyledInputFormikField
          name="amount"
          label={intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' })}
          labelFontWeight="bold"
          mt="3"
        >
          {({ field, form }) => (
            <StyledInputAmount
              id={field.id}
              data-cy={field.name}
              currency={field.value?.currency ?? collective.currency}
              currencyDisplay="CODE"
              placeholder="0.00"
              error={field.error}
              value={field.value?.valueInCents}
              maxWidth="100%"
              onChange={value =>
                form.setFieldValue(
                  field.name,
                  value ? { currency: field.value?.currency ?? collective.currency, valueInCents: value } : null,
                )
              }
              onBlur={() => form.setFieldTouched(field.name, true)}
            />
          )}
        </StyledInputFormikField>
      )}
      {values.amountType === FLEXIBLE && (
        <StyledInputFormikField
          name="presets"
          label={intl.formatMessage({
            id: 'tier.presets.label',
            defaultMessage: 'suggested amounts',
          })}
          labelFontWeight="bold"
          mt="3"
        >
          {({ field, form }) => (
            <InputFieldPresets
              {...field}
              defaultValue={field.value}
              onChange={value => form.setFieldValue(field.name, value)}
            />
          )}
        </StyledInputFormikField>
      )}
      {values.amountType === FLEXIBLE && (
        <StyledInputFormikField
          name="amount"
          label={intl.formatMessage({
            id: 'tier.defaultAmount.label',
            defaultMessage: 'default amount',
          })}
          labelFontWeight="bold"
          mt="3"
        >
          {({ field, form }) => (
            <StyledInputAmount
              id={field.id}
              data-cy={field.name}
              currency={field.value?.currency ?? collective.currency}
              currencyDisplay="CODE"
              placeholder="0.00"
              error={field.error}
              value={field.value?.valueInCents}
              maxWidth="100%"
              onChange={value =>
                form.setFieldValue(
                  field.name,
                  value ? { currency: field.value?.currency ?? collective.currency, valueInCents: value } : null,
                )
              }
              onBlur={() => form.setFieldTouched(field.name, true)}
            />
          )}
        </StyledInputFormikField>
      )}
      {values.amountType === FLEXIBLE && (
        <StyledInputFormikField
          name="minimumAmount"
          label={intl.formatMessage({ id: 'tier.minimumAmount.label', defaultMessage: 'minimum amount' })}
          labelFontWeight="bold"
          mt="3"
          required={false}
        >
          {({ field, form }) => (
            <StyledInputAmount
              id={field.id}
              data-cy={field.name}
              currency={field.value?.currency ?? collective.currency}
              currencyDisplay="CODE"
              placeholder="0.00"
              error={field.error}
              value={field.value?.valueInCents}
              maxWidth="100%"
              onChange={value =>
                form.setFieldValue(
                  field.name,
                  value ? { currency: field.value?.currency ?? collective.currency, valueInCents: value } : null,
                )
              }
              onBlur={() => form.setFieldTouched(field.name, true)}
            />
          )}
        </StyledInputFormikField>
      )}
      {([TICKET, PRODUCT].includes(values.type) ||
        (values.type === TIER && ![FUND, PROJECT].includes(collective.type))) && (
        <React.Fragment>
          <StyledInputFormikField
            name="maxQuantity"
            label={intl.formatMessage({
              id: 'tier.maxQuantity.label',
              defaultMessage: 'Available quantity',
            })}
            labelFontWeight="bold"
            mt="3"
            required={false}
          >
            {({ field }) => <StyledInput data-cy={field.name} {...field} />}
          </StyledInputFormikField>
          <FieldDescription>
            {intl.formatMessage({
              id: 'tier.maxQuantity.description',
              defaultMessage: 'Leave empty for unlimited',
            })}
          </FieldDescription>
        </React.Fragment>
      )}
      {![FUND].includes(collective.type) && (
        <StyledInputFormikField
          name="button"
          label={intl.formatMessage({
            id: 'tier.button.label',
            defaultMessage: 'Button text',
          })}
          labelFontWeight="bold"
          mt="3"
          required={false}
        >
          {({ field }) => <StyledInput data-cy={field.name} {...field} />}
        </StyledInputFormikField>
      )}
      <StyledInputFormikField
        name="goal"
        label={intl.formatMessage({
          id: 'ContributionType.Goal',
          defaultMessage: 'Goal',
        })}
        labelFontWeight="bold"
        mt="3"
        required={false}
      >
        {({ field, form }) => (
          <StyledInputAmount
            id={field.id}
            data-cy={field.name}
            currency={field.value?.currency ?? collective.currency}
            currencyDisplay="CODE"
            placeholder="0.00"
            error={field.error}
            value={field.value?.valueInCents}
            maxWidth="100%"
            onChange={value =>
              form.setFieldValue(
                field.name,
                value ? { currency: field.value?.currency ?? collective.currency, valueInCents: value } : null,
              )
            }
            onBlur={() => form.setFieldTouched(field.name, true)}
          />
        )}
      </StyledInputFormikField>
      <FieldDescription>
        {intl.formatMessage({
          id: 'tier.goal.description',
          defaultMessage: 'Amount you aim to raise',
        })}
      </FieldDescription>
      {![FUND, PROJECT].includes(collective.type) && (
        <React.Fragment>
          <StyledInputFormikField
            name="useStandalonePage"
            label={intl.formatMessage({
              id: 'tier.standalonePage',
              defaultMessage: 'Standalone page',
            })}
            labelFontWeight="bold"
            mt="3"
            flexDirection={'row'}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            {({ field, form }) => (
              <InputSwitch
                name={field.name}
                value={field.value}
                onChange={event => form.setFieldValue(field.name, event.target.checked)}
              />
            )}
          </StyledInputFormikField>
          <FieldDescription>
            {intl.formatMessage(
              {
                id: 'tier.standalonePageDescription',
                defaultMessage:
                  "Create a <link>standalone</link> page for this tier? It's like a mini-crowdfunding campaign page that you can add a detailed description and video to, and link to directly",
              },
              {
                link: function StandaloneTierPageLink(...msg) {
                  if (!values.id) {
                    return <span>{msg}</span>;
                  } else {
                    return (
                      <StyledLink
                        as={Link}
                        openInNewTab
                        href={{
                          pathname: `${getCollectivePageRoute(collective)}/contribute/${values.slug}-${values.id}`,
                        }}
                      >
                        <span>{msg}</span>
                      </StyledLink>
                    );
                  }
                },
              },
            )}
          </FieldDescription>
        </React.Fragment>
      )}
      {receiptTemplateOptions.length > 1 && (
        <React.Fragment>
          <StyledInputFormikField
            name="invoiceTemplate"
            label={intl.formatMessage({
              defaultMessage: 'Choose receipt',
            })}
            labelFontWeight="bold"
            mt="3"
            required={false}
          >
            {({ field, form, loading }) => (
              <StyledSelect
                inputId={field.name}
                data-cy={field.name}
                error={field.error}
                onBlur={() => form.setFieldTouched(field.name, true)}
                onChange={({ value }) => form.setFieldValue(field.name, value)}
                isLoading={loading}
                options={receiptTemplateOptions}
                value={receiptTemplateOptions.find(option => option.value === field.value)}
              />
            )}
          </StyledInputFormikField>
          <FieldDescription>
            {intl.formatMessage({
              defaultMessage: 'Choose between the receipts templates available.',
            })}
          </FieldDescription>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

const EditSectionContainer = styled(Flex)`
  overflow: scroll;
  max-height: 600px;
  width: 400px;
  flex-direction: column;
  padding-right: 1rem;
`;

const PreviewSectionContainer = styled(Flex)`
  overflow: hidden;
  max-height: 600px;
  width: 300px;
`;

const ModalContainer = styled(StyledModal)`
  padding-bottom: 10px;
`;

const FieldDescription = styled.div`
  color: #737373;
  font-size: 1.2rem;
`;

const ContributeCardPreviewContainer = styled.div`
  padding: 2rem;
`;

export default function EditTierModal({ tier, collective, onClose }) {
  return (
    <ModalContainer onClose={onClose} ignoreEscapeKey>
      <EditTierForm tier={tier} collective={collective} onClose={onClose} />
    </ModalContainer>
  );
}

export function ContributeCardPreview({ tier, collective }) {
  const intl = useIntl();

  const previewTier = {
    ...tier,
    id: tier.legacyId,
    slug: 'preview-slug',
    stats: {},
  };
  if (tier.maxQuantity) {
    previewTier.stats.availableQuantity = tier.maxQuantity;
  }

  return (
    <ContributeCardPreviewContainer>
      <ContributeTier intl={intl} tier={previewTier} collective={collective} hideContributors />
    </ContributeCardPreviewContainer>
  );
}

const listTierQuery = gqlV2/* GraphQL */ `
  query AccountTiers($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            legacyId
            name
            slug
            description
            interval
            frequency
            amount {
              valueInCents
              currency
            }
            minimumAmount {
              valueInCents
              currency
            }
            goal {
              valueInCents
              currency
            }
            amountType
            endsAt
            type
            maxQuantity
            presets
            button
            useStandalonePage
          }
        }
      }
    }
  }
`;

const editTierMutation = gqlV2/* GraphQL */ `
  mutation EditTier($tier: TierUpdateInput!) {
    editTier(tier: $tier) {
      id
      legacyId
      slug
      name
      description
      amount {
        value
        currency
        valueInCents
      }
      button
      goal {
        value
        currency
        valueInCents
      }
      type
      interval
      frequency
      presets
      maxQuantity
      availableQuantity
      customFields
      amountType
      minimumAmount {
        value
        currency
        valueInCents
      }
      endsAt
      invoiceTemplate
      useStandalonePage
    }
  }
`;

const createTierMutation = gqlV2/* GraphQL */ `
  mutation CreateTier($tier: TierCreateInput!, $account: AccountReferenceInput!) {
    createTier(tier: $tier, account: $account) {
      id
      legacyId
      slug
      name
      description
      amount {
        value
        currency
        valueInCents
      }
      button
      goal {
        value
        currency
        valueInCents
      }
      type
      interval
      presets
      maxQuantity
      availableQuantity
      customFields
      amountType
      minimumAmount {
        value
        currency
        valueInCents
      }
      endsAt
      invoiceTemplate
      useStandalonePage
    }
  }
`;

const deleteTierMutation = gqlV2/* GraphQL */ `
  mutation DeleteTier($tier: TierReferenceInput!) {
    deleteTier(tier: $tier) {
      id
    }
  }
`;

export function EditTierForm({ tier, collective, onClose }) {
  const isEditing = React.useMemo(() => !!tier?.id);
  const initialValues = React.useMemo(() => {
    if (isEditing) {
      return {
        ...omit(tier, ['__typename', 'endsAt', 'slug', 'legacyId']),
        amount: omit(tier.amount, '__typename'),
        goal: omit(tier.goal, '__typename'),
        minimumAmount: omit(tier.minimumAmount, '__typename'),
        description: tier.description || '',
        presets: tier.presets || [1000],
      };
    } else {
      return {
        name: '',
        type: null,
        amountType: null,
        amount: null,
        interval: null,
        description: '',
        presets: [1000],
      };
    }
  }, [isEditing, tier]);

  const formMutation = isEditing ? editTierMutation : createTierMutation;

  const [submitFormMutation] = useMutation(formMutation, {
    context: API_V2_CONTEXT,
    variables: {
      account: {
        legacyId: collective.id,
      },
    },
    refetchQueries: [
      {
        query: listTierQuery,
        context: API_V2_CONTEXT,
        variables: {
          accountSlug: collective.slug,
        },
      },
    ],
    awaitRefetchQueries: true,
  });

  const [deleteTier, { loading: isDeleting }] = useMutation(deleteTierMutation, {
    context: API_V2_CONTEXT,
    variables: {
      tier: {
        id: tier?.id,
      },
    },
    refetchQueries: [
      {
        query: listTierQuery,
        context: API_V2_CONTEXT,
        variables: {
          accountSlug: collective.slug,
        },
      },
    ],
    awaitRefetchQueries: true,
  });

  const onDeleteTierClick = React.useCallback(async () => {
    await deleteTier();
    onClose();
  }, [deleteTier]);

  return (
    <React.Fragment>
      <Formik
        initialValues={initialValues}
        validate={values => requireFields(values, ['name', 'type', 'amountType', 'amount'])}
        onSubmit={async values => {
          const tier = {
            ...omit(values, 'interval'),
            frequency: getGQLV2FrequencyFromInterval(values.interval),
            maxQuantity: parseInt(values.maxQuantity),
            goal: values?.goal?.valueInCents ? values.goal : null,
            amount: values?.amount?.valueInCents ? values.amount : null,
            minimumAmount: values?.minimumAmount?.valueInCents ? values.minimumAmount : null,
          };

          await submitFormMutation({
            variables: {
              tier,
            },
          });

          onClose();
        }}
      >
        {({ values, isSubmitting }) => {
          return (
            <Form>
              <ModalHeader onClose={onClose} hideCloseIcon>
                {isEditing ? (
                  <FormattedMessage id="modal.edit-tier.title" defaultMessage="Edit Tier" />
                ) : (
                  <FormattedMessage id="modal.create-tier.title" defaultMessage="Create Tier" />
                )}
              </ModalHeader>
              <ModalBody>
                <Flex>
                  <EditSectionContainer>
                    <FormFields collective={collective} values={values} />
                  </EditSectionContainer>
                  <PreviewSectionContainer>
                    <ContributeCardPreview collective={collective} tier={values} />
                  </PreviewSectionContainer>
                </Flex>
              </ModalBody>
              <ModalFooter isFullWidth dividerMargin="1rem 0">
                <Flex justifyContent="right" flexWrap="wrap">
                  {isEditing && (
                    <StyledButton
                      type="button"
                      data-cy="delete-btn"
                      buttonStyle="dangerSecondary"
                      mx={2}
                      minWidth={120}
                      onClick={onDeleteTierClick}
                      loading={isDeleting}
                      disabled={isSubmitting}
                      marginRight="auto"
                    >
                      <FormattedMessage id="actions.delete" defaultMessage="Delete" />
                    </StyledButton>
                  )}
                  <StyledButton
                    type="submit"
                    data-cy="confirm-btn"
                    buttonStyle="primary"
                    mx={2}
                    minWidth={120}
                    disabled={isDeleting}
                    loading={isSubmitting}
                  >
                    {isEditing ? (
                      <FormattedMessage id="save" defaultMessage="Save" />
                    ) : (
                      <FormattedMessage id="create" defaultMessage="Create" />
                    )}
                  </StyledButton>
                  <StyledButton
                    type="button"
                    data-cy="cancel-btn"
                    disabled={isSubmitting || isDeleting}
                    mx={2}
                    minWidth={100}
                    onClick={onClose}
                  >
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </StyledButton>
                </Flex>
              </ModalFooter>
            </Form>
          );
        }}
      </Formik>
    </React.Fragment>
  );
}
