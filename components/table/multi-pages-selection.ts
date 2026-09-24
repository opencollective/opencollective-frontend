type MultiPagesRowSelectionState = {
  rows: Record<string, boolean>;
  includeAllPages: boolean;
};

export const MultiPagesRowSelectionInitialState: MultiPagesRowSelectionState = {
  rows: {},
  includeAllPages: false,
} as const;

/**
 * A simpler reducer to manage multi pages row selection with `DataTable`.
 * To use, simply pass
 */
export const multiPagesRowSelectionReducer = (
  state: MultiPagesRowSelectionState,
  action: { type: 'SELECT_ALL_PAGES' } | { type: 'CLEAR' } | { type: 'SET'; rows: Record<string, boolean> },
) => {
  switch (action.type) {
    case 'SET':
      return { ...state, rows: action.rows, includeAllPages: false };
    case 'SELECT_ALL_PAGES':
      return { ...state, includeAllPages: !state.includeAllPages };
    case 'CLEAR':
      return MultiPagesRowSelectionInitialState;
    default:
      return state;
  }
};
