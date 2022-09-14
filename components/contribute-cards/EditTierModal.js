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

  const fieldDefinitions = [
    {
      name: 'type',
      type: 'select',
      options: tierTypeOptions,
      label: intl.formatMessage({ id: 'tier.type.label', defaultMessage: 'Type' }),
      when: ![FUND].includes(collective.type) || types?.length === 1,
    },
    {
      name: 'name',
      label: intl.formatMessage({ id: 'Fields.name', defaultMessage: 'Name' }),
      placeholder: 'E.g. Donation',
    },
    {
      name: 'description',
      type: 'textarea',
      label: intl.formatMessage({
        id: 'Fields.description',
        defaultMessage: 'Description',
      }),
    },
    {
      name: 'interval',
      type: 'select',
      options: intervalOptions,
      label: intl.formatMessage({
        id: 'tier.interval.label',
        defaultMessage: 'interval',
      }),
      when: [DONATION, MEMBERSHIP, TIER, SERVICE].includes(values.type),
    },
    {
      name: 'amountType',
      type: 'select',
      options: amountTypeOptions,
      label: intl.formatMessage({
        id: 'tier.amountType.label',
        defaultMessage: 'Amount type',
      }),
      when: values.interval !== FLEXIBLE,
    },
    {
      name: 'amount',
      type: 'currency',
      label: intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
      when: values.amountType === FIXED,
    },
    {
      name: 'presets',
      type: 'suggested-amounts',
      label: intl.formatMessage({
        id: 'tier.presets.label',
        defaultMessage: 'suggested amounts',
      }),
      when: values.amountType === FLEXIBLE,
    },
    {
      name: 'amount',
      type: 'currency',
      label: intl.formatMessage({
        id: 'tier.defaultAmount.label',
        defaultMessage: 'default amount',
      }),
      when: values.amountType === FLEXIBLE,
    },
    {
      name: 'minimumAmount',
      type: 'currency',
      label: intl.formatMessage({ id: 'tier.minimumAmount.label', defaultMessage: 'minimum amount' }),
      when: values.amountType === FLEXIBLE,
    },
    {
      name: 'maxQuantity',
      type: 'number',
      label: intl.formatMessage({
        id: 'tier.maxQuantity.label',
        defaultMessage: 'Available quantity',
      }),
      description: intl.formatMessage({
        id: 'tier.maxQuantity.description',
        defaultMessage: 'Leave empty for unlimited',
      }),
      when:
        [TICKET, PRODUCT].includes(values.type) || (values.type === TIER && ![FUND, PROJECT].includes(collective.type)),
    },
    {
      name: 'button',
      type: 'text',
      label: intl.formatMessage({
        id: 'tier.button.label',
        defaultMessage: 'Button text',
      }),
      when: ![FUND].includes(collective.type),
    },
    {
      name: 'goal',
      type: 'currency',
      label: intl.formatMessage({
        id: 'ContributionType.Goal',
        defaultMessage: 'Goal',
      }),
      description: intl.formatMessage({
        id: 'tier.goal.description',
        defaultMessage: 'Amount you aim to raise',
      }),
    },
    {
      name: 'useStandalonePage',
      type: 'checkbox',
      label: intl.formatMessage({
        id: 'tier.standalonePage',
        defaultMessage: 'Standalone page',
      }),
      when: ![FUND, PROJECT].includes(collective.type),
      description: intl.formatMessage(
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
                  href={{ pathname: `${getCollectivePageRoute(collective)}/contribute/${values.slug}-${values.id}` }}
                >
                  <span>{msg}</span>
                </StyledLink>
              );
            }
          },
        },
      ),
    },
    {
      name: 'invoiceTemplate',
      type: 'select',
      label: intl.formatMessage({
        defaultMessage: 'Choose receipt',
      }),
      description: intl.formatMessage({
        defaultMessage: 'Choose between the receipts templates available.',
      }),
      options: receiptTemplateOptions,
      when: receiptTemplateOptions.length > 1,
    },
  ];

  const visibleFields = fieldDefinitions.filter(fieldDef => {
    if (fieldDef.when === undefined) {
      return true;
    }

    return !!fieldDef.when;
  });

  function getFieldFor({ type, placeholder, options }) {
    switch (type) {
      case 'select': {
        return ({ field, form, loading }) => (
          <StyledSelect
            inputId={field.name}
            data-cy={field.name}
            error={field.error}
            onBlur={() => form.setFieldTouched(field.name, true)}
            onChange={({ value }) => form.setFieldValue(field.name, value)}
            isLoading={loading}
            options={options}
            value={options.find(option => option.value === field.value)}
          />
        );
      }
      case 'currency': {
        return ({ field, form }) => (
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
        );
      }
      case 'suggested-amounts': {
        return ({ field, form }) => (
          <InputFieldPresets
            {...field}
            defaultValue={field.value}
            onChange={value => form.setFieldValue(field.name, value)}
          />
        );
      }
      case 'checkbox': {
        return ({ field, form }) => (
          <InputSwitch
            name={field.name}
            value={field.value}
            onChange={event => form.setFieldValue(field.name, event.target.checked)}
          />
        );
      }
      case 'textarea': {
        return ({ field }) => <StyledTextarea data-cy={field.name} placeholder={placeholder} {...field} />;
      }
      default: {
        return ({ field }) => <StyledInput data-cy={field.name} placeholder={placeholder} {...field} />;
      }
    }
  }

  return (
    <React.Fragment>
      {visibleFields.map(fieldDef => (
        <React.Fragment key={fieldDef.name}>
          <StyledInputFormikField
            key={fieldDef.name}
            name={fieldDef.name}
            label={fieldDef.label}
            labelFontWeight="bold"
            mt={3}
            flexDirection={fieldDef.type === 'checkbox' ? 'row' : undefined}
            justifyContent={fieldDef.type === 'checkbox' ? 'space-between' : undefined}
            alignItems={fieldDef.type === 'checkbox' ? 'center' : undefined}
          >
            {getFieldFor(fieldDef)}
          </StyledInputFormikField>
          {fieldDef.description && <FieldDescription>{fieldDef.description}</FieldDescription>}
        </React.Fragment>
      ))}
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
