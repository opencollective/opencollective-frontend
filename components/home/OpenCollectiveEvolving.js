import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import Link from '../Link';
import { MainDescription, MainTitle } from '../marketing/Text';
import { H3, P } from '../Text';

const OpenCollectiveEvolving = () => {
  return (
    <Fragment>
      <Flex justifyContent="center" alignItems="center" px="16px" mt="40px">
        <Flex flexDirection="column" alignItems="center">
          <Box>
            <MainTitle
              fontSize={['48px', '52px', '64px']}
              lineHeight={['52px', '56px', '80px']}
              letterSpacing={['-0.04em', '0.012em', null]}
              textAlign="center"
            >
              <FormattedMessage id="home.openCollectiveEvolving" defaultMessage="Open Collective is evolving!" />
            </MainTitle>
          </Box>
          <Box my={[4, '40px']} maxWidth={['288px', '608px', '768px', null, '896px']}>
            <MainDescription textAlign="center">
              <FormattedMessage
                id="home.openCollectiveEvolving.twoDirections"
                defaultMessage="We're forking and moving in two different directions. The classic platform has moved to a non-profit while the original company is working on a new web3 platform."
              />
            </MainDescription>
            <br />
            <MainDescription textAlign="center">
              <FormattedMessage id="home.openCollectiveEvolving.where" defaultMessage="Where do you want to go?" />
            </MainDescription>
          </Box>
        </Flex>
      </Flex>

      <Flex flexDirection="column" px="16px" justifyContent="center" alignItems="center">
        <Flex flexDirection="column" alignItems="center">
          <Flex flexDirection={['column', 'row']} my="32px" pb="64px">
            <Container
              width={['288px', '342px', '470px', null, '536px']}
              py="48px"
              px="32px"
              border="2px solid"
              borderColor="primary.900"
              borderRadius="16px"
              mb={[3, 0]}
            >
              <Link href="https://opencollective.xyz/">
                <Image
                  style={{ border: '1px solid black', borderRadius: '10px', margin: 'auto' }}
                  src="/static/images/screenshot-xyz.png"
                  alt="web3 Platform"
                  width={450}
                  height={300}
                  margin="auto"
                  textAlign="center"
                />
              </Link>
              <H3 fontSize={['32px']} lineHeight={['40px']} letterSpacing={['-0.008em']} color="primary.900" mt={5}>
                <FormattedMessage id="home.web3" defaultMessage="web3 platform" />
              </H3>
              <P fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" color="black.800">
                <FormattedMessage defaultMessage="coming in 2025" id="yJSv0P" />
                <br />
                <FormattedMessage defaultMessage="owned and operated by Open Collective Inc." id="lXtbDH" />
              </P>
            </Container>
            <Container
              width={['288px', '342px', '470px', null, '536px']}
              py="48px"
              px="32px"
              border="2px solid"
              borderColor="primary.900"
              borderRadius="16px"
              ml={[null, 3]}
            >
              <Link href="/home">
                <Image
                  style={{ border: '1px solid black', borderRadius: '10px', margin: 'auto' }}
                  src="/static/images/screenshot-homepage.png"
                  alt="Classic Platform"
                  width={450}
                  height={300}
                  margin="auto"
                  textAlign="center"
                />
              </Link>
              <H3 fontSize={['32px']} lineHeight={['40px']} letterSpacing={['-0.008em']} color="primary.900" mt={5}>
                <FormattedMessage id="home.classic" defaultMessage="classic platform" />
              </H3>
              <P fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" color="black.800">
                <FormattedMessage defaultMessage="since 2015" id="Llwwqh" />
                <br />
                <FormattedMessage defaultMessage="owned and operated by OFi Consortium 501(c)(6)" id="AL8y3E" />
              </P>
            </Container>
          </Flex>
        </Flex>
      </Flex>
    </Fragment>
  );
};

export default OpenCollectiveEvolving;
