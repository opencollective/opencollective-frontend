import React from 'react';
import { groupBy, isEmpty } from 'lodash';
import { LayoutDashboard, Plus } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import type LoggedInUser from '../../lib/LoggedInUser';
import type { WorkspaceAccount } from '../../lib/LoggedInUser';
import { getDashboardRoute } from '../../lib/url-helpers';
import Avatar from '../Avatar';
import Collapse from '../Collapse';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { P } from '../Text';
import { Separator } from '../ui/Separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  padding-top: 12px;
  h3 {
    font-size: 12px;
    font-weight: 600;
    color: #656d76;
    letter-spacing: 0;
    line-height: 20px;
    margin: 0;
    padding: 0 8px;
  }
`;

const MenuLink = styled(Link)`
  display: flex;
  align-items: center;
  grid-gap: 8px;
  cursor: pointer;
  &:hover {
    background: #f8fafc;
  }
  positon: relative;
  padding: 8px;
  border-radius: 8px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  svg {
    color: #4b5563;
  }
`;

const CollectiveListItem = styled.div`
  position: relative;
  @media (hover: hover) {
    :hover a.dashboardLink {
      opacity: 1;
    }
  }
  @media (hover: none) {
    a.dashboardLink {
      opacity: 1;
    }
  }
`;

interface WorkspaceLineProps {
  user?: LoggedInUser;
  closeDrawer?(...args: unknown[]): unknown;
  workspace: WorkspaceAccount;
}

const WorkspaceLine = ({ user, workspace, closeDrawer }: WorkspaceLineProps) => {
  return (
    <CollectiveListItem className="group h-9">
      <MenuLink href={`/${workspace.slug}`} onClick={closeDrawer}>
        <Avatar collective={workspace} radius={16} />
        <P
          fontSize="inherit"
          fontWeight="inherit"
          lineHeight="inherit"
          color="inherit"
          letterSpacing={0}
          truncateOverflow
        >
          {workspace.name}
        </P>
      </MenuLink>

      {Boolean(user?.canSeeAdminPanel(workspace)) && (
        <div className="absolute top-1 right-1 bottom-1">
          <Tooltip>
            <TooltipTrigger>
              <Link
                className="flex h-7 w-7 items-center justify-center rounded-md border bg-white text-slate-950 opacity-0 transition-all group-hover:opacity-100 hover:border-white hover:bg-slate-900 hover:text-white"
                href={getDashboardRoute(workspace)}
                onClick={closeDrawer}
              >
                <LayoutDashboard size="14px" strokeWidth={1.5} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">
              <FormattedMessage defaultMessage="Go to Dashboard" id="LxSJOb" />
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </CollectiveListItem>
  );
};

const sortWorkspaces = (workspaces: WorkspaceAccount[]) => {
  if (!workspaces?.length) {
    return [];
  }
  return [...workspaces].sort((a, b) => a.slug.localeCompare(b.slug));
};

/** Filter workspaces to active, non-event/project accounts (workspaces resolver already filters by role) */
const filterActiveWorkspaces = (workspaces: WorkspaceAccount[]) => {
  return workspaces.filter(w => {
    if (w.isArchived) {
      return false;
    }
    if (['EVENT', 'PROJECT', 'USER', 'INDIVIDUAL'].includes(w.type)) {
      return false;
    }
    return true;
  });
};

const filterArchivedWorkspaces = (workspaces: WorkspaceAccount[]) => {
  return workspaces.filter(w => w.isArchived && !['EVENT', 'PROJECT', 'USER', 'INDIVIDUAL'].includes(w.type));
};

interface WorkspacesListProps {
  user?: LoggedInUser;
  workspaces?: WorkspaceAccount[];
  closeDrawer?(...args: unknown[]): unknown;
}

const WorkspacesList = ({ user, workspaces, closeDrawer }: WorkspacesListProps) => {
  return (
    <Box as="ul" p={0} my={2}>
      {sortWorkspaces(workspaces).map(ws => (
        <WorkspaceLine key={ws.id} workspace={ws} user={user} closeDrawer={closeDrawer} />
      ))}
    </Box>
  );
};

/**
 * Keys must be collective types, as they're used to filter the `groupedMemberships`.
 * The order of the keys in this object defines order in the menu.
 *
 * Properties:
 * - title: i18n string for the title
 * - emptyMessage: (optional) i18n string for the message when there are no memberships. If not provided, the section will not be shown.
 * - plusButton: (optional) properties to display a (+) button next to the title
 *  - href: link to the page to open when the button is clicked
 *  - text: i18n alt string for the button (accessibility)
 */
const MENU_SECTIONS = {
  [CollectiveType.COLLECTIVE]: {
    title: defineMessage({ id: 'collective', defaultMessage: 'My Collectives' }),
    emptyMessage: defineMessage({
      defaultMessage: 'Create a collective to collect and spend money transparently',
      id: 'MZB6HL',
    }),
    plusButton: {
      text: defineMessage({ id: 'home.create', defaultMessage: 'Create a Collective' }),
      href: '/signup/collective',
    },
  },
  [CollectiveType.FUND]: {
    title: defineMessage({ id: 'funds', defaultMessage: 'My Funds' }),
    plusButton: {
      text: defineMessage({ id: 'createFund.create', defaultMessage: 'Create a Fund' }),
      href: '/fund/create',
    },
  },
  [CollectiveType.ORGANIZATION]: {
    title: defineMessage({ id: 'organization', defaultMessage: 'My Organizations' }),
    emptyMessage: defineMessage({
      defaultMessage: 'A profile representing a company or organization instead of an individual',
      id: 'CBITv6',
    }),
    plusButton: {
      text: defineMessage({ id: 'host.organization.create', defaultMessage: 'Create an Organization' }),
      href: '/signup/organization',
    },
  },
  ARCHIVED: {
    title: defineMessage({ id: 'Archived', defaultMessage: 'Archived' }),
  },
};

const MenuSectionHeader = ({ section, hidePlusIcon, closeDrawer }) => {
  const intl = useIntl();
  const { title, plusButton } = MENU_SECTIONS[section];
  return (
    <Flex alignItems="center" justifyContent="space-between">
      <p className="px-2 text-xs font-medium text-slate-600">{intl.formatMessage(title)}</p>

      {Boolean(!hidePlusIcon && plusButton) && (
        <Tooltip>
          <TooltipTrigger>
            <Link
              href={plusButton.href}
              aria-label={intl.formatMessage(plusButton.text)}
              onClick={closeDrawer}
              tabIndex={-1}
              className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full border"
            >
              <Plus size={12} color="#76777A" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left">{intl.formatMessage(plusButton.text)}</TooltipContent>
        </Tooltip>
      )}
    </Flex>
  );
};

type ProfileMenuMembershipsProps = {
  user: LoggedInUser;
  closeDrawer: () => void;
};

const ProfileMenuMemberships = ({ user, closeDrawer }: ProfileMenuMembershipsProps) => {
  const intl = useIntl();
  const workspaces = user.workspaces || [];
  const activeWorkspaces = filterActiveWorkspaces(workspaces);
  const archivedWorkspaces = filterArchivedWorkspaces(workspaces);
  const groupedWorkspaces: Record<string, WorkspaceAccount[]> = {
    ...groupBy(activeWorkspaces, w => w.type),
    ARCHIVED: archivedWorkspaces,
  };
  const shouldDisplaySection = section => {
    return MENU_SECTIONS[section].emptyMessage || !isEmpty(groupedWorkspaces[section]);
  };

  return (
    <React.Fragment>
      {Object.keys(MENU_SECTIONS)
        .filter(shouldDisplaySection)
        .map((accountType, i) => {
          const sectionWorkspaces = groupedWorkspaces[accountType];
          const sectionIsEmpty = isEmpty(sectionWorkspaces);
          const sectionData = MENU_SECTIONS[accountType];
          return (
            <React.Fragment key={accountType}>
              {i !== 0 && <Separator />}
              <AccountList>
                {accountType !== 'ARCHIVED' && (
                  <MenuSectionHeader section={accountType} hidePlusIcon={sectionIsEmpty} closeDrawer={closeDrawer} />
                )}
                {sectionIsEmpty ? (
                  <div className="m-2">
                    <p className="text-xs text-muted-foreground">{intl.formatMessage(sectionData.emptyMessage)}</p>
                    {Boolean(sectionData.plusButton) && (
                      <Link href={sectionData.plusButton.href} onClick={closeDrawer}>
                        <StyledButton mt="12px" mb="16px" borderRadius="8px" width="100%" fontSize="12px">
                          <Flex alignItems="center" justifyContent="center">
                            <Container
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                              borderRadius="100%"
                              border="1px solid #C4C7CC"
                              mr="16px"
                              width="24px"
                              height="24px"
                            >
                              <Plus size={12} />
                            </Container>
                            <span>{intl.formatMessage(sectionData.plusButton.text)}</span>
                          </Flex>
                        </StyledButton>
                      </Link>
                    )}
                  </div>
                ) : accountType === 'ARCHIVED' ? (
                  <Collapse
                    buttonSize={24}
                    defaultIsOpen={false}
                    mr={'6px'}
                    title={
                      <MenuSectionHeader
                        section={accountType}
                        hidePlusIcon={sectionIsEmpty}
                        closeDrawer={closeDrawer}
                      />
                    }
                  >
                    <WorkspacesList workspaces={sectionWorkspaces} user={user} closeDrawer={closeDrawer} />
                  </Collapse>
                ) : (
                  <WorkspacesList workspaces={sectionWorkspaces} user={user} closeDrawer={closeDrawer} />
                )}
              </AccountList>
            </React.Fragment>
          );
        })}
    </React.Fragment>
  );
};

export default React.memo(ProfileMenuMemberships);
