import React, { Fragment, useState } from 'react';
import { RightArrow } from '@styled-icons/boxicons-regular/RightArrow';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import { MainDescription, MainTitle } from '../../marketing/Text';
import StyledButton from '../../StyledButton';
import StyledModal from '../../StyledModal';
import { H2, P, Span } from '../../Text';
import NextIllustration from '../HomeNextIllustration';

const SustainTextWrapper = styled(Span)`
  background-image: url('/static/images/home/sustain-underline-sm.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position-y: 10px;
  background-position-x: -12px;
  padding-right: 12px;

  @media screen and (min-width: 64em) {
    background-image: url('/static/images/home/sustain-underline.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position-y: 16px;
    background-position-x: -12px;
  }
`;

const MakeCommunity = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <Fragment>
      <Flex
        mx={[3, 4]}
        my={[null, 4, 5]}
        flexDirection={['column-reverse', 'row']}
        alignItems={['center', 'flex-start', null, null, 'center']}
        justifyContent={[null, 'center']}
      >
        <Flex flexDirection="column" alignItems={['center', 'flex-start']} mr={[null, null, null, null, 3]}>
          <Box width={[null, null, '458px', null, '558px']}>
            <MainTitle my={[3, null, 3]} textAlign={['center', 'left']}>
              <Span>
                <FormattedMessage
                  id="home.makeCommunitySection.title.makeYourCommunity"
                  defaultMessage="Make your community {sustainable}"
                  values={{
                    sustainable: (
                      <SustainTextWrapper>
                        <FormattedMessage id="home.makeCommunitySection.title.sustain" defaultMessage="sustainable" />
                      </SustainTextWrapper>
                    ),
                  }}
                />
              </Span>
            </MainTitle>
          </Box>
          <Box width={['288px', '306px', '342px', null, '558px']}>
            <MainDescription mt={1} mb={4} textAlign={['center', 'left']}>
              <FormattedMessage
                id="home.makeCommunitySection.description"
                defaultMessage="Community is about trust and sharing. Doohi Collective lets you manage your finances so everyone can see where money comes from and where it goes."
              />{' '}
              <Span fontWeight="bold" display={['none', 'inline']}>
                <FormattedMessage
                  id="home.makeCommunitySection.subTitle"
                  defaultMessage="Collect and spend money transparently."
                />
              </Span>
            </MainDescription>
          </Box>
          <Box display="flex" flexDirection={['column', 'row']} alignItems="center">
            <Link href="/create">
              <StyledButton minWidth={158} my={[2, null, 0]} mr={[0, 3]} buttonStyle="marketing" whiteSpace="nowrap">
                <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
              </StyledButton>
            </Link>
            <StyledButton onClick={() => setShowModal(true)} my={[2, null, 0]} minWidth={158}>
              <Span mr={2}>
                <FormattedMessage id="home.makeCommunitySection.watchVideo" defaultMessage="Watch Video" />
              </Span>
              <Span className="arrowIcon">
                <RightArrow size="14" />
              </Span>
            </StyledButton>
          </Box>
        </Flex>
        <Flex
          mt={[5, 3]}
          width={[1, null, '458px', null, '558px']}
          justifyContent="center"
          alignItems="center"
          ml={[null, null, null, null, 3]}
        >
          <NextIllustration
            width={558}
            height={448}
            alt="Make your community sustainable"
            src="/static/images/home/makecommunity-section-illustration.png"
          />
        </Flex>
      </Flex>
      {/* What is great about Doohi Collective? */}
      <Container
        display={'flex'}
        justifyContent="center"
        alignItems="center"
        flexDirection={['column', 'row']}
        mx={[3, 4]}
        my={[4, 5]}
      >
        <H2
          mb={4}
          letterSpacing={['-0.6px', '-0.8px']}
          fontSize={['20px', '24px']}
          lineHeight={['28px', '32px']}
          color="primary.900"
          display={[null, 'none']}
          textAlign="center"
        >
          <FormattedMessage id="home.whatIsGreatAboutOC" defaultMessage="What's great about Doohi Collective?" />
        </H2>
        <Box width={['320px', '414px', '548px', null, '696px']} mr={[null, 3, null, null, 4]}>
          <NextIllustration
            width={696}
            height={396}
            alt="Make your community sustainable"
            src="/static/images/home/whatisgreataboutOC-Illustration-2x.png"
          />
        </Box>
        <Box width={['288px', '224px', '396px']}>
          <H2
            mb={[null, 2]}
            letterSpacing={[null, '-0.8px']}
            fontSize={[null, '24px']}
            lineHeight={[null, '32px']}
            color="primary.900"
            display={['none', 'block']}
          >
            <FormattedMessage id="home.whatIsGreatAboutOC" defaultMessage="What's great about Doohi Collective?" />
          </H2>
          <P
            letterSpacing={['-0.12px', '-0.16px', '-0.2px']}
            fontSize={['15px', '16px', '18px']}
            lineHeight={['23px', '24px', '27px']}
            color="black.800"
            fontWeight={['500', 'normal']}
            mt={3}
          >
            <FormattedMessage
              id="home.whatIsGreatAboutOC.description"
              defaultMessage="Money management made simple, plus great tools for community engagement, budget reporting, and fiscal sponsorship."
            />
          </P>
        </Box>
      </Container>
      {showModal && (
        <StyledModal
          padding="0"
          background="transparent"
          width={[1, null, '670px', null, '770px']}
          onClose={() => setShowModal(false)}
        >
          <Container display="flex" width={1} height={400} maxWidth={712} background="black">
            <iframe
              title="YouTube video"
              width="100%"
              height="400px"
              src="https://www.youtube.com/embed/IBU5fSILAe8"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Container>
        </StyledModal>
      )}
    </Fragment>
  );
};

export default MakeCommunity;
