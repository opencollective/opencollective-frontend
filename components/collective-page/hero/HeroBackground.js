import React from 'react';
import { PropTypes } from 'prop-types';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';
import { Mutation } from 'react-apollo';
import { get, set, has } from 'lodash';

import { Upload } from 'styled-icons/feather/Upload';

import { upload } from '../../../lib/api';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import Container from '../../Container';
import StyledButton from '../../StyledButton';
import { Span } from '../../Text';

// Local imports
import { EditCollectiveBackgroundMutation } from '../graphql/mutations';
import HeroBackgroundMask from '../images/HeroBackgroundMask.svg';

const BASE_WIDTH = 1368;
const BASE_HEIGHT = 325;

// Dynamically import cropper component
const EditBackgroundLoadingPlaceholder = () => <LoadingPlaceholder height={BASE_HEIGHT} />;
const Cropper = dynamic(() => import(/* webpackChunkName: 'react-easy-crop' */ 'react-easy-crop'), {
  loading: EditBackgroundLoadingPlaceholder,
  ssr: false,
});

// Dynamically import dropzone component
const Dropzone = dynamic(() => import(/* webpackChunkName: 'react-dropzone' */ 'react-dropzone'), {
  ssr: false,
});

const generateBackground = theme => {
  const color = theme.colors.primary[300];
  const gradient = `linear-gradient(10deg, ${theme.colors.primary[700]}, ${theme.colors.primary[200]})`;
  return `${gradient}, ${color}`;
};

const StyledBackground = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 100%;
  max-width: 1368px; // Should match SVG's viewbox
  z-index: ${props => (props.isEditing ? 0 : -1)};

  @supports (mask-size: cover) {
    background: ${props => generateBackground(props.theme)};
    background-repeat: no-repeat;
    background-size: 100%;

    mask: url(${HeroBackgroundMask}) no-repeat;
    mask-size: cover;
    mask-position-x: 100%;
    mask-position-y: -150px;

    @media (max-width: 900px) {
      mask-position-x: 20%;
    }
  }
`;

const ImageContainer = styled.div`
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  position: absolute;
  overflow: hidden;
`;

const BackgroundImage = styled.img.attrs({ alt: '' })`
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 0;
  min-width: 0;
  max-height: none;
  max-width: none;
  position: absolute;
  margin: auto;
`;

const KEY_IMG_REMOVE = '__REMOVE__';
const DEFAULT_CROP = { x: 0, y: 0 };

const getCrop = collective => get(collective.settings, 'collectivePage.background.crop') || DEFAULT_CROP;
const getZoom = collective => get(collective.settings, 'collectivePage.background.zoom') || 1;

/**
 * Wraps the logic to display the hero background. Fallsback on a white background if
 * css `mask` is not supported.
 */
const HeroBackground = ({ collective, isEditing, onEditCancel }) => {
  const [crop, onCropChange] = React.useState(getCrop(collective));
  const [zoom, onZoomChange] = React.useState(getZoom(collective));
  const [uploadedImage, setUploadedImage] = React.useState();
  const [submitting, setSubmitting] = React.useState(false);
  const hasBackgroundSettings = has(collective.settings, 'collectivePage.background');

  return !isEditing ? (
    <StyledBackground>
      {collective.backgroundImage && (
        <ImageContainer>
          <BackgroundImage
            src={collective.backgroundImage}
            style={
              hasBackgroundSettings
                ? { transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})` }
                : { minWidth: '100%' }
            }
          />
        </ImageContainer>
      )}
    </StyledBackground>
  ) : (
    <Mutation mutation={EditCollectiveBackgroundMutation}>
      {editBackground => (
        <StyledBackground backgroundImage={collective.backgroundImage} isEditing>
          <Cropper
            image={uploadedImage ? uploadedImage.preview : collective.backgroundImage}
            cropSize={{ width: BASE_WIDTH, height: BASE_HEIGHT }}
            apect={BASE_WIDTH / BASE_HEIGHT}
            crop={crop}
            zoom={zoom}
            minZoom={0.25}
            maxZoom={5}
            zoomSpeed={0.5}
            restrictPosition={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            style={{ imageStyle: { minHeight: '0', minWidth: '0', maxHeight: 'none', maxWidth: 'none' } }}
          />
          <Container display={['none', 'flex']} position="absolute" right={25} top={25} zIndex={222}>
            <Dropzone
              onDrop={acceptedFiles => setUploadedImage(acceptedFiles[0])}
              multiple={false}
              accept="image/jpeg, image/png"
              style={{}}
              disabled={submitting}
            >
              {({ isDragActive, isDragAccept }) => (
                <StyledButton minWidth={150} disabled={submitting}>
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
              )}
            </Dropzone>
            {((collective.backgroundImage && uploadedImage !== KEY_IMG_REMOVE) || uploadedImage !== KEY_IMG_REMOVE) && (
              <StyledButton
                minWidth={150}
                ml={3}
                disabled={submitting}
                onClick={() => (uploadedImage ? setUploadedImage(null) : setUploadedImage(KEY_IMG_REMOVE))}
              >
                <FormattedMessage id="Remove" defaultMessage="Remove" />
              </StyledButton>
            )}
            <StyledButton
              textTransform="capitalize"
              minWidth={150}
              disabled={submitting}
              ml={3}
              onClick={() => {
                const base = get(collective.settings, 'collectivePage.background');
                onCropChange((base && base.crop) || DEFAULT_CROP);
                onZoomChange((base && base.zoom) || 1);
                setUploadedImage(null);
                onEditCancel();
              }}
            >
              <FormattedMessage id="form.cancel" defaultMessage="cancel" />
            </StyledButton>
            <StyledButton
              textTransform="capitalize"
              buttonStyle="primary"
              ml={3}
              minWidth={150}
              loading={submitting}
              onClick={async () => {
                setSubmitting(true); // Need this because `upload` is not a graphql function

                try {
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
                      settings: set({ ...collective.settings }, 'collectivePage.background', { crop, zoom }),
                    },
                  });

                  // Reset
                  const base = get(result, 'data.editCollective.settings.collectivePage.background');
                  onCropChange((base && base.crop) || DEFAULT_CROP);
                  onZoomChange((base && base.zoom) || 1);
                  setUploadedImage(null);

                  // Close the form
                  onEditCancel();
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <FormattedMessage id="save" defaultMessage="save" />
            </StyledButton>
          </Container>
        </StyledBackground>
      )}
    </Mutation>
  );
};

HeroBackground.propTypes = {
  /** The collective to show the image for */
  collective: PropTypes.shape({
    id: PropTypes.number,
    /** The background image */
    backgroundImage: PropTypes.string,
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

  /** Wether to show the cropper/uploader */
  isEditing: PropTypes.bool,
};

/** @component */
export default HeroBackground;
