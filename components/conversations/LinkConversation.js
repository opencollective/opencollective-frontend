import React from 'react';
import PropTypes from 'prop-types';
import Link from '../Link';

const LinkConversations = ({ collective: { slug, parentCollective }, children }) => {
  const routeParams = { collectiveSlug: slug };

  if (parentCollective && parentCollective.slug) {
    routeParams.parentCollectiveSlug = parentCollective.slug;
    routeParams.collectiveType = 'events';
  }

  return (
    <Link route="conversations" params={routeParams}>
      {children}
    </Link>
  );
};

LinkConversations.propTypes = {
  children: PropTypes.node,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }).isRequired,
};

export default React.memo(LinkConversations);
