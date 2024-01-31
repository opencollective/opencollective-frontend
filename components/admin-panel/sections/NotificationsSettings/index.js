import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { compact, flatten } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';

import Avatar from '../../../Avatar';
import { Box, Flex } from '../../../Grid';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledButton from '../../../StyledButton';
import StyledCard from '../../../StyledCard';
import StyledHr from '../../../StyledHr';
import StyledTag from '../../../StyledTag';
import { P, Span } from '../../../Text';
import { Switch } from '../../../ui/Switch';

import CollectiveSettings from './CollectiveSettings';
import { accountActivitySubscriptionsFragment } from './fragments';
import GroupView from './GroupView';

const GROUP_VIEWS = {
  COLLECTIVES: 'collectives',
  ORGANIZATIONS: 'organizations',
  BACKED: 'backed',
};

const NecessaryNotificationsList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  grid-gap: 12px 24px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
`;

const userActivitySubscriptionsQuery = gql`
  query ActivitySubscriptionsSettings($slug: String!) {
    account(slug: $slug) {
      id
      ... on Individual {
        newsletterOptIn
      }
      memberOf(role: [ADMIN], accountType: [COLLECTIVE, FUND, ORGANIZATION], isArchived: false) {
        nodes {
          id
          account {
            id
            ...AccountActivitySubscriptionsFields
            ... on Organization {
              host {
                id
                totalHostedCollectives
              }
            }
          }
        }
      }
      backerOf: memberOf(
        role: [BACKER]
        accountType: [COLLECTIVE, ORGANIZATION, EVENT, FUND, PROJECT]
        isArchived: false
      ) {
        nodes {
          id
          account {
            id
            ...AccountActivitySubscriptionsFields
          }
        }
      }
    }
  }
  ${accountActivitySubscriptionsFragment}
`;

const setNewsletterOptInMutation = gql`
  mutation SetNewsletterOptIn($newsletterOptIn: Boolean!) {
    setNewsletterOptIn(newsletterOptIn: $newsletterOptIn) {
      id
      ... on Individual {
        newsletterOptIn
      }
    }
  }
`;

const GroupSettings = ({ accounts, group, title, ...boxProps }) => {
  const router = useRouter();
  const handleGroupSettings = () => router.push(`${router.asPath}/${group}`);
  const activitySubscriptions = compact(flatten(accounts.map(account => account.activitySubscriptions)));

  return (
    <Box {...boxProps}>
      <Flex alignItems="center" justifyContent="space-between">
        {title}
        <P fontSize="12px" lineHeight="18px" color="black.700" display={['none', 'block']}>
          {activitySubscriptions.length === 0 ? (
            <FormattedMessage
              id="GroupSettings.NoActivitySubscriptions"
              defaultMessage="You are receiving all notifications"
            />
          ) : (
            <FormattedMessage
              id="GroupSettings.SomeActivitySubscriptions"
              defaultMessage="Some notifications are turned off"
            />
          )}
        </P>
      </Flex>
      <Box mt={3}>
        <Flex alignItems={['flex-start', 'center']} justifyContent="space-between" flexWrap="wrap" gap="8px">
          <Flex alignItems="center">
            <StyledTag
              variant="rounded"
              fontSize="11px"
              lineHeight="16px"
              backgroundColor="black.50"
              border="1px solid #C3C6CB"
              mr={2}
              p="4px 8px"
            >
              {accounts.slice(0, 5).map(account => (
                <Avatar key={account.id} collective={account} radius={16} mr="6px" />
              ))}
            </StyledTag>
            {accounts.length - 5 > 0 && (
              <P fontSize="14px" lineHeight="20px" color="black.700">
                (<FormattedMessage id="nMore" defaultMessage="{n} more" values={{ n: accounts.length - 5 }} />)
              </P>
            )}
          </Flex>
          <StyledButton buttonStyle="primary" buttonSize="tiny" onClick={handleGroupSettings}>
            <FormattedMessage id="GroupSettings.Show" defaultMessage="Show group settings" />
          </StyledButton>
        </Flex>
        <Box display={['block', 'none']} mt={2}>
          <P fontSize="12px" lineHeight="18px" color="black.700">
            {activitySubscriptions.length === 0 ? (
              <FormattedMessage
                id="GroupSettings.NoActivitySubscriptions"
                defaultMessage="You are receiving all notifications"
              />
            ) : (
              <FormattedMessage
                id="GroupSettings.SomeActivitySubscriptions"
                defaultMessage="Some notifications are turned off"
              />
            )}
          </P>
        </Box>
      </Box>
    </Box>
  );
};

GroupSettings.propTypes = {
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
      type: PropTypes.string,
      imageUrl: PropTypes.string,
      activitySubscriptions: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
          active: PropTypes.bool,
        }),
      ),
    }),
  ),
  group: PropTypes.string,
  title: PropTypes.node,
};

const NotificationsSettings = ({ accountSlug, subpath }) => {
  const { data, loading, error } = useQuery(userActivitySubscriptionsQuery, {
    variables: { slug: accountSlug },
    context: API_V2_CONTEXT,
  });
  const [setNewsletterOptIn, { loading: setNewsletterOptInLoading }] = useMutation(setNewsletterOptInMutation, {
    context: API_V2_CONTEXT,
  });

  const accounts = data?.account.memberOf.nodes.map(member => member.account) || [];
  const hosts = accounts.filter(a => !!a.host);
  const orgs = accounts.filter(a => a.type === 'ORGANIZATION' && !a.host);
  const collectives = accounts.filter(a => a.type === 'COLLECTIVE');

  const backedAccounts =
    data?.account.backerOf.nodes
      .map(member => member.account)
      // Remove accounts already listed in the advanced settings section
      .filter(backedAccount => !accounts.some(account => account.id === backedAccount.id)) || [];

  const view = subpath?.[0];
  if (Object.values(GROUP_VIEWS).includes(view)) {
    const titles = {
      [GROUP_VIEWS.COLLECTIVES]: (
        <FormattedMessage
          id="NotificationsSettings.Activity.List.CollectivesSubtitle"
          defaultMessage="Collectives you manage"
        />
      ),
      [GROUP_VIEWS.ORGANIZATIONS]: (
        <FormattedMessage
          id="NotificationsSettings.Activity.List.OrganizationsSubtitle"
          defaultMessage="Organizations you manage"
        />
      ),
      [GROUP_VIEWS.BACKED]: (
        <FormattedMessage
          id="NotificationsSettings.Updates.CollectivesSupported"
          defaultMessage="Collectives you support"
        />
      ),
    };
    const accountGroups = {
      [GROUP_VIEWS.COLLECTIVES]: collectives,
      [GROUP_VIEWS.ORGANIZATIONS]: orgs,
      [GROUP_VIEWS.BACKED]: backedAccounts,
    };
    const roleLabel =
      view === GROUP_VIEWS.BACKED ? (
        <FormattedMessage id="NotificationSettings.Label.Backer" defaultMessage="Backer" />
      ) : (
        <FormattedMessage id="AdminPanel.button" defaultMessage="Admin" />
      );

    return (
      <GroupView
        accounts={accountGroups[view]}
        title={titles[view]}
        advancedSettings={view !== GROUP_VIEWS.BACKED}
        roleLabel={roleLabel}
      />
    );
  }

  return (
    <Box>
      <P fontSize="24px" fontWeight="700" lineHeight="32px" mb={3}>
        <FormattedMessage id="NotificationsSettings.Title" defaultMessage="Notification Settings" />
      </P>
      <P lineHeight="20px" letterSpacing="0px">
        <FormattedMessage
          id="NotificationsSettings.Descripion"
          defaultMessage="We will always let you know about important changes, but you can customize other settings here. Manage email notifications for your individual profile as well as the collectives and organizations you are part of."
        />
      </P>
      {error && <MessageBoxGraphqlError error={error} my={4} />}
      <StyledCard mt={4} p="24px">
        <P fontSize="18px" fontWeight="700" lineHeight="26px">
          <FormattedMessage
            id="NotificationsSettings.NecessaryNotifications.Title"
            defaultMessage="Necessary notifications"
          />
        </P>
        <P lineHeight="20px" letterSpacing="0px" mt={2}>
          <FormattedMessage
            id="NotificationsSettings.NecessaryNotifications.Description"
            defaultMessage="There are some notifications we are required to send you, and they can't be opted out of."
          />
        </P>
        <StyledHr my="24px" />
        <NecessaryNotificationsList>
          <li>
            <FormattedMessage
              id="NotificationsSettings.NecessaryNotifications.ToSUpdates"
              defaultMessage="Updates on our terms of service"
            />
          </li>
          <li>
            <FormattedMessage
              id="NotificationsSettings.NecessaryNotifications.MagicLink"
              defaultMessage="Magic link login"
            />
          </li>
          <li>
            <FormattedMessage
              id="NotificationsSettings.NecessaryNotifications.EmailUpdate"
              defaultMessage="Email address update"
            />
          </li>
          <li>
            <FormattedMessage
              id="NotificationsSettings.NecessaryNotifications.HostMessages"
              defaultMessage="Communications from your hosts"
            />
          </li>
          <li>
            <FormattedMessage
              id="NotificationsSettings.NecessaryNotifications.Receipts"
              defaultMessage="Receipts of your contributions"
            />
          </li>
          <li>
            <FormattedMessage
              id="NotificationsSettings.NecessaryNotifications.PaymentIssues"
              defaultMessage="Payment and payment method issues"
            />
          </li>
          <li>
            <FormattedMessage
              id="NotificationsSettings.NecessaryNotifications.Expenses"
              defaultMessage="Recurring and requested expenses"
            />
          </li>
        </NecessaryNotificationsList>
      </StyledCard>

      {loading ? (
        <Fragment>
          <LoadingPlaceholder mt={4} width="100%" height={300} borderRadius="8px" />
          <LoadingPlaceholder mt={4} width="100%" height={200} borderRadius="8px" />
        </Fragment>
      ) : (
        <Fragment>
          {accounts.length > 0 && (
            <StyledCard mt={4} p="24px">
              <P fontSize="18px" fontWeight="700" lineHeight="26px">
                <FormattedMessage
                  id="NotificationsSettings.Activity.Title"
                  defaultMessage="Notifications regarding your activity"
                />
              </P>
              <P lineHeight="20px" letterSpacing="0px" mt={2}>
                <FormattedMessage
                  id="NotificationsSettings.Activity.Description"
                  defaultMessage="Notification settings about the profiles you administer."
                />
              </P>
              <StyledHr my="24px" />
              <P fontSize="18px" fontWeight="700" lineHeight="26px">
                <FormattedMessage
                  id="NotificationsSettings.Activity.List.Title"
                  defaultMessage="What you are following:"
                />
              </P>

              {hosts.length > 0 && (
                <Box mt={3}>
                  <P fontSize="15px" fontWeight="500" lineHeight="22px">
                    <FormattedMessage
                      id="NotificationsSettings.Activity.List.HostSubtitle"
                      defaultMessage="Collective you host"
                    />{' '}
                    <Span fontSize="14px" fontWeight="400" lineHeight="20px" color="black.700">
                      ({hosts.length || 0})
                    </Span>
                  </P>
                  {hosts.map(a => (
                    <CollectiveSettings key={a.id} account={a} advancedSettings mt={3} />
                  ))}
                </Box>
              )}

              {collectives.length > 0 && (
                <GroupSettings
                  title={
                    <P fontSize="15px" fontWeight="500" lineHeight="22px">
                      <FormattedMessage
                        id="NotificationsSettings.Activity.List.CollectivesSubtitle"
                        defaultMessage="Collectives you manage"
                      />
                    </P>
                  }
                  accounts={collectives}
                  group={GROUP_VIEWS.COLLECTIVES}
                  mt={4}
                />
              )}

              {orgs.length > 0 && (
                <GroupSettings
                  title={
                    <P fontSize="15px" fontWeight="500" lineHeight="22px">
                      <FormattedMessage
                        id="NotificationsSettings.Activity.List.OrganizationsSubtitle"
                        defaultMessage="Organizations you manage"
                      />
                    </P>
                  }
                  accounts={orgs}
                  group={GROUP_VIEWS.ORGANIZATIONS}
                  mt={4}
                />
              )}
            </StyledCard>
          )}

          <StyledCard mt={4} p="24px">
            <P fontSize="18px" fontWeight="700" lineHeight="26px">
              <FormattedMessage
                id="NotificationsSettings.Updates.Title"
                defaultMessage="Updates about the platform and Collectives you support"
              />
            </P>
            <P lineHeight="20px" letterSpacing="0px" mt={2}>
              <FormattedMessage
                id="NotificationsSettings.Updates.Description"
                defaultMessage="Notifications about us, news we want to share with you related to our activities and the development of the platform."
              />
            </P>
            <StyledHr my="24px" />
            <Box mt={3}>
              <Flex alignItems="center" justifyContent="space-between">
                <P fontSize="15px" fontWeight="500" lineHeight="22px">
                  <FormattedMessage
                    id="NotificationsSettings.Updates.Newsletter"
                    defaultMessage="Receive the Doohi Collective newsletter (monthly)"
                  />
                </P>
                <Switch
                  name={`newsletter-switch`}
                  checked={data?.account?.newsletterOptIn}
                  isDisabled={setNewsletterOptInLoading}
                  onCheckedChange={checked => setNewsletterOptIn({ variables: { newsletterOptIn: checked } })}
                />
              </Flex>
              <StyledHr width="100%" mt={3} borderStyle="dashed" />
            </Box>
            {backedAccounts.length > 0 && (
              <GroupSettings
                title={
                  <P fontSize="15px" fontWeight="500" lineHeight="22px">
                    <FormattedMessage
                      id="NotificationsSettings.Updates.CollectivesSupported"
                      defaultMessage="Collectives you support"
                    />
                  </P>
                }
                accounts={backedAccounts}
                group={GROUP_VIEWS.BACKED}
                mt={3}
              />
            )}
          </StyledCard>
        </Fragment>
      )}
    </Box>
  );
};

NotificationsSettings.propTypes = {
  accountSlug: PropTypes.string.isRequired,
  subpath: PropTypes.arrayOf(PropTypes.string),
};

export default NotificationsSettings;
