import React from 'react';
import { ArrowRight } from '@styled-icons/fa-solid';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import { I18nUnderline } from '../I18nFormatters';
import Link from '../Link';
import { H2, H3, P } from '../Text';

const LinkContainer = styled(Container)`
  &:hover {
    background: ${themeGet('colors.primary.50')};
  }
`;

const RaiseMoney = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" mt="72px">
      <Flex flexDirection="column" alignItems="center">
        <Box mb="50px" px="16px">
          <H2
            letterSpacing={['-0.008em', '-0.04em']}
            fontSize={['32px', '40px', '52px']}
            lineHeight={['40px', '48px', '56px']}
            textAlign="center"
            color="primary.900"
            fontWeight="700"
            mb={3}
          >
            <FormattedMessage id="home.raiseMoney" defaultMessage={'Raise money with full transparency.'} />
          </H2>

          <P
            fontSize={['18px', '20px']}
            letterSpacing={[null, '-0.008em']}
            lineHeight={['26px', '28px']}
            textAlign="center"
            color="black.800"
            fontWeight="500"
          >
            <FormattedMessage
              id="home.raiseMoney.description"
              defaultMessage={'We do the paperwork so you can focus on your mission.'}
            />
          </P>
        </Box>

        <Flex justifyContent="center" width="100vw" overflow="hidden">
          <Container
            width={['320px', '768px', '1024px', null, '1280px']}
            height={['495px', '256px', '347px']}
            display={[null, 'flex']}
            position="relative"
            overflow="hidden"
          >
            <Container
              width={['190px', null, '250px']}
              left={['-5%', '3%', '5%']}
              position="absolute"
              top={[null, '20%']}
            >
              <NextIllustration width={250} height={168} src="/static/images/new-home/team-picture-4.png" />
            </Container>
            <Container
              width={['183px', null, '250px']}
              left={['10%', '12%', '18%']}
              position="absolute"
              top={['30%', '50%']}
            >
              <NextIllustration width={250} height={168} src="/static/images/new-home/team-picture-5.png" />
            </Container>
            <Container
              width={['213px', null, '250px']}
              right={['-8%', '48%', '49%']}
              position="absolute"
              top={['5%', '0']}
              zIndex="1"
            >
              <NextIllustration width={250} height={168} src="/static/images/new-home/team-picture-6.png" />
            </Container>
            <Container
              width={['183px', null, '250px']}
              left={['-15%', '40%', '46%']}
              position="absolute"
              bottom={['25%', '0']}
              zIndex="1"
            >
              <NextIllustration width={250} height={168} src="/static/images/new-home/team-picture-7.png" />
            </Container>
            <Container
              width={['182px', null, '250px']}
              right={['-10%', '24.5%']}
              position="absolute"
              top={['45%', '8%']}
            >
              <NextIllustration width={250} height={168} src="/static/images/new-home/team-picture-8.png" />
            </Container>
            <Container
              width={['228px', null, '250px']}
              bottom={['0', '8%']}
              position="absolute"
              left={['20%', '66%', '70.5%']}
            >
              <NextIllustration width={250} height={168} src="/static/images/new-home/team-picture-9.png" />
            </Container>
          </Container>
        </Flex>

        <Box maxWidth={['288px', '701px']} mt="35px" px="16px">
          <P
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
                "Whether you're a <u>mutual aid group</u>, a <u>community initiative</u>, an <u>open-source</u> <u>software project</u>, or a <u>climate change activist</u>, Open Collective helps groups unlock access to money."
              }
              values={{
                u: I18nUnderline,
              }}
            />
          </P>
        </Box>
        <Box px="16px">
          <Link href="/">
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
              src="/static/images/fiscal-hosting/tax-exempt.png"
              alt="Fiscal hosting"
            />
          </Box>
          <Box textAlign={['center', 'left']}>
            <Link href="/fiscal-hosting">
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
            </Link>
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
            </Box>
          </Box>
        </Flex>
        <Flex justifyContent="center" flexDirection={['column', 'row-reverse']} alignItems="center">
          <Box width={['288px', '338px', '478px', null, '558px']} mr={[null, '24px']}>
            <NextIllustration
              width={558}
              height={418}
              src="/static/images/fiscal-hosting/tax-exempt.png"
              alt="Fiscal hosting"
            />
          </Box>
          <Box textAlign={['center', 'left']}>
            <Link href="/fiscal-hosting">
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
            </Link>
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
            </Box>
          </Box>
        </Flex>
        <Flex justifyContent="center" flexDirection={['column', 'row']} alignItems="center">
          <Box width={['288px', '338px', '478px', null, '558px']} mr={[null, '24px']}>
            <NextIllustration
              width={558}
              height={418}
              src="/static/images/fiscal-hosting/tax-exempt.png"
              alt="Fiscal hosting"
            />
          </Box>
          <Box textAlign={['center', 'left']}>
            <Link href="/how-it-works">
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
            </Link>
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
            </Box>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default RaiseMoney;
