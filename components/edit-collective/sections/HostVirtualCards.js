import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { Info } from '@styled-icons/feather/Info';
import { get, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Box, Flex, Grid } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import InputField from '../../InputField';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledInputField from '../../StyledInputField';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import AssignVirtualCardModal from '../AssignVirtualCardModal';
import CreateVirtualCardModal from '../CreateVirtualCardModal';
import EditVirtualCardModal from '../EditVirtualCardModal';
import SettingsTitle from '../SettingsTitle';
import VirtualCard from '../VirtualCard';

import VirtualCardFilters from './virtual-cards/VirtualCardFilters';
import SettingsSectionTitle from './SettingsSectionTitle';

const VIRTUAL_CARDS_POLICY_MAX_LENGTH = 3000; // 600 words * 5 characters average length word

const hostVirtualCardsQuery = gqlV2/* GraphQL */ `
  query HostedVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $state: String
    $merchantAccount: AccountReferenceInput
    $collectiveAccountIds: [AccountReferenceInput]
  ) {
    host(slug: $slug) {
      id
      legacyId
      slug
      supportedPayoutMethods
      name
      imageUrl
      currency
      hostedVirtualCards(
        limit: $limit
        offset: $offset
        state: $state
        merchantAccount: $merchantAccount
        collectiveAccountIds: $collectiveAccountIds
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          privateData
          provider
          spendingLimitAmount
          spendingLimitInterval
          currency
          createdAt
          account {
            id
            name
            slug
            imageUrl
          }
          assignee {
            id
            name
            slug
            imageUrl
          }
        }
      }
      hostedVirtualCardMerchants {
        nodes {
          id
          type
          slug
          name
          currency
          location {
            address
            country
          }
          imageUrl(height: 64)
        }
      }
      hostedVirtualCardCollectives {
        totalCount
        limit
        offset
        nodes {
          id
          slug
          name
          legacyId
          imageUrl(height: 64)
        }
      }
    }
  }
`;

const updateAccountSettingsMutation = gqlV2/* GraphQL */ `
  mutation UpdateAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      type
      isActive
      settings
    }
  }
`;

const messages = defineMessages({
  'policy.placeholder': {
    id: 'Host.VirtualCards.Policy.Placeholder',
    defaultMessage: 'E.g. deadlines to submit receipts, allowed charges, limits, or who to contact with questions.',
  },
});

const AddCardPlaceholder = styled(Flex)`
  border-radius: 20px;
  ${props => `border: 1px dashed ${props.theme.colors.primary[500]};`}
`;

const VIRTUAL_CARDS_PER_PAGE = 6;

const HostVirtualCards = props => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { state, merchant, collectiveAccountIds } = routerQuery;
  const { formatMessage } = useIntl();
  const { addToast } = useToasts();
  const { loading, data, refetch } = useQuery(hostVirtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: props.collective.slug,
      limit: VIRTUAL_CARDS_PER_PAGE,
      offset,
      state,
      merchantAccount: { slug: merchant },
      collectiveAccountIds: collectiveAccountIds
        ? collectiveAccountIds.split(',').map(collectiveAccountId => ({ legacyId: parseInt(collectiveAccountId) }))
        : undefined,
    },
  });

  const [updateAccountSetting, { loading: updateLoading }] = useMutation(updateAccountSettingsMutation, {
    context: API_V2_CONTEXT,
    onError: e => {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: (
          <FormattedMessage
            id="Host.VirtualCards.Settings.Error"
            defaultMessage="Error updating setting: {error}"
            values={{
              error: e.message,
            }}
          />
        ),
      });
    },
  });
  const [displayAssignCardModal, setAssignCardModalDisplay] = React.useState(false);
  const [displayCreateVirtualCardModal, setCreateVirtualCardModalDisplay] = React.useState(false);
  const [editingVirtualCard, setEditingVirtualCard] = React.useState(undefined);
  const [virtualCardPolicy, setVirtualCardPolicy] = React.useState(
    props.collective.settings?.virtualcards?.policy || '',
  );

  const handleUpdateFilters = queryParams => {
    return router.push(
      {
        pathname: `/${props.collective.slug}/admin/host-virtual-cards`,
        query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
      },
      null,
      { scroll: false },
    );
  };

  const handleAssignCardSuccess = message => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: message || (
        <FormattedMessage id="Host.VirtualCards.AssignCard.Success" defaultMessage="Card successfully assigned" />
      ),
    });
    setAssignCardModalDisplay(false);
    refetch();
  };

  const handleEditCardSuccess = message => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: message,
    });
    setEditingVirtualCard(undefined);
    refetch();
  };

  const handleCreateVirtualCardSuccess = message => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: message || <FormattedMessage defaultMessage="Virtual card successfully created" />,
    });
    setCreateVirtualCardModalDisplay(false);
    refetch();
  };

  const handleSettingsUpdate = key => async value => {
    await updateAccountSetting({
      variables: {
        account: { legacyId: props.collective.id },
        key,
        value,
      },
    });
    await refetch();
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: <FormattedMessage id="Host.VirtualCards.Settings.Success" defaultMessage="Setting updated" />,
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Fragment>
      <SettingsTitle contentOnly={props.contentOnly}>
        <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
      </SettingsTitle>
      <Box>
        <SettingsSectionTitle>
          <FormattedMessage id="Host.VirtualCards.Settings.Title" defaultMessage="Settings and Policy" />
        </SettingsSectionTitle>
        <Flex mt={4} justifyContent="space-between" alignItems="center">
          <Box lineHeight="20px" fontSize="14px" fontWeight="500">
            <FormattedMessage id="Host.VirtualCards.RequestCard.Title" defaultMessage="Enable card requests" />
            <P fontSize="11px" fontWeight="400" color="black.600">
              <FormattedMessage
                id="Host.VirtualCards.RequestCard.Description"
                defaultMessage="Collectives can request a card to be linked to their budget."
              />
            </P>
          </Box>
          <StyledInputField name="virtualcards.requestcard" htmlFor="virtualcards.requestcard" disabled={updateLoading}>
            {inputProps => (
              <InputField
                name="application"
                className="horizontal"
                type="switch"
                id={inputProps.id}
                inputName={inputProps.name}
                onChange={handleSettingsUpdate(inputProps.name)}
                defaultValue={get(props.collective, `settings.${inputProps.name}`)}
              />
            )}
          </StyledInputField>
        </Flex>

        <StyledInputField
          name="virtualcards.policy"
          htmlFor="virtualcards.policy"
          disabled={updateLoading}
          mt={4}
          label={
            <Box lineHeight="20px" fontSize="14px" fontWeight="500">
              <Span mr={1}>
                <FormattedMessage id="Host.VirtualCards.Policy.Title" defaultMessage="Virtual Card Policy" />
              </Span>
              <StyledTooltip
                content={
                  <FormattedMessage
                    id="Host.VirtualCards.Policy.ToolTip"
                    defaultMessage="This policy text will appear in a pop up when someone 'Requests a Virtual Card' from the Action menu on the collective's page."
                  />
                }
              >
                <Info size={16} />
              </StyledTooltip>
            </Box>
          }
        >
          {inputProps => (
            <RichTextEditor
              withBorders
              showCount
              maxLength={VIRTUAL_CARDS_POLICY_MAX_LENGTH}
              version="simplified"
              editorMinHeight="20rem"
              editorMaxHeight={500}
              id={inputProps.id}
              inputName={inputProps.name}
              onChange={e => setVirtualCardPolicy(e.target.value)}
              value={virtualCardPolicy}
              placeholder={formatMessage(messages['policy.placeholder'])}
              fontSize="14px"
            />
          )}
        </StyledInputField>

        <StyledButton
          mt={10}
          loading={updateLoading}
          onClick={() => handleSettingsUpdate('virtualcards.policy')(virtualCardPolicy)}
        >
          <FormattedMessage id="Host.VirtualCards.Policy.Save" defaultMessage="Save Policy" />
        </StyledButton>
      </Box>

      <Box mt={4}>
        <SettingsSectionTitle>
          <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
        </SettingsSectionTitle>
        <P>
          <FormattedMessage
            id="Host.VirtualCards.List.Description"
            defaultMessage="Make payments easier by creating virtual cards on Privacy.com and linking them to Collectives. One Collective can have multiple virtual cards. <learnMoreLink>Learn more</learnMoreLink>"
            values={{
              learnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/fiscal-hosts/virtual-cards',
                openInNewTabNoFollow: true,
              }),
            }}
          />
        </P>
        <Flex mt={3} flexDirection={['row', 'column']}>
          <VirtualCardFilters
            isCollectiveFilter={true}
            filters={routerQuery}
            collective={props.collective}
            virtualCardMerchants={data.host.hostedVirtualCardMerchants.nodes}
            virtualCardCollectives={data.host.hostedVirtualCardCollectives.nodes}
            onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
          />
        </Flex>
      </Box>
      <Grid mt={4} gridTemplateColumns={['100%', '366px 366px']} gridGap="32px 24px">
        <AddCardPlaceholder
          width="366px"
          height="248px"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <StyledButton
            my={1}
            buttonStyle="primary"
            buttonSize="round"
            data-cy="confirmation-modal-continue"
            onClick={() => setCreateVirtualCardModalDisplay(true)}
          >
            +
          </StyledButton>
          <Box mt="10px">
            <FormattedMessage defaultMessage="Create virtual card" />
          </Box>
        </AddCardPlaceholder>
        <AddCardPlaceholder
          width="366px"
          height="248px"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <StyledButton
            my={1}
            buttonStyle="primary"
            buttonSize="round"
            data-cy="confirmation-modal-continue"
            onClick={() => setAssignCardModalDisplay(true)}
          >
            +
          </StyledButton>
          <Box mt="10px">
            <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
          </Box>
        </AddCardPlaceholder>
        {data.host.hostedVirtualCards.nodes.map(vc => (
          <VirtualCard
            key={vc.id}
            {...vc}
            onSuccess={refetch}
            editHandler={() => setEditingVirtualCard(vc)}
            canEditVirtualCard
          />
        ))}
      </Grid>
      <Flex mt={5} alignItems="center" flexDirection="column" justifyContent="center">
        <Pagination
          route={`/${props.collective.slug}/admin/host-virtual-cards`}
          total={data.host.hostedVirtualCards.totalCount}
          limit={VIRTUAL_CARDS_PER_PAGE}
          offset={offset}
          ignoredQueryParams={['slug', 'section']}
        />
        <P mt={1} fontSize="12px">
          <FormattedMessage id="TotalItems" defaultMessage="Total Items" />: {data.host.hostedVirtualCards.totalCount}
        </P>
      </Flex>
      {displayAssignCardModal && (
        <AssignVirtualCardModal
          host={data.host}
          onSuccess={handleAssignCardSuccess}
          onClose={() => {
            setAssignCardModalDisplay(false);
          }}
          show
        />
      )}
      {editingVirtualCard && (
        <EditVirtualCardModal
          host={data.host}
          onSuccess={handleEditCardSuccess}
          onClose={() => {
            setEditingVirtualCard(undefined);
          }}
          virtualCard={editingVirtualCard}
          show
        />
      )}
      {displayCreateVirtualCardModal && (
        <CreateVirtualCardModal
          host={data.host}
          onSuccess={handleCreateVirtualCardSuccess}
          onClose={() => {
            setCreateVirtualCardModalDisplay(false);
          }}
          show
        />
      )}
    </Fragment>
  );
};

HostVirtualCards.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string,
    settings: PropTypes.shape({
      virtualcards: PropTypes.shape({
        autopause: PropTypes.bool,
        requestcard: PropTypes.bool,
        policy: PropTypes.string,
      }),
    }),
  }),
  contentOnly: PropTypes.bool,
  hideTopsection: PropTypes.func,
};

export default HostVirtualCards;
