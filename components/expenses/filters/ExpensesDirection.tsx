import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

// import StyledFilters from '../../StyledFilters';
import Tabs from '../../ui/tabs';

const I18NLabels = defineMessages({
  RECEIVED: { id: 'Expense.Direction.Received', defaultMessage: 'Received' },
  SUBMITTED: { id: 'Expense.Direction.Submitted', defaultMessage: 'Submitted' },
});

const DIRECTIONS = Object.keys(I18NLabels);

type ExpensesDirectionProps = {
  value: 'RECEIVED' | 'SUBMITTED' | null | undefined;
  onChange: (direction: 'RECEIVED' | 'SUBMITTED') => void;
};

export const ExpensesDirection = ({ onChange, value }: ExpensesDirectionProps) => {
  const intl = useIntl();
  return (
    <Tabs
      filters={DIRECTIONS}
      selected={value || DIRECTIONS[0]}
      onChange={onChange}
      getLabel={value => intl.formatMessage(I18NLabels[value])}
    />
  );

  // return (
  //   <StyledFilters
  //     filters={DIRECTIONS}
  //     selected={value || DIRECTIONS[0]}
  //     minButtonWidth="100%"
  //     onChange={onChange}
  //     getLabel={value => intl.formatMessage(I18NLabels[value])}
  //     buttonGrow={1}
  //   />
  // );
};
