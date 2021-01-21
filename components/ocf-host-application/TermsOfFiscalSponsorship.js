import React from 'react';
import PropTypes from 'prop-types';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledCheckbox from '../StyledCheckbox';
import { H1, H5, P } from '../Text';

import OCFPrimaryButton from './OCFPrimaryButton';

const TermsOfFiscalSponsorship = ({ checked, onChecked }) => (
  <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={['24px', '48px']}>
    <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center">
      <Box width={'160px'} height={'160px'} mb="24px">
        <Illustration
          alt="OCF sponsorship illustration"
          src="/static/images/ocf-host-application/ofc-sponsorship-illustration.png"
        />
      </Box>
      <Box textAlign={['center', 'left']} width={['288px', '404px']} mb={4} ml={[null, '24px']}>
        <H1
          fontSize="32px"
          lineHeight="40px"
          letterSpacing="-0.008em"
          color="black.900"
          textAlign={['center', 'left']}
          mb="14px"
        >
          <FormattedMessage id="OCFHostApplication.title" defaultMessage="Apply with your initiative" />
        </H1>
        <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
          <FormattedMessage
            id="OCFHostApplication.description"
            defaultMessage="Get your non-profit initiative up and running fast."
          />
        </P>
      </Box>
    </Flex>
    <Box width={['288px', '588px']}>
      <P fontSize="13px" lineHeight="20px" color="#090A0A" mb={3}>
        <FormattedMessage
          id="OCFHostApplication.importance"
          defaultMessage="It can take years for a group to get 501c3 non-profit status.  Fiscal hosts are especially helpful to newly formed nonprofit groups- large and small.
          We act as a legal entity for your group-organizing the back-end of your fundraising efforts. 
          It’s fast and easy to apply to be hosted by our foundation (or you can choose a different fiscal host, or you can self-host), once your group is approved, you can begin collecting funds immediately
           "
        />
      </P>
      <H5 fontSize="13px" lineHeight="20px" color="#090A0A">
        <FormattedMessage id="OCFHostApplication.howItWorks" defaultMessage="How it works:" />
      </H5>
      <P fontSize="13px" lineHeight="20px" color="#090A0A" mb={3}>
        <FormattedMessage
          id="OCFHostApplication.howItWorks.list"
          values={{ lineBreak: <br /> }}
          defaultMessage="• Donations are made to our 501c3 (tax-exempt status applies){lineBreak}
          • We make a “grant” to your group/project{lineBreak}
          • We send donors their receipts, disburse funds/reimburse expenses after your approval, send out the tax forms to independent contractors as applicable{lineBreak}
          • You have complete access to collect, spend, manage your money on our platform.
         "
        />
      </P>
      <P fontSize="13px" lineHeight="20px" color="#090A0A" mb={3}>
        <FormattedMessage
          id="OCFHostApplication.readInfoGuideAndTOS"
          values={{
            InfoGuideLink: getI18nLink({
              color: '#396C6F',
              textDecoration: 'underline',
              openInNewTab: true,
              href: 'https://docs.opencollective.foundation/about/fiscal-sponsorship-info-guide',
            }),
            TOSLink: getI18nLink({
              color: '#396C6F',
              textDecoration: 'underline',
              openInNewTab: true,
              href:
                'https://docs.google.com/document/u/2/d/e/2PACX-1vQ_fs7IOojAHaMBKYtaJetlTXJZLnJ7flIWkwxUSQtTkWUMtwFYC2ssb-ooBnT-Ldl6wbVhNQiCkSms/pub',
            }),
          }}
          defaultMessage="Please take a moment to read our <InfoGuideLink>Info guide</InfoGuideLink> and <TOSLink>Terms and Conditions</TOSLink> before applying, we want to make this process as easy for you as possible, that's why you will need to know a couple of things to have the best possible experience."
        />
      </P>
      <Container display="flex" alignSelf="flex-start" alignItems="center" mb={4} mt={2}>
        <Box mr={3}>
          <StyledCheckbox
            name="TOSAgreement"
            background="#396C6F"
            size="16px"
            checked={checked}
            onChange={({ checked }) => onChecked(checked)}
            label={
              <P ml={1} fontSize="12px" lineHeight="18px" fontWeight="400">
                <FormattedMessage
                  id="OCFHostApplication.tosCheckBoxLabel"
                  defaultMessage="I agree with the <TOSLink>terms of fiscal sponsorship</TOSLink>."
                  values={{
                    TOSLink: getI18nLink({
                      href: 'https://docs.opencollective.foundation/about/our-terms-and-conditions',
                      openInNewTabNoFollow: true,
                    }),
                  }}
                />
              </P>
            }
          />
        </Box>
      </Container>
    </Box>
    <Link route="/foundation/apply/fees">
      <OCFPrimaryButton mb="40px" width={['286px', '100px']} disabled={!checked}>
        <FormattedMessage id="OCFHostApplication.nextBtn" defaultMessage="Next" />
        &nbsp;
        <ArrowRight2 size="14px" />
      </OCFPrimaryButton>
    </Link>
  </Flex>
);

TermsOfFiscalSponsorship.propTypes = {
  checked: PropTypes.bool,
  onChecked: PropTypes.func,
};

export default TermsOfFiscalSponsorship;
