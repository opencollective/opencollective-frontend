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
} from '../../lib/graphql/types/v2/graphql';

import Avatar from '../Avatar';
import CollectivePickerAsync from '../CollectivePickerAsync';
import Loading from '../Loading';
import { StepListItem } from '../ui/StepList';

import { RadioCardButton } from './RadioCardButton';
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
  const [isPickingOtherCollective, setIsPickingOtherCollective] = React.useState(false);
  const setFieldValue = props.form.setFieldValue;

  const recentlySubmittedExpenses = props.form.options.recentlySubmittedExpenses;
  const recentCollectives = React.useMemo(() => {
    const uniqueCollectives = uniqBy(recentlySubmittedExpenses?.nodes || [], e => e.account.id).map(e => e.account);
    return uniqueCollectives;
  }, [recentlySubmittedExpenses]);

  React.useEffect(() => {
    if (!isPickingOtherCollective && !props.form.values.collectiveSlug && recentCollectives.length > 0) {
      setFieldValue('collectiveSlug', recentCollectives[0].slug);
    }
  }, [setFieldValue, props.form.values.collectiveSlug, recentCollectives, isPickingOtherCollective]);

  const recentCollectivePicked = recentCollectives.some(({ slug }) => slug === props.form.values.collectiveSlug);

  if (!props.form.options.recentlySubmittedExpenses) {
    return <Loading />;
  }

  return (
    <div className="flex-grow">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Who are you requesting money from?" />
      </h1>
      {recentCollectives.length > 0 && (
        <div className="flex flex-col gap-4">
          {recentCollectives.map((c, i) => (
            <CollectiveOption
              key={c.slug}
              isLastUsedCollective={i === 0}
              onClick={() => {
                setFieldValue('collectiveSlug', c.slug);
                setIsPickingOtherCollective(false);
              }}
              collectiveSlug={c.slug}
              checked={props.form.values.collectiveSlug === c.slug}
            />
          ))}
        </div>
      )}

      <div className={clsx({ 'mt-4': recentCollectives.length > 0 })}>
        <CollectiveOptionPicker
          label={
            recentCollectives.length > 0 ? (
              <FormattedMessage defaultMessage="Another collective" />
            ) : (
              <FormattedMessage defaultMessage="Search Collective" />
            )
          }
          collectiveSlug={props.form.values.collectiveSlug}
          checked={isPickingOtherCollective || !recentCollectivePicked}
          onClick={() => {
            if (!isPickingOtherCollective || recentCollectivePicked) {
              setFieldValue('collectiveSlug', null);
            }
            setIsPickingOtherCollective(true);
          }}
          onChange={slug => setFieldValue('collectiveSlug', slug)}
        />
      </div>
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
      title={<FormattedMessage defaultMessage="Who is paying?" />}
      subtitle={query.data?.account?.name ?? undefined}
      completed={!PickCollectiveStep.hasError(props.form)}
      current={props.current}
    />
  );
}

type CollectiveOptionProps = {
  collectiveSlug: string;
  isLastUsedCollective?: boolean;
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

  return (
    <RadioCardButton
      checked={props.checked}
      onClick={props.onClick}
      title={
        <div className="flex items-center gap-4">
          <Avatar collective={query.data?.account} radius={24} />

          {props.isLastUsedCollective ? (
            <FormattedMessage
              defaultMessage="{label} (Last used)"
              values={{
                label: query.data?.account?.name,
              }}
            />
          ) : (
            query.data?.account?.name
          )}
        </div>
      }
    />
  );
}

type CollectiveOptionPickerProps = {
  label?: React.ReactNode;
  onClick: () => void;
  onChange: (slug: string) => void;
  checked?: boolean;
  collectiveSlug?: string;
};

function CollectiveOptionPicker(props: CollectiveOptionPickerProps) {
  const query = useQuery<CollectiveOptionQuery, CollectiveOptionQueryVariables>(
    gql`
      query CollectiveOption($slug: String!) {
        account(slug: $slug) {
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
        slug: props.collectiveSlug,
      },
      skip: !props.collectiveSlug || !props.checked,
    },
  );

  return (
    <RadioCardButton
      className="w-full"
      onClick={props.onClick}
      title={props.label}
      checked={props.checked}
      content={
        props.checked && (
          <CollectivePickerAsync
            className="mt-4"
            inputId="collective-expense-picker"
            types={allowedCollectiveTypes}
            value={{ value: query.data?.account, label: query.data?.account?.name }}
            onChange={e => props.onChange(e.value.slug)}
          />
        )
      }
    />
  );
}
