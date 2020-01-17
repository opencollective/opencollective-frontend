import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { typography, layout, space } from 'styled-system';
import Select, { components } from 'react-select';
import { injectIntl, defineMessages } from 'react-intl';
import propTypes from '@styled-system/prop-types';
import { truncate } from 'lodash';

import SearchIcon from './SearchIcon';
import StyledTag from './StyledTag';

const Messages = defineMessages({
  loading: {
    id: 'Select.Loading',
    defaultMessage: 'Loading...',
  },
  noOptions: {
    id: 'Select.NoOptions',
    defaultMessage: 'Nothing found',
  },
  placeholder: {
    id: 'Select.Placeholder',
    defaultMessage: 'No selection',
  },
});

// eslint-disable-next-line react/prop-types
const Option = ({ innerProps, ...props }) => (
  <components.Option {...props} innerProps={{ ...innerProps, 'data-cy': 'select-option' }} />
);

// eslint-disable-next-line react/prop-types
const SelectContainer = ({ innerProps, ...props }) => (
  <components.SelectContainer
    {...props}
    innerProps={{ ...innerProps, 'data-cy': props.selectProps['data-cy'] || 'select' }} // eslint-disable-line react/prop-types
  />
);

// eslint-disable-next-line react/prop-types
const MultiValue = ({ children, removeProps }) => {
  if (typeof children === 'string') {
    children = truncate(children, { maxLength: 32 });
  }

  return (
    <StyledTag my={2} mr={2} fontSize="8px" closeButtonProps={removeProps}>
      {children}
    </StyledTag>
  );
};

const STYLES_DISPLAY_NONE = { display: 'none' };

/**
 * Override the default "Caret Down" indicator to use a search icon instead
 */
const DropdownSearchIndicator = props => {
  return props.isDisabled ? null : (
    <components.DropdownIndicator {...props}>
      <SearchIcon size={16} fill="#aaaaaa" />
    </components.DropdownIndicator>
  );
};

DropdownSearchIndicator.propTypes = {
  isDisabled: PropTypes.bool,
};

/**
 * A map to override the default components of react-select
 */
export const customComponents = { SelectContainer, Option, MultiValue };
export const searchableCustomComponents = { ...customComponents, DropdownIndicator: DropdownSearchIndicator };

/**
 * Binds our custom theme and wordings to a regular `react-select`'s `Select`.
 * See https://react-select.com for more documentation.
 */
export const makeStyledSelect = SelectComponent => styled(SelectComponent).attrs(
  ({ theme, intl, placeholder, disabled, isDisabled, useSearchIcon, hideDropdownIndicator, hideMenu, error }) => ({
    isDisabled: disabled || isDisabled,
    placeholder: placeholder || intl.formatMessage(Messages.placeholder),
    loadingMessage: () => intl.formatMessage(Messages.loading),
    noOptionsMessage: () => intl.formatMessage(Messages.noOptions),
    components: useSearchIcon ? searchableCustomComponents : customComponents,
    styles: {
      control: (baseStyles, state) => {
        const customStyles = { borderColor: theme.colors.black[300], cursor: 'text' };

        if (error) {
          customStyles.borderColor = theme.colors.red[500];
          customStyles['&:hover'] = { borderColor: theme.colors.red[300] };
        } else if (!state.isFocused) {
          customStyles['&:hover'] = { borderColor: theme.colors.primary[300] };
        } else if (state.isDisabled) {
          customStyles.boxShadow = 'none';
        } else {
          customStyles.borderColor = theme.colors.primary[500];
          customStyles.boxShadow = `inset 0px 2px 2px ${theme.colors.primary[50]}`;
        }

        return { ...baseStyles, ...customStyles };
      },
      option: (baseStyles, state) => {
        const customStyles = {};

        if (state.data.__background__) {
          // Ability to force background by setting a special option prop
          customStyles.background = state.data.__background__;
        } else if (state.isSelected) {
          customStyles.backgroundColor = theme.colors.primary[200];
          customStyles.color = undefined;
        } else if (state.isFocused) {
          customStyles.backgroundColor = theme.colors.primary[100];
        } else {
          customStyles['&:hover'] = { backgroundColor: theme.colors.primary[100] };
        }

        return { ...baseStyles, ...customStyles };
      },
      singleValue: baseStyles => ({
        ...baseStyles,
        width: '100%',
      }),
      menu: baseStyles => {
        return hideMenu
          ? STYLES_DISPLAY_NONE
          : {
              ...baseStyles,
              overflow: 'hidden', // for children border-radius to apply
              zIndex: 3,
            };
      },
      menuList: baseStyles => ({
        ...baseStyles,
        paddingTop: 0,
        paddingBottom: 0,
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
      dropdownIndicator: baseStyles => {
        return hideDropdownIndicator ? STYLES_DISPLAY_NONE : baseStyles;
      },
    },
  }),
)`
  ${typography}
  ${layout}
  ${space}
`;

const StyledSelect = makeStyledSelect(Select);

StyledSelect.propTypes = {
  placeholder: PropTypes.node,
  /** Wether the component is disabled */
  disabled: PropTypes.bool,
  /** Alias for `disabled` */
  isDisabled: PropTypes.bool,
  /** Rendered when there's no option to show */
  noOptionsMessage: PropTypes.func,
  /** If true, a search icon will be used instead of the default caret down */
  useSearchIcon: PropTypes.bool,
  /** If true, DropDown indicator (caret) will not be displayed */
  hideDropdownIndicator: PropTypes.bool,
  /** If true, options list will not be displayed */
  hideMenu: PropTypes.bool,
  /** @ignore from injectIntl */
  intl: PropTypes.object,
  // Styled-system
  ...propTypes.typography,
  ...propTypes.layout,
  ...propTypes.space,
};

StyledSelect.defaultProps = {
  fontSize: 'Paragraph',
};

/** @component */
export default injectIntl(StyledSelect);
