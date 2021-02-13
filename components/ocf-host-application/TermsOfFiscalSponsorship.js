import React from 'react';
import PropTypes from 'prop-types';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import NextLink from 'next/link';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { getI18nLink } from '../I18nFormatters';
import StyledCheckbox from '../StyledCheckbox';
import { H1, P } from '../Text';

import ApplicationDescription from './ApplicationDescription';
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
      <ApplicationDescription />
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
    <NextLink href="/foundation/apply/fees">
      <OCFPrimaryButton mb="40px" width={['286px', '100px']} disabled={!checked}>
        <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
        &nbsp;
        <ArrowRight2 size="14px" />
      </OCFPrimaryButton>
    </NextLink>
  </Flex>
);

TermsOfFiscalSponsorship.propTypes = {
  checked: PropTypes.bool,
  onChecked: PropTypes.func,
};

export default TermsOfFiscalSponsorship;
