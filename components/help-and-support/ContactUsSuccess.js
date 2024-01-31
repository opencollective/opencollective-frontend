import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Newsletter from '../collectives/Newsletter';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledLink from '../StyledLink';
import { H2, H3, P } from '../Text';

const Wrapper = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #eaeaec;
  padding: 24px 36px;

  &:hover {
    border-color: #297eff;

    h3,
    svg {
      color: #1041a3;
    }
  }
`;

const ContactUsSuccess = () => (
  <Flex flexDirection="column" alignItems="center" justifyContent="center" px="16px" mt={['32px', '48px']} mb="120px">
    <Flex alignItems="center" width={['288px', '404px']}>
      <Box width={[null, '96px']} height={[null, '96px']}>
        <NextIllustration
          alt="How Doohi Collective works"
          src="/static/images/help-and-support/success-illustration.png"
          width={96}
          height={96}
        />
      </Box>
      <Box ml={['4px', 3]}>
        <H2 fontSize={['24px', '32px']} lineHeight={['32px', '40px']} letterSpacing="-0.008em" color="primary.900">
          <FormattedMessage id="helpAndSupport.messageConfirmation" defaultMessage="We’ve received your message. ✅" />
        </H2>
      </Box>
    </Flex>
    <Box my="18px" width={['288px', '404px']}>
      <P fontSize={['16px', '18px']} lineHeight={['24px', '26px']} color="black.800" textAlign="center">
        <FormattedMessage
          id="helpAndSupport.description"
          defaultMessage="Our support team is available from Monday to Friday. Please expect a response within 3 business days."
        />
      </P>
    </Box>
    <Flex mt="32px" flexDirection="column" alignItems="center">
      <StyledLink href="https://slack.opencollective.com/" openInNewTab>
        <Wrapper color="black.900" className="linkWrapper" my={[3, null, 4]} width={['288px', '520px']}>
          <Box width={['184px', 1]}>
            <H3 fontSize="24px" textAlign="left" lineHeight="32px" letterSpacing="-0.008em" mb={2} color="black.800">
              <FormattedMessage id="helpAndSupport.joinCommunity" defaultMessage="Join our slack community" />
            </H3>
            <P fontSize="15px" color="black.700" lineHeight="22px" textDecoration="underline">
              https://slack.opencollective.com/
            </P>
          </Box>
          <Box className="arrowWrapper" color="black.900" fontWeight="bold">
            <ArrowRight2 size={'24'} />
          </Box>
        </Wrapper>
      </StyledLink>

      <StyledLink href="https://github.com/opencollective" openInNewTab>
        <Wrapper color="black.900" className="linkWrapper" my={[3, null, 4]} width={['288px', '520px']}>
          <Box width={['184px', 1]}>
            <H3 fontSize="24px" textAlign="left" lineHeight="32px" letterSpacing="-0.008em" mb={2} color="black.800">
              <FormattedMessage id="helpAndSupport.bugs" defaultMessage="Bugs & feature requests" />
            </H3>
            <P fontSize="15px" color="black.700" lineHeight="22px" textDecoration="underline">
              https://github.com/opencollective
            </P>
          </Box>
          <Box className="arrowWrapper" color="black.900" fontWeight="bold">
            <ArrowRight2 size={'24'} />
          </Box>
        </Wrapper>
      </StyledLink>

      <Wrapper color="black.900" width={['288px', '520px']} className="newsletterWrapper">
        <Container>
          <H3 fontSize="24px" textAlign="left" lineHeight="32px" letterSpacing="-0.008em" mb={2} color="black.800">
            <FormattedMessage id="home.joinUsSection.newsletter" defaultMessage="Subscribe to our newsletter" />
          </H3>
          <Box mb={3}>
            <P fontSize={['15px', null, '15px']} lineHeight={['22px', null, '25px']} color="black.700">
              <FormattedMessage id="home.joinUsSection.weNeedUpdate" defaultMessage="We send updates once a month." />
            </P>
          </Box>
          <Newsletter />
        </Container>
      </Wrapper>
    </Flex>
  </Flex>
);

export default ContactUsSuccess;
