import React from 'react';
import PropTypes from 'prop-types';
import Link from '../Link';

const LinkCreateConversation = ({ collective: { slug, parentCollective }, children }) => {
  const routeParams = { collectiveSlug: slug };

  if (parentCollective && parentCollective.slug) {
    routeParams.parentCollectiveSlug = parentCollective.slug;
    routeParams.collectiveType = 'events';
  }

  return (
    <Link route="create-conversation" params={routeParams}>
      {children}
    </Link>
  );
};

LinkCreateConversation.propTypes = {
  children: PropTypes.node,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }).isRequired,
};

export default React.memo(LinkCreateConversation);
