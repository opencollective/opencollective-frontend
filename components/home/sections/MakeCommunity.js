import React, { useState, Fragment } from 'react';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { RightArrow } from '@styled-icons/boxicons-regular/RightArrow';

import { P, Span, H1, H4 } from '../../Text';
import { Link } from '../../../server/pages';
import Illustration from '../HomeIllustration';
import { HomePrimaryLink } from '../HomeLinks';
import StyledButton from '../../StyledButton';
import Modal from '../../StyledModal';
import Container from '../../Container';

const SustainTextWrapper = styled(Span)`
  background-image: url('/static/images/sustain-underline-sm.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position-y: 7px;
  background-position-x: -12px;
  padding-right: 12px;

  @media screen and (min-width: 64em) {
    background-image: url('/static/images/sustain-underline.png');
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position-y: 16px;
    background-position-x: -12px;
  }
`;

const WatchVideoButtons = styled(StyledButton)`
  padding: 15px 20px;
  color: ${themeGet('colors.black.700')};
  border-color: ${themeGet('colors.black.400')};
  &:hover {
    color: ${themeGet('colors.black.700')};
    border-color: ${themeGet('colors.blue.300')};

    .arrowIcon {
      color: ${themeGet('colors.blue.300')};
    }
  }

  &:focus {
    color: ${themeGet('colors.white.full')};
    border-color: ${themeGet('colors.white.full')};
    background: #434566;

    .arrowIcon {
      color: ${themeGet('colors.white.full')};
    }
  }
`;

const MakeCommunity = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <Fragment>
      <Flex
        mx={[3, 4]}
        my={[null, null, 5]}
        flexDirection={['column-reverse', null, 'column']}
        alignItems="center"
        justifyContent={[null, 'center']}
      >
        <Flex flexDirection="column" textAlign="center" alignItems={['center']} width={[null, null, null, null, null]}>
          <H1
            my={[3, null, 3]}
            letterSpacing={['-0.2px', null, '-0.8px']}
            fontSize={['H4', null, 'H1']}
            lineHeight={['H4', null, 'H1']}
          >
            <Span>
              <FormattedMessage
                id="home.makeCommunitySection.title.makeYourCommunity"
                defaultMessage="Make your community"
              />
            </Span>{' '}
            <SustainTextWrapper>
              <FormattedMessage id="home.makeCommunitySection.title.sustain" defaultMessage="sustainable" />
            </SustainTextWrapper>
          </H1>
          <H4
            mb={[2, null, 4]}
            letterSpacing={['-0.016em', null, '-0.8px']}
            fontSize={['15px', null, 'H4']}
            lineHeight={['25px', null, 'H4']}
            color="black.700"
            fontWeight="300"
          >
            <FormattedMessage
              id="home.makeCommunitySection.subTitle"
              defaultMessage="Collect and spend money transparently."
            />
          </H4>
          <Box width={['288px', 1, '576px']}>
            <P
              fontSize={['Caption', null, 'Paragraph']}
              color="black.800"
              mt={1}
              mb={4}
              letterSpacing="-0.016em"
              lineHeight={['19px', null, 'LeadParagraph']}
              textAlign="center"
            >
              <FormattedMessage
                id="home.makeCommunitySection.description"
                defaultMessage="Community is about trust and sharing. Open Collective lets you manage your finances so everyone can see where money comes from and where it goes."
              />
            </P>
          </Box>
          <Box display="flex" flexDirection={['column', null, 'row']} alignItems={['center', null, null]}>
            <Link route="create" passHref>
              <HomePrimaryLink border="none" width="175px" my={[2, null, 0]} mr={[0, null, 3]} py="15px" px="24px">
                <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
              </HomePrimaryLink>
            </Link>
            <WatchVideoButtons onClick={() => setShowModal(true)} my={[2, null, 0]}>
              <Span mr={2} fontSize="Paragraph" lineHeight="Caption" fontWeight="500">
                <FormattedMessage id="home.makeCommunitySection.watchVideo" defaultMessage="Watch Video" />
              </Span>
              <Span className="arrowIcon">
                <RightArrow size="14" />
              </Span>
            </WatchVideoButtons>
          </Box>
        </Flex>
        <Flex mt={5} width={[1, null, '672px']} justifyContent="center" alignItems="center">
          <Illustration
            alt="Make your community sustainable"
            src="/static/images/makecommunity-section-illustration.png"
            display={['none', null, null, null, 'block']}
          />
          <Illustration
            alt="Make your community sustainable"
            src="/static/images/makecommunity-section-illustration-md.png"
            display={['none', null, 'block', null, 'none']}
          />
          <Illustration
            alt="Make your community sustainable"
            src="/static/images/makecommunity-illustration-sm.png"
            display={['block', null, 'none']}
          />
        </Flex>
      </Flex>
      <Modal
        padding="0"
        background="transparent"
        show={showModal}
        width={[1, null, '670px', null, '770px']}
        onClose={() => setShowModal(false)}
      >
        <Container
          display="flex"
          width={1}
          dangerouslySetInnerHTML={{
            __html:
              '<iframe width="100%" height="400px" src="https://www.youtube.com/embed/IBU5fSILAe8" frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />',
          }}
        ></Container>
      </Modal>
    </Fragment>
  );
};

export default MakeCommunity;
