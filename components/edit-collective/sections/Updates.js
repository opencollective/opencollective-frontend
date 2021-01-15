import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { cloneDeep, pick, set } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import hasFeature, { FEATURE_FLAGS, FEATURES } from '../../../lib/allowed-features';
import { getErrorFromGraphqlException } from '../../../lib/errors';

import Container from '../../Container';
import CreateUpdateFAQ from '../../faqs/CreateUpdateFAQ';
import { Flex } from '../../Grid';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledCheckbox from '../../StyledCheckbox';
import { P } from '../../Text';
import { editCollectiveSettingsMutation } from '../mutations';
import SettingsTitle from '../SettingsTitle';

import imgPreviewList from '../../../public/static/images/updates/updates-list-preview.png';
import imgPreviewNewUpdate from '../../../public/static/images/updates/updates-new-preview.png';

const messages = defineMessages({
  title: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  mainDescription: {
    id: 'EditCollective.Updates.description',
    defaultMessage:
      'Updates are a way to keep your community posted on your progress. They are sent by email to all you contributors and followers. Once enabled, a new "Updates" section will be added to your profile page and a dedicated page will be created on {updatesLink}.',
  },
  mainDescriptionHost: {
    id: 'EditCollective.Updates.descriptionHost',
    defaultMessage:
      'Updates are a way to keep your community posted on your progress. They are sent by email to admins of your Collectives and to your team members and contributors. Once enabled, a new "Updates" section will be added to your profile page and a dedicated page will be created on {updatesLink}.',
  },
  checkboxLabel: {
    id: 'EditCollective.Updates.checkbox',
    defaultMessage: 'Enable updates',
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
 * A presentation of the updates feature, with a checkbox to (de-)activate it.
 */
const Updates = ({ collective }) => {
  const defaultIsChecked = hasFeature(collective, FEATURES.UPDATES);
  const { formatMessage } = useIntl();
  const [setSettings, { loading, error }] = useMutation(editCollectiveSettingsMutation);

  return (
    <Container>
      <SettingsTitle>{formatMessage(messages.title)}</SettingsTitle>
      <Flex mb={2} flexWrap="wrap" justifyContent="center">
        <Container mr={3} pr={3} flex="1 1" minWidth={300} maxWidth={700} borderRight={[null, '1px solid #dcdee0']}>
          <P wordBreak="break-word">
            {formatMessage(!collective.isHost ? messages.mainDescription : messages.mainDescriptionHost, {
              updatesLink: (
                <Link key="updatesLink" route="updates" params={{ collectiveSlug: collective.slug }}>
                  {process.env.WEBSITE_URL}/{collective.slug}/updates
                </Link>
              ),
            })}
          </P>
        </Container>
        <Flex flexDirection="column" alignItems="center" justifyContent="center" minWidth={300}>
          <StyledCheckbox
            name="enable-updates"
            label={formatMessage(messages.checkboxLabel)}
            defaultChecked={defaultIsChecked}
            width="auto"
            isLoading={loading}
            onChange={({ target }) => {
              const updatedCollective = cloneDeep(collective);
              set(updatedCollective, FEATURE_FLAGS.UPDATES, target.value);
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
          <img src={imgPreviewNewUpdate} alt="Preview new update" />
        </ScreenshotPreview>
        <ScreenshotPreview>
          <img src={imgPreviewList} alt="Preview updates list" />
        </ScreenshotPreview>
        <hr />
      </Flex>
      <hr />
      <CreateUpdateFAQ defaultOpen />
    </Container>
  );
};

Updates.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    settings: PropTypes.object,
    slug: PropTypes.string.isRequired,
    isHost: PropTypes.boolean,
  }).isRequired,
};

export default Updates;
