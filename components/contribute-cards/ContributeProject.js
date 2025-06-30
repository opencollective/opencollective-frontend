import React from 'react';
import { truncate } from 'lodash';

import { ContributionTypes } from '../../lib/constants/contribution-types';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import Link from '../Link';
import StyledLink from '../StyledLink';

import Contribute from './Contribute';

/**
 * A contribute card specialized to display a Project.
 */
const ContributeProject = ({ collective, project, ...props }) => {
  const description = truncate(project.description, { length: 100 });
  return (
    <Contribute
      route={`${getCollectivePageRoute(collective)}/projects/${project.slug}`}
      type={project.isArchived ? ContributionTypes.ARCHIVED_PROJECT : ContributionTypes.PROJECT}
      contributors={project.contributors}
      stats={project.stats?.backers}
      image={project.backgroundImageUrl}
      title={
        <StyledLink as={Link} color="black.800" href={`/${collective.slug}/projects/${project.slug}`}>
          {project.name}
        </StyledLink>
      }
      {...props}
    >
      {description}
    </Contribute>
  );
};

export default ContributeProject;
