import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import { Box } from './Grid';
import Image from './Image';
import StyledButton from './StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';

/*
 * A image preview modal that can be used to display a preview image for a
 * an Email Template or an Invoice Receipt.
 */
const PreviewModal = ({ previewImage, heading, subheading = null, imgHeight, imgWidth, onClose }) => {
  return (
    <StyledModal onClose={onClose}>
      <ModalHeader>{heading}</ModalHeader>
      <ModalBody mb={0}>
        {subheading && (
          <Box pt="6px" pb="32px" fontSize="14px" fontWeight={400} lineHeight="20px" color="black.700">
            {subheading}
          </Box>
        )}
        <Image src={previewImage} alt="Position of custom message" height={imgHeight} width={imgWidth} />
      </ModalBody>
      <ModalFooter>
        <Container display="flex" justifyContent="center">
          <StyledButton buttonStyle="secondary" onClick={onClose}>
            <FormattedMessage id="Close" defaultMessage="Close" />
          </StyledButton>
        </Container>
      </ModalFooter>
    </StyledModal>
  );
};

export default PreviewModal;
