import React from 'react';
import { PropTypes } from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import { Upload } from '@styled-icons/feather/Upload';
import { get, set } from 'lodash';
import Dropzone from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { FormattedMessage } from 'react-intl';

import { upload } from '../../../lib/api';

import Container from '../../Container';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import { Span } from '../../Text';
import { editCollectiveBackgroundMutation } from '../graphql/mutations';

import {
  BASE_HERO_HEIGHT,
  BASE_HERO_WIDTH,
  DEFAULT_BACKGROUND_CROP,
  getAlignedRight,
  getCrop,
  getZoom,
  StyledHeroBackground,
} from './HeroBackground';

const KEY_IMG_REMOVE = '__REMOVE__';

/**
 * Wraps the logic to display the hero background. Fallsback on a white background if
 * css `mask` is not supported.
 */
const HeroBackgroundEdit = ({ collective, onEditCancel }) => {
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [editBackground] = useMutation(editCollectiveBackgroundMutation);
  const [mediaSize, setMediaSize] = React.useState();
  const [crop, onCropChange] = React.useState(getCrop(collective));
  const [zoom, onZoomChange] = React.useState(getZoom(collective));
  const [isAlignedRight, setAlignedRight] = React.useState(getAlignedRight(collective));
  const [uploadedImage, setUploadedImage] = React.useState();

  return (
    <StyledHeroBackground
      data-cy="collective-background-image-styledBackground"
      backgroundImage={collective.backgroundImageUrl}
      isAlignedRight={isAlignedRight}
      isEditing
    >
      <Cropper
        image={uploadedImage ? uploadedImage.preview : collective.backgroundImageUrl}
        cropSize={{ width: BASE_HERO_WIDTH, height: BASE_HERO_HEIGHT }}
        crop={crop}
        zoom={zoom}
        minZoom={0.25}
        maxZoom={5}
        zoomSpeed={0.5}
        restrictPosition={false}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onMediaLoaded={mediaSize => setMediaSize({ width: mediaSize.naturalWidth, height: mediaSize.naturalHeight })}
        style={{
          imageStyle: { minHeight: '0', minWidth: '0', maxHeight: 'none', maxWidth: 'none' },
          containerStyle: { height: BASE_HERO_HEIGHT },
        }}
      />
      <Container display={['none', 'flex']} position="absolute" right={25} top={25} zIndex={222}>
        <Dropzone
          onDrop={acceptedFiles => {
            onZoomChange(1);
            onCropChange(DEFAULT_BACKGROUND_CROP);
            setAlignedRight(true);
            setUploadedImage(
              ...acceptedFiles.map(file =>
                Object.assign(file, {
                  preview: URL.createObjectURL(file),
                }),
              ),
            );
          }}
          multiple={false}
          accept="image/jpeg, image/png"
          style={{}}
          disabled={isSubmitting}
        >
          {({ isDragActive, isDragAccept, getRootProps, getInputProps }) => (
            <div {...getRootProps()}>
              <input data-cy="heroBackgroundDropzone" {...getInputProps()} />
              <StyledButton minWidth={150} disabled={isSubmitting} buttonSize="small">
                {!isDragActive && (
                  <React.Fragment>
                    <Span mr={2}>
                      <Upload size="1em" />
                    </Span>
                    <FormattedMessage id="Upload" defaultMessage="Upload" />
                  </React.Fragment>
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
              </StyledButton>
            </div>
          )}
        </Dropzone>
        {uploadedImage !== KEY_IMG_REMOVE && collective.backgroundImage && (
          <StyledButton
            minWidth={150}
            ml={3}
            disabled={isSubmitting}
            onClick={() => (uploadedImage ? setUploadedImage(null) : setUploadedImage(KEY_IMG_REMOVE))}
            buttonSize="small"
          >
            <FormattedMessage id="Remove" defaultMessage="Remove" />
          </StyledButton>
        )}
        <StyledButton
          textTransform="capitalize"
          minWidth={150}
          disabled={isSubmitting}
          ml={3}
          buttonSize="small"
          onClick={() => {
            const base = get(collective.settings, 'collectivePage.background');
            onCropChange((base && base.crop) || DEFAULT_BACKGROUND_CROP);
            onZoomChange((base && base.zoom) || 1);
            setUploadedImage(null);
            onEditCancel();
          }}
        >
          <FormattedMessage id="form.cancel" defaultMessage="cancel" />
        </StyledButton>
        <StyledButton
          data-cy="heroBackgroundDropzoneSave"
          textTransform="capitalize"
          buttonStyle="primary"
          buttonSize="small"
          ml={3}
          minWidth={150}
          loading={isSubmitting}
          onClick={async () => {
            try {
              setSubmitting(true);

              // We intentionally use the raw image URL rather than image service here
              // because the `backgroundImage` column is not supposed to store the
              // images service address
              let imgURL = collective.backgroundImage;

              // Upload image if changed or remove it
              if (uploadedImage === KEY_IMG_REMOVE) {
                imgURL = null;
              } else if (uploadedImage) {
                imgURL = await upload(uploadedImage);
              }

              // Update settings
              const result = await editBackground({
                variables: {
                  id: collective.id,
                  backgroundImage: imgURL,
                  settings: set({ ...collective.settings }, 'collectivePage.background', {
                    crop,
                    zoom,
                    mediaSize,
                    isAlignedRight,
                  }),
                },
              });

              // Reset
              const base = get(result, 'data.editCollective.settings.collectivePage.background');
              onCropChange((base && base.crop) || DEFAULT_BACKGROUND_CROP);
              onZoomChange((base && base.zoom) || 1);
              setUploadedImage(null);

              // Close the form
              onEditCancel();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <FormattedMessage id="save" defaultMessage="Save" />
        </StyledButton>
      </Container>
      <Container zIndex={222} position="absolute" right={25} top={75}>
        <MessageBox type="info" withIcon opacity={0.9} px={2} py={1}>
          <FormattedMessage
            id="HeroBackground.Instructions"
            defaultMessage="Use your mouse wheel or pinch to change the zoom, drag and drop to adjust position."
          />
        </MessageBox>
      </Container>
    </StyledHeroBackground>
  );
};

HeroBackgroundEdit.propTypes = {
  /** The collective to show the image for */
  collective: PropTypes.shape({
    id: PropTypes.number,
    /** The background image */
    backgroundImage: PropTypes.string,
    backgroundImageUrl: PropTypes.string,
    /** Collective settings */
    settings: PropTypes.shape({
      collectivePage: PropTypes.shape({
        background: PropTypes.shape({
          /** Used to display the background at the right position */
          offset: PropTypes.shape({ y: PropTypes.number.isRequired }),
          /** Only used for the editor */
          crop: PropTypes.shape({ y: PropTypes.number.isRequired }),
        }),
      }),
    }),
  }).isRequired,

  /** Called when user click on cancel */
  onEditCancel: PropTypes.func.isRequired,
};

/** @component */
export default HeroBackgroundEdit;
