import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';
import { Close as _Close } from '@styled-icons/material/Close';
import { Box, Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';
import DismissibleMessage from '../DismissibleMessage';
import { BANNER } from '../../lib/constants/dismissable-help-message';
import { Link } from '../../server/pages';

import Container from '../Container';

const Wrapper = styled(Flex)`
  width: 100%;
  position: -webkit-sticky;
  position: sticky;
  bottom: 0px;
`;

const Banner = styled(Container)`
  position: relative;
  overflow: hidden;
  margin: auto;
  background: #fff;
  box-shadow: 0px 0px 10px RGBA(0, 0, 0, 0.1);
  z-index: 50;
  border-bottom: none;

  h1,
  h2 {
    font-weight: bold;
    margin: 0px;
    text-align: left;
  }

  h2 {
    font-size: 20px;
    line-height: 28px;
    padding-bottom: 4px;
  }

  h1 {
    font-size: 28px;
    line-height: 36px;
  }

  @media screen and (max-width: 40em) {
    h2 {
      font-size: 15px;
      line-height: 23px;
      padding-bottom: 9px;
    }

    h1 {
      font-size: 20px;
      line-height: 28px;
    }
  }
`;

const Button = styled(StyledButton)`
  width: 212px;
  font-size: 13px;
  color: #fff;
  z-index: 100;

  background: linear-gradient(180deg, #313233 0%, #141414 100%);
  &:hover {
    background: linear-gradient(180deg, #4e5052 0%, #313233 100%);
  }
  &:visited {
    color: #fff;
    outline: none;
    border: none;
  }
`;

const Close = styled(_Close)`
  position: absolute;
  color: #dadada;
  top: 25px;
  right: 25px;
  width: 20px;
  height: 20px;
  cursor: pointer;

  &:hover {
    color: #000;
  }

  @media screen and (max-width: 40em) {
    top: 18px;
    right: 18px;
  }
`;

const Mobile = styled.div`
  display: none;
  @media screen and (max-width: 40em) {
    display: block;
  }
`;

const Desktop = styled.div`
  display: block;
  @media screen and (max-width: 40em) {
    display: none;
  }
`;

const Virus = styled.div`
  position: absolute;
  bottom: 0px;
  right: 10px;
  width: 80px;
  height: 80px;

  @media screen and (max-width: 40em) {
    bottom: -20px;
  }

  img:nth-child(1) {
    left: 20px;
    position: absolute;
  }

  img:nth-child(2) {
    bottom: 15px;
    position: absolute;
  }
`;

const CovidBanner = props => {
  return (
    <Wrapper>
      <Banner
        width={[300, 992]}
        border="1px solid #E6E8EB"
        borderRadius="16px 16px 0 0"
        pl={[24, 48]}
        pr={[24, props.showLink ? 72 : 107]}
        pt={[24, 16]}
        pb={24}
      >
        <Virus>
          <img src="/static/images/virus-1.png" width="54px" />
          <img src="/static/images/virus-2.png" width="38px" />
        </Virus>
        <Flex flexDirection={['column', 'row']}>
          <Box>
            <Desktop>
              <h2>
                <FormattedMessage
                  id="banners.covid.title.desktop"
                  defaultMessage="Let's work together to support each other. We are apart but not alone."
                />
              </h2>
            </Desktop>
            <Mobile>
              <h2>
                <FormattedMessage id="banners.covid.title.mobile" defaultMessage="Let's support each other." />
              </h2>
            </Mobile>
            <h1>
              <FormattedMessage
                id="banners.covid.description"
                defaultMessage="We are waiving our platform fees on COVID-19 related Collectives until the end of June."
              />
            </h1>
          </Box>
          {props.showLink && (
            <Flex alignItems="center" mt={[16, 0]}>
              <Link route="create" passHref>
                <Button buttonStyle="standard">
                  <FormattedMessage id="banners.covid.button" defaultMessage="Create a COVID-19 Initiative" />
                </Button>
              </Link>
            </Flex>
          )}
        </Flex>
        <Close onClick={props.dismiss} />
      </Banner>
    </Wrapper>
  );
};

CovidBanner.propTypes = {
  showLink: PropTypes.bool,
  dismiss: PropTypes.func,
};

const WrappedBanner = props => (
  <DismissibleMessage displayForLoggedOutUser={true} messageId={BANNER.COVID}>
    {({ dismiss }) => <CovidBanner {...{ dismiss, ...props }} />}
  </DismissibleMessage>
);

export default WrappedBanner;
