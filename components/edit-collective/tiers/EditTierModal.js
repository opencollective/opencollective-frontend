import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { getApplicableTaxes } from '@opencollective/taxes';
import { Form, Formik, useFormikContext } from 'formik';
import { omit } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { getLegacyIdForCollective } from '../../../lib/collective.lib';
import { CollectiveType } from '../../../lib/constants/collectives';
import { getGQLV2FrequencyFromInterval } from '../../../lib/constants/intervals';
import { AmountTypes, TierTypes } from '../../../lib/constants/tiers-types';
import { i18nGraphqlException } from '../../../lib/errors';
import { requireFields } from '../../../lib/form-utils';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { i18nTaxDescription, i18nTaxType } from '../../../lib/i18n/taxes';
import { getCollectivePageRoute } from '../../../lib/url-helpers';

import ContributeTier from '../../contribute-cards/ContributeTier';
import { Box, Flex } from '../../Grid';
import InputFieldPresets from '../../InputFieldPresets';
import InputSwitch from '../../InputSwitch';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledInputAmount from '../../StyledInputAmount';
import StyledInputFormikField from '../../StyledInputFormikField';
import StyledLink from '../../StyledLink';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import StyledSelect from '../../StyledSelect';
import StyledTextarea from '../../StyledTextarea';
import { Span } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import ConfirmTierDeleteModal from './ConfirmTierDeleteModal';

const { FUND, PROJECT } = CollectiveType;
const { TIER, TICKET, MEMBERSHIP, SERVICE, PRODUCT, DONATION } = TierTypes;
const { FIXED, FLEXIBLE } = AmountTypes;

function getTierTypeOptions(intl, collectiveType) {
  const simplifiedTierTypes = [
    { value: TIER, label: intl.formatMessage({ id: 'tier.type.tier', defaultMessage: 'generic tier' }) },
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
    { value: 'onetime', label: intl.formatMessage({ id: 'Frequency.OneTime', defaultMessage: 'One time' }) },
    { value: 'month', label: intl.formatMessage({ id: 'Frequency.Monthly', defaultMessage: 'Monthly' }) },
    { value: 'year', label: intl.formatMessage({ id: 'Frequency.Yearly', defaultMessage: 'Yearly' }) },
    { value: 'flexible', label: intl.formatMessage({ id: 'tier.interval.flexible', defaultMessage: 'Flexible' }) },
  ];

  const amountTypeOptions = [
    { value: FIXED, label: intl.formatMessage({ id: 'tier.amountType.fixed', defaultMessage: 'Fixed amount' }) },
    {
      value: FLEXIBLE,
      label: intl.formatMessage({ id: 'tier.amountType.flexible', defaultMessage: 'Flexible amount' }),
    },
  ];

  const receiptTemplateOptions = getReceiptTemplates(collective.host);

  const taxes = getApplicableTaxes(collective, collective.host, values.type);

  const formik = useFormikContext();
  React.useEffect(() => {
    if (values.interval === 'flexible') {
      formik.setFieldValue('amountType', FLEXIBLE);
    }
  }, [values.interval]);

  React.useEffect(() => {
    if (values.type === PRODUCT) {
      formik.setFieldValue('interval', null);
      formik.setFieldValue('amountType', FIXED);
    }
  }, [values.type]);

  return (
    <React.Fragment>
      {(![FUND].includes(collective.type) || types?.length === 1) && (
        <React.Fragment>
          <StyledInputFormikField
            name="type"
            label={intl.formatMessage({ id: 'tier.type.label', defaultMessage: 'Type' })}
            labelFontWeight="bold"
            mt="3"
          >
            {({ field, form, loading }) => (
              <StyledSelect
                inputId={field.name}
                data-cy={`select-${field.name}`}
                error={field.error}
                onBlur={() => form.setFieldTouched(field.name, true)}
                onChange={({ value }) => form.setFieldValue(field.name, value)}
                isLoading={loading}
                options={tierTypeOptions}
                value={tierTypeOptions.find(option => option.value === field.value)}
              />
            )}
          </StyledInputFormikField>
          {taxes.map(({ type, percentage }) => (
            <Flex key={`${type}-${percentage}`} mt={3}>
              <MessageBox type="info" withIcon css={{ flexGrow: 1 }} fontSize="12px">
                <Span fontWeight="bold">
                  <FormattedMessage
                    id="withColon"
                    defaultMessage="{item}:"
                    values={{ item: i18nTaxType(intl, type) }}
                  />{' '}
                  {percentage}%
                </Span>
                <Box mt={2}>{i18nTaxDescription(intl, type)}</Box>
              </MessageBox>
            </Flex>
          ))}
        </React.Fragment>
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
        {({ field }) => <StyledTextarea data-cy={field.name} maxLength={510} width="100%" showCount {...field} />}
      </StyledInputFormikField>
      {[DONATION, MEMBERSHIP, TIER, SERVICE].includes(values.type) && (
        <StyledInputFormikField
          name="interval"
          label={intl.formatMessage({
            id: 'tier.interval.label',
            defaultMessage: 'Interval',
          })}
          labelFontWeight="bold"
          mt="3"
          required={false}
        >
          {({ field, form, loading }) => (
            <StyledSelect
              inputId={field.name}
              data-cy={`select-${field.name}`}
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
      {values.interval !== 'flexible' && (
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
            defaultMessage: 'Suggested amounts',
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
            defaultMessage: 'Default amount',
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
          label={intl.formatMessage({ id: 'tier.minimumAmount.label', defaultMessage: 'Minimum amount' })}
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
      {([TICKET, PRODUCT, MEMBERSHIP].includes(values.type) ||
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
                checked={field.value}
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

FormFields.propTypes = {
  collective: PropTypes.shape({
    host: PropTypes.object,
    currency: PropTypes.string,
    type: PropTypes.string,
  }),
  values: PropTypes.shape({
    id: PropTypes.string,
    slug: PropTypes.string,
    type: PropTypes.string,
    amountType: PropTypes.string,
    interval: PropTypes.string,
  }),
  types: PropTypes.array,
};

const EditSectionContainer = styled(Flex)`
  overflow-y: scroll;
  flex-grow: 1;
  flex-direction: column;
  padding-right: 1rem;
  min-width: 250px;

  @media (min-width: 700px) {
    max-height: 600px;
  }
`;

const PreviewSectionContainer = styled(Flex)`
  overflow: hidden;
  max-height: 600px;
  flex-grow: 1;
  min-width: 300px;
  justify-content: center;
  @media (max-width: 700px) {
    margin: 0 -20px;
  }
`;

const ModalSectionContainer = styled(Flex)`
  @media (max-width: 700px) {
    flex-wrap: wrap;
    gap: 2em;
    align-items: center;
  }
`;

const EditModalActionsContainer = styled(Flex)`
  justify-content: right;
  flex-wrap: wrap;
  gap: 1em;

  @media (max-width: 700px) {
    & > button {
      width: 100%;
    }
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
  }
`;

const ConfirmModalButton = styled(StyledButton)`
  @media (max-width: 700px) {
    order: 1;
  }
`;

const DeleteModalButton = styled(StyledButton)`
  @media (max-width: 700px) {
    order: 2;
  }
`;

const CancelModalButton = styled(StyledButton)`
  @media (max-width: 700px) {
    order: 3;
  }
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
  @media (max-width: 700px) {
    padding: 0;
  }
`;

export default function EditTierModal({ tier, collective, onClose }) {
  return (
    <ModalContainer onClose={onClose} ignoreEscapeKey>
      <EditTierForm tier={tier} collective={collective} onClose={onClose} />
    </ModalContainer>
  );
}

EditTierModal.propTypes = {
  tier: PropTypes.object,
  collective: PropTypes.object,
  onClose: PropTypes.func,
};

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
      <ContributeTier isPreview intl={intl} tier={previewTier} collective={collective} hideContributors />
    </ContributeCardPreviewContainer>
  );
}

ContributeCardPreview.propTypes = {
  tier: PropTypes.shape({
    legacyId: PropTypes.number,
    maxQuantity: PropTypes.number,
  }),
  collective: PropTypes.object,
};

export const editTiersFieldsFragment = gql`
  fragment EditTiersFields on Tier {
    id
    legacyId
    amount {
      value
      valueInCents
      currency
    }
    amountType
    availableQuantity
    button
    customFields
    description
    endsAt
    frequency
    goal {
      value
      valueInCents
      currency
    }
    interval
    invoiceTemplate
    maxQuantity
    minimumAmount {
      value
      valueInCents
      currency
    }
    name
    presets
    slug
    type
    useStandalonePage
  }
`;

const listTierQuery = gql`
  query AccountTiers($accountSlug: String!) {
    account(slug: $accountSlug) {
      id
      ... on AccountWithContributions {
        tiers {
          nodes {
            id
            ...EditTiersFields
          }
        }
      }
      ... on Organization {
        tiers {
          nodes {
            id
            ...EditTiersFields
          }
        }
      }
    }
  }
  ${editTiersFieldsFragment}
`;

const editTierMutation = gql`
  mutation EditTier($tier: TierUpdateInput!) {
    editTier(tier: $tier) {
      id
      ...EditTiersFields
    }
  }
  ${editTiersFieldsFragment}
`;

const createTierMutation = gql`
  mutation CreateTier($tier: TierCreateInput!, $account: AccountReferenceInput!) {
    createTier(tier: $tier, account: $account) {
      id
      ...EditTiersFields
    }
  }
  ${editTiersFieldsFragment}
`;

const deleteTierMutation = gql`
  mutation DeleteTier($tier: TierReferenceInput!, $stopRecurringContributions: Boolean! = false) {
    deleteTier(tier: $tier, stopRecurringContributions: $stopRecurringContributions) {
      id
    }
  }
`;

const i18nMessages = defineMessages({
  EDIT_SUCCESS: { id: 'EditTier.Edit.Success', defaultMessage: 'Tier updated.' },
  CREATE_SUCCESS: { id: 'EditTier.Create.Success', defaultMessage: 'Tier created.' },
  DELETE_SUCCESS: { id: 'EditTier.Delete.Success', defaultMessage: 'Tier deleted.' },
});

export function EditTierForm({ tier, collective, onClose }) {
  const intl = useIntl();
  const isEditing = React.useMemo(() => !!tier?.id);
  const initialValues = React.useMemo(() => {
    if (isEditing) {
      return {
        ...omit(tier, [
          '__typename',
          'endsAt',
          'slug',
          'legacyId',
          'invoiceTemplate',
          'customFields',
          'availableQuantity',
        ]),
        amount: omit(tier.amount, '__typename'),
        goal: omit(tier.goal, '__typename'),
        minimumAmount: omit(tier.minimumAmount, '__typename'),
        description: tier.description || '',
        presets: tier.presets || [1000],
      };
    } else {
      return {
        name: '',
        type: TierTypes.TIER,
        amountType: AmountTypes.FIXED,
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
    update: cache => {
      // Invalidate the cache for the collective page query to make sure we'll fetch the latest data next time we visit
      const cachedCollective = cache.identify({ __typename: 'Collective', id: getLegacyIdForCollective(collective) });
      if (cachedCollective) {
        cache.modify({
          id: cachedCollective,
          fields: {
            tiers: (_, { DELETE }) => DELETE,
          },
        });
      }
    },
  });

  const [deleteTier, { loading: isDeleting }] = useMutation(deleteTierMutation, { context: API_V2_CONTEXT });

  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const { addToast } = useToasts();

  const onDeleteTierClick = React.useCallback(async () => {
    setIsConfirmingDelete(true);
  }, []);

  const onConfirmDelete = React.useCallback(
    async keepRecurringContributions => {
      try {
        await deleteTier({
          variables: {
            tier: { id: tier.id },
            stopRecurringContributions: !keepRecurringContributions,
          },
          update: cache => {
            cache.evict({ id: cache.identify(tier) }); // Evict from GraphQL V1
            cache.evict({ id: cache.identify({ __typename: 'Tier', id: tier.legacyId }) }); // Evict from GraphQL V2
            cache.gc();
          },
        });
        onClose();
        addToast({
          type: TOAST_TYPE.SUCCESS,
          message: intl.formatMessage(i18nMessages['DELETE_SUCCESS']),
        });
      } catch (e) {
        addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e.message) });
      } finally {
        setIsConfirmingDelete(false);
      }
    },
    [deleteTier],
  );

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

          try {
            await submitFormMutation({
              variables: {
                tier,
              },
            });
            addToast({
              type: TOAST_TYPE.SUCCESS,
              message: intl.formatMessage(i18nMessages[isEditing ? 'EDIT_SUCCESS' : 'CREATE_SUCCESS']),
            });
            onClose();
          } catch (e) {
            addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
          }
        }}
      >
        {({ values, isSubmitting }) => {
          return (
            <Form data-cy="edit-tier-modal-form">
              <ModalHeader onClose={onClose} hideCloseIcon>
                {isEditing ? (
                  <FormattedMessage id="modal.edit-tier.title" defaultMessage="Edit Tier" />
                ) : (
                  <FormattedMessage id="modal.create-tier.title" defaultMessage="Create Tier" />
                )}
              </ModalHeader>
              <ModalBody>
                <ModalSectionContainer>
                  <EditSectionContainer>
                    <FormFields collective={collective} values={values} />
                  </EditSectionContainer>
                  <PreviewSectionContainer>
                    <ContributeCardPreview collective={collective} tier={values} />
                  </PreviewSectionContainer>
                </ModalSectionContainer>
              </ModalBody>
              <ModalFooter isFullWidth dividerMargin="1rem 0">
                <EditModalActionsContainer>
                  {isEditing && (
                    <DeleteModalButton
                      type="button"
                      data-cy="delete-btn"
                      buttonStyle="dangerSecondary"
                      minWidth={120}
                      onClick={onDeleteTierClick}
                      loading={isDeleting}
                      disabled={isSubmitting || isConfirmingDelete}
                      marginRight="auto"
                    >
                      <FormattedMessage id="actions.delete" defaultMessage="Delete" />
                    </DeleteModalButton>
                  )}
                  <ConfirmModalButton
                    type="submit"
                    data-cy="confirm-btn"
                    buttonStyle="primary"
                    minWidth={120}
                    disabled={isDeleting || isConfirmingDelete}
                    loading={isSubmitting}
                  >
                    {isEditing ? (
                      <FormattedMessage id="save" defaultMessage="Save" />
                    ) : (
                      <FormattedMessage id="create" defaultMessage="Create" />
                    )}
                  </ConfirmModalButton>
                  <CancelModalButton
                    type="button"
                    data-cy="cancel-btn"
                    disabled={isSubmitting || isDeleting || isConfirmingDelete}
                    minWidth={100}
                    onClick={onClose}
                  >
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </CancelModalButton>
                </EditModalActionsContainer>
              </ModalFooter>
            </Form>
          );
        }}
      </Formik>
      {isConfirmingDelete && (
        <ConfirmTierDeleteModal
          isDeleting={isDeleting}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirmDelete={onConfirmDelete}
        />
      )}
    </React.Fragment>
  );
}

EditTierForm.propTypes = {
  collective: PropTypes.object,
  tier: PropTypes.object,
  onClose: PropTypes.func,
};
