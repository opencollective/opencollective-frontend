import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import { get, isEmpty } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import { MODERATION_CATEGORIES } from '../../../lib/constants/moderation-categories';
import { getEnvVar } from '../../../lib/env-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { parseToBoolean, stripHTML } from '../../../lib/utils';

import Container from '../../Container';
import { Flex } from '../../Grid';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledInputField from '../../StyledInputField';
import StyledSelect from '../../StyledSelect';
import { H3, P } from '../../Text';

import { getSettingsQuery } from './EditCollectivePage';

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
    defaultMessage:
      'For example: what type of contributors (like casinos) you do not want donations from, or under what circumstances you might allow certain donations, etc.',
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
    defaultMessage:
      'For example: what type of expenses will be approved, any limitations on amounts, what documentation is required, and who to contact with questions.',
  },
  'expensePolicy.error': {
    id: 'collective.expensePolicy.error',
    defaultMessage: 'Expense policy must contain less than {maxLength} characters',
  },
});

const Policies = ({ collective }) => {
  const { formatMessage } = useIntl();
  const [selected, setSelected] = React.useState([]);
  const hasRejectCategoriesFeature =
    hasFeature(collective, FEATURES.MODERATION) || parseToBoolean(getEnvVar('REJECTED_CATEGORIES'));

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
  const [updatePolicies, { loading: isSubmittingPolicies, error: policiesError }] = useMutation(editCollectiveMutation);
  const error = categoriesError || policiesError;

  // Data and data handling
  const collectiveContributionFilteringCategories = get(data, 'account.settings.moderation.rejectedCategories', null);
  const collectiveContributionPolicy = get(collective, 'contributionPolicy', null);
  const collectiveExpensePolicy = get(collective, 'expensePolicy', null);

  const selectOptions = React.useMemo(() => {
    const optionsArray = Object.entries(MODERATION_CATEGORIES).map(([key, value], index) => ({
      id: index,
      value: key,
      label: value,
    }));
    return optionsArray;
  }, [MODERATION_CATEGORIES]);

  React.useEffect(() => {
    if (collectiveContributionFilteringCategories && isEmpty(selected)) {
      const alreadyPickedCategories = collectiveContributionFilteringCategories.map(category => {
        return selectOptions.find(option => option.value === category);
      });
      setSelected(alreadyPickedCategories);
    }
  }, [loading, collectiveContributionFilteringCategories]);

  // Form
  const formik = useFormik({
    initialValues: {
      contributionPolicy: collectiveContributionPolicy || '',
      expensePolicy: collectiveExpensePolicy || '',
    },
    async onSubmit(values) {
      const { contributionPolicy, expensePolicy } = values;
      await updatePolicies({
        variables: {
          collective: {
            id: collective.id,
            contributionPolicy,
            expensePolicy,
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

  return (
    <Flex flexDirection="column">
      {error && <MessageBoxGraphqlError error={error} />}
      <H3 mt={2}>
        <FormattedMessage id="editCollective.menu.policies" defaultMessage="Policies" />
      </H3>
      <form onSubmit={formik.handleSubmit}>
        <Container>
          <StyledInputField
            name="contributionPolicy"
            htmlFor="contributionPolicy"
            error={formik.errors.contributionPolicy}
            disabled={isSubmittingPolicies}
            label={formatMessage(messages['contributionPolicy.label'])}
            labelProps={{ mb: 2, pt: 2, lineHeight: '18px', fontWeight: 'bold' }}
          >
            {inputProps => (
              <RichTextEditor
                withBorders
                showCount
                maxLength={CONTRIBUTION_POLICY_MAX_LENGTH}
                error={formik.errors.contributionPolicy}
                version="simplified"
                editorMinHeight="20rem"
                id={inputProps.id}
                inputName={inputProps.name}
                onChange={formik.handleChange}
                placeholder={formatMessage(messages['contributionPolicy.placeholder'])}
                defaultValue={formik.values.contributionPolicy}
                fontSize="14px"
              />
            )}
          </StyledInputField>
          <P fontSize="14px" color="black.600">
            <FormattedMessage
              id="collective.contributionPolicy.description"
              defaultMessage="All categorized Financial Contributors are manually classified by the Open Collective team. Only contributors that are thought to be abusing are classified with these categories. Financial Contributors with a good reputation should normally not be affected by this setting."
            />
          </P>

          <StyledInputField
            name="expensePolicy"
            htmlFor="expensePolicy"
            error={formik.errors.expensePolicy}
            disabled={isSubmittingPolicies}
            label={formatMessage(messages['expensePolicy.label'])}
            labelProps={{ mb: 2, pt: 2, lineHeight: '18px', fontWeight: 'bold' }}
          >
            {inputProps => (
              <RichTextEditor
                withBorders
                showCount
                maxLength={EXPENSE_POLICY_MAX_LENGTH}
                error={formik.errors.expensePolicy}
                version="simplified"
                editorMinHeight="20rem"
                id={inputProps.id}
                inputName={inputProps.name}
                onChange={formik.handleChange}
                placeholder={formatMessage(messages['expensePolicy.placeholder'])}
                defaultValue={formik.values.expensePolicy}
                fontSize="14px"
              />
            )}
          </StyledInputField>
          <P fontSize="14px" color="black.600">
            <FormattedMessage
              id="collective.expensePolicy.description"
              defaultMessage="It can be daunting to file an expense if you're not sure what's allowed. Provide a clear policy to guide expense submitters."
            />
          </P>
        </Container>
        {hasRejectCategoriesFeature && (
          <Container>
            <H3 mt={2}>
              <FormattedMessage id="editCollective.rejectCategories.header" defaultMessage="Rejected categories" />
            </H3>
            <P>
              <FormattedMessage
                id="editCollective.rejectCategories.description"
                defaultMessage="Select which categories of contributor, if any, you do not wish to receive any contributions from. This will automatically prevent them from being able to become a sponsor of your Collective."
              />
            </P>
            <StyledSelect
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
        )}
        <Flex my={3} alignItems="center" justifyContent="center">
          <StyledButton
            buttonStyle="primary"
            mx={2}
            minWidth={200}
            buttonSize="medium"
            loading={isSubmittingPolicies || isSubmittingCategories}
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
  }),
};

export default Policies;
