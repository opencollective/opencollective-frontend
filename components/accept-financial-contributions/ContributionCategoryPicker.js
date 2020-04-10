import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'next/router';

import skateboardingIllustration from '../../public/static/images/create-collective/onboardingAdminsIllustration.png';
import { H1, P } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import Link from '../Link';

const Image = styled.img`
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

class ContributionCategoryPicker extends React.Component {
  static propTypes = {
    router: PropTypes.object,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      header: {
        id: 'acceptContributions.picker.header',
        defaultMessage: 'Accept financial contributions',
      },
      subtitle: {
        id: 'acceptContributions.picker.subtitle',
        defaultMessage: 'Who will hold money on behalf of the Collective?',
      },
      myself: {
        id: 'acceptContributions.picker.myself',
        defaultMessage: 'Myself',
      },
      myselfInfo: {
        id: 'acceptContributions.picker.myselfInfo',
        defaultMessage: 'Use my personal bank account',
      },
      host: { id: 'acceptContributions.picker.host', defaultMessage: 'A fiscal host' },
      hostInfo: {
        id: 'acceptContributions.picker.hostInfo',
        defaultMessage: 'Outsource fundholding to an entity who offers this service (More info)',
      },
      organization: { id: 'acceptContributions.picker.organization', defaultMessage: 'Our organization' },
      organizationInfo: {
        id: 'acceptContributions.picker.organizationInfo',
        defaultMessage: 'Use my company or organization bank account',
      },
    });
  }

  render() {
    const { intl, router } = this.props;

    return (
      <div>
        <Box mb={4} mt={5}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            {intl.formatMessage(this.messages.header)}
          </H1>
          <P color="black.700" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
            {intl.formatMessage(this.messages.subtitle)}
          </P>
        </Box>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" mb={[5, 6]}>
          <Box alignItems="center">
            <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
              <Container alignItems="center" width={[null, 280, 312]} mb={[4, 0]}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image src={skateboardingIllustration} alt={intl.formatMessage(this.messages.myself)} />
                  <Link
                    route="editCollective"
                    params={{
                      slug: router.query.slug,
                      section: 'host',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      px={4}
                      onClick={() => {
                        this.props.onChange('path', 'myself');
                      }}
                    >
                      {intl.formatMessage(this.messages.myself)}
                    </StyledButton>
                  </Link>
                  <P color="black.500" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                    {intl.formatMessage(this.messages.myselfInfo)}
                  </P>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB']}
                borderTop={['1px solid #E6E8EB', 'none']}
                alignItems="center"
                width={[null, 280, 312]}
                mb={[4, 0]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image src={skateboardingIllustration} alt={intl.formatMessage(this.messages.organization)} />
                  <Link
                    route="editCollective"
                    params={{
                      slug: router.query.slug,
                      section: 'host',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      px={3}
                      onClick={() => {
                        this.props.onChange('path', 'organization');
                      }}
                    >
                      {intl.formatMessage(this.messages.organization)}
                    </StyledButton>
                  </Link>
                  <P color="black.500" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                    {intl.formatMessage(this.messages.organizationInfo)}
                  </P>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB']}
                borderTop={['1px solid #E6E8EB', 'none']}
                alignItems="center"
                width={[null, 280, 312]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image src={skateboardingIllustration} alt={intl.formatMessage(this.messages.host)} />
                  <Link
                    route="accept-financial-contributions"
                    params={{
                      slug: router.query.slug,
                      path: 'host',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      px={3}
                      onClick={() => {
                        this.props.onChange('path', 'host');
                      }}
                    >
                      {intl.formatMessage(this.messages.host)}
                    </StyledButton>
                  </Link>
                  <P color="black.500" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                    {intl.formatMessage(this.messages.hostInfo)}
                  </P>
                </Flex>
              </Container>
            </Flex>
          </Box>
        </Flex>
      </div>
    );
  }
}

export default withRouter(injectIntl(ContributionCategoryPicker));
