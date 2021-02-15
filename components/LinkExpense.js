import React from 'react';
import PropTypes from 'prop-types';

import { getCollectiveTypeForUrl } from '../lib/collective.lib';

import Link from './Link';

const LinkExpense = ({ collective, expense, ...props }) => {
  const collectiveType = collective.parent ? getCollectiveTypeForUrl(collective) : '';
  const collectiveTypeRoute = collectiveType ? `${collectiveType}/` : '';
  const parentCollectiveSlugRoute = collective.parent?.slug ? `${collective.parent?.slug}/` : '';
  const expenseId = expense.legacyId || expense.id;

  return (
    <Link
      href={`${parentCollectiveSlugRoute}${collectiveTypeRoute}${collective.slug}/expenses/${expenseId}`}
      {...props}
    />
  );
};

LinkExpense.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }).isRequired,
  expense: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    legacyId: PropTypes.number,
  }).isRequired,
};

export default LinkExpense;
