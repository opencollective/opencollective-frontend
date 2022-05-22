import React from 'react';
import { ArrowRight } from '@styled-icons/fa-solid';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import { I18nUnderline } from '../I18nFormatters';
import { H2, H3, P } from '../Text';

const RaiseMoney = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px="16px" mt="72px">
      <Flex flexDirection="column" alignItems="center">
        <Box mb="50px">
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

        <Box width={['288px', '701px']} mt="35px">
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
        <Container
          mt="72px"
          width={['288px', '700px', '956px', null, '1200px']}
          padding={['24px', '32px', '46px 56px']}
          border="2px solid"
          borderColor="primary.900"
          borderRadius="16px"
        >
          <Box width={[null, '572px', '756px', null, '1000px']}>
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
          <Box display="flex" alignItems={['center', 'flex-start']}>
            <Box width={['184px', '572px', '756px']}>
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
            {/* TODO - Fix Arrow alignment on tab */}
            <ArrowRight size={'40px'} color="#0C2D66" />
          </Box>
        </Container>
      </Flex>
      <Flex flexDirection="column" alignItems="center" mt="72px">
        <Flex justifyContent="center" flexDirection={['column', 'row']} alignItem="center">
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
                as={'a'}
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
            <Box width={['288px', '338px', '478px']} mt={['16px', '24px']}>
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
      </Flex>
    </Flex>
  );
};

export default RaiseMoney;
