import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import { filter, get, isEmpty, size } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { MODERATION_CATEGORIES } from '../../../lib/constants/moderation-categories';
import { i18nGraphqlException } from '../../../lib/errors';
import { DEFAULT_SUPPORTED_EXPENSE_TYPES } from '../../../lib/expenses';
import { API_V2_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';
import { omitDeep, stripHTML } from '../../../lib/utils';

import Container from '../../Container';
import { Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledCheckbox from '../../StyledCheckbox';
import StyledInputAmount from '../../StyledInputAmount';
import StyledInputField from '../../StyledInputField';
import StyledSelect from '../../StyledSelect';
import { P } from '../../Text';
import { useToast } from '../../ui/useToast';

import { getSettingsQuery } from './EditCollectivePage';
import SettingsSectionTitle from './SettingsSectionTitle';

const EXPENSE_POLICY_MAX_LENGTH = 16000; // max in database is ~15,500
const CONTRIBUTION_POLICY_MAX_LENGTH = 3000; // 600 words * 5 characters average length word

const updateFilterCategoriesMutation = gql`
  mutation UpdateFilterCategories($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      type
      isActive
      settings
    }
  }
`;

const editCollectiveMutation = gqlV1/* GraphQL */ `
  mutation EditCollectiveMutation($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      type
      isActive
      settings
    }
  }
`;

const setPoliciesMutation = gql`
  mutation SetPolicies($account: AccountReferenceInput!, $policies: PoliciesInput!) {
    setPolicies(account: $account, policies: $policies) {
      id
      policies {
        id
        EXPENSE_AUTHOR_CANNOT_APPROVE {
          enabled
          amountInCents
          appliesToHostedCollectives
          appliesToSingleAdminCollectives
        }
        REQUIRE_2FA_FOR_ADMINS
        COLLECTIVE_ADMINS_CAN_REFUND
        COLLECTIVE_MINIMUM_ADMINS {
          numberOfAdmins
          applies
          freeze
        }
      }
    }
  }
`;

const messages = defineMessages({
  'rejectCategories.placeholder': {
    id: 'editCollective.rejectCategories.placeholder',
    defaultMessage: 'Choose categories',
  },
  'contributionPolicy.label': {
    id: 'collective.contributionPolicy.label',
    defaultMessage: 'Contribution Policy',
  },
  'contributionPolicy.placeholder': {
    id: 'collective.contributionPolicy.placeholder',
    defaultMessage: 'E.g. what types of contributions you will and will not accept.',
  },
  'contributionPolicy.error': {
    id: 'collective.contributionPolicy.error',
    defaultMessage: 'Contribution policy must contain less than {maxLength} characters',
  },
  'expensePolicy.label': {
    id: 'editCollective.menu.expenses',
    defaultMessage: 'Expenses Policy',
  },
  'expensePolicy.placeholder': {
    id: 'collective.expensePolicy.placeholder',
    defaultMessage: 'E.g. approval criteria, limitations, or required documentation.',
  },
  'expensePolicy.error': {
    id: 'collective.expensePolicy.error',
    defaultMessage: 'Expense policy must contain less than {maxLength} characters',
  },
  'expensePolicy.allowExpense': {
    id: 'collective.expensePolicy.allowExpense',
    defaultMessage:
      'Only allow expenses to be created by Team Members and Financial Contributors (they may invite expenses from other payees)',
  },
  'expensePolicy.RECEIPT': {
    id: 'collective.expensePolicy.hasReceipt',
    defaultMessage: 'Allow receipts',
  },
  'expensePolicy.GRANT': {
    id: 'collective.expensePolicy.hasGrant',
    defaultMessage: 'Allow grants',
  },
  'expensePolicy.INVOICE': {
    id: 'collective.expensePolicy.hasInvoice',
    defaultMessage: 'Allow invoices',
  },
  'requiredAdmins.numberOfAdmins': {
    defaultMessage: '{admins, plural, =0 {Do not enforce minimum number of admins} one {# Admin} other {# Admins} }',
  },
});

const Policies = ({ collective, showOnlyExpensePolicy }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [selected, setSelected] = React.useState([]);
  const { toast } = useToast();

  // GraphQL
  const { loading, data } = useQuery(getSettingsQuery, {
    variables: { slug: collective.slug },
    context: API_V2_CONTEXT,
  });
  const [updateCategories, { loading: isSubmittingCategories, error: categoriesError }] = useMutation(
    updateFilterCategoriesMutation,
    {
      context: API_V2_CONTEXT,
    },
  );
  const [updateCollective, { loading: isSubmittingSettings, error: settingsError }] =
    useMutation(editCollectiveMutation);
  const [setPolicies, { loading: isSettingPolicies, error: policiesError }] = useMutation(setPoliciesMutation, {
    context: API_V2_CONTEXT,
  });
  const error = categoriesError || settingsError || policiesError;

  // Data and data handling
  const collectiveContributionFilteringCategories = get(data, 'account.settings.moderation.rejectedCategories', null);
  const collectiveContributionPolicy = get(collective, 'contributionPolicy', null);
  const collectiveExpensePolicy = get(collective, 'expensePolicy', null);
  const collectiveDisableExpenseSubmission = get(collective, 'settings.disablePublicExpenseSubmission', false);
  const expenseTypes = get(collective, 'settings.expenseTypes') || DEFAULT_SUPPORTED_EXPENSE_TYPES;
  const numberOfAdmins = size(filter(collective.members, m => m.role === 'ADMIN'));

  const selectOptions = React.useMemo(() => {
    const optionsArray = Object.entries(MODERATION_CATEGORIES).map(([key, value], index) => ({
      id: index,
      value: key,
      label: value,
    }));
    return optionsArray;
  }, [MODERATION_CATEGORIES]);

  // Form
  const formik = useFormik({
    initialValues: {
      contributionPolicy: collectiveContributionPolicy || '',
      expensePolicy: collectiveExpensePolicy || '',
      disablePublicExpenseSubmission: collectiveDisableExpenseSubmission || false,
      expenseTypes,
      policies: omitDeep(data?.account?.policies || {}, ['__typename']),
    },
    async onSubmit(values) {
      const { contributionPolicy, expensePolicy, disablePublicExpenseSubmission, expenseTypes, policies } = values;
      const newSettings = { ...collective.settings, disablePublicExpenseSubmission };
      if (collective.isHost) {
        newSettings.expenseTypes = expenseTypes;
      }

      try {
        await updateCollective({
          variables: {
            collective: {
              id: collective.id,
              contributionPolicy,
              expensePolicy,
              settings: newSettings,
            },
          },
        });
        const selectedRejectCategories = selected.map(option => option.value);
        await Promise.all([
          updateCategories({
            variables: {
              account: {
                legacyId: collective.id,
              },
              key: 'moderation',
              value: { rejectedCategories: selectedRejectCategories },
            },
          }),
          setPolicies({
            variables: {
              account: {
                legacyId: collective.id,
              },
              policies,
            },
          }),
        ]);

        toast({
          variant: 'success',
          message: formatMessage({ defaultMessage: 'Policies updated successfully' }),
        });
      } catch (e) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, e),
        });
      }
    },
    validate(values) {
      const errors = {};
      const contributionPolicyText = stripHTML(values.contributionPolicy);
      const expensePolicyText = stripHTML(values.expensePolicy);

      if (contributionPolicyText.length > CONTRIBUTION_POLICY_MAX_LENGTH) {
        errors.contributionPolicy = formatMessage(messages['contributionPolicy.error'], {
          maxLength: CONTRIBUTION_POLICY_MAX_LENGTH,
        });
      }
      if (expensePolicyText.length > EXPENSE_POLICY_MAX_LENGTH) {
        errors.expensePolicy = formatMessage(messages['expensePolicy.error'], { maxLength: EXPENSE_POLICY_MAX_LENGTH });
      }
      return errors;
    },
  });

  React.useEffect(() => {
    if (collectiveContributionFilteringCategories && isEmpty(selected)) {
      const alreadyPickedCategories = collectiveContributionFilteringCategories.map(category => {
        return selectOptions.find(option => option.value === category);
      });
      setSelected(alreadyPickedCategories);
    }
  }, [loading, collectiveContributionFilteringCategories]);

  React.useEffect(() => {
    if (data) {
      formik.setFieldValue('policies', omitDeep(data?.account?.policies || {}, ['__typename', 'id']));
    }
  }, [data]);

  const numberOfAdminsOptions = [0, 2, 3, 4, 5].map(n => ({
    value: n,
    label: formatMessage(messages['requiredAdmins.numberOfAdmins'], { admins: n }),
  }));
  const minAdminsApplies = [
    { value: 'NEW_COLLECTIVES', label: <FormattedMessage defaultMessage="New Collectives Only" /> },
    { value: 'ALL_COLLECTIVES', label: <FormattedMessage defaultMessage="All Collectives" /> },
  ];

  const hostAuthorCannotApproveExpensePolicy = data?.account?.host?.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE'];
  const authorCannotApproveExpenseEnforcedByHost =
    hostAuthorCannotApproveExpensePolicy?.enabled && hostAuthorCannotApproveExpensePolicy?.appliesToHostedCollectives;

  return (
    <Flex flexDirection="column">
      {error && <MessageBoxGraphqlError error={error} />}
      <form onSubmit={formik.handleSubmit}>
        <Container>
          {!showOnlyExpensePolicy && (
            <Container mb={4}>
              <StyledInputField
                name="contributionPolicy"
                htmlFor="contributionPolicy"
                error={formik.errors.contributionPolicy}
                disabled={isSubmittingSettings}
                labelProps={{ mb: 2, pt: 2, lineHeight: '18px', fontWeight: 'bold' }}
                label={
                  <SettingsSectionTitle>{formatMessage(messages['contributionPolicy.label'])}</SettingsSectionTitle>
                }
              >
                {inputProps => (
                  <RichTextEditor
                    withBorders
                    showCount
                    maxLength={CONTRIBUTION_POLICY_MAX_LENGTH}
                    error={formik.errors.contributionPolicy}
                    version="simplified"
                    editorMinHeight="12.5rem"
                    editorMaxHeight={500}
                    id={inputProps.id}
                    inputName={inputProps.name}
                    onChange={formik.handleChange}
                    placeholder={formatMessage(messages['contributionPolicy.placeholder'])}
                    defaultValue={formik.values.contributionPolicy}
                    fontSize="14px"
                  />
                )}
              </StyledInputField>
              <P fontSize="14px" lineHeight="18px" color="black.600" mt={2}>
                <FormattedMessage
                  id="collective.contributionPolicy.description"
                  defaultMessage="Financial Contributors are manually reviewed by the Open Collective team to check for abuse or spam. Financial Contributors with a good reputation should not be affected by this setting."
                />
              </P>
            </Container>
          )}

          <StyledInputField
            name="expensePolicy"
            htmlFor="expensePolicy"
            error={formik.errors.expensePolicy}
            disabled={isSubmittingSettings}
            labelProps={{ mb: 2, pt: 2, lineHeight: '18px', fontWeight: 'bold' }}
            label={<SettingsSectionTitle>{formatMessage(messages['expensePolicy.label'])}</SettingsSectionTitle>}
          >
            {inputProps => (
              <RichTextEditor
                data-cy="expense-policy-input"
                withBorders
                showCount
                maxLength={EXPENSE_POLICY_MAX_LENGTH}
                error={formik.errors.expensePolicy}
                version="simplified"
                editorMinHeight="12.5rem"
                editorMaxHeight={500}
                id={inputProps.id}
                inputName={inputProps.name}
                onChange={formik.handleChange}
                placeholder={formatMessage(messages['expensePolicy.placeholder'])}
                defaultValue={formik.values.expensePolicy}
                fontSize="14px"
                maxHeight={600}
              />
            )}
          </StyledInputField>
          <P fontSize="14px" lineHeight="18px" color="black.600" my={2}>
            <FormattedMessage
              id="collective.expensePolicy.description"
              defaultMessage="It can be daunting to file an expense if you're not sure what's allowed. Provide a clear policy to guide expense submitters."
            />
          </P>
        </Container>

        {collective?.isHost && (
          <Container>
            <SettingsSectionTitle mt={4}>
              <FormattedMessage id="editCollective.admins.header" defaultMessage="Required Admins" />
            </SettingsSectionTitle>
            <P mb={2}>
              <FormattedMessage
                id="editCollective.admins.description"
                defaultMessage="Please specify the minimum number of admins a collective needs to have for being accepted by your fiscal host and to accept contributions."
              />
            </P>
            <Flex gap="12px 24px" mb={3} mt={2} flexDirection={['column', 'row']}>
              <StyledInputField
                disabled={isSubmittingSettings}
                labelFontSize="13px"
                labelFontWeight="700"
                label={<FormattedMessage defaultMessage="Minimum number of admins" />}
                flexGrow={1}
              >
                <StyledSelect
                  inputId="numberOfAdmins"
                  isSearchable={false}
                  options={numberOfAdminsOptions}
                  onChange={option => {
                    if (option.value === 0) {
                      formik.setFieldValue('policies', { ...formik.values.policies, COLLECTIVE_MINIMUM_ADMINS: null });
                    } else {
                      formik.setFieldValue('policies.COLLECTIVE_MINIMUM_ADMINS', {
                        ...formik.values.policies.COLLECTIVE_MINIMUM_ADMINS,
                        numberOfAdmins: option.value,
                      });
                    }
                  }}
                  value={numberOfAdminsOptions.find(
                    option => option.value === (formik.values.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins || 0),
                  )}
                />
              </StyledInputField>
              <StyledInputField
                disabled={isSubmittingSettings}
                labelFontSize="13px"
                labelFontWeight="700"
                label={<FormattedMessage defaultMessage="Whom does this apply to" />}
                flexGrow={1}
              >
                <StyledSelect
                  inputId="applies"
                  isSearchable={false}
                  options={minAdminsApplies}
                  onChange={option =>
                    formik.setFieldValue('policies.COLLECTIVE_MINIMUM_ADMINS', {
                      ...formik.values.policies.COLLECTIVE_MINIMUM_ADMINS,
                      applies: option.value,
                    })
                  }
                  disabled
                  value={minAdminsApplies[0]}
                />
              </StyledInputField>
            </Flex>
            <StyledCheckbox
              name="minAdminsFreeze"
              label={<FormattedMessage defaultMessage="Freeze collectives that don’t meet the minimum requirement" />}
              onChange={({ checked }) => {
                formik.setFieldValue('policies.COLLECTIVE_MINIMUM_ADMINS', {
                  ...formik.values.policies.COLLECTIVE_MINIMUM_ADMINS,
                  freeze: checked,
                });
              }}
              checked={Boolean(formik.values.policies?.COLLECTIVE_MINIMUM_ADMINS?.freeze)}
            />
            <P fontSize="14px" lineHeight="18px" color="black.600" ml="1.4rem">
              <FormattedMessage defaultMessage="Freezing the collective will prevent them from accepting and distributing contributions till they meet the requirements. This is a security measure to make sure the admins are within their rights. Read More." />
            </P>
            {formik.values.policies?.COLLECTIVE_MINIMUM_ADMINS?.applies === 'ALL_COLLECTIVES' &&
              formik.values.policies?.COLLECTIVE_MINIMUM_ADMINS?.freeze && (
                <MessageBox type="warning" mt={2} fontSize="13px">
                  <FormattedMessage defaultMessage="Some collectives hosted by you may not fulfill the minimum admin requirements. If you choose to apply the setting to all Collectives, the ones that don't comply will be frozen until they meet the minimum requirements for admins." />
                </MessageBox>
              )}
          </Container>
        )}
        <Container>
          <SettingsSectionTitle mt={4}>
            <FormattedMessage id="editCollective.expenseApprovalsPolicy.header" defaultMessage="Expense approvals" />
          </SettingsSectionTitle>
          <StyledCheckbox
            name="authorCannotApproveExpense"
            label={
              <FormattedMessage
                id="editCollective.expenseApprovalsPolicy.authorCannotApprove"
                defaultMessage="Admins cannot approve their own expenses. With this feature turned on, admins will need another admin to approve their expenses"
              />
            }
            onChange={() =>
              formik.setFieldValue('policies', {
                ...formik.values.policies,
                ['EXPENSE_AUTHOR_CANNOT_APPROVE']: {
                  ...formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE'],
                  enabled: !formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled,
                  appliesToHostedCollectives: false,
                  appliesToSingleAdminCollectives: false,
                  amountInCents: 0,
                },
              })
            }
            checked={
              authorCannotApproveExpenseEnforcedByHost ||
              Boolean(formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled)
            }
            disabled={
              isSettingPolicies ||
              (numberOfAdmins < 2 && Boolean(!formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled)) ||
              authorCannotApproveExpenseEnforcedByHost
            }
          />
          <Flex
            ml="1.4rem"
            mt="0.65rem"
            alignItems="center"
            color={!formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled ? 'black.600' : undefined}
          >
            <P mr="1.25rem">
              <FormattedMessage defaultMessage="Enforce for expenses above:" />
            </P>
            <StyledInputAmount
              maxWidth="11em"
              disabled={
                isSettingPolicies ||
                authorCannotApproveExpenseEnforcedByHost ||
                !formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled
              }
              currency={data?.account?.currency}
              currencyDisplay="CODE"
              placeholder="0"
              value={
                authorCannotApproveExpenseEnforcedByHost
                  ? hostAuthorCannotApproveExpensePolicy.amountInCents
                  : formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.amountInCents
              }
              onChange={value =>
                formik.setFieldValue('policies', {
                  ...formik.values.policies,
                  ['EXPENSE_AUTHOR_CANNOT_APPROVE']: {
                    ...formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE'],
                    amountInCents: value,
                  },
                })
              }
            />
          </Flex>
          {collective?.isHost && (
            <React.Fragment>
              <P
                ml="1.4rem"
                mt="0.65rem"
                color={!formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled ? 'black.600' : undefined}
              >
                <StyledCheckbox
                  name="authorCannotApproveExpense.appliesToHostedCollectives"
                  label={
                    <FormattedMessage
                      id="editCollective.expenseApprovalsPolicy.authorCannotApprove.appliesToHostedCollectives"
                      defaultMessage="Enforce this policy on collectives hosted by you."
                    />
                  }
                  checked={formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.appliesToHostedCollectives}
                  disabled={isSettingPolicies || !formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled}
                  onChange={() =>
                    formik.setFieldValue('policies', {
                      ...formik.values.policies,
                      ['EXPENSE_AUTHOR_CANNOT_APPROVE']: {
                        ...formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE'],
                        appliesToHostedCollectives:
                          !formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.appliesToHostedCollectives,
                        appliesToSingleAdminCollectives: false,
                      },
                    })
                  }
                />
              </P>
              <P
                ml="1.4rem"
                mt="0.65rem"
                color={
                  !formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.appliesToHostedCollectives
                    ? 'black.600'
                    : undefined
                }
              >
                <StyledCheckbox
                  name="authorCannotApproveExpense.appliesToSingleAdminCollectives"
                  label={
                    <FormattedMessage
                      id="editCollective.expenseApprovalsPolicy.authorCannotApprove.appliesToSingleAdminCollectives"
                      defaultMessage="Enforce this policy on collectives with a single admin."
                    />
                  }
                  checked={formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.appliesToSingleAdminCollectives}
                  disabled={
                    isSettingPolicies ||
                    !formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.appliesToHostedCollectives
                  }
                  onChange={() =>
                    formik.setFieldValue('policies', {
                      ...formik.values.policies,
                      ['EXPENSE_AUTHOR_CANNOT_APPROVE']: {
                        ...formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE'],
                        appliesToSingleAdminCollectives:
                          !formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.appliesToSingleAdminCollectives,
                      },
                    })
                  }
                />
              </P>
            </React.Fragment>
          )}
          {numberOfAdmins < 2 && Boolean(!formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']?.enabled) && (
            <P fontSize="14px" lineHeight="18px" color="black.600" ml="1.4rem">
              <FormattedMessage
                id="editCollective.expenseApprovalsPolicy.authorCannotApprove.minAdminRequired"
                defaultMessage="You need to have at least two admins to enable this policy."
              />
            </P>
          )}
        </Container>
        <Container mt={3}>
          <StyledCheckbox
            name="allow-expense-submission"
            label={formatMessage(messages['expensePolicy.allowExpense'])}
            onChange={() =>
              formik.setFieldValue('disablePublicExpenseSubmission', !formik.values.disablePublicExpenseSubmission)
            }
            defaultChecked={Boolean(formik.values.disablePublicExpenseSubmission)}
          />
        </Container>
        {collective.isHost && (
          <Container>
            <SettingsSectionTitle mt={4}>
              <FormattedMessage defaultMessage="Expense types" />
            </SettingsSectionTitle>
            <P mb={2}>
              <FormattedMessage
                id="editCollective.expenseTypes.description"
                defaultMessage="Specify the types of expenses allowed for all the collectives you're hosting. If you wish to customize these options for specific collectives, head to the <HostedCollectivesLink>Hosted Collectives</HostedCollectivesLink> section."
                values={{
                  HostedCollectivesLink: getI18nLink({
                    as: Link,
                    href: `/${collective.slug}/admin/hosted-collectives`,
                  }),
                }}
              />
            </P>

            {['RECEIPT', 'INVOICE', 'GRANT'].map(type => (
              <StyledCheckbox
                key={type}
                name={`allow-${type}-submission`}
                label={formatMessage(messages[`expensePolicy.${type}`])}
                checked={Boolean(formik.values.expenseTypes[type])}
                onChange={() =>
                  formik.setFieldValue('expenseTypes', {
                    ...formik.values.expenseTypes,
                    [type]: !formik.values.expenseTypes[type],
                  })
                }
              />
            ))}
          </Container>
        )}
        <Container>
          <SettingsSectionTitle mt={4}>
            <FormattedMessage id="editCollective.rejectCategories.header" defaultMessage="Rejected categories" />
          </SettingsSectionTitle>
          <P mb={2}>
            <FormattedMessage
              id="editCollective.rejectCategories.description"
              defaultMessage="Specify any categories of contributor that you do not wish to accept money from, to automatically prevent these types of contributions. (You can also reject contributions individually using the button on a specific unwanted transaction)"
            />
          </P>
          <StyledSelect
            inputId="policy-select"
            isSearchable={false}
            isLoading={loading}
            placeholder={formatMessage(messages['rejectCategories.placeholder'])}
            minWidth={300}
            maxWidth={600}
            options={selectOptions}
            value={selected}
            onChange={selectedOptions => setSelected(selectedOptions)}
            isMulti
          />
        </Container>
        {collective.isHost && (
          <Container>
            <SettingsSectionTitle mt={4}>
              <FormattedMessage defaultMessage="Refunds" />
            </SettingsSectionTitle>

            <StyledCheckbox
              name={`checkbox-COLLECTIVE_ADMINS_CAN_REFUND`}
              label={
                <FormattedMessage defaultMessage="Allow collective admins to refund contributions for up to 30 days after the transaction date." />
              }
              checked={formik.values.policies?.COLLECTIVE_ADMINS_CAN_REFUND}
              onChange={() =>
                formik.setFieldValue('policies', {
                  ...formik.values.policies,
                  COLLECTIVE_ADMINS_CAN_REFUND: !formik.values.policies?.COLLECTIVE_ADMINS_CAN_REFUND,
                })
              }
            />
          </Container>
        )}
        <Flex mt={5} mb={3} alignItems="center" justifyContent="center">
          <StyledButton
            data-cy="submit-policy-btn"
            buttonStyle="primary"
            mx={2}
            minWidth={200}
            buttonSize="medium"
            loading={isSubmittingSettings || isSubmittingCategories}
            type="submit"
            onSubmit={formik.handleSubmit}
          >
            <FormattedMessage id="save" defaultMessage="Save" />
          </StyledButton>
        </Flex>
      </form>
    </Flex>
  );
};

Policies.propTypes = {
  collective: PropTypes.shape({
    settings: PropTypes.object,
    id: PropTypes.number,
    slug: PropTypes.string,
    isHost: PropTypes.bool,
    members: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string,
      }),
    ),
  }),
  showOnlyExpensePolicy: PropTypes.bool,
};

export default Policies;
