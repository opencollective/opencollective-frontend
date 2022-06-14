import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { Box, Flex } from './Grid';
import SearchForm from './SearchForm';
import StyledLink from './StyledLink';
import StyledModal, { CloseIcon, ModalBody } from './StyledModal';
import { Span } from './Text';

/*
 * A modal that appears on top of the page containing a search field.
 */
const SearchModal = ({ onClose }) => {
  const intl = useIntl();
  return (
    <StyledModal
      position="absolute"
      top={0}
      style={{ borderRadius: 0 }}
      maxWidth="100%"
      width="100%"
      height="128px"
      onClose={onClose}
      overflow="hidden"
    >
      <ModalBody>
        <Flex height="48px" alignItems="center" flexDirection="column">
          <Flex>
            <SearchForm
              autoFocus
              width={['180px', '248px', '536px']}
              borderRadius="100px"
              fontSize="12px"
              placeholder={intl.formatMessage({ defaultMessage: 'Search for Collectives, organizations, and more...' })}
              showSearchButton
              searchButtonStyles={{ width: '32px', height: '32px' }}
            />
            <Span mt="12px" ml={['10px', '25px']}>
              <CloseIcon onClick={onClose} style={{ width: '14px', height: '14px' }} />
            </Span>
          </Flex>
          <Box pt="16px" fontSize="13px">
            <StyledLink href="/search">
              <FormattedMessage id="home.discoverCollectives" defaultMessage="Discover Collectives" />
            </StyledLink>
          </Box>
        </Flex>
      </ModalBody>
    </StyledModal>
  );
};

SearchModal.propTypes = {
  onClose: PropTypes.func,
};

export default SearchModal;
