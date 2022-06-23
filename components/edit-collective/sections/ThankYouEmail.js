import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import RichTextEditor from '../../RichTextEditor';
import StyledButton from '../../StyledButton';
import StyledCheckbox from '../../StyledCheckbox';
import StyledHr from '../../StyledHr';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

const AdditionalSettingsCheckBox = ({ onChange, checked }) => {
  return (
    <StyledCheckbox
      onChange={({ checked, name }) => onChange({ target: { name, value: checked } })}
      checked={checked}
      name="additionalSettings"
      label={
        <FormattedMessage defaultMessage="Inherit the above collective level custom message to all tiers, event and projects if no custom message is set at the respective levels." />
      }
    />
  );
};

AdditionalSettingsCheckBox.propTypes = {
  onChange: PropTypes.func,
  checked: PropTypes.bool,
};

const updateCustomMessageMutation = gqlV2/* GraphQL */ `
  mutation UpdateCustomMessage($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      type
      isActive
      settings
    }
  }
`;

const ThankYouEmail = ({ collective }) => {
  const thankYouMessage =
    collective?.settings?.thankYouEmailMessage || collective?.parentCollective?.settings?.thankYouEmailMessage;
  const [customMessage, setCustomMessage] = useState(thankYouMessage);
  const { addToast } = useToasts();

  const [updateCustomEmailMessage, { loading }] = useMutation(updateCustomMessageMutation, {
    context: API_V2_CONTEXT,
    onError: e => {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: (
          <FormattedMessage
            defaultMessage="Error updating custom email message: {error}"
            values={{
              error: e.message,
            }}
          />
        ),
      });
    },
    onCompleted: () => {
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage defaultMessage="Email message updated" />,
      });
    },
  });

  const handleSubmit = async message => {
    await updateCustomEmailMessage({
      variables: {
        account: { legacyId: collective.id },
        key: 'thankYouEmailMessage',
        value: message,
      },
    });
  };

  return (
    <Container>
      <P fontSize="14px" fontWeight={400} lineHeight="20ppx">
        <FormattedMessage defaultMessage="Add a custom message to be sent to your users whenever they receive a mail after a contribution to your Collective, a project, or tickets for events." />
      </P>
      <StyledHr mt="32px" mb="34px" borderStyle="dotted" />
      <Container maxWidth="1000px">
        <Box mb={2} fontSize="18px" fontWeight={700} lineHeight="26px">
          <FormattedMessage defaultMessage="Custom Message" />
        </Box>
        <RichTextEditor
          inputName="message"
          onChange={e => setCustomMessage(e.target.value)}
          defaultValue={customMessage}
          withBorders
          editorMinHeight="150px"
          maxLength={500}
          showCount
        />
      </Container>
      {[CollectiveType.EVENT, CollectiveType.PROJECT].includes(collective.type) ? (
        <MessageBox type="info" mt="24px">
          <P fontSize="13px" fontWeight={400} lineHeight="20px">
            <FormattedMessage defaultMessage="The above text will override the customized email response set by the parent collective of this event or project." />
          </P>
        </MessageBox>
      ) : (
        <MessageBox type="info" mt="24px">
          <P fontSize="13px" fontWeight={400} lineHeight="20px">
            <FormattedMessage defaultMessage="The above text will be considered as a global customized email response for all of your events and projects. You also have the possibility to customize each if you like from the settings in events or projects." />
          </P>
        </MessageBox>
      )}
      <Flex justifyContent={['center', 'left']}>
        <StyledButton
          disable={loading}
          mt="35px"
          buttonStyle="primary"
          width="157px"
          onClick={() => handleSubmit(customMessage)}
        >
          <FormattedMessage id="save" defaultMessage="Save" />
        </StyledButton>
      </Flex>
    </Container>
  );
};

ThankYouEmail.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    settings: PropTypes.shape({
      thankYouEmailMessage: PropTypes.string,
    }),
    parentCollective: PropTypes.shape({
      settings: PropTypes.shape({
        thankYouEmailMessage: PropTypes.string,
      }),
    }),
  }),
  isInheritSettings: PropTypes.bool,
};

export default ThankYouEmail;
