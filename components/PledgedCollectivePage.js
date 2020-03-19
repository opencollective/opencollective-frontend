import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { useQuery } from '@apollo/react-hooks';
import { Box, Flex } from '@rebass/grid';
import gql from 'graphql-tag';
import { ExternalLinkAlt } from '@styled-icons/fa-solid/ExternalLinkAlt';

import { Link } from '../server/pages';

import Page from './Page';
import Container from './Container';
import { H2, H3, H5, P } from './Text';
import PledgeCard from './PledgeCard';
import StyledLink from './StyledLink';
import Currency from './Currency';
import { withUser } from './UserProvider';
import Loading from './Loading';
import MessageBox from './MessageBox';

const defaultPledgedLogo = '/static/images/default-pledged-logo.svg';

const CollectivePledgesQuery = gql`
  query CollectivePledges($id: Int!) {
    Collective(id: $id) {
      id
      pledges: orders(status: PENDING) {
        id
        currency
        interval
        publicMessage
        status
        totalAmount
        fromCollective {
          id
          name
          imageUrl(height: 128)
          slug
          type
          isIncognito
        }
      }
    }
  }
`;

/**
 * Display a collective with all its pledges
 */
const PledgedCollectivePage = ({ collective }) => {
  const { loading, error, data } = useQuery(CollectivePledgesQuery, { variables: { id: collective.id } });

  if (loading) {
    return (
      <Container py={[5, 6]}>
        <Loading />
      </Container>
    );
  } else if (error) {
    return (
      <Container py={[5, 6]}>
        <MessageBox type="error" withIcon>
          {error.toString()}
        </MessageBox>
      </Container>
    );
  }

  const pledges = [...data.Collective.pledges].reverse();
  const pledgeStats = pledges.reduce(
    (stats, { fromCollective, totalAmount }) => {
      stats[fromCollective.type]++;
      stats.total += totalAmount;
      return stats;
    },
    {
      USER: 0,
      ORGANIZATION: 0,
      COLLECTIVE: 0,
      total: 0,
    },
  );

  let website = collective.website;
  if (!website && collective.githubHandle) {
    website = `https://github.com/${collective.githubHandle}`;
  }

  return (
    <Page title={collective.name}>
      <Container
        background="linear-gradient(180deg, #DBECFF, #FFFFFF)"
        borderBottom="1px solid"
        borderColor="black.200"
        py={4}
      >
        <Flex alignItems="center" flexDirection="column">
          <img src={defaultPledgedLogo} alt="Pledged Collective" />

          <H2 as="h1">{collective.name}</H2>

          <Box mb={4} mt={3}>
            <StyledLink href={website} color="primary.500" fontSize="Caption">
              <ExternalLinkAlt size="1em" /> {website}
            </StyledLink>
          </Box>
        </Flex>
      </Container>

      <Container display="flex" justifyContent="center" position="relative" top={-30}>
        <Link route="createCollectivePledge" params={{ slug: collective.slug }} passHref>
          <StyledLink buttonStyle="primary" buttonSize="large">
            <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
          </StyledLink>
        </Link>
      </Container>

      <Container display="flex" alignItems="center" flexDirection="column" maxWidth={800} mx="auto" mt={4} px={3}>
        <H3 fontWeight="normal">
          <FormattedMessage
            id="pledge.stats"
            values={{
              both: pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE && pledgeStats.USER ? 1 : 0,
              orgCount: pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE,
              userCount: pledgeStats.USER,
              totalCount: pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE + pledgeStats.USER,
              currency: collective.currency,
              amount: (
                <Currency fontWeight="bold" value={pledgeStats.total} currency={collective.currency} precision={0} />
              ),
            }}
            defaultMessage="{orgCount, plural, =0 {} one {# organization} other {# organizations}} {both, plural, =0 {} one { and }} {userCount, plural, =0 {} one {# individual } other {# individuals }} {totalCount, plural, one {has } other {have }} already pledged a total of {amount} {currency}"
          />
        </H3>

        <P color="black.600" fontSize="Caption" my={4}>
          <FormattedMessage
            id="pledge.definition"
            defaultMessage="A pledge is a way for the community to show interest in supporting a cause or project that is not yet on
              Open Collective, just like {collective}. This will incentivize them to create a
              collective for their activities and offer you much more visibility on how your money is spent to advance
              their cause. Once they create it, you will receive an email to ask you to fulfill your pledge."
            values={{ collective: <strong>{collective.name}</strong> }}
          />
        </P>
      </Container>

      <Container display="flex" flexWrap="wrap" maxWidth={800} mx="auto" mb={5} px={3}>
        {pledges.map((pledge, index) => (
          <Container width={[0.5, null, 0.25]} mb={2} position="relative" px={1} minWidth={160} key={pledge.id}>
            {index === 0 && (
              <Container position="absolute" right={15} top={-10}>
                <img src="/static/icons/first-pledge-badge.svg" alt="first pledge" />
              </Container>
            )}
            <PledgeCard {...pledge} />
          </Container>
        ))}
      </Container>
      <Box px={3}>
        <Container
          alignItems="center"
          border="1px solid"
          borderColor="primary.300"
          borderRadius="12px"
          display="flex"
          flexDirection={['column', null, 'row']}
          maxWidth={800}
          mb={5}
          mx="auto"
          px={[3, null, 4]}
          py={4}
          width={1}
        >
          <Box width={[1, null, 0.65]}>
            <H5 textAlign="left" fontWeight="normal" mb={1}>
              <FormattedMessage
                id="pledge.ownerQuestion"
                defaultMessage="Do you own {collective}?"
                values={{ collective: <strong>{collective.name}</strong> }}
              />
            </H5>
            <P fontSize="Caption" color="black.500">
              <FormattedMessage
                id="pledge.ownerDetails"
                defaultMessage="You can claim this collective! You will be able to start raising funds and manage your expenses
                  transparently. We will contact the organizations and individuals who made commitment for them to
                  fulfill their pledge."
              />
            </P>
          </Box>
          <Flex width={[1, null, 0.35]} justifyContent="center" mt={[4, null, 0]}>
            <Link route="claimCollective" params={{ collectiveSlug: collective.slug }} passHref>
              <StyledLink textAlign="center" width={1} buttonSize="medium" buttonStyle="standard">
                <FormattedMessage id="pledge.claim" defaultMessage="Claim this collective" />
              </StyledLink>
            </Link>
          </Flex>
        </Container>
      </Box>
    </Page>
  );
};

PledgedCollectivePage.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    website: PropTypes.string,
    githubHandle: PropTypes.string,
  }).isRequired,
};

export default withUser(PledgedCollectivePage);
