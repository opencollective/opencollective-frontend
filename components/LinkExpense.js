import React from 'react';
import PropTypes from 'prop-types';

import Link from './Link';

const LinkExpense = ({ collective, expense, isV2, ...props }) => {
  const route = isV2 ? 'expense-v2' : 'expense';
  return (
    <Link
      route={route}
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
  isV2: PropTypes.bool,
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
