import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import { getI18nLink, I18nUnderline } from '../I18nFormatters';
import Link from '../Link';
import ListItem from '../ListItem';
import StyledButton from '../StyledButton';
import { H2, H3, H5, P } from '../Text';

const ListContainer = styled.ul`
  padding-left: 20px;
`;

const StyledListItem = styled(ListItem)`
  &::before {
    content: '• ';
    color: #1869f5;
    font-weight: bold;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
  }

  a:hover {
    text-decoration: underline;
    text-decoration-color: #1869f5;
  }
`;

const GetToKnowUs = () => {
  return (
    <Flex flexDirection="column" px="16px" justifyContent="center" alignItems="center">
      <Flex flexDirection="column" alignItems="center">
        <Box maxWidth={['288px', '700px', '880px']}>
          <H2
            letterSpacing={['-0.008em', '-0.04em']}
            fontSize={['32px', '40px', '52px']}
            lineHeight={['40px', '48px', '56px']}
            textAlign="center"
            color="primary.900"
            fontWeight="700"
            mb={3}
          >
            <FormattedMessage id="home.getToKnowUs" defaultMessage="Get to know us." />
          </H2>
        </Box>
        <Box maxWidth={['288px', '700px', '768px']}>
          <P
            fontSize={['18px', '20px']}
            letterSpacing={[null, '-0.008em']}
            lineHeight={['26px', '28px']}
            textAlign="center"
            color="black.800"
            fontWeight="500"
          >
            <FormattedMessage
              id="home.getToKnowUs.description"
              defaultMessage={'Browse stories, blog posts, resources, and get support from the community.'}
            />
          </P>
        </Box>
      </Flex>
      <Flex flexDirection={['column', 'row']} my="32px">
        <Container
          maxWidth={['288px', '342px', '470px', null, '536px']}
          py="48px"
          px="32px"
          border="2px solid"
          borderColor="primary.900"
          borderRadius="16px"
          mb={[3, 0]}
        >
          <H3 fontSize={['32px']} lineHeight={['40px']} letterSpacing={['-0.008em']} color="primary.900">
            <FormattedMessage id="home.exploreAndLearn" defaultMessage={'Explore and learn'} />
          </H3>
          <P my="24px" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" color="black.800">
            <FormattedMessage
              defaultMessage={'Check out these amazing Collectives—explore their transparent budgets and activities.'}
            />
          </P>
          <ListContainer>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: 'https://blog.opencollective.com',
                    openInNewTab: true,
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                }}
                defaultMessage={'<link>Read our blog</link>'}
              />
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: '/e2c',
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                  u: I18nUnderline,
                }}
                defaultMessage={'<link>Our exit strategy</link>'}
              />
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: '/become-a-sponsor',
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                }}
                defaultMessage={'<link>More about Sponsors</link>'}
              />
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: 'https://blog.opencollective.com/tag/case-studies/',
                    openInNewTab: true,
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                }}
                defaultMessage={'<link>Communities that use Open Collective</link>'}
              />
            </StyledListItem>
          </ListContainer>
        </Container>
        <Container
          maxWidth={['288px', '342px', '470px', null, '536px']}
          py="48px"
          px="32px"
          border="2px solid"
          borderColor="primary.900"
          borderRadius="16px"
          ml={[null, 3]}
        >
          <H3 fontSize={['32px']} lineHeight={['40px']} letterSpacing={['-0.008em']} color="primary.900">
            <FormattedMessage id="home.helpAndSupport" defaultMessage={'Help and support'} />
          </H3>
          <P my="24px" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" color="black.800">
            <FormattedMessage
              defaultMessage={'Check out these amazing Collectives—explore their transparent budgets and activities.'}
            />
          </P>
          <ListContainer>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: '/help',
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                }}
                defaultMessage={'<link>Visit the support page</link>'}
              />
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: 'https://docs.opencollective.com',
                    openInNewTab: true,
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                }}
                defaultMessage={'<link>Read through our documentation</link>'}
              />
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: 'https://slack.opencollective.com/',
                    openInNewTab: true,
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                }}
                defaultMessage={'<link>Slack and email</link>'}
              />
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
            >
              <FormattedMessage
                values={{
                  link: getI18nLink({
                    href: '/pricing',
                    color: 'black.800',
                    textDecoration: 'underline',
                  }),
                }}
                defaultMessage={'<link>Pricing and Business Model</link>'}
              />
            </StyledListItem>
          </ListContainer>
        </Container>
      </Flex>
      <Flex flexDirection={['column', 'row']} justifyContent="center" alignItems="center">
        <Box mb="16px" display={[null, 'none']}>
          <NextIllustration
            width={288}
            height={238}
            alt="Exit to community illustration"
            src="/static/images/new-home/e2c-illustration.png"
          />
        </Box>
        <Box mb="16px" display={['none', 'block', 'none']}>
          <NextIllustration
            width={392}
            height={324}
            alt="Exit to community illustration"
            src="/static/images/new-home/e2c-illustration-sm.png"
          />
        </Box>
        <Box mb="16px" display={['none', null, 'block']}>
          <NextIllustration
            width={558}
            height={454}
            alt="Exit to community illustration"
            src="/static/images/new-home/e2c-illustration-lg.png"
          />
        </Box>
        <Box textAlign={['center', 'left']} ml={[null, '24px']} width={['288px', '318px', '472px']}>
          <H5
            mb="16px"
            fontSize={['20px', '32px', '40px']}
            lineHeight={['28px', '40px', '48px']}
            fontWeight="700"
            letterSpacing={['-0.008em', null, '-0.04em']}
            color="primary.900"
          >
            <FormattedMessage defaultMessage={"Where we're heading..."} />
          </H5>
          <P
            fontSize={['15px', '16px', '20px']}
            lineHeight={['22px', '24px', '28px']}
            color="black.800"
            letterSpacing={[null, null, '-0.008em']}
            fontWeight="500"
          >
            <FormattedMessage
              defaultMessage={
                'Join us as we transition from a privately owned company to a structure that allows us to share power and revenue with you.'
              }
            />
          </P>
          <Box display={['none', null, 'block']} mt="24px">
            <Link href="/e2c">
              <StyledButton
                width="135px"
                my={['12px', null, 0]}
                buttonStyle="marketing"
                whiteSpace="nowrap"
                backgroundColor="primary.900"
                fontSize="16px"
                lineHeight="20px"
              >
                <FormattedMessage defaultMessage="Learn more" />
              </StyledButton>
            </Link>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default GetToKnowUs;
