import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';
import { FormattedMessage, FormattedHTMLMessage } from 'react-intl';
import { graphql } from 'react-apollo';

import Container from '../../Container';
import BackButton from '../BackButton';
import StyledLink from '../../StyledLink';
import { H1, P, H3, Span } from '../../Text';
import Currency from '../../Currency';
import { Router } from '../../../server/pages';
import StyledCollectiveCard from '../../StyledCollectiveCard';
import StyledButton from '../../StyledButton';
import Link from '../../Link';

const featuredHostsSlugs = ['opensource', 'wwcodeinc', 'paris', 'allforclimate'];

const HostsWrapper = styled(Flex)`
  overflow-x: auto;
`;

const ApplyButton = styled(StyledButton)`
  font-weight: 500;
  font-size: ${props => props.theme.fontSizes.Caption}px;
  line-height: ${props => props.theme.lineHeights.Tiny};
  border-radius: 100px;
  min-width: 76px;
  background: linear-gradient(180deg, #1869f5 0%, #1659e1 100%);
  padding: 10px 20px;
`;

const SingleCollectiveWithoutBankAccount = ({ data }) => {
  const hosts = featuredHostsSlugs
    .map(
      slug =>
        data.allCollectives &&
        data.allCollectives.collectives &&
        data.allCollectives.collectives.find(collective => collective.slug === slug),
    )
    .filter(collective => !!collective);

  return (
    <Container mx={3} my={4}>
      <Box display={['block', null, 'none']}>
        <BackButton onClick={() => Router.pushRoute('pricing')} />
      </Box>

      <Flex justifyContent="center">
        <Box textAlign={['center', null, 'left']} my={3} color="black.700" width={[1, null, '672px']}>
          <H1
            fontSize={['H3', null, 'H4']}
            textAlign="center"
            lineHeight={['40px', null, 'H4']}
            letterSpacing={['-0.4px', null, '-0.2px']}
          >
            <FormattedMessage id="pricing.tab.welcome" defaultMessage="Welcome!" />
          </H1>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedHTMLMessage
              id="pricing.tab.joinHost"
              defaultMessage="If you don't have access to a bank account you can use, please <strong>join a Fiscal Host</strong>!"
            />
          </P>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedHTMLMessage
              id="pricing.fiscalHost.description"
              defaultMessage="A Fiscal Host is an <strong>organization who offers fund-holding as a service</strong>. They keep your money in their bank account and  <strong>handle things like accounting, taxes, admin, payments, and liability</strong>-so you don’t have to!"
            />
          </P>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedHTMLMessage
              id="pricing.fiscalHost.reasonToJoin"
              defaultMessage="If you join a Fiscal Host, <strong>you don’t need to go on an Open Collective paid plan</strong>, as your Collective is already included. Each Fiscal Host sets their own fees and acceptance criteria for Collectives. Open Collective keeps a 5% of the donations your raise via credit card payments (Stripe). All other payment methods such as PayPal and Bank transfers are included in your Host's plan."
            />
          </P>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedMessage
              id="pricing.fiscalHost.applyOpenSource"
              defaultMessage="If you are an open source project, you can apply to join  the Open Source Collective."
            />
          </P>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedHTMLMessage
              id="pricing.fiscalHost.featured"
              defaultMessage="Below are some of our most popular hosts or <a href='/hosts'>browse all of them</a>."
            />
          </P>
        </Box>
      </Flex>
      <Container my={4} display="flex" flexDirection="column" alignItems="center">
        <H3
          color="black.700"
          textAlign="center"
          fontSize={['LeadParagraph']}
          lineHeight={['26px']}
          letterSpacing={['-0.008em']}
        >
          <FormattedMessage id="pricing.applyFiscalHost" defaultMessage="Apply to a fiscal host." />
        </H3>
        <HostsWrapper width={[1, null, '715px']} py={4}>
          {hosts.map(collective => (
            <Box mx={2} key={collective.id}>
              <StyledCollectiveCard
                width="224px"
                collective={collective}
                borderRadius="16px"
                border="1px solid rgba(49, 50, 51, 0.1)"
                boxShadow="0px 1px 4px rgba(26, 27, 31, 0.12)"
              >
                <Container>
                  <Box>
                    <P my={3} mx={3} fontSize="Caption">
                      <FormattedMessage
                        id="pricing.hostCollective.count"
                        defaultMessage="{count, plural, =0 {No collective} one {{prettyCount} collective} other {{prettyCount} collectives} }"
                        values={{
                          count: collective.stats.collectives.hosted,
                          prettyCount: (
                            <Span fontWeight="bold" fontSize="LeadParagraph">
                              {collective.stats.collectives.hosted}
                            </Span>
                          ),
                        }}
                      />
                    </P>
                    <P my={3} mx={3} fontSize="Caption">
                      <FormattedMessage
                        id="pricing.hostCollective.currency"
                        defaultMessage="{currency} currency"
                        values={{
                          currency: (
                            <Span fontWeight="bold" fontSize="LeadParagraph">
                              {collective.currency}
                            </Span>
                          ),
                        }}
                      />
                    </P>
                    {collective.stats.yearlyBudget > 0 && (
                      <P my={3} mx={3} fontSize="Caption">
                        <Span fontSize="Caption">
                          <FormattedMessage id="YearlyBudget" defaultMessage="Yearly budget" />
                        </Span>
                        <Span fontSize="LeadParagraph" fontWeight="bold">
                          <Currency value={collective.stats.yearlyBudget} currency={collective.currency} />
                        </Span>
                      </P>
                    )}
                    <Box mx={3} my={3}>
                      <Link route={`/${collective.slug}/apply`}>
                        <ApplyButton buttonStyle="primary" data-cy="host-apply-btn">
                          <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply" />
                        </ApplyButton>
                      </Link>
                    </Box>
                  </Box>
                </Container>
              </StyledCollectiveCard>
            </Box>
          ))}
        </HostsWrapper>
        <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
          <StyledLink href={'/hosts'}>
            <FormattedHTMLMessage id="pricing.fiscalHost.more" defaultMessage="See more fiscal hosts" />
          </StyledLink>
        </P>
      </Container>
    </Container>
  );
};

SingleCollectiveWithoutBankAccount.propTypes = {
  data: PropTypes.object,
};

const getHostsQuery = gql`
  query allCollectives($slugs: [String]) {
    allCollectives(slugs: $slugs) {
      total
      collectives {
        id
        isHost
        type
        createdAt
        slug
        name
        description
        longDescription
        currency
        backgroundImage
        stats {
          id
          collectives {
            hosted
          }
        }
      }
    }
  }
`;

const addHostsData = graphql(getHostsQuery, {
  options() {
    return { variables: { slugs: featuredHostsSlugs } };
  },
});

export default addHostsData(SingleCollectiveWithoutBankAccount);
