import React from 'react';
import PropTypes from 'prop-types';

import withIntl from '../lib/withIntl';
import Container from './Container';
import { Span } from './Text';
import Currency from './Currency';
import Link from './Link';
import { Flex, Box } from 'grid-styled';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { width, height, fontSize } from 'styled-system';

const WhiteLink = styled(Link)`
  color: white;
  text-decoration: underline !important;
  &&:hover {
    color: #eee;
  }
  &&:active {
    color: #ddd;
  }
`;
const Card = styled(Box)`
  ${width};
  ${height};
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background-image: url('/static/images/oc-gift-card-front.svg');
  background-size: 100%;
  background-repeat: no-repeat;
  background-color: transparent;
`;

const ShadowCard = styled(Card)`
  box-shadow: 0px 8px 16px rgba(20, 20, 20, 0.12);
`;

const Text = styled.p`
  color: white;
  text-align: left;
  font-size: 14px;
  ${fontSize};
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  ${fontSize};
`;

class GiftCard extends React.Component {
  static propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    emitter: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { amount, currency, collective, emitter } = this.props;

    return (
      <ShadowCard width={['300px', '400px']} height={['168px', '224px']}>
        <Container
          position="absolute"
          left={['12px', '24px']}
          top={['12px', '24px']}
        >
          <Title fontSize={['18px', '24px']}>
            <FormattedMessage
              id="giftcard.user.name"
              defaultMessage="Hello again, {name}!"
              values={{ name: collective.name }}
            />
          </Title>
          <Text fontSize={['12px', '14px']}>
            <FormattedMessage
              id="giftcard.user.text"
              defaultMessage="You can now support open collectives with this amount, courtesy of {emitter}."
              values={{
                emitter: (
                  <WhiteLink route={`/${emitter.slug}`}>
                    {emitter.name}
                  </WhiteLink>
                ),
              }}
            />
          </Text>
        </Container>
        <Container
          position="absolute"
          right={['12px', '24px']}
          bottom={['12px', '24px']}
        >
          <Flex alignItems="top" className="AmountCurrency">
            <Span
              fontWeight="bold"
              fontSize="4rem"
              lineHeight="4rem"
              color="#313233"
            >
              <Currency value={amount} currency={currency} precision={0} />
            </Span>
            <Box ml={1}>
              <Span color="#9D9FA3" fontSize="1.6rem" className="currency">
                {currency}
              </Span>
            </Box>
          </Flex>
        </Container>
      </ShadowCard>
    );
  }
}

export default withIntl(GiftCard);
