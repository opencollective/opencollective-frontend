import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import memoizeOne from 'memoize-one';

import roles from '../../constants/roles';
import { H3, P } from '../Text';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledMembershipCard from '../StyledMembershipCard';

import ContainerSectionContent from './ContainerSectionContent';
import EmptyCollectivesSectionImageSVG from './EmptyCollectivesSectionImage.svg';

class SectionCollectives extends React.PureComponent {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,

    /** @ignore from withData */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      Collective: PropTypes.shape({
        memberOf: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            role: PropTypes.string.isRequired,
            since: PropTypes.string.isRequired,
            collective: PropTypes.shape({
              id: PropTypes.number.isRequired,
              name: PropTypes.string.isRequired,
              slug: PropTypes.string.isRequired,
            }),
          }),
        ),
      }),
    }),
  };

  /** Return unique members, pick based on role */
  getUniqueMemberships = memoizeOne(memberOf => {
    const ROLES_WEIGHT = {
      [roles.FUNDRAISER]: 1,
      [roles.MEMBER]: 2,
      [roles.BACKER]: 3,
      [roles.CONTRIBUTOR]: 4,
      [roles.ADMIN]: 5,
    };

    const hasMorePriority = (member1, member2) => {
      return ROLES_WEIGHT[member1.role] > ROLES_WEIGHT[member2.role];
    };

    const membershipsMap = memberOf.reduce((result, member) => {
      const existingMember = result[member.collective.id];
      if (!existingMember || hasMorePriority(member, existingMember)) {
        result[member.collective.id] = member;
      }
      return result;
    }, {});

    return Object.values(membershipsMap);
  });

  render() {
    const { collective, data } = this.props;

    if (data.loading) {
      return <LoadingPlaceholder height={600} borderRadius={0} />;
    }

    const memberships = this.getUniqueMemberships(data.Collective.memberOf);
    return (
      <ContainerSectionContent pt={5} pb={6}>
        {memberships.length === 0 ? (
          <Flex flexDirection="column" alignItems="center">
            <img src={EmptyCollectivesSectionImageSVG} alt="" />
            <P color="black.600" fontSize="LeadParagraph" mt={5}>
              <FormattedMessage
                id="CollectivePage.SectionCollectives.Empty"
                defaultMessage="{collectiveName} seems to be hibernating on a cave in the North Pole ❄️☃️!"
                values={{ collectiveName: collective.name }}
              />
            </P>
          </Flex>
        ) : (
          <React.Fragment>
            <H3 mb={4} fontSize={['H4', 'H2']} fontWeight="normal" color="black.900">
              <FormattedMessage id="CollectivePage.SectionCollectives.Title" defaultMessage="Collectives" />
            </H3>
            <Flex flexWrap="wrap">
              {memberships.map(membership => (
                <Box key={membership.id} mr={35} mb={40}>
                  <StyledMembershipCard
                    role={membership.role}
                    description={membership.description}
                    since={membership.since}
                    toCollective={membership.collective}
                  />
                </Box>
              ))}
            </Flex>
          </React.Fragment>
        )}
      </ContainerSectionContent>
    );
  }
}

export default React.memo(
  graphql(
    gql`
      query SectionCollective($id: Int!) {
        Collective(id: $id) {
          id
          memberOf {
            id
            role
            since
            description
            collective {
              id
              name
              slug
              description
            }
          }
        }
      }
    `,
    {
      options(props) {
        return { variables: { id: props.collective.id } };
      },
    },
  )(SectionCollectives),
);
