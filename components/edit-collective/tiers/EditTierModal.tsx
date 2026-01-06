import React from 'react';
import { useMutation } from '@apollo/client';
import { getApplicableTaxes } from '@opencollective/taxes';
import { Form, Formik, useFormikContext } from 'formik';
import { capitalize, isNil, omit } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import { getLegacyIdForCollective } from '../../../lib/collective';
import { CollectiveType } from '../../../lib/constants/collectives';
import INTERVALS, { getGQLV2FrequencyFromInterval } from '../../../lib/constants/intervals';
import { AmountTypes, TierTypes } from '../../../lib/constants/tiers-types';
import { getIntervalFromContributionFrequency } from '../../../lib/date-utils';
import { i18nGraphqlException } from '../../../lib/errors';
import { requireFields } from '../../../lib/form-utils';
import { gql } from '../../../lib/graphql/helpers';
import { useNavigationWarning } from '../../../lib/hooks/useNavigationWarning';
import { i18nTaxDescription, i18nTaxType } from '../../../lib/i18n/taxes';
import { getCollectivePageRoute } from '../../../lib/url-helpers';

import InputAmount from '@/components/InputAmount';

import ContributeTier from '../../contribute-cards/ContributeTier';
import { Box, Flex } from '../../Grid';
import InputFieldPresets from '../../InputFieldPresets';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledInput from '../../StyledInput';
import StyledInputFormikField from '../../StyledInputFormikField';
import StyledLink from '../../StyledLink';
import StyledSelect from '../../StyledSelect';
import StyledTextarea from '../../StyledTextarea';
import { Span } from '../../Text';
import { Button } from '../../ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../../ui/Dialog';
import { Switch } from '../../ui/Switch';
import { useToast } from '../../ui/useToast';

import ConfirmTierDeleteModal from './ConfirmTierDeleteModal';

const { FUND, PROJECT } = CollectiveType;
const { TIER, TICKET, MEMBERSHIP, SERVICE, PRODUCT, DONATION } = TierTypes;
const { FIXED, FLEXIBLE } = AmountTypes;

function getTierTypeOptions(intl, collectiveType) {
  const simplifiedTierTypes = [
    { value: TIER, label: capitalize(intl.formatMessage({ id: 'tier.type.tier', defaultMessage: 'generic tier' })) },
    {
      value: SERVICE,
      label: capitalize(intl.formatMessage({ id: 'tier.type.service', defaultMessage: 'service (e.g., support)' })),
    },
    {
      value: PRODUCT,
      label: capitalize(intl.formatMessage({ id: 'tier.type.product', defaultMessage: 'product (e.g., t-shirt)' })),
    },
    {
      value: DONATION,
      label: capitalize(intl.formatMessage({ id: 'tier.type.donation', defaultMessage: 'donation (gift)' })),
    },
  ];

  const membershipTierType = {
    value: MEMBERSHIP,
    label: capitalize(intl.formatMessage({ id: 'tier.type.membership', defaultMessage: 'membership (recurring)' })),
  };

  if (collectiveType === PROJECT) {
    return simplifiedTierTypes;
  }

  return [...simplifiedTierTypes, membershipTierType];
}

function getReceiptTemplates(intl, host) {
  const receiptTemplates = host?.settings?.invoice?.templates;

  const receiptTemplateTitles = [];
  if (receiptTemplates?.default) {
    receiptTemplateTitles.push({
      value: 'default',
      label: intl.formatMessage(
        { defaultMessage: '{value} (default)', id: 'OgbGHX' },
        { value: receiptTemplates.default.title },
      ),
    });
  }
  if (receiptTemplates?.alternative) {
    receiptTemplateTitles.push({ value: 'alternative', label: receiptTemplates.alternative.title });
  }
  return receiptTemplateTitles;
}

const collectiveSupportsInterval = collective => {
  return collective.type !== CollectiveType.EVENT;
};

function FormFields({ collective, values, hideTypeSelect }) {
  const intl = useIntl();
  const tierTypeOptions = React.useMemo(() => getTierTypeOptions(intl, collective.type), [intl, collective.type]);
  const intervalOptions = React.useMemo(() => {
    if (!collectiveSupportsInterval(collective)) {
      return [{ value: null, label: intl.formatMessage({ id: 'Frequency.OneTime', defaultMessage: 'One time' }) }];
    } else {
      return [
        { value: 'flexible', label: intl.formatMessage({ id: 'tier.interval.flexible', defaultMessage: 'Flexible' }) },
        { value: null, label: intl.formatMessage({ id: 'Frequency.OneTime', defaultMessage: 'One time' }) },
        { value: 'month', label: intl.formatMessage({ id: 'Frequency.Monthly', defaultMessage: 'Monthly' }) },
        { value: 'year', label: intl.formatMessage({ id: 'Frequency.Yearly', defaultMessage: 'Yearly' }) },
      ];
    }
  }, [collective.type, intl]);

  const amountTypeOptions = React.useMemo(
    () => [
      { value: FIXED, label: intl.formatMessage({ id: 'tier.amountType.fixed', defaultMessage: 'Fixed amount' }) },
      {
        value: FLEXIBLE,
        label: intl.formatMessage({ id: 'tier.amountType.flexible', defaultMessage: 'Flexible amount' }),
      },
    ],
    [intl],
  );

  const receiptTemplateOptions = getReceiptTemplates(intl, collective.host);

  const taxes = getApplicableTaxes(collective, collective.host, values.type);

  const formik = useFormikContext();

  // Enforce certain rules when updating
  React.useEffect(() => {
    // Flexible amount implies flexible interval, and vice versa
    if (values.interval === 'flexible' && values.amountType !== FLEXIBLE) {
      formik.setFieldValue('amountType', FLEXIBLE);
    } else if (values.amountType === FIXED && values.interval === 'flexible') {
      formik.setFieldValue('interval', 'onetime');
    }

    // No interval for products and tickets
    if ([PRODUCT, TICKET].includes(values.type)) {
      formik.setFieldValue('interval', null);
    }
  }, [values.interval, values.type]);

  React.useEffect(() => {}, [values.type]);

  return (
    <React.Fragment>
      {collective.type !== FUND && !hideTypeSelect && (
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
        required
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
      {[DONATION, MEMBERSHIP, TIER, SERVICE].includes(values.type) && intervalOptions.length > 1 && (
        <StyledInputFormikField
          name="interval"
          label={intl.formatMessage({ id: 'tier.interval.label', defaultMessage: 'Interval' })}
          labelFontWeight="bold"
          mt="3"
          required
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
            <InputAmount
              id={field.id}
              data-cy={field.name}
              currency={field.value?.currency ?? collective.currency}
              currencyDisplay="CODE"
              error={field.error}
              value={field.value?.valueInCents}
              maxWidth="100%"
              onChange={value =>
                form.setFieldValue(
                  field.name,
                  !isNil(value) && !isNaN(value)
                    ? { currency: field.value?.currency ?? collective.currency, valueInCents: value }
                    : null,
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
              currency={collective.currency}
              min={values.minimumAmount?.valueInCents || 0}
              defaultValue={field.value}
              onChange={value => form.setFieldValue(field.name, value)}
            />
          )}
        </StyledInputFormikField>
      )}
      {values.amountType === FLEXIBLE && (
        <StyledInputFormikField
          name="amount"
          label={intl.formatMessage({ id: 'tier.defaultAmount.label', defaultMessage: 'Default amount' })}
          labelFontWeight="bold"
          mt="3"
        >
          {({ field, form }) => (
            <InputAmount
              id={field.id}
              data-cy={field.name}
              currency={field.value?.currency ?? collective.currency}
              currencyDisplay="CODE"
              error={field.error}
              value={field.value?.valueInCents}
              maxWidth="100%"
              onChange={value =>
                form.setFieldValue(
                  field.name,
                  !isNil(value) && !isNaN(value)
                    ? { currency: field.value?.currency ?? collective.currency, valueInCents: value }
                    : null,
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
          required
        >
          {({ field, form }) => (
            <InputAmount
              id={field.id}
              data-cy={field.name}
              currency={field.value?.currency ?? collective.currency}
              currencyDisplay="CODE"
              error={field.error}
              value={field.value?.valueInCents}
              maxWidth="100%"
              onChange={value =>
                form.setFieldValue(
                  field.name,
                  !isNil(value) && !isNaN(value)
                    ? { currency: field.value?.currency ?? collective.currency, valueInCents: value }
                    : null,
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
          {({ field }) => <StyledInput data-cy={field.name} {...field} maxLength={20} />}
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
          <InputAmount
            id={field.id}
            data-cy={field.name}
            currency={field.value?.currency ?? collective.currency}
            currencyDisplay="CODE"
            error={field.error}
            value={field.value?.valueInCents}
            maxWidth="100%"
            onChange={value =>
              form.setFieldValue(
                field.name,
                !isNil(value) && !isNaN(value)
                  ? { currency: field.value?.currency ?? collective.currency, valueInCents: value }
                  : null,
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
      {values.type === TICKET && (
        <React.Fragment>
          <StyledInputFormikField
            name="singleTicket"
            label={<FormattedMessage defaultMessage="Single Ticket" id="WHXII/" />}
            labelFontWeight="bold"
            mt="3"
            flexDirection={'row'}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            {({ field, form }) => (
              <Switch
                name={field.name}
                checked={field.value}
                onCheckedChange={checked => form.setFieldValue(field.name, checked)}
              />
            )}
          </StyledInputFormikField>
          <FieldDescription>
            <FormattedMessage
              id="tier.singleTicketDescription"
              defaultMessage="Only allow people to buy a single ticket per order"
            />
          </FieldDescription>
        </React.Fragment>
      )}
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
              <Switch
                name={field.name}
                checked={field.value}
                onCheckedChange={checked => form.setFieldValue(field.name, checked)}
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
                          pathname: `${getCollectivePageRoute(collective)}/contribute/${values.slug}-${
                            values.legacyId
                          }`,
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
              id: 'cyMx/0',
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
                value={receiptTemplateOptions.find(option => option.value === (field.value ?? 'default'))}
              />
            )}
          </StyledInputFormikField>
          <FieldDescription>
            {intl.formatMessage({
              defaultMessage: 'Choose between the receipts templates available.',
              id: 'sn4ULW',
            })}
          </FieldDescription>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

const EditSectionContainer = styled(Flex)`
  overflow-y: scroll;
  flex-grow: 1;
  min-height: 200px;
  flex-direction: column;
  padding-right: 0.65rem;
  min-width: 250px;

  @media (min-width: 700px) {
    max-height: 400px;
  }
`;

const PreviewSectionContainer = styled(Flex)`
  overflow: hidden;
  max-height: 400px;
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
  gap: 12px;

  @media (max-width: 700px) {
    & > button {
      width: 100%;
    }
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
  }
`;

const FieldDescription = styled.div`
  color: #737373;
  font-size: 0.75rem;
`;

const ContributeCardPreviewContainer = styled.div`
  padding: 1.25rem;
  @media (max-width: 700px) {
    padding: 0;
  }
`;

export default function EditTierModal({ tier, collective, onClose, onUpdate, forcedType }) {
  const [formDirty, setFormDirty] = React.useState(false);
  const intl = useIntl();

  const handleClose = React.useCallback(
    ({ ignoreCloseWarning = false } = {}) => {
      if (formDirty && !ignoreCloseWarning) {
        const confirmed = confirm(
          intl.formatMessage({
            id: 'WarningUnsavedChanges',
            defaultMessage: 'You have unsaved changes. Are you sure you want to leave this page?',
          }),
        );
        if (!confirmed) {
          return; // Don't close if user cancels
        }
      }
      onClose();
    },
    [formDirty, intl, onClose],
  );

  return (
    <Dialog open={true} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-4xl" onEscapeKeyDown={e => e.preventDefault()}>
        <DialogHeader>
          <h2 className="text-lg font-semibold">
            {tier ? (
              <FormattedMessage
                defaultMessage="Edit {type, select, TICKET {Ticket} other {Tier}}"
                id="/CCt2w"
                values={{ type: tier.type }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Create {type, select, TICKET {Ticket} other {Tier}}"
                id="/XDuMs"
                values={{ type: forcedType }}
              />
            )}
          </h2>
        </DialogHeader>
        <EditTierForm
          tier={tier}
          collective={collective}
          onClose={handleClose}
          forcedType={forcedType}
          onUpdate={onUpdate}
          setFormDirty={setFormDirty}
        />
      </DialogContent>
    </Dialog>
  );
}

function ContributeCardPreview({ tier, collective }) {
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

const editTiersFieldsFragment = gql`
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
    singleTicket
  }
`;

export const listTierQuery = gql`
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

const getRequiredFields = values => {
  const fields = ['name', 'type', 'amountType'];

  // Depending on amount type
  if (values.amountType === 'FIXED') {
    fields.push('amount');
  } else if (values.amountType === 'FLEXIBLE') {
    fields.push('minimumAmount');
  }

  return fields;
};

function EditTierFormInner({
  formik,
  tier,
  collective,
  onClose,
  forcedType,
  onDeleteTierClick,
  isDeleting,
  isConfirmingDelete,
  setFormDirty,
}) {
  const intl = useIntl();
  const { values, isSubmitting, dirty } = formik;

  // Use navigation warning when form has unsaved changes
  useNavigationWarning({
    enabled: dirty,
    confirmationMessage: intl.formatMessage({
      id: 'WarningUnsavedChanges',
      defaultMessage: 'You have unsaved changes. Are you sure you want to leave this page?',
    }),
  });

  // Notify parent component when dirty state changes
  React.useEffect(() => {
    setFormDirty?.(dirty);
  }, [dirty, setFormDirty]);

  return (
    <Form data-cy="edit-tier-modal-form">
      <div className="flex-1">
        <ModalSectionContainer>
          <EditSectionContainer>
            <FormFields collective={collective} values={values} hideTypeSelect={Boolean(forcedType)} />
          </EditSectionContainer>
          <PreviewSectionContainer>
            <ContributeCardPreview collective={collective} tier={values} />
          </PreviewSectionContainer>
        </ModalSectionContainer>
      </div>
      <DialogFooter className="flex-col-reverse border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:space-x-2">
        <EditModalActionsContainer>
          {Boolean(tier) && (
            <Button
              type="button"
              data-cy="delete-btn"
              variant="outlineDestructive"
              onClick={onDeleteTierClick}
              loading={isDeleting}
              disabled={isSubmitting || isConfirmingDelete}
              className="min-w-32"
            >
              <FormattedMessage id="actions.delete" defaultMessage="Delete" />
            </Button>
          )}
          <Button
            type="button"
            data-cy="cancel-btn"
            variant="outline"
            disabled={isSubmitting || isDeleting || isConfirmingDelete}
            onClick={onClose}
            className="min-w-24"
          >
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </Button>
          <Button
            type="submit"
            data-cy="confirm-btn"
            variant="default"
            disabled={isDeleting || isConfirmingDelete}
            loading={isSubmitting}
            className="min-w-32"
          >
            {tier ? (
              <FormattedMessage id="save" defaultMessage="Save" />
            ) : (
              <FormattedMessage id="create" defaultMessage="Create" />
            )}
          </Button>
        </EditModalActionsContainer>
      </DialogFooter>
    </Form>
  );
}

function EditTierForm({ tier, collective, onClose, onUpdate, forcedType, setFormDirty }) {
  const intl = useIntl();
  const isEditing = Boolean(tier?.id);
  const initialValues = React.useMemo(() => {
    if (isEditing) {
      return {
        ...omit(tier, ['__typename', 'endsAt', 'customFields', 'availableQuantity']),
        amount: omit(tier.amount, '__typename'),
        interval: collectiveSupportsInterval(collective) ? getIntervalFromContributionFrequency(tier.frequency) : null,
        goal: omit(tier.goal, '__typename'),
        minimumAmount: omit(tier.minimumAmount, '__typename'),
        description: tier.description || '',
        presets: tier.presets || [1000],
      };
    } else {
      return {
        name: '',
        type: forcedType || TierTypes.TIER,
        amountType: AmountTypes.FIXED,
        amount: null,
        minimumAmount: null,
        interval: collectiveSupportsInterval(collective) ? INTERVALS.month : null,
        description: '',
        presets: [1000],
        maxQuantity: null,
        singleTicket: false,
        goal: null,
      };
    }
  }, [collective, forcedType, isEditing, tier]);

  const formMutation = isEditing ? editTierMutation : createTierMutation;

  const [submitFormMutation] = useMutation(formMutation, {
    update: cache => {
      // Invalidate the cache for the collective page query to make sure we'll fetch the latest data next time we visit
      const __typename = collective.type === CollectiveType.EVENT ? 'Event' : 'Collective';
      const cachedCollective = cache.identify({ __typename, id: getLegacyIdForCollective(collective) });
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

  const [deleteTier, { loading: isDeleting }] = useMutation(deleteTierMutation);

  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const { toast } = useToast();

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
        onClose({ ignoreCloseWarning: true });
        toast({
          variant: 'success',
          message: intl.formatMessage(
            { defaultMessage: '{type, select, TICKET {Ticket} other {Tier}} deleted.', id: 'r5PByj' },
            { type: tier.type },
          ),
        });
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e.message) });
      } finally {
        setIsConfirmingDelete(false);
      }
    },
    [deleteTier, intl, onClose, tier, toast],
  );

  return (
    <React.Fragment>
      <Formik
        initialValues={initialValues}
        validate={values => requireFields(values, getRequiredFields(values))}
        onSubmit={async values => {
          const tier = {
            ...omit(values, ['interval', 'legacyId', 'slug']),
            frequency: getGQLV2FrequencyFromInterval(values.interval),
            maxQuantity: parseInt(values.maxQuantity),
            goal: !isNil(values.goal?.valueInCents) ? values.goal : null,
            amount: !isNil(values.amount?.valueInCents) ? values.amount : null,
            minimumAmount: !isNil(values.minimumAmount?.valueInCents) ? values.minimumAmount : null,
            singleTicket: values.singleTicket,
          };

          try {
            const result = await submitFormMutation({ variables: { tier, account: { legacyId: collective.id } } });
            onUpdate?.(result);
            toast({
              variant: 'success',
              message: isEditing
                ? intl.formatMessage(
                    { defaultMessage: '{type, select, TICKET {Ticket} other {Tier}} updated.', id: 'SOhVsw' },
                    { type: values.type },
                  )
                : intl.formatMessage(
                    { defaultMessage: '{type, select, TICKET {Ticket} other {Tier}} created.', id: 'deViVP' },
                    { type: values.type },
                  ),
            });
            onClose({ ignoreCloseWarning: true });
          } catch (e) {
            toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          }
        }}
      >
        {formik => {
          return (
            <EditTierFormInner
              formik={formik}
              tier={tier}
              collective={collective}
              onClose={onClose}
              forcedType={forcedType}
              onDeleteTierClick={onDeleteTierClick}
              isDeleting={isDeleting}
              isConfirmingDelete={isConfirmingDelete}
              setFormDirty={setFormDirty}
            />
          );
        }}
      </Formik>
      {isConfirmingDelete && (
        <ConfirmTierDeleteModal
          tier={tier}
          isDeleting={isDeleting}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirmDelete={onConfirmDelete}
        />
      )}
    </React.Fragment>
  );
}
