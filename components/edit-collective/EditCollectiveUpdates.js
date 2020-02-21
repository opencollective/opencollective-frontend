import { Flex } from '@rebass/grid';
import { set, cloneDeep, pick } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { useMutation } from 'react-apollo';
import { useIntl, defineMessages } from 'react-intl';
import styled from 'styled-components';

import imgPreviewList from '../../static/images/updates/updates-list-preview.png';
import imgPreviewNewUpdate from '../../static/images/updates/updates-new-preview.png';

import { getErrorFromGraphqlException } from '../../lib/utils';
import hasFeature, { FEATURES, FEATURE_FLAGS } from '../../lib/allowed-features';
import CreateUpdateFAQ from '../faqs/CreateUpdateFAQ';
import Container from '../Container';
import MessageBox from '../MessageBox';
import { H3, P } from '../Text';
import StyledCheckbox from '../StyledCheckbox';
import Link from '../Link';

import { updateSettingsMutation } from './mutations';

const messages = defineMessages({
  title: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  mainDescription: {
    id: 'EditCollective.Updates.description',
    defaultMessage:
      'Updates is a way to keep your community posted on your progress. Once enabled, a new "Updates" section will be added to your profile page and a dedicated page will be created on {updatesLink}.',
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

  img {
    max-height: 100%;
  }
`;

/**
 * A presentation of the updates feature, with a checkbox to (de-)activate it.
 */
const EditCollectiveUpdates = ({ collective }) => {
  const defaultIsChecked = hasFeature(collective, FEATURES.UPDATES);
  const { formatMessage } = useIntl();
  const [setSettings, { loading, error }] = useMutation(updateSettingsMutation);

  return (
    <Container>
      <H3>{formatMessage(messages.title)}</H3>
      <Flex mb={2} flexWrap="wrap" justifyContent="center">
        <Container mr={3} pr={3} flex="1 1" minWidth={300} maxWidth={700} borderRight={[null, '1px solid #dcdee0']}>
          <P wordBreak="break-word">
            {formatMessage(messages.mainDescription, {
              updatesLink: (
                <Link route="updates" params={{ collectiveSlug: collective.slug }}>
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
        <MessageBox type="error" fontSize="Paragraph" withIcon mb={3}>
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

EditCollectiveUpdates.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    settings: PropTypes.object,
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default EditCollectiveUpdates;
