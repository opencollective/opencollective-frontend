import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { css } from '@styled-system/css';
import { isEmpty } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import type {
  ProjectsSectionSearchQuery,
  ProjectsSectionSearchQueryVariables,
} from '../../../lib/graphql/types/v2/graphql';
import useDebounced from '../../../lib/hooks/useDebounced';

import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/constants';
import ContributeProject from '../../contribute-cards/ContributeProject';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import LoadingGrid from '../../LoadingGrid';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import { Input } from '../../ui/Input';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import SectionTitle from '../SectionTitle';

const ProjectSectionCardFields = gql`
  fragment ProjectSectionCardFields on Account {
    id
    legacyId
    slug
    name
    description
    imageUrl
    isActive
    isArchived
    backgroundImageUrl(height: 208)
  }
`;

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
  const intl = useIntl();
  const hasProjectsSection = (props.projects.length >= 0 && !collective.isActive) || isAdmin;

  const [searchTerm, setSearchTerm] = React.useState('');
  const deboucedSearchTerm = useDebounced(searchTerm, 1000);
  const isSearching = !isEmpty(deboucedSearchTerm);
  const query = useQuery<ProjectsSectionSearchQuery, ProjectsSectionSearchQueryVariables>(
    gql`
      query ProjectsSectionSearch($slug: String, $searchTerm: String) {
        account(slug: $slug) {
          projects: childrenAccounts(accountType: [PROJECT], term: $searchTerm) {
            totalCount
            nodes {
              ...ProjectSectionCardFields
            }
          }
        }
      }

      ${ProjectSectionCardFields}
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        slug: props.collective.slug,
        searchTerm: deboucedSearchTerm,
      },
      skip: !isSearching,
    },
  );

  const searchProjects = React.useMemo(
    () => (query.data?.account?.projects?.nodes || []).filter(p => isAdmin || !p.isArchived),
    [isAdmin, query.data?.account?.projects?.nodes],
  );
  const collectiveProjects = React.useMemo(
    () => props.projects.filter(p => isAdmin || !p.isArchived),
    [isAdmin, props.projects],
  );

  const isLoadingSearch = isSearching && query.loading;
  const displayedProjects = !isSearching ? collectiveProjects : searchProjects;
  if (!hasProjectsSection) {
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
        <Input
          placeholder={intl.formatMessage({ defaultMessage: 'Search projects...', id: 'Dw9Bae' })}
          type="search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </ContainerSectionContent>

      <Box mb={4}>
        <HorizontalScroller container={ContributeCardsContainer} getScrollDistance={getContributeCardsScrollDistance}>
          {isLoadingSearch && (
            <div className="ml-8 self-center">
              <LoadingGrid />
            </div>
          )}
          {isSearching && isEmpty(displayedProjects) && (
            <div className="ml-8 self-center">
              <FormattedMessage defaultMessage="No results match your search" id="qqqV4d" />
            </div>
          )}
          {displayedProjects.map(project => (
            <Box key={project.id} px={CONTRIBUTE_CARD_PADDING_X}>
              <ContributeProject
                collective={collective}
                project={project}
                disableCTA={!project.isActive}
                hideContributors={!displayedProjects.some(project => project.contributors?.length)}
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
        <ContainerSectionContent>
          <Link href={`/${collective.slug}/projects`}>
            <StyledButton mt={4} width={1} buttonSize="small" fontSize="14px">
              <FormattedMessage id="CollectivePage.SectionProjects.ViewAll" defaultMessage="View all projects" /> →
            </StyledButton>
          </Link>
        </ContainerSectionContent>
      </Box>
    </Box>
  );
}
