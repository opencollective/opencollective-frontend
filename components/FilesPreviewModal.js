import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft } from '@styled-icons/feather/ArrowLeft';
import { ArrowRight } from '@styled-icons/feather/ArrowRight';
import { FormattedMessage } from 'react-intl';

import BulletSlider from './BulletSlider';
import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledModal, { ModalBody, ModalHeader } from './StyledModal';
import UploadedFilePreview from './UploadedFilePreview';

export default class FilesPreviewModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    renderItemPreview: PropTypes.func,
    /** A render func for item details */
    renderInfo: PropTypes.func,
    files: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        /** An alternative to `url` */
        onClick: PropTypes.func,
      }),
    ),
  };

  state = { selectedIndex: 0, isDownloading: false };

  componentDidMount() {
    this.eventListener = document.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        this.selectPrevFile();
      } else if (event.key === 'ArrowRight') {
        this.selectNextFile();
      } else if (event.key === 'Escape') {
        this.props.onClose();
      }
    });
  }

  componentWillUnmount() {
    if (this.eventListener) {
      this.document.removeEventListener(this.eventListener);
      this.eventListener = null;
    }
  }

  selectPrevFile = () => {
    this.setState(({ selectedIndex }) => ({ selectedIndex: Math.max(selectedIndex - 1, 0) }));
  };

  selectNextFile = () => {
    this.setState(({ selectedIndex }) => ({
      selectedIndex: Math.min(selectedIndex + 1, (this.props.files?.length || 1) - 1),
    }));
  };

  getItemOnClick(item) {
    if (!item.onClick) {
      return undefined;
    } else {
      return () =>
        item.onClick({
          isLoading: this.state.isDownloading,
          setLoading: isDownloading => this.setState({ isDownloading }),
        });
    }
  }

  renderItemPreview(item) {
    if (this.props.renderItemPreview) {
      return this.props.renderItemPreview({ item, isDownloading: this.state.isDownloading });
    }

    return (
      <UploadedFilePreview
        url={item.url}
        size={350}
        hasLink
        onClick={this.getItemOnClick(item)}
        isDownloading={this.state.isDownloading}
        title={item.title}
      />
    );
  }

  render() {
    const { renderInfo, files, ...props } = this.props;
    const { selectedIndex } = this.state;
    const selectedItem = files ? files[selectedIndex] : null;
    const nbFiles = this.props.files?.length || 0;
    const hasMultipleFiles = nbFiles > 1;

    return (
      <StyledModal {...props} width="100%" maxWidth={450} trapFocus={false}>
        <ModalHeader mb={3}>
          <FormattedMessage id="FilesPreviewModal.AttachmentPreview" defaultMessage="Attachment preview" />
        </ModalHeader>
        <ModalBody mb={0}>
          <Flex justifyContent="center" width="100%">
            {hasMultipleFiles && (
              <StyledButton
                buttonSize="tiny"
                isBorderless
                ml="-12px"
                px="4px"
                onClick={this.selectPrevFile}
                disabled={!selectedIndex}
              >
                <ArrowLeft size={18} />
              </StyledButton>
            )}
            <Flex mx={2} width="100%" justifyContent="center">
              {selectedItem && this.renderItemPreview(selectedItem)}
            </Flex>
            {hasMultipleFiles && (
              <StyledButton
                buttonSize="tiny"
                isBorderless
                mr="-12px"
                px="4px"
                onClick={this.selectNextFile}
                disabled={!nbFiles || selectedIndex === nbFiles - 1}
              >
                <ArrowRight size={18} />
              </StyledButton>
            )}
          </Flex>
          {renderInfo && renderInfo({ item: selectedItem })}
          {hasMultipleFiles && (
            <Box mt={4}>
              <BulletSlider
                nbItems={nbFiles}
                selectedIndex={selectedIndex}
                onChange={selectedIndex => this.setState({ selectedIndex })}
              />
            </Box>
          )}
        </ModalBody>
      </StyledModal>
    );
  }
}
