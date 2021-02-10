import React from 'react';
import PropTypes from 'prop-types';
import { Clock } from '@styled-icons/feather/Clock';
import { FormattedDate, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { fontSize, height, width } from 'styled-system';

import CollectiveCard from './virtual-cards/CollectiveCard';
import Container from './Container';
import Currency from './Currency';
import { Box, Flex } from './Grid';
import Link from './Link';
import { P, Span } from './Text';

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
  margin: 6px 0;
  ${fontSize};
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 2px;
  ${fontSize};
`;

class GiftCard extends React.Component {
  static propTypes = {
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    collective: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
    emitter: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
    expiryDate: PropTypes.string,
  };

  render() {
    const { amount, currency, collective, emitter, expiryDate } = this.props;
    return (
      <ShadowCard maxWidth={['320px', '450px']} width="100%" minHeight={['200px', '260px']} m="0 auto">
        <Container p={['18px', '24px']}>
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
              defaultMessage="Contribute on Open Collective with this Gift Card, courtesy of {emitter}."
              values={{
                emitter: <WhiteLink route={`/${emitter.slug}`}>{emitter.name}</WhiteLink>,
              }}
            />
          </Text>
          {emitter?.imageUrl ? (
            <Container mt={3}>
              <CollectiveCard
                m="0px"
                collective={emitter}
                mb={3}
                size={[48, 64]}
                avatarSize={[24, 32]}
                fontSize="14px"
                boxShadow="0 0 8px rgba(0, 0, 0, 0.24) inset"
                borderColor="blue.200"
                p={2}
              />
            </Container>
          ) : null}
        </Container>
        {expiryDate && (
          <Container position="absolute" left={['8px', '12px']} bottom={['8px', '12px']}>
            <P mt={2} fontSize="12px" color="black.700">
              <Clock size="1.2em" />
              <Span ml={1} css={{ verticalAlign: 'middle' }}>
                <FormattedMessage
                  id="ContributePayment.expiresOn"
                  defaultMessage="Expires on {expiryDate}"
                  values={{
                    expiryDate: (
                      <strong>
                        <FormattedDate value={expiryDate} />
                      </strong>
                    ),
                  }}
                />
              </Span>
            </P>
          </Container>
        )}
        <Container position="absolute" right={['8px', '12px']} bottom={['8px', '12px']}>
          <Flex alignItems="top" className="AmountCurrency">
            <Span fontWeight="bold" fontSize="4rem" lineHeight="4rem" color="#313233">
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

export default GiftCard;
