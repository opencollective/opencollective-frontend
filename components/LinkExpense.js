import React from 'react';
import PropTypes from 'prop-types';

import Link from './Link';

const LinkExpense = ({ collective, expense, ...props }) => {
  return (
    <Link
      route="expense-v2"
      params={{
        parentCollectiveSlug: collective.parentCollective?.slug,
        collectiveType: collective.parentCollective ? 'events' : undefined,
        collectiveSlug: collective.slug,
        ExpenseId: expense.legacyId || expense.id,
      }}
      {...props}
    />
  );
};

LinkExpense.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }).isRequired,
  expense: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    legacyId: PropTypes.number,
  }).isRequired,
};

export default LinkExpense;
