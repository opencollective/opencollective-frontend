import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { ExternalLinkAlt } from '@styled-icons/fa-solid/ExternalLinkAlt';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import Currency from './Currency';
import { Box, Flex, Grid } from './Grid';
import I18nFormatters from './I18nFormatters';
import Link from './Link';
import Loading from './Loading';
import MessageBox from './MessageBox';
import Page from './Page';
import PledgeCard from './PledgeCard';
import StyledLink from './StyledLink';
import { H2, H3, H5, P } from './Text';
import { withUser } from './UserProvider';

const defaultPledgedLogo = '/static/images/default-pledged-logo.svg';

export const pledgedCollectivePageQuery = gql`
  query PledgedCollectivePage($id: Int!) {
    Collective(id: $id) {
      id
      pledges: orders(status: PLEDGED) {
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
  const { loading, error, data } = useQuery(pledgedCollectivePageQuery, { variables: { id: collective.id } });

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

  const pledges = [...data.Collective.pledges].reverse().filter(pledge => pledge.fromCollective);
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
          <Image src={defaultPledgedLogo} alt="Pledged Collective" height={128} width={128} />

          <H2 as="h1">{collective.name}</H2>

          <Box mb={4} mt={3}>
            <StyledLink href={website} color="primary.500" fontSize="12px" openInNewTabNoFollow>
              <ExternalLinkAlt size="1em" /> {website}
            </StyledLink>
          </Box>
        </Flex>
      </Container>

      <Container display="flex" justifyContent="center" position="relative" top={-30}>
        <Link href={`/${collective.slug}/pledges/new`}>
          <StyledLink buttonStyle="primary" buttonSize="large" data-cy="makeAPledgeButton">
            <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
          </StyledLink>
        </Link>
      </Container>

      <Container
        display="flex"
        alignItems="center"
        flexDirection="column"
        maxWidth={800}
        mx="auto"
        mt={4}
        px={3}
        data-cy="pledgeStats"
      >
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
                <Currency
                  data-cy="currencyAmount"
                  fontWeight="bold"
                  value={pledgeStats.total}
                  currency={collective.currency}
                  precision={0}
                />
              ),
            }}
            defaultMessage="{orgCount, plural, =0 {} one {# organization} other {# organizations}} {both, plural, =0 {} one { and }} {userCount, plural, =0 {} one {# individual } other {# individuals }} {totalCount, plural, one {has } other {have }} already pledged a total of {amount} {currency}"
          />
        </H3>

        <P color="black.600" fontSize="12px" lineHeight="18px" my={4}>
          <FormattedMessage
            id="pledge.definition"
            defaultMessage="A pledge is a way to show interest in supporting a cause or project that is not yet on Open Collective, just like {collective}. If they create a Collective, you will receive an email asking you to fulfill your pledge."
            values={{ collective: <strong>{collective.name}</strong> }}
          />
        </P>
      </Container>

      <Grid
        maxWidth={800}
        mx="auto"
        mb={5}
        px={3}
        data-cy="contributersGrouped"
        gridTemplateColumns="repeat(auto-fill, minmax(165px, 1fr))"
        gridGap={24}
      >
        {pledges.map((pledge, index) => (
          <Container position="relative" key={pledge.id} data-cy="contributers">
            {index === 0 && (
              <Container position="absolute" right={15} top={-10}>
                <Image src="/static/icons/first-pledge-badge.svg" alt="first pledge" width={32} height={32} />
              </Container>
            )}
            <PledgeCard {...pledge} />
          </Container>
        ))}
      </Grid>
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
          <Box>
            <H5 textAlign="left" fontWeight="normal" mb={1}>
              <FormattedMessage
                id="pledge.ownerQuestion"
                defaultMessage="Do you own {collective}?"
                values={{ collective: <strong>{collective.name}</strong> }}
              />
            </H5>
            <P fontSize="12px" color="black.500" mt={3}>
              <FormattedMessage
                id="pledge.contactToClaim"
                defaultMessage="To claim this Collective, contact <SupportLink></SupportLink>."
                values={I18nFormatters}
              />
            </P>
          </Box>
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
