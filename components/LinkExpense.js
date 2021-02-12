import React from 'react';
import PropTypes from 'prop-types';
import NextLink from 'next/link';

import { getCollectiveTypeForUrl } from '../lib/collective.lib';

const LinkExpense = ({ collective, expense, ...props }) => {
  const collectiveType = collective.parent ? getCollectiveTypeForUrl(collective) : undefined;
  const expenseId = expense.legacyId || expense.id;

  return (
    <NextLink
      href={`${collective.parent?.slug}/${collectiveType}/${collective.slug}/expenses/${expenseId}`}
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
