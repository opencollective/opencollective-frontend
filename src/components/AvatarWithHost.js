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
const AvatarWithHost = ({ collective, host, radius }) => {
  return (
    <MainContainer>
      <LinkCollective collective={collective}>
        <Avatar
          type={collective.type}
          src={collective.image}
          backgroundColor="#EBEBEB"
          border="1px solid #efefef"
          radius={radius}
          borderRadius={radius / 4}
        />
      </LinkCollective>
      {host && (
        <HostLink collective={host}>
          <Avatar
            type={host.type}
            src={host.image}
            border="1px solid #efefef"
            radius={radius / 4}
            borderRadius={radius / 16}
            title={host.name}
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
};

export default withFallbackImage(AvatarWithHost);
