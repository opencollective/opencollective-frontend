import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import { filter, get, isEmpty, omit, size } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { MODERATION_CATEGORIES } from '../../../lib/constants/moderation-categories';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { stripHTML } from '../../../lib/utils';

import Container from '../../Container';
import { Flex } from '../../Grid';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledCheckbox from '../../StyledCheckbox';
import StyledInputField from '../../StyledInputField';
import StyledSelect from '../../StyledSelect';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import { getSettingsQuery } from './EditCollectivePage';
import SettingsSectionTitle from './SettingsSectionTitle';

const EXPENSE_POLICY_MAX_LENGTH = 16000; // max in database is ~15,500
const CONTRIBUTION_POLICY_MAX_LENGTH = 3000; // 600 words * 5 characters average length word

const updateFilterCategoriesMutation = gqlV2/* GraphQL */ `
  mutation UpdateFilterCategories($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      type
      isActive
      settings
    }
  }
`;

const editCollectiveMutation = gql/* GraphQL */ `
  mutation EditCollectiveMutation($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      type
      isActive
      settings
    }
  }
`;

const setPoliciesMutation = gqlV2/* GraphQL */ `
  mutation SetPolicies($account: AccountReferenceInput!, $policies: JSON!) {
    setPolicies(account: $account, policies: $policies) {
      id
      policies
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
});

const Policies = ({ collective, showOnlyExpensePolicy }) => {
  const { formatMessage } = useIntl();
  const [selected, setSelected] = React.useState([]);
  const { addToast } = useToasts();

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
      policies: data?.account?.policies || {},
    },
    async onSubmit(values) {
      const { contributionPolicy, expensePolicy, disablePublicExpenseSubmission, policies } = values;
      await updateCollective({
        variables: {
          collective: {
            id: collective.id,
            contributionPolicy,
            expensePolicy,
            settings: { ...collective.settings, disablePublicExpenseSubmission },
          },
        },
      });
      const selectedRejectCategories = selected.map(option => option.value);
      await updateCategories({
        variables: {
          account: {
            legacyId: collective.id,
          },
          key: 'moderation',
          value: { rejectedCategories: selectedRejectCategories },
        },
      });
      await setPolicies({
        variables: {
          account: {
            legacyId: collective.id,
          },
          policies,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: formatMessage({ defaultMessage: 'Policies updated successfully' }),
      });
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
      formik.setFieldValue('policies', data.account?.policies || []);
    }
  }, [data]);

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
                    editorMinHeight="20rem"
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
                editorMinHeight="20rem"
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
              formik.setFieldValue(
                'policies',
                formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']
                  ? omit(formik.values.policies, ['EXPENSE_AUTHOR_CANNOT_APPROVE'])
                  : { ...formik.values.policies, EXPENSE_AUTHOR_CANNOT_APPROVE: true },
              )
            }
            checked={Boolean(formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE'])}
            disabled={
              isSettingPolicies ||
              (numberOfAdmins < 2 && Boolean(!formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']))
            }
          />
          {collective?.isHost && (
            <P fontSize="14px" lineHeight="18px" color="black.600" ml="2.2rem">
              <FormattedMessage
                id="editCollective.expenseApprovalsPolicy.authorCannotApprove.hostDescription"
                defaultMessage="This policy is only enforced on your fiscal host and does not affect collectives hosted by you."
              />
            </P>
          )}
          {numberOfAdmins < 2 && Boolean(!formik.values.policies?.['EXPENSE_AUTHOR_CANNOT_APPROVE']) && (
            <P fontSize="14px" lineHeight="18px" color="black.600" ml="2.2rem">
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
