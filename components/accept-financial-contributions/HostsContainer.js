import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import NextLink from 'next/link';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import Hide from '../Hide';
import HorizontalScroller from '../HorizontalScroller';
import Loading from '../Loading';
import StyledButton from '../StyledButton';

import HostCollectiveCard from './HostCollectiveCard';

const LIMIT = 12; // nice round number to make even rows of 2, 3, 4

const AllCardsContainer = styled(Flex).attrs({
  flexWrap: 'wrap',
  width: '90%',
  justifyContent: 'space-evenly',
})``;

const AllCardsContainerMobile = styled(Flex)`
  overflow-x: auto;
  scroll-behavior: smooth;
  width: 95vw;
  padding: 16px;
`;

const CollectiveCardContainer = styled.div`
  width: 280px;
  padding: 20px 15px;
`;

class HostsContainer extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    onChange: PropTypes.func,
    data: PropTypes.object.isRequired,
    tags: PropTypes.array,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      seeMoreHosts: {
        id: 'fiscalHost.seeMoreHosts',
        defaultMessage: 'See more Hosts',
      },
    });
  }

  render() {
    const { onChange, data, intl } = this.props;

    if (!data.hosts || !data.hosts.nodes) {
      return (
        <Flex justifyContent="center" width="100%" py={4}>
          <Loading />
        </Flex>
      );
    }

    const hosts = [...data.hosts.nodes];

    return (
      <Flex flexDirection="column" flexGrow={1}>
        <Hide md lg>
          <HorizontalScroller>
            {ref => (
              <AllCardsContainerMobile ref={ref}>
                {hosts.map(host => (
                  <HostCollectiveCard
                    key={host.legacyId}
                    host={host}
                    collective={this.props.collective}
                    onChange={onChange}
                    style={{
                      flexBasis: 250,
                      height: 360,
                      marginRight: 20,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </AllCardsContainerMobile>
            )}
          </HorizontalScroller>
        </Hide>
        <Hide xs sm>
          <AllCardsContainer>
            {hosts.map(host => (
              <CollectiveCardContainer key={`${host.legacyId}-container`}>
                <HostCollectiveCard
                  key={host.legacyId}
                  host={host}
                  collective={this.props.collective}
                  onChange={onChange}
                  data-cy="afc-host-collective-card"
                />
              </CollectiveCardContainer>
            ))}
          </AllCardsContainer>
        </Hide>
        <Flex justifyContent="center" mt={[2, 0]} width={['100%', null, '90%']}>
          <NextLink href="hosts">
            <StyledButton fontSize="13px" buttonStyle="dark" minHeight="36px" mt={[2, 3]} mb={3} px={4}>
              {intl.formatMessage(this.messages.seeMoreHosts)}
            </StyledButton>
          </NextLink>
        </Flex>
      </Flex>
    );
  }
}

const hostsQuery = gqlV2/* GraphQL */ `
  query AcceptFinancialContributionsHosts($tags: [String], $limit: Int) {
    hosts(tags: $tags, limit: $limit) {
      totalCount
      nodes {
        id
        legacyId
        createdAt
        settings
        type
        name
        slug
        description
        longDescription
        currency
        totalHostedCollectives
        hostFeePercent
        stats {
          yearlyBudgetManaged {
            value
          }
        }
      }
    }
  }
`;

const addHostsData = graphql(hostsQuery, {
  options(props) {
    return {
      variables: {
        tags: props.tags,
        limit: LIMIT,
      },
      context: API_V2_CONTEXT,
    };
  },
});

export default injectIntl(addHostsData(HostsContainer));
