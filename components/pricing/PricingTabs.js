import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Box } from '@rebass/grid';

import StyledInputField from '../StyledInputField';
import StyledCard from '../StyledCard';
import StyledRadioList from '../StyledRadioList';
import Container from '../Container';
import { Span, P, H1 } from '../Text';

const Wrapper = styled(Container)`
  @media screen and (min-width: 64em) {
    background-image: url('/static/images/pricing-star-bg-lg.png');
    background-size: 100% 100%;
    min-height: 108px;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  @media screen and (min-width: 88em) {
    width: 1216px;
  }
`;

const TabBox = styled(Box)`
  width: 330px;
  height: 96px;
  padding: 16px 32px;
  outline: none;
  border: none;
  border-left: 1px solid;
  border-top: 1px solid;
  border-right: 1px solid;
  border-color: #e8e9eb;
  background-color: #f7f8fa;
  text-align: center;
  color: ${props => props.theme.colors.black[800]};

  ${({ active }) =>
    active &&
    `
    height: 104px;
    border-bottom: none;
    background: #fff;
    border-top-color: #297EFF;
  `};
`;

const Title = styled(H1)`
  @media screen and (min-width: 64em) {
    position: relative;
    top: 40px;
    margin-bottom: 32px;
  }
`;

const TabEndLines = styled(Span)`
  border-bottom: 1px solid #e8e9eb;

  @media screen and (min-width: 64em) {
    width: 25px;
  }
  @media screen and (min-width: 88em) {
    width: 105px;
  }
`;

const messages = defineMessages({
  'tabs.singleCollectiveWithAccount': {
    id: 'tabs.singleCollectiveWithAccount',
    defaultMessage: 'A single Collective and I DO',
  },
  'tabs.singleCollectiveWithAccount.description': {
    id: 'tabs.singleCollectiveWithAccount.description',
    defaultMessage: 'have a bank account to receive money for my community',
  },
  'tabs.singleCollectiveWithoutAccount': {
    id: 'tabs.singleCollectiveWithoutAccount',
    defaultMessage: 'A single Collective and I DON’T',
  },
  'tabs.singleCollectiveWithoutAccount.description': {
    id: 'tabs.singleCollectiveWithoutAccount.description',
    defaultMessage: 'have a bank account to receive money for my community',
  },
  'tabs.organization': {
    id: 'tabs.organization',
    defaultMessage: 'An organization',
  },
  'tabs.organization.description': {
    id: 'tabs.organization.description',
    defaultMessage: 'to host multiple Collectives ',
  },
});

const tabs = ['singleCollectiveWithAccount', 'singleCollectiveWithoutAccount', 'organization'];

const PricingTabs = ({ onChange, activeTab }) => {
  const intl = useIntl();
  return (
    <Container display={[activeTab ? 'none' : 'block', null, 'flex']} flexDirection="column" alignItems="center">
      <Wrapper>
        <Box width={1} display={['flex', null, 'none']}>
          <img width="100%" src="/static/images/pricing-star-bg-sm.png" alt="Pricing" />
        </Box>
        <Title
          fontSize={['H3', null, 'H1']}
          lineHeight={['40px', null, 'H1']}
          letterSpacing="-0.4px"
          textAlign="center"
        >
          <FormattedMessage id="pricing.title" defaultMessage="Our pricing" />
        </Title>
      </Wrapper>
      <Container>
        <Box mx={3} my={2}>
          <P
            textAlign={['left', 'center']}
            fontSize={['LeadParagraph', null, 'H4']}
            fontWeight={['bold', null, 500]}
            lineHeight={['26px', null, 'H3']}
            letterSpacing={['-0.012em', null, '-0.4px']}
          >
            <FormattedMessage id="tabs.label" defaultMessage="I want to create…" />
          </P>
        </Box>
        <Container mx={3} mt={3} mb={4} display={['flex', null, 'none']} justifyContent="center">
          <StyledInputField htmlFor="choose-tab">
            {fieldsProps => (
              <StyledCard width={[1, '387px']}>
                <StyledRadioList {...fieldsProps} options={tabs} onChange={({ value }) => onChange(value)}>
                  {({ value, radio }) => (
                    <Container
                      display="flex"
                      alignItems="center"
                      p={3}
                      borderBottom="1px solid"
                      borderColor="black.300"
                    >
                      <Box as="span" mr={3}>
                        {radio}
                      </Box>
                      <Box as="div" display="flex" flexDirection="column">
                        <Span fontSize="13px" lineHeight="19px" letterSpacing="-0.008em">
                          {intl.formatMessage(messages[`tabs.${value}`])}...
                        </Span>
                        <Span
                          color="black.600"
                          fontSize="13px"
                          fontWeight="300"
                          lineHeight="19px"
                          letterSpacing="-0.012em"
                        >
                          {intl.formatMessage(messages[`tabs.${value}.description`])}
                        </Span>
                      </Box>
                    </Container>
                  )}
                </StyledRadioList>
              </StyledCard>
            )}
          </StyledInputField>
        </Container>
        <Container
          my={4}
          display={['none', null, 'flex']}
          justifyContent="center"
          alignItems="flex-end"
          borderBottom="1px solid"
          borderColor="#E8E9EB"
          width={1}
        >
          <TabEndLines />
          {tabs.map(tab => {
            return (
              <TabBox as="button" key={tab} active={tab === activeTab} onClick={() => onChange(tab)}>
                <Span fontWeight="bold">{intl.formatMessage(messages[`tabs.${tab}`])}</Span>{' '}
                <Span>{intl.formatMessage(messages[`tabs.${tab}.description`])}</Span>
              </TabBox>
            );
          })}
          <TabEndLines />
        </Container>
      </Container>
    </Container>
  );
};

PricingTabs.propTypes = {
  activeTab: PropTypes.string,
  onChange: PropTypes.func,
};

export default PricingTabs;
