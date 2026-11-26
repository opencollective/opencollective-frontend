import React from 'react';

import type { StyledSelectProps } from './StyledSelect';
import StyledSelect from './StyledSelect';

export const getSelectFilterStyles = (stylesFromProps = undefined) => ({
  ...(stylesFromProps || null),
  control: (baseStyles, state) => {
    const styles = {
      ...baseStyles,
      background: 'var(--color-gray-50)',
      borderRadius: 100,
      padding: '0 8px',
      fontWeight: 500,
      borderColor: 'var(--color-gray-200)',
      ...(stylesFromProps?.control || null),
      '&:hover': {
        borderColor: 'var(--color-gray-300)',
      },
    };

    if (state.isFocused) {
      styles.background = 'var(--color-white)';
      styles.boxShadow = '0 0 0 2px var(--color-gray-900)';
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
