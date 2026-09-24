import React from 'react';

import type { StyledSelectProps } from './StyledSelect';
import StyledSelect from './StyledSelect';

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
 *
 * @deprecated Use `ui/Select` instead
 */
export const StyledSelectFilter = (props: StyledSelectProps) => {
  const styles = React.useMemo(() => getSelectFilterStyles(props.styles), [props.styles]);
  return (
    <StyledSelect minWidth={80} fontSize="12px" lineHeight="14px" isSearchable={false} {...props} styles={styles} />
  );
};
