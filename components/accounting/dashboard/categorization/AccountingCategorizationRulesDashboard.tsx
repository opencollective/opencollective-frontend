import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { FormikProvider } from 'formik';
import { omitBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import { i18nGraphqlException } from '@/lib/errors';
import type { HostContributionCategoryRulesQuery } from '@/lib/graphql/types/v2/graphql';

import { AccountingCategorySelectFieldsFragment } from '@/components/AccountingCategorySelect';
import { DashboardContext } from '@/components/dashboard/DashboardContext';
import { useFormikZod } from '@/components/FormikZod';
import LoadingGrid from '@/components/LoadingGrid';
import MessageBox from '@/components/MessageBox';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/useToast';

import { CategorizationRulesList } from './CategorizationRulesList';
import { contributionRulesSchema } from './schema';

const hostContributionCategoryRulesQuery = gql`
  query HostContributionCategoryRules($slug: String!) {
    host(slug: $slug) {
      id
      legacyId
      type
      slug
      accountingCategories(kind: CONTRIBUTION) {
        nodes {
          ...AccountingCategorySelectFields
        }
      }
      contributionAccountingCategoryRules {
        id
        name
        enabled
        predicates
        accountingCategory {
          ...AccountingCategorySelectFields
        }
      }
    }
  }
  ${AccountingCategorySelectFieldsFragment}
`;

export function AccountingCategorizationRulesDashboard() {
  const { account: dashboardAccount } = React.useContext(DashboardContext);

  const query = useQuery(hostContributionCategoryRulesQuery, {
    variables: { slug: dashboardAccount.slug },
    skip: !dashboardAccount.slug,
  });

  return (
    <div className="w-full space-y-6">
      <MessageBox type="info">
        <FormattedMessage
          id="AccountingCategorization.description"
          defaultMessage="Create rules to automatically set an accounting category on contributions when conditions match. Rules are evaluated in order; the first matching rule applies."
        />
      </MessageBox>

      {query.loading && <LoadingGrid />}
      {query.error && <MessageBoxGraphqlError error={query.error} />}
      {query.data && <AccountingCategorizationRules data={query.data} />}
    </div>
  );
}

type AccountingCategorizationRulesProps = {
  data: HostContributionCategoryRulesQuery;
};

function AccountingCategorizationRules(props: AccountingCategorizationRulesProps) {
  const intl = useIntl();
  const [updateRules] = useMutation(
    gql`
      mutation UpdateContributionAccountingCategoryRules(
        $account: AccountReferenceInput!
        $rules: [ContributionAccountingCategoryRuleInput!]!
      ) {
        updateContributionAccountingCategoryRules(account: $account, rules: $rules) {
          id
        }
      }
    `,
    {
      refetchQueries: [hostContributionCategoryRulesQuery],
    },
  );

  const initialValues: z.infer<typeof contributionRulesSchema> = {
    rules: (props.data.host?.contributionAccountingCategoryRules ?? []).map(rule => ({
      name: rule.name,
      predicates: rule.predicates.map(predicate => ({
        subject: predicate.subject,
        operator: predicate.operator,
        value: predicate.value,
      })),
      categoryId: rule.accountingCategory.id,
      enabled: rule.enabled,
      id: rule.id,
    })),
  };

  const formikContext = useFormikZod({
    schema: contributionRulesSchema,
    initialValues,
    onSubmit: async values => {
      try {
        await updateRules({
          variables: {
            account: {
              legacyId: props.data.host?.legacyId,
            },
            rules: values.rules.map(rule => ({
              ...omitBy(
                rule,
                (value, key) => key === 'categoryId' || (key === 'id' && (value as string).startsWith('new-rule-')),
              ),
              accountingCategory: {
                id: rule.categoryId,
              },
            })),
          },
        });
        formikContext.resetForm({ values: values, errors: {}, touched: {} });
        toast({
          variant: 'success',
          message: <FormattedMessage defaultMessage="Rules updated" id="j3PF+6" />,
        });
      } catch (error) {
        toast({
          variant: 'error',
          message: i18nGraphqlException(intl, error),
        });
      }
    },
  });
  const rules = formikContext.values.rules;
  const host = props.data.host;

  return (
    <div className="space-y-4">
      {rules.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <FormattedMessage
            id="CategorizationRule.empty"
            defaultMessage="No rules yet. Add a rule to automatically categorize contributions based on description, amount, status, and more."
          />
        </p>
      )}

      <FormikProvider value={formikContext}>
        <form className="space-y-4" onSubmit={formikContext.handleSubmit}>
          <CategorizationRulesList host={host} />

          <div className="flex justify-end gap-4">
            {formikContext.dirty && (
              <Button
                onClick={() => formikContext.resetForm({ values: initialValues, errors: {}, touched: {} })}
                variant="outline"
              >
                <FormattedMessage id="CategorizationRule.discard" defaultMessage="Discard changes" />
              </Button>
            )}
            <Button type="submit">
              <FormattedMessage id="save" defaultMessage="Save" />
            </Button>
          </div>
        </form>
      </FormikProvider>
    </div>
  );
}
