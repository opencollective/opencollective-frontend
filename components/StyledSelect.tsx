import React from 'react';
import PropTypes from 'prop-types';
import propTypes from '@styled-system/prop-types';
import { isNil, omitBy, truncate } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl, IntlShape } from 'react-intl';
import Select, {
  components as ReactSelectComponents,
  ContainerProps,
  GroupHeadingProps,
  OptionProps,
  ValueContainerProps,
} from 'react-select';
import styled from 'styled-components';
import { layout, LayoutProps, space, SpaceProps, typography, TypographyProps } from 'styled-system';

import Container from './Container';
import { Flex } from './Grid';
import SearchIcon from './SearchIcon';
import StyledHr from './StyledHr';
import StyledTag from './StyledTag';
import { P } from './Text';

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

/* eslint-disable react/prop-types */
const Option = ({ innerProps, ...props }: OptionProps & { 'data-cy': string }) => (
  <ReactSelectComponents.Option
    {...props}
    innerProps={
      { ...innerProps, 'data-cy': 'select-option', title: props.data['title'] } as React.HTMLProps<HTMLDivElement>
    }
  />
);

const SelectContainer = ({ innerProps, ...props }: ContainerProps) => (
  <ReactSelectComponents.SelectContainer
    {...props}
    innerProps={
      { ...innerProps, 'data-cy': props.selectProps['data-cy'] || 'select' } as React.HTMLProps<HTMLDivElement>
    }
  />
);

const MultiValue = ({ children, removeProps, ...props }) => {
  let title;
  if (typeof children === 'string') {
    title = children;
    children = truncate(children, { length: 32 });
  }

  if (props.selectProps.useCompactMode) {
    return (
      <StyledTag m="4px" variant="rounded" maxHeight="24px" closeButtonProps={removeProps}>
        <Container maxWidth={16} overflow="hidden" title={props.data.label || title}>
          {children}
        </Container>
      </StyledTag>
    );
  } else {
    return (
      <StyledTag m="4px" variant="rounded-right" maxHeight="none" closeButtonProps={removeProps} title={title}>
        {children}
      </StyledTag>
    );
  }
};

const ValueContainer = ({ children, ...rest }: ValueContainerProps) => {
  const selectedCount = rest.getValue().length;
  const truncationThreshold = rest.selectProps['truncationThreshold'] || 3;
  const isTruncate = selectedCount > truncationThreshold;

  let firstChild = [];
  let elementNames;

  if (isTruncate) {
    firstChild = [children[0][0], children[1]];
    elementNames = children[0]
      .slice(1)
      .map(child => child.props.data.label)
      .join(', ');
  }

  return (
    <ReactSelectComponents.ValueContainer {...rest}>
      {!isTruncate ? children : firstChild}
      {isTruncate && (
        <span title={elementNames}>
          <u>
            <FormattedMessage
              defaultMessage="and {selectedCount} others"
              values={{ selectedCount: selectedCount - 1 }}
            />
          </u>
        </span>
      )}
    </ReactSelectComponents.ValueContainer>
  );
};
/* eslint-enable react/prop-types */

const STYLES_DISPLAY_NONE = { display: 'none' };

/**
 * Override the default "Caret Down" indicator to use a search icon instead
 */
const DropdownSearchIndicator = props => {
  return props.isDisabled ? null : (
    <ReactSelectComponents.DropdownIndicator {...props}>
      <SearchIcon size={16} fill="#aaaaaa" />
    </ReactSelectComponents.DropdownIndicator>
  );
};

DropdownSearchIndicator.propTypes = {
  isDisabled: PropTypes.bool,
};

const GroupHeading = ({ children, ...props }: GroupHeadingProps) => (
  <ReactSelectComponents.GroupHeading {...props}>
    <Flex justifyContent="space-between" alignItems="center" mr={2}>
      <P
        fontWeight="600"
        fontSize="9px"
        lineHeight="14px"
        textTransform="uppercase"
        letterSpacing="0.6px"
        whiteSpace="nowrap"
        pr={3}
      >
        {children}
      </P>
      <StyledHr flex="1" borderStyle="solid" borderColor="black.300" />
    </Flex>
  </ReactSelectComponents.GroupHeading>
);

/**
 * A map to override the default components of react-select
 */
export const customComponents = { SelectContainer, Option, MultiValue, GroupHeading, ValueContainer };
export const searchableCustomComponents = { ...customComponents, DropdownIndicator: DropdownSearchIndicator };

const getComponents = (components, useSearchIcon) => {
  const baseComponents = useSearchIcon ? searchableCustomComponents : customComponents;
  if (!components) {
    return baseComponents;
  } else {
    return omitBy({ ...baseComponents, ...components }, isNil);
  }
};

/**
 * Binds our custom theme and wordings to a regular `react-select`'s `Select`.
 * See https://react-select.com for more documentation.
 */
export const makeStyledSelect = SelectComponent => styled(SelectComponent).attrs(
  ({
    theme,
    intl,
    placeholder,
    disabled,
    inputId,
    instanceId,
    isDisabled,
    useSearchIcon,
    hideDropdownIndicator,
    hideMenu,
    error,
    styles,
    components,
    isSearchable,
    menuPortalTarget,
    selectTheme,
    noOptionsMessage = () => intl.formatMessage(Messages.noOptions),
    options,
  }) => {
    isSearchable = isSearchable ?? options?.length > 8;
    return {
      isSearchable,
      menuPortalTarget:
        menuPortalTarget || (menuPortalTarget === null || typeof document === 'undefined' ? undefined : document.body),
      isDisabled: disabled || isDisabled,
      placeholder: placeholder || intl.formatMessage(Messages.placeholder),
      loadingMessage: () => intl.formatMessage(Messages.loading),
      noOptionsMessage,
      components: getComponents(components, useSearchIcon),
      instanceId: instanceId ? instanceId : inputId,
      theme: selectTheme,
      styles: {
        control: (baseStyles, state) => {
          const customStyles: Record<string, unknown> = { borderColor: theme.colors.black[300] };

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

          if (isSearchable !== false) {
            customStyles.cursor = 'text';
          } else {
            customStyles.cursor = 'pointer';
          }

          if (typeof styles?.control === 'function') {
            return styles.control({ ...baseStyles, ...customStyles }, state);
          } else {
            return { ...baseStyles, ...customStyles, ...styles?.control };
          }
        },
        option: (baseStyles, state) => {
          const customStyles: Record<string, unknown> = { cursor: 'pointer' };

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

          return { ...baseStyles, ...customStyles, ...styles?.option };
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
                ...styles?.menu,
                overflow: 'hidden', // for children border-radius to apply
                zIndex: 10,
              };
        },
        menuList: baseStyles => ({
          ...baseStyles,
          ...styles?.menuList,
          paddingTop: 0,
          paddingBottom: 0,
        }),
        indicatorSeparator: () => ({
          display: 'none',
        }),
        clearIndicator: baseStyles => ({
          ...baseStyles,
          cursor: 'pointer',
        }),
        dropdownIndicator: baseStyles => {
          if (hideDropdownIndicator) {
            return STYLES_DISPLAY_NONE;
          } else if (styles?.dropdownIndicator) {
            return { ...baseStyles, ...styles.dropdownIndicator };
          } else {
            return baseStyles;
          }
        },
        menuPortal: baseStyles => ({
          ...baseStyles,
          zIndex: 99999,
        }),
      },
    };
  },
)`
  ${typography}
  ${layout}
  ${space}
`;

type StyledSelectCustomComponent = Select &
  React.ExoticComponent<
    LayoutProps &
      TypographyProps &
      SpaceProps & {
        intl: IntlShape;
        /** Alias for isDisabled */
        inputId: string;
        disabled?: boolean;
        useSearchIcon?: boolean;
        hideDropdownIndicator?: boolean;
        hideMenu?: boolean;
        error?: boolean;
        style?: Record<string, unknown>;
        onBlur?: Function;
        onChange?: Function;
        isLoading?: boolean;
        isSearchable?: boolean;
        options?: any;
        value?: any;
      }
  >;

const StyledSelect: StyledSelectCustomComponent = makeStyledSelect(Select);

StyledSelect['propTypes'] = {
  // Styled-system
  ...propTypes.typography,
  ...propTypes.layout,
  ...propTypes.space,
  /** The id of the search input */
  inputId: PropTypes.string.isRequired,
  /** Define an id prefix for the select components e.g., {your-id}-value */
  instanceId: PropTypes.string,
  /** Placeholder for the select value */
  placeholder: PropTypes.node,
  /** Whether the component is disabled */
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
  /** Default placement of the menu in relation to the control */
  menuPlacement: PropTypes.oneOf(['bottom', 'top', 'auto']),
  /** Displays a red border when truthy */
  error: PropTypes.any,
  /** @ignore from injectIntl */
  intl: PropTypes.object,
  /** Default option */
  defaultValue: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  styles: PropTypes.object,
  /** To render menu in a portal */
  menuPortalTarget: PropTypes.any,
  /** Compact mode for rending multiple selections correctly **/
  useCompactMode: PropTypes.bool,
};

StyledSelect['defaultProps'] = {
  fontSize: '14px',
  styles: {},
  useCompactMode: false,
};

export default injectIntl(StyledSelect);
