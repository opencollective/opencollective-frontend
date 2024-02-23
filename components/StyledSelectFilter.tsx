import React from 'react';
import PropTypes from 'prop-types';
import { differenceBy } from 'lodash';
import { components as ReactSelectComponents } from 'react-select';
import styled from 'styled-components';
import { maxWidth } from 'styled-system';

import { Flex } from './Grid';
import type { StyledSelectProps } from './StyledSelect';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

const TruncatedItemsList = styled(Span).attrs({
  truncateOverflow: true,
  pl: 2,
  maxWidth: ['calc(100vw - 135px)', '75px', '175px', '200px'],
})`
  display: inline-block;
  max-width: 75px;
  ${maxWidth}
`;

export const makeTruncatedValueAllSelectedLabelContainer = (allSelectedNode: React.ReactNode) => {
  const TruncatedValueAllSelectedLabelContainer = (props: {
    selectProps: { value?: Array<any>; options?: Array<any> };
    children: React.ReactNode[];
  }) => {
    const { selectProps, children } = props;
    const itemsList = (selectProps.value || []).map(({ label }) => label);
    const itemsListStr = itemsList.join(', ');
    const isAllSelected = differenceBy(selectProps.options, selectProps.value, 'value').length === 0;

    return (
      <ReactSelectComponents.SelectContainer height="1em" {...(props as any)}>
        <Flex>
          <TruncatedItemsList title={itemsListStr}>{isAllSelected ? allSelectedNode : itemsListStr}</TruncatedItemsList>
          {children}
        </Flex>
      </ReactSelectComponents.SelectContainer>
    );
  };

  return TruncatedValueAllSelectedLabelContainer;
};

export const TruncatedValueContainer = props => {
  const { selectProps, children } = props;
  const itemsList = (selectProps.value || []).map(({ label }) => label);
  const itemsListStr = itemsList.join(', ');

  return (
    <ReactSelectComponents.SelectContainer height="1em" {...props}>
      <Flex>
        <TruncatedItemsList title={itemsListStr}>{itemsListStr}</TruncatedItemsList>
        {children}
      </Flex>
    </ReactSelectComponents.SelectContainer>
  );
};

TruncatedValueContainer.propTypes = {
  selectProps: PropTypes.object,
  children: PropTypes.node,
};

export const getSelectFilterStyles = stylesFromProps => ({
  ...(stylesFromProps || null),
  control: (baseStyles, state) => {
    const styles = {
      ...baseStyles,
      background: '#F7F8FA',
      borderRadius: 100,
      padding: '0 8px',
      fontWeight: 500,
      borderColor: '#E8E9EB',
      ...(stylesFromProps?.control || null),
      '&:hover': {
        borderColor: '#C4C7CC',
      },
    };

    if (state.isFocused) {
      styles.background = 'white';
      styles.boxShadow = '0 0 0 2px black';
    }

    return styles;
  },
});

/**
 * A superset of `StyledSelect` with custom styles, to use for selects that contains
 * filters for lists.
 */
export const StyledSelectFilter = (props: StyledSelectProps) => {
  const styles = React.useMemo(() => getSelectFilterStyles(props.styles), [props.styles]);
  return (
    <StyledSelect minWidth={80} fontSize="12px" lineHeight="14px" isSearchable={false} {...props} styles={styles} />
  );
};
