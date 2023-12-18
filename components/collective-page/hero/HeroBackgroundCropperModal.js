import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Image as ImageIcon } from '@styled-icons/boxicons-regular/Image';
import { AngleDoubleDown } from '@styled-icons/fa-solid/AngleDoubleDown';
import { cloneDeep, get, set } from 'lodash';
import Dropzone from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { upload } from '../../../lib/api';
import { formatErrorMessage, getErrorFromXhrUpload, i18nGraphqlException } from '../../../lib/errors';
import { editCollectiveBackgroundMutation } from '../../../lib/graphql/v1/mutations';
import { useElementSize } from '../../../lib/hooks/useElementSize';
import { mergeRefs } from '../../../lib/react-utils';

import Container from '../../Container';
import ContainerOverlay from '../../ContainerOverlay';
import { Box, Flex } from '../../Grid';
import StyledButton from '../../StyledButton';
import { DROPZONE_ACCEPT_IMAGES } from '../../StyledDropzone';
import StyledInputSlider from '../../StyledInputSlider';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { Span } from '../../Text';
import { useToast } from '../../ui/useToast';

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
const BUTTONS_PROPS = { buttonSize: 'small', py: 1, my: 1, mx: 2, width: ['100%', 'auto'] };

const EmptyDropzoneContainer = styled.div`
  border: 2px dashed #c3c6cb;
  cursor: pointer;
  box-sizing: border-box;
  border-radius: 4px;
  height: 122px;
  text-align: center;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover:not(:disabled) {
    background: #f9f9f9;
    border-color: ${props => props.theme.colors.primary[300]};
  }

  &:focus {
    outline: 0;
    border-color: ${props => props.theme.colors.primary[500]};
  }
`;

const HeroBackgroundCropperModal = ({ onClose, collective }) => {
  const [isSubmitting, setSubmitting] = React.useState(false); // Not using Apollo to have a common flag with file upload
  const intl = useIntl();
  const { toast } = useToast();
  const [editBackground] = useMutation(editCollectiveBackgroundMutation);
  const containerSize = useElementSize({ defaultWidth: 600 });
  const [mediaSize, setMediaSize] = React.useState();
  const [crop, onCropChange] = React.useState(getCrop(collective));
  const [zoom, onZoomChange] = React.useState(getZoom(collective));
  const [isAlignedRight, setAlignedRight] = React.useState(getAlignedRight(collective));
  const [uploadedImage, setUploadedImage] = React.useState();
  const scale = containerSize.width / BASE_HERO_WIDTH;
  const transform = scale ? `scale(${scale})` : undefined;
  const minZoom = 0.25;
  const maxZoom = 5;
  const hasImage = Boolean(collective.backgroundImage ? uploadedImage !== KEY_IMG_REMOVE : uploadedImage);

  const onDrop = ([file]) => {
    onZoomChange(1);
    onCropChange(DEFAULT_BACKGROUND_CROP);
    setAlignedRight(true);
    setUploadedImage(Object.assign(file, { preview: URL.createObjectURL(file) }));
  };

  return (
    <StyledModal onClose={onClose} ignoreEscapeKey>
      <ModalHeader mb={3}>
        <Span fontSize="20px" fontWeight="500">
          <FormattedMessage defaultMessage="Add cover image" />
        </Span>
      </ModalHeader>

      <Dropzone onDrop={onDrop} multiple={false} accept={DROPZONE_ACCEPT_IMAGES}>
        {({ isDragActive, isDragAccept, getRootProps, getInputProps, open }) => {
          const rootProps = getRootProps();
          return (
            <React.Fragment>
              <ModalBody>
                <Container position="relative" width="510px" maxWidth="100%">
                  <Container
                    position="relative"
                    height={BASE_HERO_HEIGHT * scale}
                    {...getRootProps()}
                    ref={mergeRefs([containerSize.ref, rootProps.ref])}
                    onClick={hasImage ? null : rootProps.onClick} // Invalidate click event if there's already an image
                  >
                    {isDragActive && (
                      <ContainerOverlay>
                        {isDragAccept ? (
                          <React.Fragment>
                            <Box mb={2}>
                              <AngleDoubleDown size="32px" />
                            </Box>
                            <FormattedMessage id="uploadImage.isDragActive" defaultMessage="Drop it like it's hot 🔥" />
                          </React.Fragment>
                        ) : (
                          <FormattedMessage
                            id="uploadImage.isDragReject"
                            defaultMessage="🚫 This file type is not accepted"
                          />
                        )}
                      </ContainerOverlay>
                    )}
                    <input data-cy="heroBackgroundDropzone" {...getInputProps()} />
                    {hasImage ? (
                      <Container
                        position="absolute"
                        width={BASE_HERO_WIDTH}
                        height={BASE_HERO_HEIGHT}
                        left={0}
                        top={0}
                        border="1px solid grey"
                        css={{ transform, transformOrigin: 'top left' }}
                      >
                        <StyledHeroBackground
                          data-cy="collective-background-image-styledBackground"
                          backgroundImage={collective.backgroundImageUrl}
                          isAlignedRight={isAlignedRight}
                          isEditing={hasImage}
                        >
                          <Cropper
                            image={uploadedImage ? uploadedImage.preview : collective.backgroundImageUrl}
                            cropSize={{ width: BASE_HERO_WIDTH, height: BASE_HERO_HEIGHT }}
                            crop={crop}
                            zoom={zoom}
                            minZoom={minZoom}
                            maxZoom={maxZoom}
                            zoomSpeed={0.5}
                            restrictPosition={false}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onMediaLoaded={mediaSize =>
                              setMediaSize({ width: mediaSize.naturalWidth, height: mediaSize.naturalHeight })
                            }
                            style={{
                              imageStyle: { minHeight: '0', minWidth: '0', maxHeight: 'none', maxWidth: 'none' },
                              containerStyle: { cursor: hasImage ? 'move' : 'auto' },
                            }}
                          />
                        </StyledHeroBackground>
                      </Container>
                    ) : (
                      <EmptyDropzoneContainer>
                        <Container maxWidth={268}>
                          <FormattedMessage
                            defaultMessage="Drag and drop your image or <Link>click here</Link> to select it."
                            values={{ Link: msg => <Span color="blue.500">{msg}</Span> }}
                          />
                        </Container>
                      </EmptyDropzoneContainer>
                    )}
                  </Container>

                  <Flex alignItems="center" justifyContent="center" mt={3}>
                    <ImageIcon size={14} color="#75777A" />
                    <StyledInputSlider
                      min={minZoom}
                      max={maxZoom}
                      value={zoom}
                      step="0.01"
                      onChange={e => onZoomChange(e.target.value)}
                      mx={2}
                      width="200px"
                      disabled={!hasImage}
                    />
                    <ImageIcon size={22} color="#75777A" />
                  </Flex>
                </Container>
              </ModalBody>
              <ModalFooter>
                <Flex justifyContent="space-between" flexWrap="wrap" my={1}>
                  <Flex flexWrap="wrap" width={['100%', 'auto']}>
                    <StyledButton
                      {...BUTTONS_PROPS}
                      buttonStyle="primary"
                      data-cy="heroBackgroundDropzoneSave"
                      py={1}
                      minWidth={75}
                      loading={isSubmitting}
                      onClick={async () => {
                        setSubmitting(true);

                        // We intentionally use the raw image URL rather than image service here
                        // because the `backgroundImage` column is not supposed to store the
                        // images service address
                        let imgURL = collective.backgroundImage;
                        try {
                          // Upload image if changed or remove it
                          if (uploadedImage === KEY_IMG_REMOVE) {
                            imgURL = null;
                          } else if (uploadedImage) {
                            imgURL = await upload(uploadedImage, 'ACCOUNT_BANNER');
                          }
                        } catch (e) {
                          const error = getErrorFromXhrUpload(e);
                          toast({ variant: 'error', message: formatErrorMessage(intl, error) });
                          return;
                        } finally {
                          setSubmitting(false);
                        }

                        // Update settings
                        try {
                          const result = await editBackground({
                            variables: {
                              id: collective.id,
                              backgroundImage: imgURL,
                              settings: set(cloneDeep(collective.settings), 'collectivePage.background', {
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

                          // Show a toast and close the modal
                          toast({
                            variant: 'success',
                            title: <FormattedMessage defaultMessage="Cover updated" />,
                            message: (
                              <FormattedMessage defaultMessage="The page might take a few seconds to fully update" />
                            ),
                          });

                          onClose();
                        } catch (e) {
                          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      <FormattedMessage id="save" defaultMessage="Save" />
                    </StyledButton>
                    <StyledButton
                      {...BUTTONS_PROPS}
                      disabled={!hasImage || isSubmitting}
                      onClick={() => {
                        onCropChange(DEFAULT_BACKGROUND_CROP);
                        onZoomChange(1);
                        setUploadedImage(KEY_IMG_REMOVE);
                      }}
                    >
                      <FormattedMessage id="Reset" defaultMessage="Reset" />
                    </StyledButton>
                  </Flex>
                  <StyledButton {...BUTTONS_PROPS} onClick={open} disabled={isSubmitting}>
                    <FormattedMessage defaultMessage="Upload new image" />
                  </StyledButton>
                </Flex>
              </ModalFooter>
            </React.Fragment>
          );
        }}
      </Dropzone>
    </StyledModal>
  );
};

HeroBackgroundCropperModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    backgroundImage: PropTypes.string.isRequired,
    backgroundImageUrl: PropTypes.string.isRequired,
    settings: PropTypes.object,
  }).isRequired,
};

export default HeroBackgroundCropperModal;
