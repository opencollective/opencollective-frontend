import React from 'react';
import PropTypes from 'prop-types';
import { VideoPlus } from '@styled-icons/boxicons-regular/VideoPlus';
import { ArrowDownCircle } from '@styled-icons/feather/ArrowDownCircle';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { Box } from './Grid';
import StyledInput from './StyledInput';
import { P } from './Text';
import VideoPlayer, { supportedVideoProviders } from './VideoPlayer';

const VideoPlaceholder = styled(({ children, ...props }) => (
  <div {...props}>
    <div>{children}</div>
  </div>
))`
  /** Main-container, sized with padding-bottom to be 16:9 */
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; // 16:9 aspect ratio equivalent (9/16 === 0.5625)
  background: #f7f8fa;
  color: #dcdee0;

  /** Flex container to center the content */
  & > div {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 16px;
  }

  ${props =>
    props.onClick &&
    css`
      cursor: pointer;
      &:hover {
        color: ${themeGet('colors.black.400')};
        & > div {
          transform: scale(1.05);
          transition: transform 0.2s;
        }
      }
    `}
`;

/** A container for the form used to animate the different inputs */
const MainFormContainer = styled.div`
  position: relative;
  input {
    box-shadow: 0px 2px 7px -6px #696969;
  }
`;

/**
 * A video placeholder that user can click on to upload a new video.
 * This component doesn't provide save and cancel buttons, nor
 * does it manages internal state.
 *
 * A good way to use it is to wrap it with `InlineEditField`. You can
 * check `components/tier-page/TierVideo.js` for an example.
 */
const VideoLinkerBox = ({ url, onChange, isEditing, setEditing }) => {
  return !isEditing ? (
    <VideoPlaceholder onClick={() => setEditing(true)}>
      <VideoPlus size="50%" />
      <P fontWeight="bold" fontSize="16px">
        <FormattedMessage id="VideoLinkerBox.AddVideo" defaultMessage="Add a video" />
      </P>
    </VideoPlaceholder>
  ) : (
    <MainFormContainer>
      <Box width={1} maxHeight={400} mb={2}>
        <VideoPlayer
          url={url}
          placeholder={
            <VideoPlaceholder>
              <ArrowDownCircle size="50%" />
              <P fontWeight="bold" fontSize="16px" textAlign="center" color="black.400" mt={2}>
                <FormattedMessage
                  id="VideoLinkerBox.SetUrl"
                  defaultMessage="Set the video URL below. We support the following platforms: {supportedVideoProviders}"
                  values={{ supportedVideoProviders: supportedVideoProviders.join(', ') }}
                />
              </P>
            </VideoPlaceholder>
          }
        />
      </Box>
      <StyledInput
        type="url"
        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        value={url || ''}
        onChange={e => onChange(e.target.value || null)}
        width={1}
        autoFocus
      />
    </MainFormContainer>
  );
};

VideoLinkerBox.propTypes = {
  url: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  setEditing: PropTypes.func.isRequired,
};

export default VideoLinkerBox;
