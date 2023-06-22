import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { Flex } from './Grid';
import Link from './Link';
import SearchForm from './SearchForm';
import StyledLink from './StyledLink';
import StyledModal, { ModalBody } from './StyledModal';

/*
 * A modal that appears on top of the page containing a search field.
 */
const SearchModal = ({ onClose, showLinkToDiscover = false }) => {
  const intl = useIntl();
  return (
    <StyledModal
      padding={0}
      position="absolute"
      top={64}
      style={{ borderRadius: showLinkToDiscover ? 20 : 100 }}
      onClose={onClose}
      overflow="hidden"
    >
      <ModalBody mt={0} mb={0}>
        <Flex flexDirection="column">
          <Flex>
            <SearchForm
              autoFocus
              width={['180px', '248px', '536px']}
              borderRadius="100px"
              borderColor="transparent"
              fontSize="14px"
              height="52px"
              placeholder={intl.formatMessage({ defaultMessage: 'Search for Collectives, organizations, and more...' })}
              showSearchButton
              searchButtonStyles={{ width: '32px', height: '32px' }}
            />
          </Flex>
          {showLinkToDiscover && (
            <Flex justifyContent={'center'} p="16px" fontSize="13px" style={{ borderTop: '1px solid #e1e4e6' }}>
              <StyledLink as={Link} href="/search">
                <FormattedMessage id="home.discoverCollectives" defaultMessage="Discover Collectives" />
              </StyledLink>
            </Flex>
          )}
        </Flex>
      </ModalBody>
    </StyledModal>
  );
};

SearchModal.propTypes = {
  onClose: PropTypes.func,
  showLinkToDiscover: PropTypes.bool,
};

export default SearchModal;
