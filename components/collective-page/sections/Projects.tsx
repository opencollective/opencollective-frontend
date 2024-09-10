import React from 'react';
import { css } from '@styled-system/css';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/constants';
import ContributeProject from '../../contribute-cards/ContributeProject';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import SectionTitle from '../SectionTitle';

const CONTRIBUTE_CARD_PADDING_X = [15, 18];

const ContributeCardContainer = styled(Box).attrs({ px: CONTRIBUTE_CARD_PADDING_X })(
  css({
    scrollSnapAlign: ['center', null, 'start'],
  }),
);

type ProjectsProps = {
  collective: {
    slug: string;
    name: string;
    currency: string;
    isActive: string;
  };
  projects: { id: number; isArchived?: boolean; isActive?: boolean; contributors?: object[] }[];
  isAdmin: boolean;
  showTitle: boolean;
};

function getContributeCardsScrollDistance(width) {
  const oneCardScrollDistance = CONTRIBUTE_CARD_WIDTH + CONTRIBUTE_CARD_PADDING_X[0] * 2;
  if (width <= oneCardScrollDistance * 2) {
    return oneCardScrollDistance;
  } else if (width <= oneCardScrollDistance * 4) {
    return oneCardScrollDistance * 2;
  } else {
    return oneCardScrollDistance * 3;
  }
}

export default function Projects(props: ProjectsProps) {
  const { collective, isAdmin } = props;
  const projects = React.useMemo(() => {
    if (isAdmin) {
      return props.projects;
    }

    return props.projects.filter(p => !p.isArchived);
  }, [props.projects, isAdmin]);

  if ((projects.length === 0 || !collective.isActive) && !isAdmin) {
    return null;
  }

  return (
    <Box pt={[4, 5]} data-cy="Projects">
      <ContainerSectionContent>
        <SectionTitle>
          <FormattedMessage id="Projects" defaultMessage="Projects" />
        </SectionTitle>
        <P color="black.700" mb={4}>
          {isAdmin ? (
            <FormattedMessage
              id="CollectivePage.SectionProjects.AdminDescription"
              defaultMessage="Manage finances for a project or initiative separate from your collective budget."
            />
          ) : (
            <FormattedMessage
              id="CollectivePage.SectionProjects.Description"
              defaultMessage="Support the following initiatives from {collectiveName}."
              values={{ collectiveName: collective.name }}
            />
          )}
        </P>
      </ContainerSectionContent>

      <Box mb={4}>
        <HorizontalScroller container={ContributeCardsContainer} getScrollDistance={getContributeCardsScrollDistance}>
          {projects.map(project => (
            <Box key={project.id} px={CONTRIBUTE_CARD_PADDING_X}>
              <ContributeProject
                collective={collective}
                project={project}
                disableCTA={!project.isActive}
                hideContributors={!projects.some(project => project.contributors?.length)}
              />
            </Box>
          ))}
          {isAdmin && (
            <ContributeCardContainer minHeight={150}>
              <CreateNew route={`/${collective.slug}/projects/create`}>
                <FormattedMessage id="SectionProjects.CreateProject" defaultMessage="Create Project" />
              </CreateNew>
            </ContributeCardContainer>
          )}
        </HorizontalScroller>
        {Boolean(projects?.length) && (
          <ContainerSectionContent>
            <Link href={`/${collective.slug}/projects`}>
              <StyledButton mt={4} width={1} buttonSize="small" fontSize="14px">
                <FormattedMessage id="CollectivePage.SectionProjects.ViewAll" defaultMessage="View all projects" /> →
              </StyledButton>
            </Link>
          </ContainerSectionContent>
        )}
      </Box>
    </Box>
  );
}
