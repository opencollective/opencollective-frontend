import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { get, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Box, Flex, Grid } from '../../Grid';
import InputField from '../../InputField';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledInputField from '../../StyledInputField';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import AssignVirtualCardModal from '../AssignVirtualCardModal';
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
  ) {
    host(slug: $slug) {
      id
      legacyId
      slug
      supportedPayoutMethods
      name
      imageUrl
      hostedVirtualCards(limit: $limit, offset: $offset, state: $state, merchantAccount: $merchantAccount) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          privateData
          createdAt
          account {
            id
            name
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
    defaultMessage:
      'Provide specific rules for your Collectives to follow while using the Virtual Cards regarding terms of use, transactions etc.',
  },
});

const AddCardPlaceholder = styled(Flex)`
  border-radius: 20px;
  ${props => `border: 1px dashed ${props.theme.colors.primary[500]};`}
`;

const VIRTUAL_CARDS_PER_PAGE = 5;

const HostVirtualCards = props => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { state, merchant } = routerQuery;
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
    },
  });

  function updateFilters(queryParams) {
    return router.push({
      pathname: `/${props.collective.slug}/edit/host-virtual-cards`,
      query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
    });
  }

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
  const [virtualCardPolicy, setVirtualCardPolicy] = React.useState(
    props.collective.settings?.virtualcards?.policy || '',
  );

  const handleAssignCardSuccess = () => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: (
        <FormattedMessage id="Host.VirtualCards.AssignCard.Success" defaultMessage="Card successfully assigned" />
      ),
    });
    setAssignCardModalDisplay(false);
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
      <SettingsTitle>
        <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
      </SettingsTitle>
      <Box>
        <SettingsSectionTitle>
          <FormattedMessage id="Host.VirtualCards.Settings.Title" defaultMessage="Settings and Policy" />
        </SettingsSectionTitle>
        <P>
          <FormattedMessage
            id="Host.VirtualCards.Settings.Description"
            defaultMessage="You can setup a specific and clear Card Policy for your collectives. This could include deadlines to submit documents, what type of expenses are approved, any limitations on amounts, what documentation is required, and who to contact with questions."
          />
        </P>

        <Flex mt={4} justifyContent="space-between" alignItems="center">
          <Box lineHeight="20px" fontSize="14px" fontWeight="500">
            <FormattedMessage
              id="Host.VirtualCards.AutoPause.Title"
              defaultMessage="Automatically pause and resume cards"
            />
            <P fontSize="11px" fontWeight="400" color="black.600">
              <FormattedMessage
                id="Host.VirtualCards.AutoPause.Description"
                defaultMessage="Automatically pause cards that have incomplete charge expenses and resume after all pending expenses are up-to-date."
              />
            </P>
          </Box>
          <StyledInputField name="virtualcards.autopause" htmlFor="virtualcards.autopause" disabled={updateLoading}>
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

        <Flex mt={4} justifyContent="space-between" alignItems="center">
          <Box lineHeight="20px" fontSize="14px" fontWeight="500">
            <FormattedMessage
              id="Host.VirtualCards.RequestCard.Title"
              defaultMessage="Allow collectives to request a card"
            />
            <P fontSize="11px" fontWeight="400" color="black.600">
              <FormattedMessage
                id="Host.VirtualCards.RequestCard.Description"
                defaultMessage="Collectives can request to recieve a card."
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
              <FormattedMessage id="Host.VirtualCards.Policy.Title" defaultMessage="Virtual Card Policy Information" />
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
          <FormattedMessage id="Host.VirtualCards.List.Title" defaultMessage="Assigned Cards" />
        </SettingsSectionTitle>
        <P>
          <FormattedMessage
            id="Host.VirtualCards.List.Description"
            defaultMessage="You can now manage and distribute Virtual Cards created on Privacy.com directly on Open Collective. You can assign multiple virtual cards to one collective. Virtual Cards enable quicker transactions, making disbursing money a lot easier!"
          />
        </P>
        <Flex mt={3} flexDirection={['row', 'column']}>
          <VirtualCardFilters
            filters={routerQuery}
            collective={props.collective}
            virtualCardMerchants={data.host.hostedVirtualCardMerchants.nodes}
            onChange={queryParams => updateFilters({ ...queryParams, offset: null })}
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
            onClick={() => setAssignCardModalDisplay(true)}
          >
            +
          </StyledButton>
          <Box mt="10px">
            <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
          </Box>
        </AddCardPlaceholder>
        {data.host.hostedVirtualCards.nodes.map(vc => (
          <VirtualCard key={vc.id} {...vc} onUpdate={refetch} hasActions />
        ))}
      </Grid>
      <Flex mt={5} justifyContent="center">
        <Pagination
          route={`/${props.collective.slug}/edit/host-virtual-cards`}
          total={data.host.hostedVirtualCards.totalCount}
          limit={VIRTUAL_CARDS_PER_PAGE}
          offset={offset}
          ignoredQueryParams={['slug', 'section']}
          scrollToTopOnChange
        />
      </Flex>
      {displayAssignCardModal && (
        <AssignVirtualCardModal
          host={data.host}
          onSuccess={handleAssignCardSuccess}
          onClose={() => setAssignCardModalDisplay(false)}
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
  hideTopsection: PropTypes.func,
};

export default HostVirtualCards;
