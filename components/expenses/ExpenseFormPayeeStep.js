import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Undo } from '@styled-icons/fa-solid/Undo';
import { FastField, Field } from 'formik';
import { first, get, groupBy, isEmpty, omit, pick } from 'lodash';
import { createPortal } from 'react-dom';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { compareNames } from '../../lib/collective';
import { AccountTypesWithHost, CollectiveType } from '../../lib/constants/collectives';
import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { EMPTY_ARRAY } from '../../lib/constants/utils';
import { ERROR, isErrorType } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { expenseFormPayeeStepCollectivePickerSearchQuery } from '../../lib/graphql/v1/queries';
import { require2FAForAdmins } from '../../lib/policies';
import { flattenObjectDeep } from '../../lib/utils';
import { checkRequiresAddress } from './lib/utils';

import CollectivePicker, { CUSTOM_OPTIONS_POSITION, FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputLocation from '../StyledInputLocation';
import StyledTextarea from '../StyledTextarea';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';
import { TwoFactorAuthRequiredMessage } from '../TwoFactorAuthRequiredMessage';

import PayoutMethodForm, { validatePayoutMethod } from './PayoutMethodForm';
import PayoutMethodSelect from './PayoutMethodSelect';

const { INDIVIDUAL, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT, VENDOR } = CollectiveType;

const msg = defineMessages({
  payeeLabel: {
    id: `ExpenseForm.payeeLabel`,
    defaultMessage: 'Who is being paid for this expense?',
  },
  payoutOptionLabel: {
    id: `ExpenseForm.PayoutOptionLabel`,
    defaultMessage: 'Payout method',
  },
  invoiceInfo: {
    id: 'ExpenseForm.InvoiceInfo',
    defaultMessage: 'Additional invoice information',
  },
  invoiceInfoPlaceholder: {
    id: 'ExpenseForm.InvoiceInfoPlaceholder',
    defaultMessage: 'Tax ID, VAT number, etc. This information will be printed on your invoice.',
  },
  country: {
    id: 'ExpenseForm.ChooseCountry',
    defaultMessage: 'Choose country',
  },
  address: {
    id: 'ExpenseForm.AddressLabel',
    defaultMessage: 'Physical address',
  },
  cancelEditExpense: {
    id: 'ExpenseForm.CancelEditExpense',
    defaultMessage: 'Cancel Edit',
  },
  confirmCancelEditExpense: {
    id: 'ExpenseForm.ConfirmCancelEditExpense',
    defaultMessage: 'Are you sure you want to cancel the edits?',
  },
  clearExpenseForm: {
    id: 'ExpenseForm.ClearExpenseForm',
    defaultMessage: 'Clear Form',
  },
  confirmClearExpenseForm: {
    id: 'ExpenseForm.ConfirmClearExpenseForm',
    defaultMessage: 'Are you sure you want to clear the expense form?',
  },
});

const setLocationFromPayee = (formik, payee) => {
  formik.setFieldValue('payeeLocation.country', payee?.location?.country || null);
  formik.setFieldValue('payeeLocation.address', payee?.location?.address || '');
  formik.setFieldValue('payeeLocation.structured', payee?.location?.structured);
};

const getPayoutMethodsFromPayee = payee => {
  const payoutMethods = (get(payee, 'payoutMethods') || EMPTY_ARRAY).filter(({ isSaved }) => isSaved);

  // If the Payee is active (can manage a budget and has a balance). This is usually:
  // - a "Collective" family (Collective, Fund, Event, Project) with an host or Self Hosted
  // - an "Host" Organization with budget activated (new default)
  if (payee?.isActive) {
    if (!payoutMethods.find(pm => pm.type === PayoutMethodType.ACCOUNT_BALANCE)) {
      payoutMethods.push({
        id: 'new',
        data: {},
        type: PayoutMethodType.ACCOUNT_BALANCE,
        isSaved: true,
      });
    }
  }

  // If the Payee is in the "Collective" family (Collective, Fund, Event, Project)
  // But not the Host itself (Self Hosted)
  // Then we should add BANK_ACCOUNT and PAYPAL of the Host as an option
  if (payee && AccountTypesWithHost.includes(payee.type) && payee.id !== payee.host?.id) {
    const hostPayoutMethods = get(payee, 'host.payoutMethods') || EMPTY_ARRAY;
    let hostSuitablePayoutMethods = hostPayoutMethods
      .filter(payoutMethod => payoutMethod.type === PayoutMethodType.BANK_ACCOUNT)
      .filter(
        payoutMethod =>
          !payoutMethod.name ||
          payoutMethod.name.includes('Collectives account') ||
          payoutMethod.name.includes('Main account'),
      );
    if (hostSuitablePayoutMethods.length === 0) {
      hostSuitablePayoutMethods = hostPayoutMethods.filter(
        payoutMethod => payoutMethod.type === PayoutMethodType.PAYPAL,
      );
    }
    payoutMethods.push(...hostSuitablePayoutMethods.map(payoutMethod => ({ ...payoutMethod, isDeletable: false })));
  }

  return payoutMethods.length > 0 ? payoutMethods : EMPTY_ARRAY;
};

const refreshPayoutProfile = (formik, payoutProfiles) => {
  const payee = formik.values.payee
    ? payoutProfiles.find(profile => profile.id === formik.values.payee.id)
    : first(payoutProfiles);

  formik.setValues({ ...formik.values, draft: omit(formik.values.draft, ['payee']), payee });
};

const sortProfiles = profiles => {
  return profiles?.sort((a, b) => a.slug.localeCompare(b.slug)) || [];
};

const getPayeeOptions = (intl, payoutProfiles) => {
  const profilesByType = groupBy(payoutProfiles, p => p.type);
  const getOption = profile => ({ value: profile, label: profile.name, [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true });
  const getProfileOptions = type => sortProfiles(profilesByType[type]).map(getOption);

  const payeeOptions = [
    {
      label: intl.formatMessage({ defaultMessage: 'Myself' }),
      options: getProfileOptions(INDIVIDUAL),
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Vendors' }),
      options: getProfileOptions(VENDOR),
    },
    {
      label: intl.formatMessage({ id: 'organization', defaultMessage: 'My Organizations' }),
      options: getProfileOptions(ORGANIZATION),
    },
  ];

  if (profilesByType[COLLECTIVE]?.length) {
    payeeOptions.push({
      options: getProfileOptions(COLLECTIVE),
      label: intl.formatMessage({ id: 'collective', defaultMessage: 'My Collectives' }),
    });
  }
  if (profilesByType[FUND]?.length) {
    payeeOptions.push({
      options: getProfileOptions(FUND),
      label: intl.formatMessage({ id: 'funds', defaultMessage: 'My Funds' }),
    });
  }
  if (profilesByType[PROJECT]?.length) {
    payeeOptions.push({
      options: getProfileOptions(PROJECT),
      label: intl.formatMessage({ defaultMessage: 'My Projects' }),
    });
  }
  if (profilesByType[EVENT]?.length) {
    payeeOptions.push({
      options: getProfileOptions(EVENT),
      label: intl.formatMessage({ id: 'events', defaultMessage: 'My Events' }),
    });
  }

  return payeeOptions;
};

const hostVendorsQuery = gql`
  query HostVendors($hostId: String!, $collectiveSlug: String!) {
    host(id: $hostId, throwIfMissing: false) {
      id
      slug
      legacyId
      vendors(forAccount: { slug: $collectiveSlug }, limit: 5) {
        nodes {
          id
          slug
          name
          type
          description
          imageUrl(height: 64)
          hasPayoutMethod
          payoutMethods {
            id
            type
            name
            data
            isSaved
          }
        }
      }
    }
  }
`;

const checkStepOneCompleted = (values, isOnBehalf, isMissing2FA) => {
  if (isMissing2FA) {
    return false;
  } else if (isOnBehalf || values.payee?.type === VENDOR) {
    return Boolean(values.payee);
  } else if (!isEmpty(flattenObjectDeep(validatePayoutMethod(values.payoutMethod)))) {
    return false; // There are some errors in the form
  } else if (checkRequiresAddress(values)) {
    // Require an address for non-receipt expenses
    return Boolean(values.payoutMethod && values.payeeLocation?.country && values.payeeLocation?.address);
  } else {
    return true;
  }
};

const ExpenseFormPayeeStep = ({
  formik,
  payoutProfiles,
  collective,
  onCancel,
  onNext,
  onInvite,
  onChange,
  isOnBehalf,
  loggedInAccount,
  editingExpense,
  handleClearPayeeStep,
  drawerActionsContainer,
  disablePayee,
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { values, errors } = formik;
  const { data, loading } = useQuery(hostVendorsQuery, {
    context: API_V2_CONTEXT,
    variables: { hostId: collective.host?.id, collectiveSlug: collective.slug },
    skip: !collective.host?.id,
  });
  const isMissing2FA = require2FAForAdmins(values.payee) && !loggedInAccount?.hasTwoFactorAuth;
  const stepOneCompleted = checkStepOneCompleted(values, isOnBehalf, isMissing2FA);
  const allPayoutMethods = React.useMemo(
    () => getPayoutMethodsFromPayee(values.payee),
    [values.payee, loggedInAccount],
  );

  const onPayoutMethodRemove = React.useCallback(() => refreshPayoutProfile(formik, payoutProfiles), [payoutProfiles]);
  const setPayoutMethod = React.useCallback(({ value }) => formik.setFieldValue('payoutMethod', value), []);

  const vendors = get(data, 'host.vendors.nodes', []).filter(v => v.hasPayoutMethod);
  const payeeOptions = React.useMemo(
    () => getPayeeOptions(intl, [...payoutProfiles, ...vendors]),
    [payoutProfiles, vendors],
  );
  const requiresAddress = checkRequiresAddress(values);
  const requiresPayoutMethod = !isOnBehalf && values.payee?.type !== VENDOR;
  const canInvite = !values?.status;

  const collectivePick = canInvite
    ? ({ id }) => (
        <CollectivePickerAsync
          inputId={id}
          data-cy="select-expense-payee"
          isSearchable
          collective={values.payee}
          onChange={({ value }) => {
            if (value) {
              const existingProfile = payoutProfiles.find(p => p.slug === value.slug);
              const isVendor = value.type === VENDOR;
              const isNewlyCreatedProfile = value.members?.some(
                m => m.role === 'ADMIN' && m.member.slug === loggedInAccount.slug,
              );

              const payee = existingProfile || {
                ...pick(value, ['id', 'name', 'slug', 'email', 'type', 'payoutMethods']),
                isInvite: !isNewlyCreatedProfile && !isVendor,
              };

              if (isNewlyCreatedProfile && !isVendor) {
                payee.payoutMethods = [];
              }

              formik.setFieldValue('payee', payee);
              formik.setFieldValue('payoutMethod', isVendor ? first(payee.payoutMethods) || null : null);
              setLocationFromPayee(formik, payee);
              onChange(payee);
            }
          }}
          styles={{
            menu: {
              borderRadius: '16px',
            },
            menuList: {
              padding: '8px',
            },
          }}
          emptyCustomOptions={payeeOptions}
          customOptionsPosition={CUSTOM_OPTIONS_POSITION.BOTTOM}
          getDefaultOptions={build => values.payee && build(values.payee)}
          disabled={disablePayee}
          invitable
          onInvite={onInvite}
          LoggedInUser={loggedInAccount}
          includeVendorsForHostId={collective.host?.legacyId || undefined}
          addLoggedInUserAsAdmin
          excludeAdminFields
          searchQuery={expenseFormPayeeStepCollectivePickerSearchQuery}
          filterResults={collectives => collectives.filter(c => c.type !== CollectiveType.VENDOR || c.hasPayoutMethod)}
          loading={loading}
        />
      )
    : ({ id }) => (
        <CollectivePicker
          inputId={id}
          customOptions={payeeOptions}
          getDefaultOptions={build => values.payee && build(values.payee)}
          data-cy="select-expense-payee"
          isSearchable
          disabled={disablePayee}
          collective={values.payee}
          onChange={({ value }) => {
            formik.setFieldValue('payee', value);
            formik.setFieldValue('payoutMethod', null);
            setLocationFromPayee(formik, value);
            onChange(value);
          }}
          loading={loading}
        />
      );

  const actionButtons = (
    <Flex flex={1} gridGap={[2, 3]} flexWrap="wrap">
      {onCancel && (
        <StyledButton
          type="button"
          width={['100%', 'auto']}
          whiteSpace="nowrap"
          data-cy="expense-cancel"
          onClick={() => {
            onCancel?.();
          }}
        >
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
      )}
      <StyledButton
        type="button"
        width={['100%', 'auto']}
        whiteSpace="nowrap"
        data-cy="expense-next"
        buttonStyle="primary"
        disabled={!stepOneCompleted}
        onClick={async () => {
          const allErrors = await formik.validateForm();
          // Get the relevant errors for the payee step, ignores data.currency in the because it is related to expense amount.
          const errors = omit(pick(allErrors, ['payee', 'payoutMethod', 'payeeLocation']), [
            'payoutMethod.data.currency',
          ]);
          if (isEmpty(flattenObjectDeep(errors))) {
            onNext?.(formik.values);
          } else {
            // We use set touched here to display errors on fields that are not dirty.
            // eslint-disable-next-line no-console
            console.log('ExpenseFormPayeeStep > Validation failed', errors);
            formik.setTouched(errors);
            formik.setErrors(errors);
          }
        }}
      >
        <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
        &nbsp;→
      </StyledButton>

      <StyledButton
        type="button"
        buttonStyle="borderless"
        width={['100%', 'auto']}
        color="red.500"
        whiteSpace="nowrap"
        onClick={handleClearPayeeStep}
        marginLeft={'auto'}
      >
        <Undo size={11} />
        <Span mx={1}>{formatMessage(editingExpense ? msg.cancelEditExpense : msg.clearExpenseForm)}</Span>
      </StyledButton>
    </Flex>
  );

  return (
    <Fragment>
      <Flex flexDirection={['column', 'row']}>
        <Box mr={[null, 2, null, 4]} flexGrow="1" flexBasis="50%" maxWidth={[null, null, '60%']}>
          <Field name="payee">
            {({ field }) => (
              <StyledInputField
                name={field.name}
                label={formatMessage(msg.payeeLabel)}
                labelFontSize="13px"
                flex="1"
                mt={3}
              >
                {collectivePick}
              </StyledInputField>
            )}
          </Field>
          {!isMissing2FA && (
            <React.Fragment>
              {values.payee?.legalName && (
                <Field name="legalName">
                  {({ field }) => (
                    <StyledInputField
                      name={field.name}
                      label={
                        <React.Fragment>
                          <FormattedMessage id="LegalName" defaultMessage="Legal Name" />
                          &nbsp;
                          <StyledTooltip
                            content={() => (
                              <FormattedMessage
                                id="ExpenseForm.legalName.tooltip"
                                defaultMessage="The legal name of the payee. This can be changed in your profile settings."
                              />
                            )}
                          >
                            <InfoCircle size={16} />
                          </StyledTooltip>
                        </React.Fragment>
                      }
                      labelFontSize="13px"
                      flex="1"
                      mt={3}
                    >
                      <StyledInput value={values.payee.legalName} disabled />
                      {values.payoutMethod?.data?.accountHolderName &&
                        values.payee.legalName &&
                        !compareNames(values.payoutMethod.data.accountHolderName, values.payee.legalName) && (
                          <MessageBox mt={2} fontSize="12px" type="warning" withIcon>
                            <FormattedMessage
                              id="Warning.LegalNameNotMatchBankAccountName"
                              defaultMessage="The legal name should match the bank account holder name in most cases. Otherwise payments may be delayed. If the payment is to an organization, please select or create that organization's profile instead of your individual profile as the payee."
                            />
                          </MessageBox>
                        )}
                    </StyledInputField>
                  )}
                </Field>
              )}
              {requiresAddress && (
                <Box mt={3}>
                  <StyledInputLocation
                    onChange={values => {
                      formik.setFieldValue('payeeLocation', values);
                    }}
                    location={values.payeeLocation}
                    errors={errors.payeeLocation}
                  />
                </Box>
              )}
              {values.type === expenseTypes.INVOICE && (
                <FastField name="invoiceInfo">
                  {({ field }) => (
                    <StyledInputField
                      name={field.name}
                      label={formatMessage(msg.invoiceInfo)}
                      labelFontSize="13px"
                      fontSize="14px"
                      required={false}
                      mt={3}
                    >
                      {inputProps => (
                        <Field
                          as={StyledTextarea}
                          {...inputProps}
                          {...field}
                          minHeight={80}
                          placeholder={formatMessage(msg.invoiceInfoPlaceholder)}
                        />
                      )}
                    </StyledInputField>
                  )}
                </FastField>
              )}
            </React.Fragment>
          )}
        </Box>
        {requiresPayoutMethod && (
          <Box flexGrow="1" flexBasis="50%" display={values.payee ? 'block' : 'none'}>
            <Field name="payoutMethod">
              {({ field }) => (
                <StyledInputField
                  name={field.name}
                  htmlFor="payout-method"
                  flex="1"
                  mt={3}
                  label={formatMessage(msg.payoutOptionLabel)}
                  labelFontSize="13px"
                  error={
                    isErrorType(errors.payoutMethod, ERROR.FORM_FIELD_REQUIRED)
                      ? formatFormErrorMessage(intl, errors.payoutMethod)
                      : null
                  }
                >
                  {({ id, error }) => (
                    <PayoutMethodSelect
                      inputId={id}
                      error={error}
                      onChange={setPayoutMethod}
                      onRemove={onPayoutMethodRemove}
                      payoutMethod={values.payoutMethod}
                      payoutMethods={allPayoutMethods}
                      payee={values.payee}
                      disabled={!values.payee || isMissing2FA}
                      collective={collective}
                    />
                  )}
                </StyledInputField>
              )}
            </Field>

            {values.payoutMethod && (
              <Field name="payoutMethod">
                {({ field, meta }) => (
                  <Box mt={3} flex="1">
                    <PayoutMethodForm
                      fieldsPrefix="payoutMethod"
                      payoutMethod={field.value}
                      host={collective.host}
                      errors={meta.error}
                    />
                  </Box>
                )}
              </Field>
            )}
          </Box>
        )}
      </Flex>

      {isMissing2FA && <TwoFactorAuthRequiredMessage mt={4} />}

      {values.payee &&
        !isMissing2FA &&
        (drawerActionsContainer ? (
          createPortal(actionButtons, drawerActionsContainer)
        ) : (
          <Fragment>
            <StyledHr flex="1" mt={4} mb={3} borderColor="black.300" />
            {actionButtons}
          </Fragment>
        ))}
    </Fragment>
  );
};

ExpenseFormPayeeStep.propTypes = {
  formik: PropTypes.object,
  editingExpense: PropTypes.bool,
  payoutProfiles: PropTypes.array,
  onCancel: PropTypes.func,
  handleClearPayeeStep: PropTypes.func,
  onNext: PropTypes.func,
  onInvite: PropTypes.func,
  onChange: PropTypes.func,
  isOnBehalf: PropTypes.bool,
  disablePayee: PropTypes.bool,
  loggedInAccount: PropTypes.object,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    host: PropTypes.shape({
      id: PropTypes.string,
      legacyId: PropTypes.number,
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.object),
      }),
    }),
    settings: PropTypes.object,
  }).isRequired,
  drawerActionsContainer: PropTypes.object,
};

export default ExpenseFormPayeeStep;
