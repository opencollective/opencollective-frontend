import React from 'react';
import styled from 'styled-components';
import { typography, layout, space } from 'styled-system';
import Select, { components } from 'react-select';
import { injectIntl, defineMessages } from 'react-intl';

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

/**
 * A map to override the default components of reac-select
 */
const customComponents = { Option };

/**
 * Binds our custom theme and wordings to a regular `react-select`'s `Select`.
 * See https://react-select.com for more documentation.
 */
const StyledSelect = styled(Select).attrs(({ theme, intl, placeholder, disabled, isDisabled }) => ({
  isDisabled: disabled || isDisabled,
  placeholder: placeholder || intl.formatMessage(Messages.placeholder),
  loadingMessage: () => intl.formatMessage(Messages.loading),
  noOptionsMessage: () => intl.formatMessage(Messages.loading),
  components: customComponents,
  styles: {
    control: (baseStyles, state) => {
      const customStyles = { borderColor: theme.colors.black[400] };

      if (!state.isFocused) {
        customStyles['&:hover'] = { borderColor: theme.colors.primary[300] };
      } else {
        customStyles.borderColor = theme.colors.primary[500];
        customStyles.boxShadow = `inset 0px 2px 2px ${theme.colors.primary[50]}`;
      }

      return { ...baseStyles, ...customStyles };
    },
    option: (baseStyles, state) => {
      const customStyles = {};

      if (state.isSelected) {
        customStyles.backgroundColor = state.isFocused ? theme.colors.primary[400] : theme.colors.primary[500];
      } else if (state.isFocused) {
        customStyles.backgroundColor = theme.colors.primary[50];
      } else {
        customStyles['&:hover'] = { backgroundColor: theme.colors.primary[50] };
      }

      return { ...baseStyles, ...customStyles };
    },
    menu: baseStyles => ({
      ...baseStyles,
      overflow: 'hidden', // for children border-radius to apply
      zIndex: 3,
    }),
    menuList: baseStyles => ({
      ...baseStyles,
      paddingTop: 0,
      paddingBottom: 0,
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  },
}))`
  ${typography}
  ${layout}
  ${space}
`;

StyledSelect.defaultProps = {
  fontSize: 'Paragraph',
};

/** @component */
export default injectIntl(StyledSelect);
