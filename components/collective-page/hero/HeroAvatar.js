import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { Camera } from '@styled-icons/feather/Camera';
import dynamic from 'next/dynamic';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { upload } from '../../../lib/api';
import { getAvatarBorderRadius } from '../../../lib/image-utils';

import Avatar from '../../Avatar';
import ConfirmationModal from '../../ConfirmationModal';
import Container from '../../Container';
import { Box } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledButton from '../../StyledButton';
import { P, Span } from '../../Text';
import { editCollectiveAvatarMutation } from '../graphql/mutations';

const AVATAR_SIZE = 128;

// Dynamically import components for admins
const DropzoneLoadingPlaceholder = () => (
  <LoadingPlaceholder height={AVATAR_SIZE} width={AVATAR_SIZE} color="primary.500" borderRadius="25%" />
);
const dynamicParams = { loading: DropzoneLoadingPlaceholder, ssr: false };
const Dropzone = dynamic(() => import(/* webpackChunkName: 'react-dropzone' */ 'react-dropzone'), dynamicParams);

const EditOverlay = styled.div`
  position: absolute;
  width: 128px;
  height: 128px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  text-align: center;
  padding: 1em;
  border-radius: ${props => props.borderRadius};
`;

const EditableAvatarContainer = styled.div`
  position: relative;
  width: 128px;

  ${props =>
    !props.isDragActive &&
    css`
      &:not(:hover) ${EditOverlay} {
        visibility: hidden;
      }
    `}
`;

const EditingAvatarContainer = styled.div`
  width: 128px;
  height: 128px;
  border: 2px dashed lightgrey;
  border-radius: ${props => props.borderRadius};
  clip-path: inset(0 0 0 0 round ${props => props.borderRadius});
  img {
    width: 100%;
    height: 100%;
  }
`;

const Triangle = styled.div`
  position: absolute;
  font-size: 42px;
  top: -45px;
  left: 42px;
  color: white;
  text-shadow: -2px -3px 4px rgba(121, 121, 121, 0.5);
`;

const Translations = defineMessages({
  settings: {
    id: 'Settings',
    defaultMessage: 'Settings',
  },
  uploadImage: {
    id: 'uploadImage.sizeRejected',
    defaultMessage: 'Image resolution needs to be less than 3000x3000, and file size must be below 5MB.',
  },
});

const HeroAvatar = ({ collective, isAdmin, intl, handleHeroMessage }) => {
  const [editing, setEditing] = React.useState(false);
  const [showModal, setshowModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadedImage, setUploadedImage] = React.useState(null);
  const borderRadius = getAvatarBorderRadius(collective.type);
  const [editImage] = useMutation(editCollectiveAvatarMutation);

  const onDropImage = async ([image]) => {
    if (image) {
      Object.assign(image, { preview: URL.createObjectURL(image) });
      const isValid = await validateImage(image);
      if (isValid) {
        setUploadedImage(image);
        setEditing(true);
      }
    }
  };

  const validateImage = image => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        if (img.width >= 3000 || img.height >= 3000 || image.size >= 5000000) {
          handleHeroMessage({ content: intl.formatMessage(Translations.uploadImage), type: 'warning' });
          resolve(false);
        } else {
          handleHeroMessage(null);
          resolve(true);
        }
      };
      img.src = image.preview;
    });
  };

  if (!isAdmin) {
    return <Avatar collective={collective} radius={AVATAR_SIZE} />;
  } else if (!editing) {
    return (
      <Fragment>
        <Dropzone
          style={{}}
          multiple={false}
          accept="image/jpeg, image/png"
          disabled={submitting}
          inputProps={{ style: { width: 1 } }}
          onDrop={onDropImage}
        >
          {({ isDragActive, isDragAccept, getRootProps, getInputProps }) => (
            <div {...getRootProps()}>
              <input data-cy="heroAvatarDropzone" {...getInputProps()} />
              <EditableAvatarContainer isDragActive={isDragActive}>
                <EditOverlay borderRadius={borderRadius}>
                  {!isDragActive && (
                    <Box>
                      <StyledButton buttonSize="tiny" minWidth={120}>
                        <Camera size={12} />
                        <Span ml={2} css={{ verticalAlign: 'center' }}>
                          <FormattedMessage id="HeroAvatar.Edit" defaultMessage="Edit logo" />
                        </Span>
                      </StyledButton>
                      <StyledButton
                        buttonSize="tiny"
                        minWidth={120}
                        mt={2}
                        onClick={event => {
                          event.stopPropagation();
                          setshowModal(true);
                        }}
                      >
                        <Span ml={2} css={{ verticalAlign: 'center' }}>
                          <FormattedMessage id="HeroAvatar.Remove" defaultMessage="Remove logo" />
                        </Span>
                      </StyledButton>
                    </Box>
                  )}
                  {isDragActive &&
                    (isDragAccept ? (
                      <FormattedMessage id="uploadImage.isDragActive" defaultMessage="Drop it like it's hot 🔥" />
                    ) : (
                      <FormattedMessage
                        id="uploadImage.isDragReject"
                        defaultMessage="🚫 This file type is not accepted"
                      />
                    ))}
                </EditOverlay>
                <Avatar collective={collective} radius={AVATAR_SIZE} />
              </EditableAvatarContainer>
            </div>
          )}
        </Dropzone>
        {showModal && (
          <ConfirmationModal
            show={showModal}
            width="100%"
            maxWidth="570px"
            onClose={() => {
              setshowModal(false);
            }}
            header={<FormattedMessage id="heroavtar.remove" defaultMessage="Remove Logo?" />}
            continueHandler={async () => {
              setSubmitting(true); // Need this because `upload` is not a graphql function

              try {
                await editImage({ variables: { id: collective.id, image: null } });
                setshowModal(false);
              } finally {
                setSubmitting(false);
                handleHeroMessage(null);
              }
            }}
          >
            <P fontSize="14px" lineHeight="18px" mt={2}>
              <FormattedMessage
                id="HeroAvatar.Confirm.Remove"
                defaultMessage="Do really want to remove your profile picture?"
              />
            </P>
          </ConfirmationModal>
        )}
      </Fragment>
    );
  } else {
    return uploadedImage || collective.imageUrl ? (
      <Mutation mutation={editCollectiveAvatarMutation}>
        {editAvatar => (
          <Fragment>
            <EditingAvatarContainer borderRadius={borderRadius}>
              <img
                data-cy="collective-avatar-image-preview"
                src={uploadedImage ? uploadedImage.preview : collective.imageUrl}
                alt=""
              />
            </EditingAvatarContainer>
            <Container
              position="absolute"
              display="flex"
              mt={2}
              p={2}
              zIndex={2}
              background="white"
              boxShadow="0px 3px 5px -2px #777777"
            >
              <Triangle>▲</Triangle>
              <StyledButton
                textTransform="capitalize"
                minWidth={150}
                disabled={submitting}
                onClick={() => {
                  setUploadedImage(null);
                  setEditing(false);
                }}
              >
                <FormattedMessage id="form.cancel" defaultMessage="cancel" />
              </StyledButton>
              <StyledButton
                data-cy="heroAvatarDropzoneSave"
                textTransform="capitalize"
                buttonStyle="primary"
                ml={3}
                minWidth={150}
                loading={submitting}
                onClick={async () => {
                  setSubmitting(true); // Need this because `upload` is not a graphql function

                  try {
                    // Upload image if changed or remove it
                    let imgURL = collective.image;
                    if (uploadedImage) {
                      imgURL = await upload(uploadedImage);
                    }

                    // Update settings
                    await editAvatar({ variables: { id: collective.id, image: imgURL } });

                    // Reset
                    setUploadedImage(null);
                    setEditing(false);
                  } finally {
                    setSubmitting(false);
                    handleHeroMessage(null);
                  }
                }}
              >
                <FormattedMessage id="save" defaultMessage="Save" />
              </StyledButton>
            </Container>
          </Fragment>
        )}
      </Mutation>
    ) : (
      <Avatar collective={collective} radius={AVATAR_SIZE} />
    );
  }
};

HeroAvatar.propTypes = {
  collective: PropTypes.shape({
    type: PropTypes.string,
    image: PropTypes.string,
    imageUrl: PropTypes.string,
  }).isRequired,
  isAdmin: PropTypes.bool,
  intl: PropTypes.object,
};

export default injectIntl(HeroAvatar);
