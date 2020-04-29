import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

import InlineEditField from '../InlineEditField';
import VideoPlayer from '../VideoPlayer';

// Dynamicly load heavy inputs only if user can edit the page
const VideoLinkerBox = dynamic(() => import(/* webpackChunkName: 'VideoLinkerBox' */ '../VideoLinkerBox'));

/**
 * Displays the video on the page, with an optional form to edit it
 * if user is allowed to do so.
 */
const TierVideo = ({ tier, editMutation, canEdit }) => {
  return (
    <InlineEditField
      field="videoUrl"
      values={tier}
      mutation={editMutation}
      canEdit={canEdit}
      showEditIcon={Boolean(tier.videoUrl)}
    >
      {({ isEditing, value, setValue, enableEditor, disableEditor }) => {
        if (isEditing || (!value && canEdit)) {
          return (
            <VideoLinkerBox
              url={value}
              onChange={setValue}
              isEditing={isEditing}
              setEditing={isEditing ? disableEditor : enableEditor}
            />
          );
        } else {
          return value ? <VideoPlayer url={value} /> : null;
        }
      }}
    </InlineEditField>
  );
};

TierVideo.propTypes = {
  tier: PropTypes.shape({
    id: PropTypes.number.isRequired,
    videoUrl: PropTypes.string,
  }).isRequired,
  editMutation: PropTypes.object,
  canEdit: PropTypes.bool,
};

export default TierVideo;
