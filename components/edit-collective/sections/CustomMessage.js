import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import PreviewModal from '../../PreviewModal';
import RichTextEditor from '../../RichTextEditor';
import StyledHr from '../../StyledHr';
import { P } from '../../Text';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/useToast';

const updateCustomMessageMutation = gql`
  mutation UpdateCustomMessage($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      type
      isActive
      settings
    }
  }
`;

const CustomMessage = ({ collective }) => {
  const thankYouMessage =
    collective.settings?.customEmailMessage || collective.parentCollective?.settings?.customEmailMessage;
  const [customMessage, setCustomMessage] = useState(thankYouMessage);
  const [isModified, setIsModified] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const [updateCustomEmailMessage, { loading }] = useMutation(updateCustomMessageMutation, {
    context: API_V2_CONTEXT,
    onError: e => {
      toast({
        variant: 'error',
        message: (
          <FormattedMessage
            defaultMessage="Error updating custom email message: {error}"
            id="DVdz90"
            values={{
              error: e.message,
            }}
          />
        ),
      });
    },
    onCompleted: () => {
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Email message updated" id="PoJg0R" />,
      });
    },
  });

  const handleSubmit = async message => {
    await updateCustomEmailMessage({
      variables: {
        account: { legacyId: collective.id },
        key: 'customEmailMessage',
        value: message || '',
      },
    });
    setIsModified(false);
  };

  const onChange = async value => {
    setCustomMessage(value);
    setIsModified(true);
  };

  return (
    <Container>
      <P fontSize="14px" fontWeight={400} lineHeight="20ppx">
        <FormattedMessage
          defaultMessage="Add a custom message to be included in the email sent to financial contributors of your Collective, Project, or Event."
          id="jRacqf"
        />
      </P>
      <StyledHr mt="32px" mb="34px" borderStyle="dotted" />
      <Container maxWidth="1000px">
        <Flex justifyContent="space-between" flexDirection={['column', 'row']}>
          <Box mb={2} fontSize="18px" fontWeight={700} lineHeight="26px">
            <FormattedMessage defaultMessage="Custom Message" id="+jDZdn" />
          </Box>
          <Button variant="outline" size="xs" className="h-6 max-w-20" onClick={() => setShowPreview(true)}>
            <FormattedMessage defaultMessage="Preview" id="TJo5E6" />
          </Button>
        </Flex>
        <RichTextEditor
          kind="ACCOUNT_CUSTOM_EMAIL"
          inputName="message"
          onChange={e => onChange(e.target.value)}
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
            <FormattedMessage
              defaultMessage="The above text will override the customized message set by the parent Collective of this Event or Project."
              id="l/qt37"
            />
          </P>
        </MessageBox>
      ) : (
        <MessageBox type="info" mt="24px">
          <P fontSize="13px" fontWeight={400} lineHeight="20px">
            <FormattedMessage
              defaultMessage="The above text will be considered as the default customized email response for all contributions to your Collective, and all of your Events and Projects. You also have the ability to customize the messages for Events & Projects from within their individual Setting's Menus."
              id="4L4QX2"
            />
          </P>
        </MessageBox>
      )}
      <div className="mt-4 flex">
        <Button
          className="w-full"
          disabled={loading || !isModified}
          width="157px"
          onClick={() => handleSubmit(customMessage)}
        >
          <FormattedMessage id="save" defaultMessage="Save" />
        </Button>
      </div>
      {showPreview && (
        <PreviewModal
          heading={<FormattedMessage defaultMessage="Preview Notification" id="XvKF/A" />}
          subheading={
            <FormattedMessage
              defaultMessage="This is the preview of the email template which your financial contributor will receive."
              id="cka+9I"
            />
          }
          onClose={() => setShowPreview(false)}
          previewImage="/static/images/custom-email-preview.png"
          imgHeight="715px"
          imgWidth="809px"
        />
      )}
    </Container>
  );
};

export default CustomMessage;
