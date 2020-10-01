import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { H2, H3, P } from '../Text';

const TransactionShadow = styled(Box)`
  width: 497px;
  height: 15px;
  position: relative;
  background: transparent;
  box-shadow: 0px 8px 12px rgba(20, 20, 20, 0.16);
  display: none;

  @media screen and (min-width: 40em) {
    display: block;
  }
`;

const JarIllustrationWrapper = styled(Flex)`
  @media screen and (min-width: 40em) {
    position: relative;
    top: -30px;
  }

  @media screen and (min-width: 64em) {
    position: relative;
    top: -100px;
  }

  @media screen and (min-width: 88em) {
    position: relative;
    top: -130px;
  }
`;

const Transparency = () => (
  <Flex flexDirection="column" px={3} alignItems="center" mt="58px">
    <Box textAlign="center" mb={3} width={['304px', '656px', '956px', null, '600px']}>
      <H2
        fontSize={['24px', '32px', '40px']}
        lineHeight={['32px', '40px', '48px']}
        letterSpacing="-1.6px"
        mb={3}
        color="black.800"
      >
        <FormattedMessage id="becomeASponsor.transparency" defaultMessage="Transparency" />
      </H2>
      <P fontSize={['14px', '18px', '20px']} lineHeight={['24px', '28px']} letterSpacing="-0.6px" color="black.600">
        <FormattedMessage
          id="becomeASponsor.transparency.description"
          defaultMessage="You can directly see the impact of your contributions, in real time, because Collective budgets are transparent"
        />
      </P>
    </Box>
    <Box width={['304px', '552px']} height={[null, '341px']} maxHeight={['187px', '341px']} overflowY="auto">
      <Illustration
        display={[null, 'none']}
        src="/static/images/become-a-sponsor/transactionScreenshot-scrollable-xs.png"
        alt="Transaction Screenshot"
      />
      <Illustration
        display={['none', 'block', 'none']}
        src="/static/images/become-a-sponsor/transactionScreenshot-sm.png"
        alt="Transaction Screenshot"
      />
      <Illustration
        display={['none', 'none', 'block', null, 'none']}
        src="/static/images/become-a-sponsor/transactionScreenshot-md.png"
        alt="Transaction Screenshot"
      />
      <Illustration
        display={['none', 'none', 'none', null, 'block']}
        src="/static/images/become-a-sponsor/transactionScreenshot-lg.png"
        alt="Transaction Screenshot"
      />
    </Box>
    <TransactionShadow />
    <JarIllustrationWrapper>
      <Box width={[null, '202px']} height={[null, '115px']} mr={[null, '67px', '200px', null, '217px']}>
        <Illustration src="/static/images/become-a-sponsor/jar1-illustration-sm.png" alt="Transaction Screenshot" />
      </Box>
      <Box width={[null, '201px']} height={[null, '117px']} ml={[null, '67px', '200px', null, '217px']}>
        <Illustration src="/static/images/become-a-sponsor/jar2-illustration-sm.png" alt="Transaction Screenshot" />
      </Box>
    </JarIllustrationWrapper>

    <Flex
      my="48px"
      mt={[null, '10px', '-20px']}
      flexDirection={['column', null, 'row']}
      justifyContent="center"
      alignItems={['center', null, 'baseline']}
    >
      <Flex flexDirection={['column', 'row', 'column']} mb={[4, null, 0]} mr={[null, null, '40px', null, '96px']}>
        <Box size="56px" mb={2} mr={[null, '32px']}>
          <Illustration
            src="/static/images/become-a-sponsor/invoiceReceipts-illustration.png"
            alt="Invoices and Receipts illustration"
          />
        </Box>
        <Box>
          <H3
            fontSize={['20px', null, null, null, '24px']}
            lineHeight={['28px', null, '32px', null, '40px']}
            letterSpacing={['-0.008em', null, '-0.6px']}
            color="black.800"
            mb={2}
          >
            <FormattedMessage id="becomeASponsor.invoiceReceipts" defaultMessage="Invoices & Receipts" />
          </H3>
          <Box width={['286px', '560px', '250px', null, '297px']}>
            <P
              fontSize={['15px', '16px', '18px']}
              lineHeight={['22px', '24px', '32px']}
              color={['black.700', 'black.600']}
              fontWeight="400"
              letterSpacing={[null, null, '-0.16px', null, '-0.2px']}
              textAlign="left"
            >
              <FormattedMessage
                id="becomeASponsor.invoiceReceipts.description"
                defaultMessage="Giving money to unincorporated communities, movements, and projects can be an accounting nightmare. Open Collective solves that problem with documentation for each transaction."
              />
            </P>
          </Box>
        </Box>
      </Flex>
      <Flex flexDirection={['column', 'row', 'column']} mb={[4, null, 0]} mr={[null, null, '40px', null, '96px']}>
        <Box size="56px" mb={2} mr={[null, '32px']}>
          <Illustration src="/static/images/become-a-sponsor/paperWork-illustration.png" alt="PaperWork illustration" />
        </Box>
        <Box width={['286px', '560px', '250px', null, '297px']}>
          <H3
            fontSize={['20px', null, null, null, '24px']}
            lineHeight={['28px', null, '32px', null, '40px']}
            letterSpacing={['-0.008em', null, '-0.6px']}
            color="black.800"
            mb={2}
          >
            <FormattedMessage id="becomeASponsor.paperWork" defaultMessage="We’ll take care of the paperwork" />
          </H3>
          <Box>
            <P
              fontSize={['15px', '16px', '18px']}
              lineHeight={['22px', '24px', '32px']}
              color={['black.700', 'black.600']}
              fontWeight="400"
              letterSpacing={[null, null, '-0.16px', null, '-0.2px']}
              textAlign="left"
            >
              <FormattedMessage
                id="becomeASponsor.paperWork.description"
                defaultMessage="The fiscal host of the Collective you want to support is an established legal entity who can engage with your vendor systems and purchase order processes, and meet documentation requirements like tax forms and signing agreements. "
              />
            </P>
          </Box>
        </Box>
      </Flex>
      <Flex flexDirection={['column', 'row', 'column']}>
        <Box size="56px" mb={2} mr={[null, '32px']}>
          <Illustration src="/static/images/become-a-sponsor/reporting-illustration.png" alt="Reporting illustration" />
        </Box>
        <Box>
          <H3
            fontSize={['20px', null, null, null, '24px']}
            lineHeight={['28px', null, '32px', null, '40px']}
            letterSpacing={['-0.008em', null, '-0.6px']}
            color="black.800"
            mb={2}
          >
            <FormattedMessage id="becomeASponsor.reporting" defaultMessage="Reporting" />
          </H3>
          <Box width={['286px', '560px', '250px', null, '297px']}>
            <P
              fontSize={['15px', '16px', '18px']}
              lineHeight={['22px', '24px', '32px']}
              color={['black.700', 'black.600']}
              fontWeight="400"
              letterSpacing={[null, null, '-0.16px', null, '-0.2px']}
              textAlign="left"
            >
              <FormattedMessage
                id="becomeASponsor.reporting.description"
                defaultMessage="In addition to monthly reports, Collectives can post regular updates about their progress and the impact your support is having, plus you can peek at their budget any time—it’s like reporting that writes itself!"
              />
            </P>
          </Box>
        </Box>
      </Flex>
    </Flex>

    <Flex flexDirection={['column', 'row']} justifyContent="center" alignItems="center" width={[null, '644px']}>
      <Box textAlign={['center', 'left']} width={['304px', '392px']} mr={[null, '46px']}>
        <P fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" color="black.700" fontWeight="500">
          <FormattedMessage
            id="becomeASponsor.monthlyInvoice"
            defaultMessage="Plus, get a consolidated monthly invoice for all your contributions on the platform—your accountant will thank you!"
          />
        </P>
      </Box>
      <Box width="223px" height="143px" mt={['68px', '17px']}>
        <Illustration src="/static/images/become-a-sponsor/invoice-illustration.png" alt="Invoice Illustration" />
      </Box>
    </Flex>
  </Flex>
);

export default Transparency;
