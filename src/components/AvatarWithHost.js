import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { CollectiveType } from '../constants/collectives';
import withFallbackImage from '../lib/withFallbackImage';
import Avatar from './Avatar';
import LinkCollective from './LinkCollective';

const MainContainer = styled.div`
  display: inline-block;
  position: relative;
`;

const HostLink = styled(LinkCollective)`
  position: absolute;
  right: 0;
  bottom: 0;
  & > div {
    margin-left: 25%;
    margin-bottom: -25%;
  }
`;

/**
 * Same as `Avatar`, except this one also displays the host avatar on
 * the bottom right corner.
 */
const AvatarWithHost = ({ collective, host, radius, animationDuration, onCollectiveClick }) => {
  const hostAvatarRadius = radius <= 60 ? radius / 2 : radius / 4;
  return (
    <MainContainer>
      <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
        <Avatar
          type={collective.type}
          src={collective.image}
          backgroundColor="#EBEBEB"
          border="1px solid #efefef"
          radius={radius}
          borderRadius={radius / 4}
          animationDuration={animationDuration}
        />
      </LinkCollective>
      {host && (
        <HostLink collective={host} isNewVersion>
          <Avatar
            type={host.type}
            src={host.image}
            border="1px solid #efefef"
            radius={hostAvatarRadius}
            borderRadius={hostAvatarRadius / 4}
            title={host.name}
            animationDuration={animationDuration}
          />
        </HostLink>
      )}
    </MainContainer>
  );
};

AvatarWithHost.propTypes = {
  /** The main collective to display the image for */
  collective: PropTypes.shape({
    type: PropTypes.oneOf(Object.keys(CollectiveType)),
    image: PropTypes.string,
  }).isRequired,

  /** The host collective (if any) */
  host: PropTypes.shape({
    type: PropTypes.oneOf(Object.keys(CollectiveType)),
    image: PropTypes.string,
  }),

  /** Size of the main image in pixels. Should ideally be a multiple of 4. */
  radius: PropTypes.number,

  /** Duration to transition size. Disabled if 0, null or undefined */
  animationDuration: PropTypes.number,

  /** Called when main collective picture is clicked */
  onCollectiveClick: PropTypes.func,
};

export default withFallbackImage(AvatarWithHost);
