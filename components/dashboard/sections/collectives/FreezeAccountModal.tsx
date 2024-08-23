import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { sum } from 'lodash';
import { Info, TriangleAlert } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getAccountReferenceInput } from '../../../../lib/collective';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import type { Account } from '../../../../lib/graphql/types/v2/graphql';

import { collectivePageQuery } from '../../../collective-page/graphql/queries';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../../../StyledModal';
import StyledTextarea from '../../../StyledTextarea';
import { Label as StyledComponentsLabel, P, Span } from '../../../Text';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';
import { Label } from '../../../ui/Label';
import { Skeleton } from '../../../ui/Skeleton';
import { Switch } from '../../../ui/Switch';
import { Textarea } from '../../../ui/Textarea';
import { useToast } from '../../../ui/useToast';

const editAccountFreezeStatusMutation = gql`
  mutation EditAccountFreezeStatus(
    $account: AccountReferenceInput!
    $action: AccountFreezeAction!
    $pauseExistingRecurringContributions: Boolean!
    $messageForAccountAdmins: String!
    $messageForContributors: String
  ) {
    editAccountFreezeStatus(
      account: $account
      action: $action
      messageForAccountAdmins: $messageForAccountAdmins
      messageForContributors: $messageForContributors
      pauseExistingRecurringContributions: $pauseExistingRecurringContributions
    ) {
      id
      isFrozen
      childrenAccounts {
        nodes {
          id
          isFrozen
        }
      }
    }
  }
`;

const freezeAccountModalQuery = gql`
  query FreezeAccountModal($accountId: String!) {
    account(id: $accountId) {
      id
      name
      slug
      isFrozen
      imageUrl(height: 64)
      ...AccountSubscriptionsInfo
      childrenAccounts {
        nodes {
          ...AccountSubscriptionsInfo
        }
      }
    }
  }
  fragment AccountSubscriptionsInfo on Account {
    stats {
      activeRecurringContributionsBreakdown {
        count
      }
    }
    activePayPalSubscriptionOrders: orders(
      filter: INCOMING
      onlyActiveSubscriptions: true
      paymentMethodService: PAYPAL
      paymentMethodType: SUBSCRIPTION
    ) {
      totalCount
    }
  }
`;

const getRecurringContributionsCountSummary = account => {
  if (!account) {
    return {};
  }

  // Total count of recurring contributions for the account and its children
  const getAllActiveCounts = (account: Account) =>
    account.stats.activeRecurringContributionsBreakdown.map(c => c.count);
  const baseCount = sum(getAllActiveCounts(account));
  const childrenCount = sum(account.childrenAccounts.nodes.map(child => sum(getAllActiveCounts(child))));

  // PayPal subscriptions count
  const paypalSubscriptionsCount = account.activePayPalSubscriptionOrders.totalCount;
  const paypalSubscriptionsCountForChildren = sum(
    account.childrenAccounts.nodes.map(child => child.activePayPalSubscriptionOrders.totalCount),
  );

  return {
    totalCount: baseCount + childrenCount,
    activePaypalSubscriptionsCount: paypalSubscriptionsCount + paypalSubscriptionsCountForChildren,
  };
};

const FreezeAccountModal = ({
  collective,
  onSuccess,
  onClose,
  ...props
}: {
  collective: Pick<Account, 'id' | 'isFrozen'>;
  onSuccess?: () => void;
  onClose: () => void;
} & Omit<React.ComponentProps<typeof StyledModal>, 'children'>) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [useMessageForAccountAdmins, setUseMessageForAccountAdmins] = useState(false);
  const [messageForAccountAdmins, setMessageForAccountAdmins] = useState('');
  const [pauseContributions, setPauseContributions] = useState(true);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const { data, loading, error } = useQuery(freezeAccountModalQuery, {
    variables: { accountId: collective.id },
    context: API_V2_CONTEXT,
  });
  const [editAccountFreezeStatus, { loading: submitting }] = useMutation(editAccountFreezeStatusMutation, {
    context: API_V2_CONTEXT,
  });

  const isUnfreezing = data?.account ? data.account.isFrozen : collective.isFrozen;
  const contributionsSummary = getRecurringContributionsCountSummary(data?.account);
  return (
    <StyledModal maxWidth={600} trapFocus onClose={onClose} {...props}>
      <CollectiveModalHeader
        preText={intl.formatMessage({ defaultMessage: `Freeze`, id: 'Account.Freeze' })}
        collective={collective}
        mb={3}
      />

      <ModalBody mb={0}>
        {loading ? (
          <Skeleton className="h-40" />
        ) : error ? (
          <MessageBoxGraphqlError error={error} mb={2} />
        ) : isUnfreezing ? (
          <div>
            <h2 className="mb-4 text-xl font-bold">
              <FormattedMessage defaultMessage="Are you sure want to unfreeze this collective?" id="OX8+5o" />
            </h2>

            <P fontSize="14px" lineHeight="20px" color="black.700" mb="10px">
              <FormattedMessage
                defaultMessage="Unfreezing the collective means they will now have full access to the platform."
                id="nhEmNV"
              />
              <br />
              <br />
              <FormattedMessage
                defaultMessage="This collective (and all its related Projects & Events) will now have access to accept funds, pay out expenses, post updates, create new Events or Projects."
                id="1Whmi8"
              />
            </P>
            <StyledComponentsLabel
              fontSize="16px"
              fontWeight="700"
              lineHeight="24px"
              color="black.800.900"
              mb="6px"
              htmlFor="freeze-account-message"
            >
              <FormattedMessage defaultMessage="Include a message to the Collective admins (Optional)" id="GLo1nw" />
              <br />
              <Span fontSize="13px" fontWeight="400">
                <FormattedMessage
                  defaultMessage="They will also be notified of this unfreeze via auto-email."
                  id="rzknYs"
                />
              </Span>
            </StyledComponentsLabel>
            <StyledTextarea
              id="freeze-account-message"
              width="100%"
              minHeight={126}
              maxHeight={300}
              onChange={e => setMessageForAccountAdmins(e.target.value)}
              value={messageForAccountAdmins}
            />
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-xl font-bold">
              <FormattedMessage defaultMessage="Are you sure want to freeze this collective?" id="GC33m/" />
            </h2>

            <p className="mb-4 text-sm">
              <FormattedMessage
                defaultMessage="Freezing this collective means temporarily limiting what a collective (and their connected Projects & Events) can and cannot do on the platform."
                id="IVw0RN"
              />
            </p>

            <p className="mb-4 text-sm">
              <FormattedMessage
                defaultMessage="They will not be able to accept funds, pay out expenses, post updates, create new Events or Projects, add new Team members under this collective."
                id="GbTEwm"
              />
            </p>

            <div className="mb-4 rounded-md border-blue-200 bg-blue-50 px-5 py-4 text-sm">
              <Info size={16} className="mr-2 inline-block text-blue-500" />
              <FormattedMessage
                defaultMessage="This collective has {count, plural, one {an active PayPal subscription} other {# active PayPal subscriptions}}. When recurring contributions are paused, PayPal will send them an automated notification."
                id="Lfe7gh"
                values={{ count: contributionsSummary.activePaypalSubscriptionsCount }}
              />
            </div>

            {contributionsSummary.totalCount > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-md border border-gray-200 p-4">
                <span className="text-sm font-medium text-gray-700">
                  <FormattedMessage
                    defaultMessage="Pause {count} recurring contributions"
                    id="0bkmNx"
                    values={{ count: contributionsSummary.totalCount }}
                  />
                </span>
                <Switch checked={pauseContributions} onCheckedChange={setPauseContributions} />
              </div>
            )}

            <Collapsible open={useMessageForAccountAdmins}>
              <CollapsibleTrigger asChild>
                <div className="mb-4 flex items-center justify-between rounded-md border border-gray-200 p-4">
                  <span className="text-sm font-medium text-gray-700">
                    <FormattedMessage defaultMessage="Add a custom message for the Collective Admins" id="PFv8Cm" />
                  </span>
                  <Switch checked={useMessageForAccountAdmins} onCheckedChange={setUseMessageForAccountAdmins} />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-1">
                  <Textarea
                    id="admin-message"
                    className="min-h-40 w-full"
                    maxLength={2048}
                    showCount
                    value={messageForAccountAdmins}
                    onChange={e => setMessageForAccountAdmins(e.target.value)}
                    placeholder={intl.formatMessage({
                      defaultMessage: 'Custom message to the Collective Admins',
                      id: '2u2sON',
                    })}
                    required
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    <FormattedMessage
                      defaultMessage="This message will be attached in the email sent to collective admins to notify them that their collective has been frozen."
                      id="Juw67v"
                    />
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="mt-8 border-t border-dotted pt-4">
              <Collapsible open={contributionsSummary.totalCount > 0 && !pauseContributions}>
                <CollapsibleContent>
                  <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
                    <TriangleAlert size={16} className="mr-2 inline-block text-yellow-500" />
                    <FormattedMessage
                      defaultMessage="We advise you to pause recurring contributions to completely stop the collective from receiving funds. Contributions will restart when you un-freeze the collective."
                      id="q/eQ02"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="mb-4 mt-2 flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-5 py-4">
                <Checkbox
                  id="confirm-freeze"
                  required
                  checked={hasConfirmed}
                  onCheckedChange={value => setHasConfirmed(value === true)}
                />
                <Label htmlFor="confirm-freeze" className="cursor-pointer text-sm font-normal">
                  <FormattedMessage
                    defaultMessage="I have read and understood the consequences of freezing this collective."
                    id="K/zNk0"
                  />
                </Label>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button
            onClick={onClose}
            disabled={loading || submitting}
            variant="outline"
            className="w-full min-w-28 sm:w-auto"
          >
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </Button>
          <Button
            loading={submitting}
            disabled={loading || (!isUnfreezing && !hasConfirmed)}
            variant="destructive"
            className="w-full min-w-36 sm:w-auto"
            onClick={async () => {
              try {
                const action = isUnfreezing ? 'UNFREEZE' : 'FREEZE';
                const accountInput = getAccountReferenceInput(data.account);
                const messageForContributors = `We are temporarily pausing contributions to ${data.account.name}.`; // The API allows to customize this, butt we don't want to expose it to host admins for now. See https://github.com/opencollective/opencollective/issues/7513#issuecomment-2311746204.
                const variables = {
                  account: accountInput,
                  action,
                  messageForAccountAdmins: useMessageForAccountAdmins ? messageForAccountAdmins : undefined,
                  messageForContributors,
                  pauseExistingRecurringContributions: contributionsSummary.totalCount > 0 && pauseContributions,
                };
                await editAccountFreezeStatus({
                  variables,
                  refetchQueries: [{ query: collectivePageQuery, variables: { slug: data.account.slug } }],
                  awaitRefetchQueries: true,
                });
                const successMsgArgs = { accountName: data.account.name, accountSlug: data.account.slug };
                toast({
                  variant: 'success',
                  message: isUnfreezing
                    ? intl.formatMessage(
                        { defaultMessage: '{accountName} (@{accountSlug}) has been unfrozen', id: '4ePoy6' },
                        successMsgArgs,
                      )
                    : intl.formatMessage(
                        { defaultMessage: '{accountName} (@{accountSlug}) has been frozen', id: 'Dnbu8Y' },
                        successMsgArgs,
                      ),
                });
                onSuccess?.();
                props.onClose();
              } catch (e) {
                toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
              }
            }}
          >
            {isUnfreezing ? (
              <FormattedMessage defaultMessage="Unfreeze" id="5SBeLS" />
            ) : (
              <FormattedMessage defaultMessage="Freeze Collective" id="ILjcbM" />
            )}
          </Button>
        </div>
      </ModalFooter>
    </StyledModal>
  );
};

export default FreezeAccountModal;
