import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '../Grid';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';

import placeholderIllustration from '../../public/static/images/create-collective/original/placeholderGraphic.png';
import { H1, H2, P } from '../Text';
import Container from '../Container';
import StyledButton from '../StyledButton';
import Avatar from '../Avatar';
import ExternalLink from '../ExternalLink';
import Link from '../Link';

const TIERS_INFO_LINK = 'https://docs.opencollective.com/help/collectives/tiers-goals';

const SmallExternalLink = styled(ExternalLink)`
  font-size: ${themeGet('fontSizes.LeadCaption')}px;
`;

class HostSuccessPage extends React.Component {
  static propTypes = {
    chosenHost: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      createCustomTiers: {
        id: 'createCustomTiers',
        defaultMessage: 'Create custom tiers',
      },
      goBack: {
        id: 'updatePaymentMethod.form.updatePaymentMethodSuccess.btn',
        defaultMessage: 'Go to Collective page',
      },
      tiersInfo: {
        id: 'tiers.knowMore',
        defaultMessage: 'Know more about tiers',
      },
      tiersAbout: {
        id: 'tiers.about',
        defaultMessage: 'About contribution tiers',
      },
      tiersParagraphOne: {
        id: 'acceptContributions.tiers.paragraphOne',
        defaultMessage:
          'We created a one-time donation tier for you to begin with. Go ahead and create different one-time and subscription tiers to define the levels or types of financial contributions your collective accepts.',
      },
      tiersParagraphTwo: {
        id: 'acceptContributions.tiers.paragraphTwo',
        defaultMessage:
          'You can provide perks or rewards for your tiers, have a set membership fee, or create categories for your contributors. Tiers can be limited to an amount or frequency (one time, monthly, yearly), or can be allowed to be flexibly set by contributors.',
      },
    });
  }

  render() {
    const { intl, collective, chosenHost } = this.props;

    return (
      <Fragment>
        <Box mb={4} mt={5} mx={[2, 6]}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            <FormattedMessage
              id="acceptContributions.applicationSuccess"
              defaultMessage="You have applied to be hosted by {hostName}."
              values={{
                hostName: chosenHost.name,
              }}
            />
          </H1>
        </Box>
        <Container display="flex" flexDirection="column" alignItems="center">
          <Flex flexDirection="column" alignItems="center" maxWidth={'575px'} my={3} mx={[3, 0]}>
            <Avatar collective={chosenHost} radius={64} mb={2} />
            <P fontSize="LeadParagraph" lineHeight="LeadCaption" fontWeight="bold" mb={4}>
              {chosenHost.name}
            </P>
            <P fontSize="LeadParagraph" lineHeight={'H5'} color="black.600" textAlign="center">
              <FormattedMessage
                id="acceptContributions.notifiedWhen"
                defaultMessage="You will be notified when {hostName} has approved or rejected your application. Contribution tiers will only go live once the Collective is approved by the fiscal host."
                values={{
                  hostName: chosenHost.name,
                }}
              />
            </P>
          </Flex>
          <Flex
            flexDirection={['column', 'row']}
            justifyContent="center"
            alignItems="center"
            mx={[2, 4, 0]}
            my={[2, 4]}
          >
            <img src={placeholderIllustration} width="264px" height="352px" />
            <Flex flexDirection="column" ml={[0, 4, 4]} mx={[2, 0]} mt={[4, 0]} maxWidth={'475px'}>
              <H2 fontSize="LeadCaption" fontWeight="bold" color="black.800">
                {intl.formatMessage(this.messages.tiersAbout)}
              </H2>
              <P fontSize="LeadCaption" lineHeight="Paragraph" mb={3} color="black.800">
                {intl.formatMessage(this.messages.tiersParagraphOne)}
              </P>
              <P fontSize="LeadCaption" lineHeight="Paragraph" mb={1} color="black.800">
                {intl.formatMessage(this.messages.tiersParagraphTwo)}
              </P>
              <SmallExternalLink href={TIERS_INFO_LINK} openInNewTab>
                {intl.formatMessage(this.messages.tiersInfo)}
              </SmallExternalLink>
            </Flex>
          </Flex>
          <Flex flexDirection={['column', 'row']} justifyContent="center" alignItems="center" my={3}>
            <Link
              route="collective"
              params={{
                slug: collective.slug,
              }}
            >
              <StyledButton buttonStyle="standard" mt={[2, 3]} mb={[3, 2]} px={3}>
                {intl.formatMessage(this.messages.goBack)}
              </StyledButton>
            </Link>
            <Link
              route="editCollective"
              params={{
                slug: collective.slug,
                section: 'tiers',
              }}
            >
              <StyledButton buttonStyle="dark" mt={[2, 3]} mb={[3, 2]} ml={[null, 3]} px={3}>
                {intl.formatMessage(this.messages.createCustomTiers)}
              </StyledButton>
            </Link>
          </Flex>
        </Container>
      </Fragment>
    );
  }
}

export default injectIntl(HostSuccessPage);
