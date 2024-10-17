import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import { Box, Flex } from '../Grid';
import { getI18nLink, I18nBold } from '../I18nFormatters';
import { SectionTitle } from '../marketing/Text';
import { H4, P, Span } from '../Text';

const ListItem = styled.li`
  margin-left: 20px;
  padding-left: 0;
`;

const ListWrapper = styled.ul`
  padding-left: 20px;
  list-style: disc;
`;

const InvestingInTheCommons = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px="16px" my={['56px', '80px', '104px']}>
      <Box width={['288px', 1]} mb={['40px', '64px']}>
        <SectionTitle textAlign="center">
          <FormattedMessage id="e2c.investingInCommons" defaultMessage="Investing in the commons" />
        </SectionTitle>
      </Box>
      <Flex flexDirection={['column', 'row-reverse']} alignItems={[null, 'center']}>
        <Box
          width={['288px', '330px', '416px']}
          height={['288px', '354px']}
          mb={['20px', 0]}
          ml={[null, '40px', '56px']}
        >
          <NextIllustration
            alt="Challenging business as usual"
            src="/static/images/e2c/challengingBusiness-illustration.png"
            width={416}
            height={354}
          />
        </Box>
        <Box width="288px" textAlign="center" mb="24px" display={[null, 'none']}>
          <H4 fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="primary.900">
            <FormattedMessage id="e2c.challengingBusiness" defaultMessage="Challenging business as usual" />
          </H4>
        </Box>
        <Box width={['288px', '330px', '472px']}>
          <H4
            mb="24px"
            display={['none', 'block']}
            fontSize={['24px', '32px']}
            lineHeight={['32px', '40px']}
            letterSpacing="-0.008em"
            color="primary.900"
          >
            <FormattedMessage id="e2c.challengingBusiness" defaultMessage="Challenging business as usual" />
          </H4>
          <Span fontSize="18px" lineHeight="26px" color="black.800">
            <FormattedMessage
              id="e2c.challengingBusiness.description"
              defaultMessage="Many tech founders are forced to give away ownership and control to investors in order to get money as a start-up. <strong>Open Collective is different.</strong> {lineBreak} {lineBreak} We raised money from people who agreed: <ul><li>Investors get paid back slowly and can’t make us exploit people to create huge profits.</li> <li>Investors do NOT control the platform.</li></ul>"
              values={{
                li: listItem => <ListItem>{listItem}</ListItem>,
                ul: list => <ListWrapper>{list}</ListWrapper>,
                lineBreak: <br />,
                strong: I18nBold,
              }}
            />
          </Span>
        </Box>
      </Flex>
      <Flex flexDirection={['column', 'row']} mt="40px" alignItems={[null, 'center']}>
        <Box
          width={['288px', '330px', '416px']}
          height={['288px', '354px']}
          mb={['20px', 0]}
          mr={[null, '40px', '56px']}
        >
          <NextIllustration
            alt="Transparent finances"
            src="/static/images/e2c/transparent-finance-illustration.png"
            width={416}
            height={354}
          />
        </Box>
        <Box width="288px" textAlign="center" mb="24px" display={[null, 'none']}>
          <H4 fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="primary.900">
            <FormattedMessage id="e2c.transparentFinances" defaultMessage="Transparent finances" />
          </H4>
        </Box>
        <Box width={['288px', '330px', '472px']}>
          <H4
            mb="24px"
            display={['none', 'block']}
            fontSize={['24px', '32px']}
            lineHeight={['32px', '40px']}
            letterSpacing="-0.008em"
            color="primary.900"
          >
            <FormattedMessage id="e2c.transparentFinances" defaultMessage="Transparent finances" />
          </H4>
          <P fontSize="18px" lineHeight="26px" color="black.800">
            <FormattedMessage
              id="e2c.transparentFinances.description"
              defaultMessage="Open Collective launched in 2016 and raised $3M of seed investment. The platform became profitable in 2020. {lineBreak}{lineBreak} See our investors and term sheets <link>here</link>."
              values={{
                lineBreak: <br />,
                link: getI18nLink({
                  openInNewTab: true,
                  href: 'https://docs.opencollective.com/help/about/investors',
                }),
              }}
            />
          </P>
        </Box>
      </Flex>
    </Flex>
  );
};

export default InvestingInTheCommons;
