import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

// A map of provider name => regex
const ProvidersRegexs = {
  YouTube: /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i,
  Vimeo: /:\/\/(www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|)(\d+)(?:|\/\?)/i,
};

/** A list of supported video provider names */
export const supportedVideoProviders = Object.keys(ProvidersRegexs);

/** Get provider name, or returns null if URL is null or not supported */
export const getProvider = url => {
  if (!url) {
    return null;
  }

  return supportedVideoProviders.find(providerName => {
    return ProvidersRegexs[providerName].test(url);
  });
};

/** An iframe that grows with its content */
const ResponsiveIframe = styled(({ src, ...props }) => (
  <div {...props}>
    <iframe title="Responsive Frame" src={src} allowFullScreen frameBorder="0" allow="fullscreen" />
  </div>
))`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; // 16:9 aspect ratio equivalent (9/16 === 0.5625)
  background: black;

  iframe {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
  }
`;

/**
 * A video player that supports YouTube and Vimeo.
 * Implemented as a pure component to avoid re-checking the URL and re-rendering
 * the iframe on each update.
 */
const VideoPlayer = React.memo(({ url, placeholder }) => {
  const provider = getProvider(url);

  if (provider === 'YouTube') {
    const youtubeId = ProvidersRegexs.YouTube.exec(url)[1];
    if (youtubeId) {
      // youtube-nocookie is a special enpoint that don't send any cookie to the
      // users until they actually start playing the video. It's better for privacy
      // and lighter for users. The service is officially supported by Google.
      // See https://support.google.com/youtube/answer/171780?hl=en > "Turn on privacy-enhanced mode"
      return <ResponsiveIframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} />;
    }
  } else if (provider === 'Vimeo') {
    const vimeoId = ProvidersRegexs.Vimeo.exec(url)[3];
    if (vimeoId) {
      return <ResponsiveIframe src={`https://player.vimeo.com/video/${vimeoId}?color=145ECC/`} />;
    }
  }

  return placeholder;
});

VideoPlayer.displayName = 'VideoPlayer';

VideoPlayer.propTypes = {
  /** URL of the video */
  url: PropTypes.string,
  /** Rendered when the video is not supported. */
  placeholder: PropTypes.node,
};

VideoPlayer.defaultProps = {
  placeholder: null,
};

export default VideoPlayer;
