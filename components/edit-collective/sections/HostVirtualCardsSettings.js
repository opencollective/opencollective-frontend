import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { Info } from '@styled-icons/feather/Info';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { Box, Flex } from '../../Grid';
import InputField from '../../InputField';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';
import { useToast } from '../../ui/useToast';
import { StripeVirtualCardComplianceStatement } from '../../virtual-cards/StripeVirtualCardComplianceStatement';

import SettingsSectionTitle from './SettingsSectionTitle';

const VIRTUAL_CARDS_POLICY_MAX_LENGTH = 3000; // 600 words * 5 characters average length word

const updateAccountSettingsMutation = gql`
  mutation UpdateAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      legacyId
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

const HostVirtualCards = props => {
  const { formatMessage } = useIntl();
  const { toast } = useToast();

  const [updateAccountSetting, { loading: updateLoading }] = useMutation(updateAccountSettingsMutation, {
    context: API_V2_CONTEXT,
    onError: e => {
      toast({
        variant: 'error',
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
    // update cache from v1 gql request
    update(cache, result) {
      if (!result.data?.editAccountSetting?.settings) {
        return;
      }

      cache.modify({
        id: `Organization:${result.data.editAccountSetting.legacyId}`,
        fields: {
          settings() {
            return result.data.editAccountSetting.settings;
          },
        },
      });
    },
  });
  const [virtualCardPolicy, setVirtualCardPolicy] = React.useState(
    props.collective.settings?.virtualcards?.policy || '',
  );

  const handleSettingsUpdate = key => async value => {
    await updateAccountSetting({
      variables: {
        account: { legacyId: props.collective.id },
        key,
        value,
      },
    });
    toast({
      variant: 'success',
      message: <FormattedMessage id="Host.VirtualCards.Settings.Success" defaultMessage="Setting updated" />,
    });
  };

  return (
    <Fragment>
      <Box my={3}>
        <StripeVirtualCardComplianceStatement />
      </Box>
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
        <Flex mt={4} justifyContent="space-between" alignItems="center">
          <Box lineHeight="20px" fontSize="14px" fontWeight="500">
            <FormattedMessage
              id="Host.VirtualCards.Reminder.Title"
              defaultMessage="Automatically notify collectives about pending receipts"
            />
            <P fontSize="11px" fontWeight="400" color="black.600">
              <FormattedMessage
                id="Host.VirtualCards.Reminder.Description"
                defaultMessage="Send missing receipt reminder after 15 and 29 days after syncing the transaction."
              />
            </P>
          </Box>
          <StyledInputField name="virtualcards.reminder" htmlFor="virtualcards.reminder" disabled={updateLoading}>
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
            <FormattedMessage id="Host.VirtualCards.AutoPause.Title" defaultMessage="Automatically suspend cards" />
            <P fontSize="11px" fontWeight="400" color="black.600">
              <FormattedMessage
                id="Host.VirtualCards.AutoPause.Description"
                defaultMessage="Automatically suspend cards with pending receipts after 31 days and resume after all receipts are submitted."
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
            <FormattedMessage id="Host.VirtualCards.AutoPauseUnusedCards.Title" defaultMessage="Pause unused cards" />
            <P fontSize="11px" fontWeight="400" color="black.600">
              <FormattedMessage
                id="Host.VirtualCards.AutoPauseUnusedCards.Description"
                defaultMessage="Unused cards will be paused after set days of inactivity. The assignee can always un-pause when required."
              />
            </P>
          </Box>

          <StyledInputField
            name="virtualcards.autopauseUnusedCards.enabled"
            htmlFor="virtualcards.autopauseUnusedCards.enabled"
            disabled={updateLoading}
          >
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
        {get(props.collective, `settings.virtualcards.autopauseUnusedCards.enabled`) && (
          <React.Fragment>
            <Box mt={3} lineHeight="20px" fontSize="14px" fontWeight="500">
              <FormattedMessage
                id="Host.VirtualCards.AutoPauseUnusedCardsPeriod.Title"
                defaultMessage="Inactivity Duration"
              />
            </Box>
            <Flex alignItems="baseline">
              <Span mr={3}>
                <FormattedMessage defaultMessage="Days" />
              </Span>
              <StyledInputField
                mt={3}
                name="virtualcards.autopauseUnusedCards.period"
                htmlFor="virtualcards.autopauseUnusedCards.period"
                disabled={updateLoading}
              >
                {inputProps => (
                  <StyledInput
                    id={inputProps.id}
                    name={inputProps.name}
                    type="number"
                    defaultValue={get(props.collective, `settings.${inputProps.name}`)}
                    onBlur={e => handleSettingsUpdate(inputProps.name)(Number(e.target.value))}
                  />
                )}
              </StyledInputField>
            </Flex>
          </React.Fragment>
        )}

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
              editorMinHeight="12.5rem"
              editorMaxHeight={500}
              id={inputProps.id}
              inputName={inputProps.name}
              onChange={e => setVirtualCardPolicy(e.target.value)}
              defaultValue={virtualCardPolicy}
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
