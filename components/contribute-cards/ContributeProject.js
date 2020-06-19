import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'lodash';

import { ContributionTypes } from '../../lib/constants/contribution-types';

import Contribute from './Contribute';

/**
 * A contribute card specialized to display a Project.
 */
const ContributeProject = ({ collective, project, ...props }) => {
  const description = truncate(project.description, { length: 100 });
  const projectRouteParams = { parentCollectiveSlug: collective.slug, slug: project.slug };
  return (
    <Contribute
      route="project"
      routeParams={projectRouteParams}
      type={ContributionTypes.PROJECT}
      title={project.name}
      contributors={project.contributors}
      stats={project.stats.backers}
      image={project.backgroundImageUrl}
      {...props}
    >
      {description}
    </Contribute>
  );
};

ContributeProject.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    description: PropTypes.string,
    backgroundImageUrl: PropTypes.string,
    contributors: PropTypes.arrayOf(PropTypes.object),
    stats: PropTypes.shape({
      backers: PropTypes.object,
    }).isRequired,
  }),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
};

export default ContributeProject;
