import React from 'react';
import { gql, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  CollectiveOptionQuery,
  CollectiveOptionQueryVariables,
  PickCollectiveStepListItemQuery,
  PickCollectiveStepListItemQueryVariables,
  PickCollectiveStepQuery,
  PickCollectiveStepQueryVariables,
} from '../../lib/graphql/types/v2/graphql';

import Avatar from '../Avatar';
import CollectivePickerAsync from '../CollectivePickerAsync';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Loading from '../Loading';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { StepListItem } from '../ui/StepList';

import { ExpenseStepDefinition } from './Steps';
import { ExpenseForm } from './useExpenseForm';

const allowedCollectiveTypes = [
  CollectiveType.COLLECTIVE,
  CollectiveType.EVENT,
  CollectiveType.FUND,
  CollectiveType.ORGANIZATION,
  CollectiveType.PROJECT,
] as const;

export const PickCollectiveStep: ExpenseStepDefinition = {
  Form: PickCollectiveStepForm,
  StepListItem: PickCollectiveStepListItem,
  hasError(form) {
    return !!form.errors.collectiveSlug;
  },
};

type PickCollectiveStepFormProps = {
  form: ExpenseForm;
  slug: string;
};

function PickCollectiveStepForm(props: PickCollectiveStepFormProps) {
  const [collectivePick, setCollectivePick] = React.useState(null);

  const setFieldValue = props.form.setFieldValue;
  const onCollectivePick = React.useCallback(
    o => {
      setCollectivePick(null);
      setFieldValue('collectiveSlug', o.value.slug);
    },
    [setFieldValue],
  );

  const query = useQuery<PickCollectiveStepQuery, PickCollectiveStepQueryVariables>(
    gql`
      query PickCollectiveStep($slug: String!, $collectiveSlug: String, $pickedCollective: Boolean!) {
        submitter: account(slug: $slug) {
          expenses(direction: SUBMITTED, limit: 10) {
            nodes {
              account {
                id
                name
                slug
                type
                imageUrl
              }
            }
          }
        }

        collective: account(slug: $collectiveSlug) @include(if: $pickedCollective) {
          id
          slug
          name
          imageUrl
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: props.slug,
        collectiveSlug: props.form.values.collectiveSlug,
        pickedCollective: !!props.form.values.collectiveSlug,
      },
    },
  );

  const submitter = query.data?.submitter;
  const recentCollectives = React.useMemo(() => {
    const uniqueCollectives = uniqBy(submitter?.expenses?.nodes || [], e => e.account.id).map(e => e.account);
    return uniqueCollectives;
  }, [submitter?.expenses?.nodes]);

  React.useEffect(() => {
    if (!props.form.values.collectiveSlug && recentCollectives.length > 0) {
      setFieldValue('collectiveSlug', recentCollectives[0].slug);
    }
  }, [setFieldValue, props.form.values.collectiveSlug, recentCollectives]);

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  return (
    <div className="flex-grow">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Who are you requesting money from?" />
      </h1>
      {recentCollectives.length > 0 && (
        <React.Fragment>
          <h2 className="mb-2 text-base font-bold leading-6 text-slate-800">
            <FormattedMessage defaultMessage="Collectives to which you have recently submitted expenses" />
          </h2>
          <div className="flex flex-col gap-4">
            {recentCollectives.map(c => (
              <CollectiveOption
                key={c.slug}
                onClick={() => setFieldValue('collectiveSlug', c.slug)}
                collectiveSlug={c.slug}
                checked={props.form.values.collectiveSlug === c.slug}
              />
            ))}
          </div>

          <h2 className="mb-4 mt-8 text-base font-bold leading-6 text-slate-800">
            <FormattedMessage defaultMessage="Choose a collective:" />
          </h2>
        </React.Fragment>
      )}
      {!collectivePick && (
        <CollectivePickerAsync
          className="mb-4"
          inputId="collective-expense-picker"
          types={allowedCollectiveTypes}
          value={collectivePick}
          onChange={onCollectivePick}
        />
      )}
      {props.form.values.collectiveSlug &&
        !recentCollectives.some(c => c.slug === props.form.values.collectiveSlug) && (
          <CollectiveOption collectiveSlug={props.form.values.collectiveSlug} checked />
        )}
    </div>
  );
}

function PickCollectiveStepListItem(props: { className?: string; form: ExpenseForm; current: boolean }) {
  const query = useQuery<PickCollectiveStepListItemQuery, PickCollectiveStepListItemQueryVariables>(
    gql`
      query PickCollectiveStepListItem($collectiveSlug: String!) {
        account(slug: $collectiveSlug) {
          id
          name
          slug
          imageUrl
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: props.form.values.collectiveSlug,
      },
      skip: !props.form.values.collectiveSlug,
    },
  );

  return (
    <StepListItem
      className={props.className}
      title={<FormattedMessage defaultMessage="Submit to" />}
      subtitle={query.data?.account?.name ?? undefined}
      completed={!PickCollectiveStep.hasError(props.form)}
      current={props.current}
    />
  );
}

type CollectiveOptionProps = {
  collectiveSlug: string;
  checked?: boolean;
  onClick?: () => void;
};

function CollectiveOption(props: CollectiveOptionProps) {
  const query = useQuery<CollectiveOptionQuery, CollectiveOptionQueryVariables>(
    gql`
      query CollectiveOption($slug: String!) {
        account(slug: $slug) {
          id
          slug
          name
          imageUrl
          stats {
            balance {
              valueInCents
              currency
            }
          }
          ... on AccountWithHost {
            host {
              id
              slug
              name
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: props.collectiveSlug,
      },
    },
  );

  const account = query.data?.account;
  const host = account && 'host' in account ? account.host : null;

  return (
    <div>
      <button
        onClick={props.onClick}
        className="group flex w-full cursor-pointer items-center gap-4 rounded-md border border-slate-300 p-4 hover:border-oc-blue-tints-500"
      >
        <span
          className={clsx('h-[16px] w-[16px] rounded-full border group-hover:border-oc-blue-tints-500', {
            'border-[5px] border-oc-blue-tints-500': props.checked,
            'border-slate-300': !props.checked,
          })}
        ></span>
        <span className="flex items-center gap-2 text-sm font-medium leading-5 text-slate-800">
          <Avatar collective={query.data?.account} radius={24} />
          {query.data?.account?.name}
        </span>
      </button>
      {props.checked && !query.loading && (
        <div className="mt-4 flex items-center gap-8 pl-4">
          <div>
            <div className="text-xs font-bold">
              <FormattedMessage defaultMessage="Collective balance" />
            </div>
            <div>
              <FormattedMoneyAmount
                currency={query.data.account.stats.balance.currency}
                amount={query.data.account.stats.balance.valueInCents}
              />
            </div>
          </div>
          {host && (
            <div className="text-xs">
              <div>
                <FormattedMessage defaultMessage="Fiscal host:" />
              </div>
              <div className="font-bold">{host.name}</div>
            </div>
          )}
        </div>
      )}
      {props.checked && query.loading && <Loading />}
    </div>
  );
}
