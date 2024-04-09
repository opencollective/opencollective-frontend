import React from 'react';
import { gql, useQuery } from '@apollo/client';
import clsx from 'clsx';
import { uniqBy } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  ChildAccountPickerQuery,
  ChildAccountPickerQueryVariables,
  CollectiveOptionPickerQuery,
  CollectiveOptionPickerQueryVariables,
  CollectiveOptionQuery,
  CollectiveOptionQueryVariables,
} from '../../lib/graphql/types/v2/graphql';

import { AvatarWithLink } from '../AvatarWithLink';
import CollectivePicker from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';

import { RadioCardButton } from './RadioCardButton';
import { ExpenseForm } from './useExpenseForm';

const I18nMessages = defineMessages({
  CHILD_DESCRIPTION: {
    defaultMessage:
      '{childName} is an {parentName} {childType, select, EVENT {event} FUND {fund} PROJECT {project} other {account}}',
    id: 'iItDLM',
  },
  TITLE: {
    defaultMessage: `{parentName}'s {childType, select, EVENT {Event} FUND {Fund} PROJECT {Project} other {Account}}: {childName}`,
    id: 'm52qTZ',
  },
});

const allowedCollectiveTypes = [
  CollectiveType.COLLECTIVE,
  CollectiveType.EVENT,
  CollectiveType.FUND,
  CollectiveType.ORGANIZATION,
  CollectiveType.PROJECT,
] as const;

type PickCollectiveStepFormProps = {
  form: ExpenseForm;
};

export function PickCollectiveStepForm(props: PickCollectiveStepFormProps) {
  const [isPickingOtherCollective, setIsPickingOtherCollective] = React.useState(false);
  const setFieldValue = props.form.setFieldValue;

  const recentlySubmittedExpenses = props.form.options.recentlySubmittedExpenses;
  const recentCollectives = React.useMemo(() => {
    const uniqueCollectives = uniqBy(recentlySubmittedExpenses?.nodes || [], e => e.account.id).map(e => e.account);
    return uniqueCollectives;
  }, [recentlySubmittedExpenses]);

  const canChangeAccount = !props.form.options.expense?.account || props.form.startOptions.duplicateExpense;

  const selectedRecentCollectiveIdx = React.useMemo(() => {
    if (!props.form.values.collectiveSlug) {
      return -1;
    }

    const recentIndex = recentCollectives.findIndex(ac => ac.slug === props.form.values.collectiveSlug);
    if (recentIndex >= 0) {
      return recentIndex;
    }

    const childOfRecent = recentCollectives.findIndex(ac => {
      return ac.childrenAccounts.nodes.some(ca => ca.slug === props.form.values.collectiveSlug);
    });

    if (childOfRecent >= 0) {
      return childOfRecent;
    }

    const siblingOfRecent = recentCollectives.findIndex(ac => {
      if ('parent' in ac) {
        return ac.parent.childrenAccounts.nodes.some(ca => ca.slug === props.form.values.collectiveSlug);
      }

      return false;
    });

    if (siblingOfRecent >= 0) {
      return siblingOfRecent;
    }

    return -1;
  }, [recentCollectives, props.form.values.collectiveSlug]);

  const recentCollectivePicked = selectedRecentCollectiveIdx >= 0;

  React.useEffect(() => {
    if (
      !isPickingOtherCollective &&
      !recentCollectivePicked &&
      !props.form.values.collectiveSlug &&
      recentCollectives.length > 0
    ) {
      setFieldValue('collectiveSlug', recentCollectives[0].slug);
    }
  }, [
    setFieldValue,
    props.form.values.collectiveSlug,
    recentCollectives,
    isPickingOtherCollective,
    recentCollectivePicked,
  ]);

  return (
    <div className="flex-grow">
      <h1 className="mb-4 text-lg font-bold leading-[26px] text-dark-900">
        <FormattedMessage defaultMessage="Whom are you requesting money from?" id="7PYZFd" />
      </h1>

      {props.form.initialLoading ? (
        <LoadingPlaceholder height={60} />
      ) : canChangeAccount ? (
        <React.Fragment>
          {recentCollectives.length > 0 && (
            <React.Fragment>
              <h2 className="mb-4 text-base font-bold text-dark-900">
                <FormattedMessage
                  defaultMessage="Accounts to which you have recently submitted expenses:"
                  id="r2CFxg"
                />
              </h2>
              <div className="flex flex-col gap-4">
                {recentCollectives.map((c, i) => (
                  <CollectiveOption
                    key={c.slug}
                    isLastUsedCollective={i === 0}
                    onClick={() => {
                      if (!isPickingOtherCollective && i === selectedRecentCollectiveIdx) {
                        return;
                      }
                      setFieldValue('collectiveSlug', c.slug);
                      setIsPickingOtherCollective(false);
                    }}
                    collectiveSlug={c.slug}
                    checked={!isPickingOtherCollective && i === selectedRecentCollectiveIdx}
                    value={props.form.values.collectiveSlug}
                    onChange={slug => {
                      setFieldValue('collectiveSlug', slug);
                    }}
                  />
                ))}
              </div>
            </React.Fragment>
          )}

          <div className={clsx({ 'mt-4': recentCollectives.length > 0 })}>
            <CollectiveOptionPicker
              label={<FormattedMessage defaultMessage="Another account" id="ckZZzj" />}
              collectiveSlug={props.form.values.collectiveSlug}
              checked={isPickingOtherCollective || !recentCollectivePicked}
              onClick={() => {
                setFieldValue('collectiveSlug', null);
                setIsPickingOtherCollective(true);
              }}
              onChange={slug => setFieldValue('collectiveSlug', slug)}
            />
          </div>
        </React.Fragment>
      ) : (
        <CollectiveOption collectiveSlug={props.form.options.account.slug} checked />
      )}
    </div>
  );
}
type CollectiveOptionProps = {
  collectiveSlug: string;
  isLastUsedCollective?: boolean;
  checked?: boolean;
  onClick?: () => void;
  value?: string;
  onChange?: (slug: string) => void;
};

function CollectiveOption(props: CollectiveOptionProps) {
  const intl = useIntl();
  const query = useQuery<CollectiveOptionQuery, CollectiveOptionQueryVariables>(
    gql`
      query CollectiveOption($slug: String!, $selectedSlug: String, $hasSelection: Boolean!) {
        account(slug: $slug) {
          id
          slug
          name
          type
          imageUrl
          isIncognito

          ... on AccountWithParent {
            parent {
              id
              slug
              name
              type
              imageUrl
              isIncognito
            }
          }
        }

        selectedAccount: account(slug: $selectedSlug) @include(if: $hasSelection) {
          id
          slug
          name
          type
          imageUrl
          isIncognito

          ... on AccountWithParent {
            parent {
              id
              slug
              name
              type
              imageUrl
              isIncognito
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: props.collectiveSlug,
        selectedSlug: props.value,
        hasSelection: props.checked && !!props.value,
      },
    },
  );

  const account = query.data?.account;
  const selectedAccount = query.data?.selectedAccount || account;
  const parent = selectedAccount && 'parent' in selectedAccount ? selectedAccount.parent : null;
  const mainAccount = parent || selectedAccount;

  const title =
    props.checked && parent
      ? parent.name
      : parent
        ? intl.formatMessage(I18nMessages.TITLE, {
            childName: selectedAccount.name,
            parentName: parent.name,
            childType: selectedAccount.type,
          })
        : selectedAccount?.name;

  return (
    <RadioCardButton
      checked={props.checked}
      onClick={props.onClick}
      title={
        !selectedAccount || !mainAccount ? (
          <LoadingPlaceholder height={20} width={60} />
        ) : (
          <div className="flex items-center gap-4">
            <AvatarWithLink
              account={mainAccount}
              secondaryAccount={parent && !props.checked ? selectedAccount : null}
              size={24}
              withHoverCard
            />

            {props.isLastUsedCollective ? (
              <FormattedMessage
                defaultMessage="{label} (Last used)" id="ieTRJZ"
                values={{
                  label: title,
                }}
              />
            ) : (
              title
            )}
          </div>
        )
      }
      content={
        props.checked ? (
          query.error ? (
            <MessageBoxGraphqlError error={query.error} />
          ) : (
            <React.Fragment>
              <ChildAccountPicker
                className="mt-4"
                accountSlug={mainAccount?.slug}
                value={selectedAccount?.slug}
                onChange={props.onChange}
              />
              {parent && parent.slug !== selectedAccount.name && (
                <div className="my-2 text-xs text-slate-700">
                  <FormattedMessage
                    {...I18nMessages.CHILD_DESCRIPTION}
                    values={{
                      childName: selectedAccount.name,
                      parentName: parent.name,
                      childType: selectedAccount.type,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        ) : null
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
  const query = useQuery<CollectiveOptionPickerQuery, CollectiveOptionPickerQueryVariables>(
    gql`
      query CollectiveOptionPicker($slug: String!) {
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
    <React.Fragment>
      {props.checked && props.collectiveSlug && (
        <div className="mb-2">
          <CollectiveOption collectiveSlug={props.collectiveSlug} checked onChange={slug => props.onChange(slug)} />
        </div>
      )}
      <RadioCardButton
        className="w-full"
        onClick={props.onClick}
        title={props.label}
        checked={props.checked && !props.collectiveSlug}
        content={
          props.checked &&
          !props.collectiveSlug && (
            <div role="searchbox" tabIndex={0} onKeyDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
              <CollectivePickerAsync
                autoFocus
                menuIsOpen
                filterResults={collectives =>
                  collectives.filter(c => c.type !== CollectiveType.ORGANIZATION || c.isHost)
                }
                preload
                className="mt-4"
                inputId="collective-expense-picker"
                types={allowedCollectiveTypes}
                value={{ value: query.data?.account, label: query.data?.account?.name }}
                onChange={e => props.onChange(e.value.slug)}
              />
            </div>
          )
        }
      />
    </React.Fragment>
  );
}

type ChildAccountPickerProps = {
  accountSlug: string;
  value: string;
  onChange: (slug: string) => void;
  className?: string;
};

function ChildAccountPicker(props: ChildAccountPickerProps) {
  const query = useQuery<ChildAccountPickerQuery, ChildAccountPickerQueryVariables>(
    gql`
      query ChildAccountPicker($slug: String!) {
        account(slug: $slug) {
          id
          legacyId
          slug
          name
          type
          imageUrl
          childrenAccounts(isActive: true) {
            nodes {
              id
              legacyId
              slug
              name
              type
              imageUrl
            }
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: props.accountSlug,
      },
      skip: !props.accountSlug,
    },
  );

  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  const options = query.data?.account ? [query.data.account, ...query.data.account.childrenAccounts.nodes] : [];
  const selection = options.find(a => a.slug === props.value);

  return (
    <div className={props.className}>
      {query.loading || !query.called ? (
        <LoadingPlaceholder height={20} />
      ) : (
        <CollectivePicker
          collectives={options}
          collective={selection}
          isSearchable={options.length > 5}
          onChange={({ value }) => props.onChange(value.slug)}
        />
      )}
    </div>
  );
}
