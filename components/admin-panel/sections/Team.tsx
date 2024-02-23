import React from 'react';
import { useQuery } from '@apollo/client';
import { Edit } from '@styled-icons/material/Edit';
import { get, truncate } from 'lodash';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { FEATURES, isFeatureEnabled } from '../../../lib/allowed-features';
import { CollectiveType } from '../../../lib/constants/collectives';
import roles from '../../../lib/constants/roles';
import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import type {
  Account,
  AccountWithHost,
  AccountWithParent,
  Member,
  MemberInvitation,
} from '../../../lib/graphql/types/v2/graphql';
import formatMemberRole from '../../../lib/i18n/member-role';
import { getCollectivePageRoute } from '../../../lib/url-helpers';

import Avatar from '../../Avatar';
import Container from '../../Container';
import DashboardHeader from '../../dashboard/DashboardHeader';
import type { DashboardSectionProps } from '../../dashboard/types';
import EditMemberModal from '../../edit-collective/sections/team/EditMemberModal';
import InviteMemberModal from '../../edit-collective/sections/team/InviteMemberModal';
import { teamSectionQuery } from '../../edit-collective/sections/team/queries';
import ResendMemberInviteBtn from '../../edit-collective/sections/team/ResendMemberInviteBtn';
import { Box, Flex, Grid } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Link from '../../Link';
import Loading from '../../Loading';
import MemberRoleDescription from '../../MemberRoleDescription';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledHr from '../../StyledHr';
import StyledRoundButton from '../../StyledRoundButton';
import StyledTag from '../../StyledTag';
import StyledTooltip from '../../StyledTooltip';
import { P } from '../../Text';

const MemberContainer = styled(Container)`
  display: block;
  min-width: 164px;
  background: white;
  width: 170px;
  height: 270px;
  border-radius: 8px;
  border: 1px solid #c0c5cc;
`;

const InviteNewCard = styled(MemberContainer)`
  border: 1px dashed #c0c5cc;
  cursor: pointer;
`;

/** A container to center the logo above a horizontal bar */
const MemberLogoContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  border-top: 1px solid #e6e8eb;
`;

type MemberCardProps = {
  member: Partial<Member & MemberInvitation>;
  account: Partial<Account & AccountWithHost & AccountWithParent>;
  index: number;
  nbAdmins?: number;
  refetch: () => void;
};

const MemberCard = ({ member, account, index, nbAdmins, refetch }: MemberCardProps) => {
  const intl = useIntl();
  const [showEditModal, setShowEditModal] = React.useState(false);
  const isInvitation = member.__typename === 'MemberInvitation';
  const isInherited = member.inherited;
  const memberCollective = member.account;
  const collectiveId = memberCollective.id;
  const memberKey = member.id ? `member-${member.id}` : `collective-${collectiveId}`;
  const isAdmin = member.role === roles.ADMIN;
  const isLastAdmin =
    isAdmin && member.id && nbAdmins <= (account.host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins || 1);

  return (
    <MemberContainer position="relative" key={`member-${index}-${memberKey}-${account.id}`} data-cy={`member-${index}`}>
      <Container position="absolute" top="0.65rem" right="0.65rem">
        {showEditModal && (
          <EditMemberModal
            key={`member-edit-modal-${index}-${memberKey}`}
            intl={intl}
            member={member}
            collective={account}
            cancelHandler={() => setShowEditModal(false)}
            onEdit={refetch}
            isLastAdmin={isLastAdmin}
            canRemove={!isLastAdmin}
          />
        )}
        <StyledTooltip
          noTooltip={!isInherited}
          content={
            <FormattedMessage
              id="MemberEdit.Disable.Inherited"
              defaultMessage="This member is inherited from {parentCollectiveName} and cannot be removed."
              values={{ parentCollectiveName: account.parent?.name }}
            />
          }
        >
          <StyledRoundButton onClick={() => setShowEditModal(true)} size={26} disabled={isInherited}>
            <Edit height={16} />
          </StyledRoundButton>
        </StyledTooltip>
        {/* )} */}
      </Container>
      <Flex flexDirection="column" alignItems="center" mb={2}>
        <MemberLogoContainer mt={50}>
          <Avatar mt={-28} src={get(memberCollective, 'imageUrl')} radius={56} />
        </MemberLogoContainer>
        <P fontSize="14px" lineHeight="20px" m={2} textAlign="center">
          {get(memberCollective, 'name')}
        </P>
        <StyledTag textTransform="uppercase" display="block" mb={2} closeButtonProps={false}>
          {formatMemberRole(intl, get(member, 'role'))}
        </StyledTag>
        <P fontSize="10px" lineHeight="14px" fontWeight={400} color="#9D9FA3" mb={2}>
          <FormattedMessage id="user.since.label" defaultMessage="Since" />:{' '}
          <FormattedDate value={get(member, 'since')} />
        </P>
        {!isInvitation && (
          <Box mb={4} overflow="hidden" height={32}>
            <P fontSize="11px" lineHeight="16px" mx={2} fontWeight={400}>
              {truncate(get(member, 'description'), {
                length: 30,
              })}
            </P>
          </Box>
        )}
        {isInvitation && (
          <React.Fragment>
            <Box mb={4}>
              <StyledTooltip
                content={
                  <FormattedMessage
                    id="members.pending.details"
                    defaultMessage="This person has not accepted their invitation yet"
                  />
                }
              >
                <StyledTag
                  data-cy="member-pending-tag"
                  textTransform="uppercase"
                  display="block"
                  type="info"
                  closeButtonProps={false}
                >
                  <FormattedMessage id="Pending" defaultMessage="Pending" />
                </StyledTag>
              </StyledTooltip>
            </Box>
            <ResendMemberInviteBtn member={member} collective={account} />
          </React.Fragment>
        )}
      </Flex>
    </MemberContainer>
  );
};

type ChildrenCollectiveSectionProps = {
  account: Partial<Account & AccountWithHost & AccountWithParent>;
  refetch: () => void;
};

const ChildrenCollectiveSection = ({ account, refetch }: ChildrenCollectiveSectionProps) => {
  return (
    <React.Fragment>
      <Box>
        <P fontSize="16px" mt={4}>
          {account.name}
        </P>
      </Box>
      <Grid
        mt={3}
        gridGap={20}
        gridTemplateColumns="repeat(auto-fill, 164px)"
        flexGrow="1"
        gap="2px"
        justifyContent={['center', null, 'start']}
      >
        {account.members.nodes.map((m: Member & MemberInvitation, idx) => (
          <MemberCard key={`${m.id}-${account.id}`} index={idx} member={m} account={account} refetch={refetch} />
        ))}
      </Grid>
    </React.Fragment>
  );
};

const Team = ({ accountSlug }: DashboardSectionProps) => {
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const intl = useIntl();
  const { loading, data, refetch, error } = useQuery(teamSectionQuery, {
    context: API_V2_CONTEXT,
    variables: { collectiveSlug: accountSlug, account: { slug: accountSlug } },
  });

  const host = data?.account?.host;
  const members = [...(data?.account?.members?.nodes || []), ...(data?.memberInvitations || [])];
  const nbAdmins = members.filter(m => m.role === roles.ADMIN && m.id).length;
  const childrenAccountsWithMembers =
    data?.account?.childrenAccounts?.nodes?.filter(child => child.members?.nodes?.length > 0) || [];

  return (
    <div className="max-w-screen-lg">
      <DashboardHeader title={<FormattedMessage id="Team" defaultMessage="Team" />} />

      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBox type="error" withIcon fontSize="13px">
          {i18nGraphqlException(intl, error)}
        </MessageBox>
      ) : data?.account?.isFrozen ? (
        <MessageBox type="warning" fontSize="13px" withIcon>
          <FormattedMessage defaultMessage="This account is currently frozen, its team members therefore cannot be edited." />{' '}
          {isFeatureEnabled(data.account.host, FEATURES.CONTACT_FORM) && (
            <FormattedMessage
              defaultMessage="Please <ContactLink>contact</ContactLink> your fiscal host for more details."
              values={{ ContactLink: getI18nLink({ href: `${getCollectivePageRoute(data.account.host)}/contact` }) }}
            />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <Box>
            {[CollectiveType.COLLECTIVE, CollectiveType.FUND].includes(data?.account?.type) &&
              Boolean(host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins) && (
                <P lineHeight="20px" letterSpacing="normal" mt={3}>
                  <FormattedMessage
                    defaultMessage="Your host requires that Collectives have {numberOfAdmins, plural, one {# active administrator} other {# active administrators} }."
                    values={host.policies.COLLECTIVE_MINIMUM_ADMINS}
                  />
                  {host?.policies?.COLLECTIVE_MINIMUM_ADMINS.freeze && (
                    <React.Fragment>
                      &nbsp;
                      <FormattedMessage
                        defaultMessage="In case of a shortfall, your collective will be frozen until the minimum required administrators are added."
                        values={host.policies.COLLECTIVE_MINIMUM_ADMINS}
                      />
                    </React.Fragment>
                  )}
                </P>
              )}

            {host?.policies?.COLLECTIVE_MINIMUM_ADMINS &&
              nbAdmins < host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins && (
                <MessageBox type="error" my={3} fontSize="13px">
                  <FormattedMessage
                    defaultMessage="Your collective doesn’t meet the requirements of having a minimum of {numberOfAdmins, plural, one {# administrator} other {# administrators} }. Add more administrators to comply with your host’s policy."
                    values={host.policies.COLLECTIVE_MINIMUM_ADMINS}
                  />
                </MessageBox>
              )}

            <StyledHr mt={3} borderColor="black.200" flex="1 1" />
            <P as="ul" fontSize="14px" lineHeight="18px" mt={4}>
              {[roles.ADMIN, roles.MEMBER, roles.ACCOUNTANT].map(role => (
                <Box as="li" key={role} mb={2}>
                  {MemberRoleDescription({ role })}
                </Box>
              ))}
            </P>
          </Box>

          <Grid
            mt={4}
            gridGap={20}
            gridTemplateColumns="repeat(auto-fill, 164px)"
            flexGrow="1"
            gap="2px"
            justifyContent={['center', null, 'start']}
          >
            <InviteNewCard>
              <Flex alignItems="center" justifyContent="center" height="100%" onClick={() => setShowInviteModal(true)}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                  <StyledRoundButton data-cy="invite-member-btn" buttonStyle="dark" fontSize={25}>
                    +
                  </StyledRoundButton>
                  <P mt={3} color="black.700">
                    <FormattedMessage id="editTeam.member.invite" defaultMessage="Invite Team Member" />
                  </P>
                </Flex>
              </Flex>
            </InviteNewCard>
            {members.map((m, idx) => (
              <MemberCard
                key={`${m.id}-${data?.account.id}`}
                index={idx}
                member={m}
                account={data?.account}
                nbAdmins={nbAdmins}
                refetch={refetch}
              />
            ))}
          </Grid>

          {childrenAccountsWithMembers.length > 0 && (
            <React.Fragment>
              <P fontSize="18px" fontWeight="700" lineHeight="32px" mt={5}>
                <FormattedMessage id="OtherAdmins" defaultMessage="Other Admins" />
              </P>
              <P>
                <FormattedMessage defaultMessage="This collective has Events and Projects that hold members with privileged access roles outside your admin team." />
              </P>
              {childrenAccountsWithMembers.map(child => (
                <ChildrenCollectiveSection account={child} key={child.id} refetch={refetch} />
              ))}
            </React.Fragment>
          )}

          <Flex justifyContent="center" flexWrap="wrap" mt={5}>
            <Link href={`/${accountSlug}`}>
              <StyledButton mx={2} minWidth={200}>
                <FormattedMessage id="ViewCollectivePage" defaultMessage="View Profile page" />
              </StyledButton>
            </Link>
          </Flex>
          {showInviteModal && (
            <InviteMemberModal
              intl={intl}
              collective={data?.account}
              membersIds={members.map(m => m.id)}
              cancelHandler={() => setShowInviteModal(false)}
            />
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default Team;
