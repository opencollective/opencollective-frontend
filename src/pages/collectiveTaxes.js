import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { countries as countriesEN } from 'i18n-iso-countries/langs/en.json';

import withIntl from '../lib/withIntl';
import { H2, H4, H5, Span, P } from '../components/Text';
import Logo from '../components/Logo';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import StyledCard from '../components/StyledCard';

/**
 * Main contribution flow entrypoint. Render all the steps from contributeAs
 * to payment.
 */
class CollectiveTaxesPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
  };

  constructor(props) {
    super(props);
    this.tiersLabels = defineMessages({
      TIER: {
        id: 'tier.type.tier',
        defaultMessage: 'generic tier',
      },
      MEMBERSHIP: {
        id: 'tier.type.membership',
        defaultMessage: 'membership (recurring)',
      },
      SERVICE: {
        id: 'tier.type.service',
        defaultMessage: 'service (e.g. support)',
      },
      PRODUCT: {
        id: 'tier.type.product',
        defaultMessage: 'product (e.g. t-shirt)',
      },
      DONATION: {
        id: 'tier.type.donation',
        defaultMessage: 'donation (gift)',
      },
      TICKET: {
        id: 'tier.type.ticket',
        defaultMessage: 'ticket (allow multiple tickets per order)',
      },
    });
  }

  renderTaxes(host) {
    const { intl } = this.props;
    const taxes = (host && host.taxes) || {};
    const taxesTiersTypes = Object.keys(taxes);

    if (taxesTiersTypes.length === 0) {
      return (
        <MessageBox type="info">
          <FormattedMessage id="tax.noTaxes" defaultMessage="This host doesn't have any tax" />
        </MessageBox>
      );
    }

    return taxesTiersTypes.map(tierType => {
      const tax = taxes[tierType];
      return (
        <StyledCard key={tierType} p={3} maxWidth={600} mb={4}>
          <H4 textTransform="capitalize" textAlign="center">
            {this.tiersLabels[tierType] ? intl.formatMessage(this.tiersLabels[tierType]) : tierType}
            <Span color="black.500" fontSize="0.75em">
              <br />
              {tax.name}
              {tax.description ? `: ${tax.description}` : ''} ({tax.percentage}%)
            </Span>
          </H4>
          {tax.countries && (
            <Box mt={4}>
              <H5 textAlign="left" mb={1}>
                <FormattedMessage id="tax.countries" defaultMessage="Countries" />
              </H5>
              <P>{tax.countries.map(code => countriesEN[code] || code).join(', ')}.</P>
            </Box>
          )}
          {tax.identificationNumberRegex && (
            <Box mt={4}>
              <H5 textAlign="left" mb={1}>
                <FormattedMessage id="tax.idRegex" defaultMessage="Tax identification number validation" />
              </H5>
              <blockquote>
                <Span fontSize={12}>{tax.identificationNumberRegex}</Span>
              </blockquote>
            </Box>
          )}
        </StyledCard>
      );
    });
  }

  render() {
    const { data } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const logo = collective.image;
    const host = collective.isHost ? collective : collective.host;

    return (
      <Page title={`Taxes for ${collective.name} collective`} image={collective.image}>
        <Flex alignItems="center" flexDirection="column" mx="auto" pt={4} p={2} mb={4}>
          <Link route="collective" params={{ slug: collective.slug }} className="goBack">
            <Logo
              src={logo}
              className="logo"
              type={collective.type}
              website={collective.website}
              height="10rem"
              key={logo}
            />
          </Link>

          <Link route="collective" params={{ slug: collective.slug }} className="goBack">
            <H2 as="h1" color="black.900">
              {collective.name}
            </H2>
          </Link>

          <H2 textAlign="center">
            <FormattedMessage id="tax.details" defaultMessage="Tax details" />
            {!collective.isHost && host && (
              <Span fontSize="0.5em">
                <br />
                <FormattedMessage
                  id="tax.forHost"
                  defaultMessage="for host {hostLink}"
                  values={{
                    hostLink: (
                      <Link route="collective" params={{ slug: host.slug }}>
                        {host.name}
                      </Link>
                    ),
                  }}
                />
              </Span>
            )}
          </H2>
          <Box mt={4}>
            {!host ? (
              <MessageBox type="warning">
                <FormattedMessage id="collective.noHost" defaultMessage="This collective doesn't have a host." />
              </MessageBox>
            ) : (
              this.renderTaxes(host)
            )}
          </Box>
        </Flex>
      </Page>
    );
  }
}

const addData = graphql(gql`
  query CollectiveTaxes($slug: String) {
    Collective(slug: $slug) {
      id
      type
      taxes
      image
      slug
      name
      isHost
      host {
        id
        name
        slug
        taxes
      }
    }
  }
`);

export default addData(withIntl(CollectiveTaxesPage));
