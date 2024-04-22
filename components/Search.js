import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { Dialog, DialogContent } from './ui/Dialog';
import SearchForm from './SearchForm';
/*
 * A modal that appears on top of the page containing a search field.
 */
const SearchModal = ({ open, setOpen }) => {
  const intl = useIntl();
  const onClose = () => setOpen(false);
  return (
    <Dialog open={open} onOpenChange={open => setOpen(open)}>
      <DialogContent className="overflow-hidden px-0 py-12 sm:rounded-full sm:py-0 sm:pr-8" hideCloseButton>
        <SearchForm
          autoFocus
          borderColor="transparent"
          overflow="hidden"
          fontSize="14px"
          height="48px"
          placeholder={intl.formatMessage({
            defaultMessage: 'Search for Collectives, organizations, and more...',
            id: 'LOtm7B',
          })}
          showSearchButton
          searchButtonStyles={{ width: '32px', height: '32px' }}
          closeSearchModal={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

SearchModal.propTypes = {
  setOpen: PropTypes.func,
  open: PropTypes.bool,
};

export default SearchModal;
