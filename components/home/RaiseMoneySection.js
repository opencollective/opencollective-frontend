import React from 'react';
import { ArrowRight } from '@styled-icons/fa-solid/ArrowRight';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { getI18nLink, I18nUnderline } from '../I18nFormatters';
import Link from '../Link';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledLink from '../StyledLink';
import { H3, P } from '../Text';

const LinkContainer = styled(Container)`
  &:hover {
    background: ${themeGet('colors.primary.50')};
  }
`;

const LearnMoreLink = styled(StyledLink)`
  &:hover {
    color: ${themeGet('colors.black.800')};
    text-decoration-color: ${themeGet('colors.primary.600')};
  }
`;

const StyledDescription = styled(P)`
  a {
    text-decoration-color: ${themeGet('colors.black.500')};
  }

  a:hover {
    color: ${themeGet('colors.black.800')};
    text-decoration-color: ${themeGet('colors.primary.600')};
  }
`;

const RaiseMoney = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" mt="72px">
      <Flex flexDirection="column" alignItems="center" maxWidth="100%">
        <Box mb="50px" px="16px">
          <SectionTitle textAlign="center" mb={3}>
            <FormattedMessage id="home.raiseMoney" defaultMessage={'Raise money with full transparency'} />
          </SectionTitle>

          <SectionDescription textAlign="center">
            <FormattedMessage
              id="home.raiseMoney.description"
              defaultMessage={'We do the paperwork so you can focus on your mission.'}
            />
          </SectionDescription>
        </Box>

        <Flex justifyContent="center" width="100vw" maxWidth="100%" overflow="hidden">
          <Container
            width={['100vw', '768px', '1024px', null, '1280px']}
            height={['495px', '256px', '347px']}
            display={[null, 'flex']}
            position="relative"
            overflow="hidden"
          >
            <Container
              width={['181px', null, '250px']}
              left={['0', '3%', '5%']}
              position="absolute"
              top={[null, '20%']}
            >
              <Link href="/climatesessions">
                <NextIllustration
                  display={['none', 'block']}
                  width={250}
                  height={168}
                  src="/static/images/new-home/team-picture-4.png"
                />
                <NextIllustration
                  display={[null, 'none']}
                  width={373}
                  height={274}
                  src="/static/images/new-home/team-picture-4-xs.png"
                />
              </Link>
            </Container>
            <Container
              width={['183px', null, '250px']}
              left={['10%', '12%', '18%']}
              position="absolute"
              top={['30%', '50%']}
            >
              <Link href="/fnb_raleigh">
                <NextIllustration
                  display={['none', 'block']}
                  width={250}
                  height={168}
                  src="/static/images/new-home/team-picture-5.png"
                />
                <NextIllustration
                  display={[null, 'none']}
                  width={384}
                  height={277}
                  src="/static/images/new-home/team-picture-5-xs.png"
                />
              </Link>
            </Container>
            <Container
              width={['174px', null, '250px']}
              right={['0', '48%', '49%']}
              position="absolute"
              top={['5%', '0']}
              zIndex="1"
            >
              <Link href="/tiwaiwakanz">
                <NextIllustration
                  display={[null, 'none']}
                  width={361}
                  height={304}
                  src="/static/images/new-home/team-picture-6-xs.png"
                />
                <NextIllustration
                  display={['none', 'block']}
                  width={250}
                  height={168}
                  src="/static/images/new-home/team-picture-6.png"
                />
              </Link>
            </Container>
            <Container
              width={['106px', null, '250px']}
              left={['0', '40%', '46%']}
              position="absolute"
              bottom={['25%', '0']}
              zIndex="1"
            >
              <Link href="/lovewins">
                <NextIllustration
                  display={[null, 'none']}
                  width={235}
                  height={258}
                  src="/static/images/new-home/team-picture-7-xs.png"
                />
                <NextIllustration
                  display={['none', 'block']}
                  width={250}
                  height={168}
                  src="/static/images/new-home/team-picture-7.png"
                />
              </Link>
            </Container>
            <Container width={['152px', null, '250px']} right={['0', '24.5%']} position="absolute" top={['45%', '8%']}>
              <Link href="/readingredkitchen">
                <NextIllustration
                  display={[null, 'none']}
                  width={303}
                  height={262}
                  src="/static/images/new-home/team-picture-8-xs.png"
                />
                <NextIllustration
                  display={['none', 'block']}
                  width={250}
                  height={168}
                  src="/static/images/new-home/team-picture-8.png"
                />
              </Link>
            </Container>
            <Container
              width={['228px', null, '250px']}
              bottom={['0', '8%']}
              position="absolute"
              left={['20%', '66%', '70.5%']}
            >
              <Link href="/the-light-inside-film">
                <NextIllustration
                  display={[null, 'none']}
                  width={483}
                  height={333}
                  src="/static/images/new-home/team-picture-9-xs.png"
                />
                <NextIllustration
                  display={['none', 'block']}
                  width={250}
                  height={168}
                  src="/static/images/new-home/team-picture-9.png"
                />
              </Link>
            </Container>
          </Container>
        </Flex>

        <Box maxWidth={['288px', '701px']} mt="35px" px="16px">
          <StyledDescription
            fontSize={['18px', '20px']}
            letterSpacing={[null, '-0.008em']}
            lineHeight={['26px', '28px']}
            textAlign={'center'}
            color="black.800"
            fontWeight="500"
          >
            <FormattedMessage
              id="home.raiseMoney.description2"
              defaultMessage={
                "Whether you're a <mutualAidLink>mutual aid group</mutualAidLink>, a <communityLink>community initiative</communityLink>, an <opensourceLink>open-source software project</opensourceLink>, or a <climateLink>climate change activist</climateLink>, Open Collective helps groups unlock access to money."
              }
              values={{
                u: I18nUnderline,
                mutualAidLink: getI18nLink({
                  as: Link,
                  href: '/fnb_raleigh',
                  textDecoration: 'underline',
                  color: 'black.800',
                }),
                communityLink: getI18nLink({
                  as: Link,
                  href: '/lovewins',
                  textDecoration: 'underline',
                  color: 'black.800',
                }),
                opensourceLink: getI18nLink({
                  as: Link,
                  href: '/webpack',
                  textDecoration: 'underline',
                  color: 'black.800',
                }),
                climateLink: getI18nLink({
                  as: Link,
                  href: '/climatesessions',
                  textDecoration: 'underline',
                  color: 'black.800',
                }),
              }}
            />
          </StyledDescription>
        </Box>
        <Box px="16px">
          <Link href="/search?q=&type=COLLECTIVE">
            <LinkContainer
              mt="72px"
              maxWidth={['288px', '700px', '956px', null, '1200px']}
              padding={['24px', '32px', '46px 56px']}
              border="2px solid"
              borderColor="primary.900"
              borderRadius="16px"
            >
              <Box maxWidth={[null, '572px', '756px', null, '1000px']}>
                <P
                  fontSize={['24px', '32px', '40px']}
                  lineHeight={['32px', '40px', '48px']}
                  letterSpacing={['-0.008em', null, '-0.04em']}
                  color="primary.900"
                  textAlign="left"
                  fontWeight="700"
                  mb={['16px', '24px']}
                >
                  <FormattedMessage
                    id="home.stat"
                    defaultMessage={'Over 15,000 groups around the world raised and managed USD $35M last year'}
                  />
                </P>
              </Box>
              <Box display="flex" alignItems={['center', 'flex-start']} justifyContent="space-between">
                <Box maxWidth={['184px', '572px', '756px']}>
                  <P
                    fontSize={['18px', '20px']}
                    letterSpacing={[null, '-0.008em']}
                    lineHeight={['26px', '28px']}
                    textAlign="left"
                    color="black.800"
                    fontWeight="500"
                  >
                    <FormattedMessage
                      id="home.stat.checkout"
                      defaultMessage={'Check out these amazing Collectives and connect with them.'}
                    />
                  </P>
                </Box>
                <ArrowRight size={'40px'} color="#0C2D66" />
              </Box>
            </LinkContainer>
          </Link>
        </Box>
      </Flex>
      <Flex flexDirection="column" alignItems="center" mt="72px" px="16px">
        <Flex justifyContent="center" flexDirection={['column', 'row']} alignItems="center">
          <Box width={['288px', '338px', '478px', null, '558px']} mr={[null, '24px']}>
            <NextIllustration
              width={558}
              height={418}
              src="/static/images/new-home/fiscal-hosting-illustration.png"
              alt="Fiscal hosting"
            />
          </Box>
          <Box textAlign={['center', 'left']}>
            <H3
              fontSize={['24px', '32px', '40px']}
              lineHeight={['32px', '40px', '48px']}
              letterSpacing={['-0.008em', null, '-0.04em']}
              color="primary.900"
              fontWeight="700"
              textDecoration={[null, null, 'underline']}
            >
              <FormattedMessage id="fiscalHosting" defaultMessage={'Fiscal hosting'} />
            </H3>
            <Box maxWidth={['288px', '338px', '478px']} mt={['16px', '24px']}>
              <P
                fontSize={['15px', '18px', '20px']}
                lineHeight={['22px', '26px', '28px']}
                fontWeight="500"
                color="black.800"
                letterSpacing={[null, null, '-0.008em']}
              >
                <FormattedMessage
                  id="home.fiscalHosting.description"
                  defaultMessage={
                    'Operate under the umbrella of an established legal entity, so you don’t have to incorporate your own. A Host can take care of accounting, taxes, banking, and non-profit status.'
                  }
                />
              </P>
              <LearnMoreLink as={Link} textDecoration="underline" color="black.800" href="/fiscal-hosting">
                <P mt="24px" fontSize="16px" lineHeight="24px" fontWeight="500">
                  <FormattedMessage defaultMessage={'Learn more about fiscal hosting'} />
                </P>
              </LearnMoreLink>
            </Box>
          </Box>
        </Flex>
        <Flex justifyContent="center" flexDirection={['column', 'row-reverse']} alignItems="center">
          <Box width={['288px', '338px', '478px', null, '558px']} mr={[null, '24px']}>
            <NextIllustration
              width={558}
              height={418}
              src="/static/images/new-home/shared-account-illustration.png"
              alt="Fiscal hosting"
            />
          </Box>
          <Box textAlign={['center', 'left']}>
            <H3
              fontSize={['24px', '32px', '40px']}
              lineHeight={['32px', '40px', '48px']}
              letterSpacing={['-0.008em', null, '-0.04em']}
              color="primary.900"
              fontWeight="700"
              textDecoration={[null, null, 'underline']}
            >
              <FormattedMessage id="home.sharedAccount" defaultMessage={'Shared account'} />
            </H3>
            <Box maxWidth={['288px', '338px', '478px']} mt={['16px', '24px']}>
              <P
                fontSize={['15px', '18px', '20px']}
                lineHeight={['22px', '26px', '28px']}
                fontWeight="500"
                color="black.800"
                letterSpacing={[null, null, '-0.008em']}
              >
                <FormattedMessage
                  id="home.sharedAccount.description"
                  defaultMessage={
                    'Manage your budget together. Transparency builds trust and accountability, and no individual has to take on all the responsibility.'
                  }
                />
              </P>
              <LearnMoreLink as={Link} textDecoration="underline" color="black.800" href="/collectives">
                <P mt="24px" fontSize="16px" lineHeight="24px" fontWeight="500">
                  <FormattedMessage defaultMessage={'Learn more about creating a Collective'} />
                </P>
              </LearnMoreLink>
            </Box>
          </Box>
        </Flex>
        <Flex justifyContent="center" flexDirection={['column', 'row']} alignItems="center">
          <Box width={['288px', '338px', '478px', null, '558px']} mr={[null, '24px']}>
            <NextIllustration
              width={558}
              height={418}
              src="/static/images/new-home/powerfulTool-illustration.png"
              alt="Fiscal hosting"
            />
          </Box>
          <Box textAlign={['center', 'left']}>
            <H3
              fontSize={['24px', '32px', '40px']}
              lineHeight={['32px', '40px', '48px']}
              letterSpacing={['-0.008em', null, '-0.04em']}
              color="primary.900"
              fontWeight="700"
              textDecoration={[null, null, 'underline']}
            >
              <FormattedMessage id="home.powerfulMoneyTools" defaultMessage={'Powerful money tools'} />
            </H3>
            <Box maxWidth={['288px', '338px', '478px']} mt={['16px', '24px']}>
              <P
                fontSize={['15px', '18px', '20px']}
                lineHeight={['22px', '26px', '28px']}
                fontWeight="500"
                color="black.800"
                letterSpacing={[null, null, '-0.008em']}
              >
                <FormattedMessage
                  id="home.powerfulMoneyTools.description"
                  defaultMessage={
                    'Pay expenses, receive donations, manage grants, sell event tickets, get a virtual card linked to your balance, and more!'
                  }
                />
              </P>
              <LearnMoreLink as={Link} textDecoration="underline" color="black.800" href="/how-it-works">
                <P mt="24px" fontSize="16px" lineHeight="24px" fontWeight="500">
                  <FormattedMessage defaultMessage={'Learn more about how the platform works'} />
                </P>
              </LearnMoreLink>
            </Box>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default RaiseMoney;
