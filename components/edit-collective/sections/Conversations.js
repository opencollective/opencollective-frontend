import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { cloneDeep, pick, set } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import hasFeature, { FEATURE_FLAGS, FEATURES } from '../../../lib/allowed-features';
import { getErrorFromGraphqlException } from '../../../lib/errors';

import Container from '../../Container';
import CreateConversationFAQ from '../../faqs/CreateConversationFAQ';
import { Flex } from '../../Grid';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledCheckbox from '../../StyledCheckbox';
import { P } from '../../Text';
import { editCollectiveSettingsMutation } from '../mutations';
import SettingsTitle from '../SettingsTitle';

import imgPreviewReplies from '../../../public/static/images/conversations/conversation-replies-preview.png';
import imgPreviewThread from '../../../public/static/images/conversations/conversations-list-preview.png';

const messages = defineMessages({
  title: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
  mainDescription: {
    id: 'EditCollective.Conversations.description',
    defaultMessage:
      'Conversations is a message board for your page, where anyone can post and anyone can reply, like a discussion forum. Once enabled, a new "Conversations" section will appear, and a dedicated page will be created at {conversationsLink}.',
  },
  checkboxLabel: {
    id: 'EditCollective.Conversations.checkbox',
    defaultMessage: 'Enable Conversations',
  },
});

const ScreenshotPreview = styled.div`
  display: block;
  margin: 8px;
  padding: 8px;
  height: 240px;
  border: 1px solid #ececec;
  border-radius: 16px;
  min-width: 42%;

  img {
    max-height: 100%;
  }
`;

/**
 * A presentation of the conversations feature, with a checkbox to (de-)activate it.
 */
const Conversations = ({ collective }) => {
  const defaultIsChecked = hasFeature(collective, FEATURES.CONVERSATIONS);
  const { formatMessage } = useIntl();
  const [setSettings, { loading, error }] = useMutation(editCollectiveSettingsMutation);

  return (
    <Container>
      <SettingsTitle>{formatMessage(messages.title)}</SettingsTitle>
      <Flex mb={2} flexWrap="wrap" justifyContent="center">
        <Container mr={3} pr={3} flex="1 1" minWidth={300} maxWidth={700} borderRight={[null, '1px solid #dcdee0']}>
          <P wordBreak="break-word">
            {formatMessage(messages.mainDescription, {
              conversationsLink: (
                <Link key="conversationsLink" route="conversations" params={{ collectiveSlug: collective.slug }}>
                  {process.env.WEBSITE_URL}/{collective.slug}/conversations
                </Link>
              ),
            })}
          </P>
        </Container>
        <Flex flexDirection="column" alignItems="center" justifyContent="center" minWidth={300}>
          <StyledCheckbox
            name="enable-conversations"
            label={formatMessage(messages.checkboxLabel)}
            defaultChecked={defaultIsChecked}
            width="auto"
            isLoading={loading}
            onChange={({ target }) => {
              const updatedCollective = cloneDeep(collective);
              set(updatedCollective, FEATURE_FLAGS.CONVERSATIONS, target.value);
              return setSettings({ variables: pick(updatedCollective, ['id', 'settings']) });
            }}
          />
        </Flex>
      </Flex>
      {error && (
        <MessageBox type="error" fontSize="14px" withIcon mb={3}>
          {getErrorFromGraphqlException(error).message}
        </MessageBox>
      )}
      <Flex flexWrap="wrap" justifyContent="space-between" width="100%">
        <ScreenshotPreview>
          <img src={imgPreviewThread} alt="Preview Conversations list" />
        </ScreenshotPreview>
        <ScreenshotPreview>
          <img src={imgPreviewReplies} alt="Preview Conversation replies" />
        </ScreenshotPreview>
        <hr />
      </Flex>
      <hr />
      <CreateConversationFAQ defaultOpen />
    </Container>
  );
};

Conversations.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    settings: PropTypes.object,
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default Conversations;
