import React from 'react';
const ExpenseItem = ({ expense }) => {
  return (
    <div>
      <div>{expense.description}</div>
    </div>
  );
};
export default ExpenseItem;
