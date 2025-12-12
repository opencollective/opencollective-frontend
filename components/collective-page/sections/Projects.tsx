import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { get, isEmpty } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { PROJECTS_ORDER_KEY } from '../../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import type {
  ProjectsSectionSearchQuery,
  ProjectsSectionSearchQueryVariables,
} from '../../../lib/graphql/types/v2/graphql';
import useDebounced from '../../../lib/hooks/useDebounced';
import { sortProjects, updateCollectiveInGraphQLV1Cache } from '@/lib/collective';
import { EMPTY_ARRAY } from '@/lib/constants/utils';

import Container from '../../Container';
import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/constants';
import ContributeProject from '../../contribute-cards/ContributeProject';
import { EmptyResults } from '../../dashboard/EmptyResults';
import { Box } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import LoadingGrid from '../../LoadingGrid';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import { Input } from '../../ui/Input';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import { editAccountSettingMutation } from '../graphql/mutations';
import SectionTitle from '../SectionTitle';

// Dynamic imports
const AdminContributeCardsContainer = dynamic(() => import('../../contribute-cards/AdminContributeCardsContainer'), {
  ssr: false,
});

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

type ProjectsProps = {
  collective: {
    id: number;
    slug: string;
    name: string;
    currency: string;
    isActive: string;
    settings?: {
      [PROJECTS_ORDER_KEY]?: number[];
    };
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
  const hasProjectsSection = (props.projects.length >= 0 && collective.isActive) || isAdmin;

  const [searchTerm, setSearchTerm] = React.useState('');
  const [draggingId, setDraggingId] = React.useState<number | null>(null);
  const [showProjectsAdmin, setShowProjectsAdmin] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const deboucedSearchTerm = useDebounced(searchTerm, 1000);
  const isSearching = !isEmpty(deboucedSearchTerm);

  const [editAccountSettings, { loading: isSaving }] = useMutation(editAccountSettingMutation);
  const query = useQuery<ProjectsSectionSearchQuery, ProjectsSectionSearchQueryVariables>(
    gql`
      query ProjectsSectionSearch($slug: String, $searchTerm: String) {
        account(slug: $slug) {
          projects: childrenAccounts(accountType: [PROJECT], searchTerm: $searchTerm) {
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

  // Get project order keys and sort projects
  const projectOrderKeys = get(collective.settings, PROJECTS_ORDER_KEY, EMPTY_ARRAY) as number[];
  const sortedCollectiveProjects = React.useMemo(() => {
    return sortProjects(collectiveProjects, projectOrderKeys);
  }, [collectiveProjects, projectOrderKeys]);

  const getProjectCards = React.useMemo(() => {
    return sortedCollectiveProjects.map(project => ({
      key: project.id,
      Component: ContributeProject,
      componentProps: {
        collective,
        project,
        disableCTA: !project.isActive,
        hideContributors: !sortedCollectiveProjects.some(p => p.contributors?.length),
      },
    }));
  }, [sortedCollectiveProjects, collective]);

  const onProjectsReorder = React.useCallback(
    async (cards: Array<{ key: number }>) => {
      const cardKeys = cards.map(c => c.key);

      setError(null);
      try {
        await editAccountSettings({
          variables: {
            collectiveId: collective.id,
            key: PROJECTS_ORDER_KEY,
            value: cardKeys,
          },
          update: (store, response) => {
            // We need to update the store manually because the response comes from API V2
            updateCollectiveInGraphQLV1Cache(store, collective.id, {
              settings: response.data.editAccountSetting.settings,
            });
          },
        });
      } catch (e) {
        setError(getErrorFromGraphqlException(e));
      }
    },
    [collective, editAccountSettings],
  );

  const onProjectsAdminReady = React.useCallback(() => {
    setShowProjectsAdmin(true);
  }, []);

  const hasMore = isSearching && !query.loading && query.data?.account?.projects?.totalCount > searchProjects.length;
  const isLoadingSearch = isSearching && query.loading;
  const displayedProjects = !isSearching ? sortedCollectiveProjects : searchProjects;
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
        {collectiveProjects?.length > 10 && (
          <Input
            placeholder={intl.formatMessage({ defaultMessage: 'Search projects...', id: 'Dw9Bae' })}
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        )}
      </ContainerSectionContent>

      <Box mb={4}>
        <HorizontalScroller
          container={ContributeCardsContainer}
          getScrollDistance={getContributeCardsScrollDistance}
          containerProps={{ disableScrollSnapping: !!draggingId }}
        >
          {error && <MessageBoxGraphqlError mb={5} error={error} />}
          {isLoadingSearch && (
            <div className="ml-8 self-center">
              <LoadingGrid />
            </div>
          )}
          {isSearching && !isLoadingSearch && isEmpty(displayedProjects) && (
            <div className="ml-8 self-center">
              <div className="w-60 text-center">
                <EmptyResults onResetFilters={() => setSearchTerm('')} hasFilters={false} entityType="PROJECTS" />
              </div>
            </div>
          )}
          {!(isAdmin && showProjectsAdmin && !isSearching) &&
            displayedProjects.map(project => (
              <Box key={project.id} px={CONTRIBUTE_CARD_PADDING_X}>
                <ContributeProject
                  collective={collective}
                  project={project}
                  disableCTA={!project.isActive}
                  hideContributors={!displayedProjects.some(project => project.contributors?.length)}
                />
              </Box>
            ))}
          {isAdmin && !isSearching && (
            <Container display={showProjectsAdmin ? 'block' : 'none'} data-cy="admin-projects-cards">
              <AdminContributeCardsContainer
                createNewType="PROJECT"
                collective={collective}
                cards={getProjectCards}
                onReorder={onProjectsReorder}
                isSaving={isSaving}
                setDraggingId={setDraggingId}
                draggingId={draggingId}
                onMount={onProjectsAdminReady}
                enableReordering={true}
              />
            </Container>
          )}
          {hasMore && (
            <div className="self-center">
              <div className="w-60 text-center">
                <Link href={`/${collective.slug}/projects`}>
                  <FormattedMessage defaultMessage="More results" id="irPBg/" /> →
                </Link>
              </div>
            </div>
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
