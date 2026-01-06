import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../../../lib/currency-utils';
import { i18nGraphqlException } from '../../../../lib/errors';
import { gql } from '../../../../lib/graphql/helpers';

import { getPortabilitySummary, leaveHostQuery } from '@/components/edit-collective/LeaveHostModal';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Flex } from '../../../Grid';
import Loading from '../../../Loading';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import RichTextEditor from '../../../RichTextEditor';
import StyledButton from '../../../StyledButton';
import StyledLink from '../../../StyledLink';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../../../StyledModal';
import StyledTextarea from '../../../StyledTextarea';
import { Label, P } from '../../../Text';
import { RadioGroup, RadioGroupItem } from '../../../ui/RadioGroup';
import { useToast } from '../../../ui/useToast';

const unhostAccountMutation = gql`
  mutation UnhostAccount(
    $account: AccountReferenceInput!
    $message: String
    $pauseContributions: Boolean!
    $messageForContributors: String
  ) {
    removeHost(
      account: $account
      message: $message
      pauseContributions: $pauseContributions
      messageForContributors: $messageForContributors
    ) {
      id
      slug
      name
      ... on AccountWithHost {
        host {
          id
        }
      }
    }
  }
`;

const UnhostAccountModal = ({ collective, host, ...props }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messageForContributors, setMessageForContributors] = useState('');
  const [pauseContributions, setPauseContributions] = useState(true);
  const {
    loading: loadingAccount,
    error: accountError,
    data: accountData,
  } = useQuery(leaveHostQuery, {
    variables: { slug: collective.slug },
  });

  const portabilitySummary = getPortabilitySummary(accountData?.account);

  const [unhostAccount, { loading }] = useMutation(unhostAccountMutation, {
    variables: {
      account: {
        id: collective.id,
      },
      message,
      pauseContributions,
      messageForContributors,
    },
    refetchQueries: ['HostDashboardHostedCollectives'],
    awaitRefetchQueries: true,
  });

  if (loadingAccount) {
    return <Loading />;
  }

  if (accountError) {
    return <MessageBoxGraphqlError error={accountError} />;
  }

  return (
    <StyledModal maxWidth={600} {...props}>
      <CollectiveModalHeader collective={collective} mb={3} />
      <ModalBody>
        <div>
          <P fontSize="16px" fontWeight="700" lineHeight="24px" color="red.900" mb={2}>
            <FormattedMessage
              defaultMessage="Are you sure you want to un-host {collectiveName}?"
              id="JYMdjW"
              values={{ collectiveName: collective.name }}
            />
          </P>
          <P fontSize="14px" lineHeight="20px" color="black.700" mb={2}>
            <FormattedMessage
              defaultMessage="{fiscalHostName} will no longer be the Fiscal Host for this Collective. Un-hosting this Collective means no longer holding funds for them, neither managing tax compliance and accounting."
              id="E0P87E"
              values={{ fiscalHostName: host.name }}
            />
          </P>
          {collective.stats.balance.valueInCents > 0 && (
            <MessageBox type="warning" mb={2}>
              <FormattedMessage
                defaultMessage="The Collective's balance must be zero to un-host, including its Events or Projects. There is a remaining balance of {collectiveBalanceAmount}. You can pay out these funds by <Link>processing expenses.</Link>"
                id="J2/jVu"
                values={{
                  collectiveBalanceAmount: formatCurrency(
                    collective.stats.balance.valueInCents,
                    collective.stats.balance.currency,
                    { locale: intl.locale },
                  ),
                  Link: value => (
                    <StyledLink
                      color="black.800"
                      href="https://documentation.opencollective.com/expenses-and-getting-paid/submitting-expenses"
                      textDecoration="underline"
                      openInNewTab
                    >
                      {value}
                    </StyledLink>
                  ),
                }}
              />
            </MessageBox>
          )}

          <div className="mt-4">
            <Label
              htmlFor="unhost-account-message"
              fontSize="16px"
              fontWeight="700"
              lineHeight="24px"
              color="black.800.900"
              mb="6px"
            >
              <FormattedMessage defaultMessage="Include a message to the Collective admins (Optional)" id="GLo1nw" />
            </Label>
            <StyledTextarea
              id="unhost-account-message"
              width="100%"
              minHeight={126}
              maxHeight={300}
              onChange={e => setMessage(e.target.value)}
              value={message}
              fontSize="13px"
            />
          </div>

          {Boolean(portabilitySummary.totalCount) && (
            <React.Fragment>
              <div className="mt-4">
                <Label fontSize="16px" fontWeight="700" lineHeight="24px" color="black.800.900">
                  <FormattedMessage
                    defaultMessage="What should happen to recurring contributions?"
                    id="contributions.question"
                  />
                </Label>
                <P fontSize="14px" lineHeight="20px" mb={2} mt={2}>
                  <FormattedMessage
                    defaultMessage="{accountName} currently has {count, plural, one {# active recurring contribution} other {# active recurring contributions}} ({yearlyAmount})."
                    id="PetJ0B"
                    values={{
                      accountName: <strong>{collective.name}</strong>,
                      count: portabilitySummary.totalCount,
                      yearlyAmount: (
                        <FormattedMoneyAmount
                          amount={portabilitySummary.yearlyAmount}
                          interval="year"
                          currency={collective.currency}
                        />
                      ),
                    }}
                  />
                </P>
                <RadioGroup
                  value={pauseContributions ? 'pause' : 'cancel'}
                  className="my-3 space-y-3"
                  onValueChange={value => setPauseContributions(value === 'pause')}
                >
                  <div className="flex items-center space-x-2">
                    <div className="self-baseline">
                      <RadioGroupItem value="pause" id="pause" />
                    </div>
                    <label className="cursor-pointer text-sm font-normal" htmlFor="pause">
                      <FormattedMessage
                        defaultMessage="I want to <strong>pause</strong> recurring contributions"
                        id="QRU6tq"
                        values={{ strong: msg => <strong>{msg}</strong> }}
                      />
                      <p className="pt-1 text-sm text-gray-700">
                        <FormattedMessage
                          defaultMessage="Select this option if the collective intends to stay on Open Collective (either with another fiscal host or as an independent collective). We will pause all recurring contributions and notify contributors that they can renew them as soon as the collective is ready."
                          id="aWqCIv"
                        />
                      </p>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="self-baseline">
                      <RadioGroupItem value="cancel" id="cancel" />
                    </div>
                    <label className="cursor-pointer text-sm font-normal" htmlFor="cancel">
                      <FormattedMessage
                        defaultMessage="I want to <strong>cancel</strong> all the recurring contributions"
                        id="yvsZ12"
                        values={{ strong: msg => <strong>{msg}</strong> }}
                      />
                      <p className="pt-1 text-sm text-gray-700">
                        <FormattedMessage
                          defaultMessage="Select this option if the collective intends to leave Open Collective. We will notify contributors that their recurring contributions have been canceled."
                          id="qMfzJH"
                        />
                      </p>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="mt-4">
                <div className="mb-1">
                  <Label fontSize="16px" fontWeight="700" lineHeight="24px" color="black.800.900">
                    <FormattedMessage defaultMessage="Additional message for contributors" id="bjXbg/" />
                  </Label>
                </div>
                <RichTextEditor
                  id="message-for-contributors"
                  inputName="messageForContributors"
                  showCount
                  version="simplified"
                  onChange={e => setMessageForContributors(e.target.value)}
                  editorMaxHeight={300}
                  withBorders
                  editorMinHeight={150}
                  maxLength={2000}
                  placeholder={
                    pauseContributions
                      ? intl.formatMessage({
                          defaultMessage: 'The collective is transitioning to a new fiscal host.',
                          id: 'host.pause.message',
                        })
                      : intl.formatMessage({
                          defaultMessage: 'The collective is leaving Open Collective.',
                          id: 'host.cancel.message',
                        })
                  }
                />
              </div>
            </React.Fragment>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent="center">
          <StyledButton
            buttonStyle={'danger'}
            minWidth={90}
            disabled={
              collective.stats.balance.valueInCents > 0 ||
              (portabilitySummary.totalCount > 0 && !messageForContributors)
            }
            loading={loading}
            onClick={async () => {
              try {
                await unhostAccount();
                const successMsgArgs = { accountName: collective.name, accountSlug: collective.slug };
                toast({
                  variant: 'success',
                  message: intl.formatMessage(
                    { defaultMessage: '{accountName} (@{accountSlug}) has been un-hosted', id: 'hOzNmK' },
                    successMsgArgs,
                  ),
                });
                props.onClose();
                props.onSuccess?.();
              } catch (e) {
                toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
              }
            }}
          >
            <FormattedMessage defaultMessage="Un-host Collective" id="w5thcm" />
          </StyledButton>
          <StyledButton ml={3} minWidth={120} onClick={props.onClose} disabled={loading}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

export default UnhostAccountModal;
